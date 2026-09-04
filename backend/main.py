from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

import models
import database
from ai_extractor import extract_from_note

# Create tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="SafeHandover AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
   allow_origins=[
    "http://localhost:5173",
    "http://localhost:5175",
    "http://localhost:3000",
    "https://safe-handover-frontend.onrender.com"
]
)


# ─── Pydantic Schemas ───────────────────────────────────────────────────────

class HandoverNoteCreate(BaseModel):
    note_text: str
    ward: str
    shift_date: str
    shift_type: str
    outgoing_nurse: str
    incoming_nurse: str
    patient_id: str
    patient_name: str


class HandoverNoteOut(BaseModel):
    id: int
    note_text: str
    ward: str
    shift_date: str
    shift_type: str
    outgoing_nurse: str
    incoming_nurse: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class ExtractedActionOut(BaseModel):
    id: int
    handover_id: int
    patient_id: str
    patient_name: str
    risk: str
    action: str
    owner: str
    deadline: str
    confidence: float
    status: str
    human_review_required: bool
    missing_owner: bool
    overdue: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class ShiftChangeOut(BaseModel):
    id: int
    handover_id: int
    shift_date: str
    ward: str
    unresolved_count: int
    resolved_count: int

    class Config:
        from_attributes = True


class SubsequentEventOut(BaseModel):
    id: int
    action_id: int
    patient_id: str
    patient_name: str
    event_description: str
    related_risk: str
    event_type: str
    severity: str
    was_preventable: bool
    shift_date: str

    class Config:
        from_attributes = True


class FailureCaseOut(BaseModel):
    id: int
    action_id: Optional[int]
    failure_type: str
    description: str
    patient_id: str
    patient_name: str
    ward: str
    severity: str
    resolved: bool

    class Config:
        from_attributes = True


class MetricsOut(BaseModel):
    total_handovers: int
    total_actions: int
    resolved_actions: int
    unresolved_actions: int
    overdue_actions: int
    missing_owner_count: int
    low_confidence_count: int
    human_review_required_count: int
    subsequent_events: int
    preventable_events: int
    failure_cases: int
    baseline_missed_actions: int
    baseline_adverse_events: int
    prototype_missed_actions: int
    prototype_adverse_events: int
    improvement_missed_actions_pct: float
    improvement_adverse_events_pct: float
    avg_confidence: float


# ─── Endpoints ──────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "SafeHandover AI API is running", "version": "1.0.0"}


@app.get("/api/dashboard/summary")
def dashboard_summary(db: Session = Depends(database.get_db)):
    total_handovers = db.query(models.HandoverNote).count()
    total_actions = db.query(models.ExtractedAction).count()
    resolved = db.query(models.ExtractedAction).filter(models.ExtractedAction.status == "resolved").count()
    unresolved = db.query(models.ExtractedAction).filter(models.ExtractedAction.status == "pending").count()
    overdue = db.query(models.ExtractedAction).filter(models.ExtractedAction.overdue == True).count()
    missing_owner = db.query(models.ExtractedAction).filter(models.ExtractedAction.missing_owner == True).count()
    human_review = db.query(models.ExtractedAction).filter(models.ExtractedAction.human_review_required == True).count()
    low_conf = db.query(models.ExtractedAction).filter(models.ExtractedAction.confidence < 0.70).count()
    subsequent = db.query(models.SubsequentEvent).count()
    preventable = db.query(models.SubsequentEvent).filter(models.SubsequentEvent.was_preventable == True).count()
    failures = db.query(models.FailureCase).count()
    wards = db.query(models.HandoverNote.ward).distinct().count()

    actions = db.query(models.ExtractedAction).all()
    avg_conf = round(sum(a.confidence for a in actions) / len(actions), 2) if actions else 0.0

    recent_notes = (
        db.query(models.HandoverNote)
        .order_by(models.HandoverNote.id.desc())
        .limit(5)
        .all()
    )

    recent_events = (
        db.query(models.SubsequentEvent)
        .order_by(models.SubsequentEvent.id.desc())
        .limit(3)
        .all()
    )

    return {
        "total_handovers": total_handovers,
        "total_actions": total_actions,
        "resolved_actions": resolved,
        "unresolved_actions": unresolved,
        "overdue_actions": overdue,
        "missing_owner_count": missing_owner,
        "human_review_required_count": human_review,
        "low_confidence_count": low_conf,
        "subsequent_events": subsequent,
        "preventable_events": preventable,
        "failure_cases": failures,
        "wards_monitored": wards,
        "avg_confidence": avg_conf,
        "recent_notes": [
            {
                "id": n.id,
                "ward": n.ward,
                "shift_date": n.shift_date,
                "shift_type": n.shift_type,
                "outgoing_nurse": n.outgoing_nurse,
                "incoming_nurse": n.incoming_nurse,
            }
            for n in recent_notes
        ],
        "recent_events": [
            {
                "id": e.id,
                "patient_name": e.patient_name,
                "event_type": e.event_type,
                "severity": e.severity,
                "shift_date": e.shift_date,
            }
            for e in recent_events
        ],
    }


# ─── Handover Notes ──────────────────────────────────────────────────────────

@app.get("/api/handovers", response_model=List[HandoverNoteOut])
def list_handovers(db: Session = Depends(database.get_db)):
    return db.query(models.HandoverNote).order_by(models.HandoverNote.id.desc()).all()


@app.get("/api/handovers/{handover_id}", response_model=HandoverNoteOut)
def get_handover(handover_id: int, db: Session = Depends(database.get_db)):
    note = db.query(models.HandoverNote).filter(models.HandoverNote.id == handover_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Handover not found")
    return note


@app.post("/api/handovers/analyze")
def analyze_handover(payload: HandoverNoteCreate, db: Session = Depends(database.get_db)):
    """Accept a handover note, run mock AI extraction, save and return result."""
    note = models.HandoverNote(
        note_text=payload.note_text,
        ward=payload.ward,
        shift_date=payload.shift_date,
        shift_type=payload.shift_type,
        outgoing_nurse=payload.outgoing_nurse,
        incoming_nurse=payload.incoming_nurse,
    )
    db.add(note)
    db.flush()

    extracted = extract_from_note(payload.note_text, payload.patient_id, payload.patient_name)
    action = models.ExtractedAction(
        handover_id=note.id,
        patient_id=extracted["patient_id"],
        patient_name=extracted["patient_name"],
        risk=extracted["risk"],
        action=extracted["action"],
        owner=extracted["owner"],
        deadline=extracted["deadline"],
        confidence=extracted["confidence"],
        status=extracted["status"],
        missing_owner=extracted["missing_owner"],
        human_review_required=extracted["human_review_required"],
        overdue=False,
    )
    db.add(action)

    # Auto-create failure cases
    if extracted["missing_owner"]:
        db.add(models.FailureCase(
            action_id=None,
            failure_type="missing_owner",
            description=f"No owner specified in handover note for {payload.patient_name}.",
            patient_id=payload.patient_id,
            patient_name=payload.patient_name,
            ward=payload.ward,
            severity="high",
            resolved=False,
        ))
    if extracted["human_review_required"] and extracted["confidence"] < 0.70:
        db.add(models.FailureCase(
            action_id=None,
            failure_type="low_confidence",
            description=f"Low confidence ({extracted['confidence']}) extraction for {payload.patient_name}. Human review required.",
            patient_id=payload.patient_id,
            patient_name=payload.patient_name,
            ward=payload.ward,
            severity="high",
            resolved=False,
        ))

    db.commit()
    db.refresh(action)

    return {
        "handover_id": note.id,
        "action_id": action.id,
        "extraction": extracted,
    }


# ─── Extracted Actions ───────────────────────────────────────────────────────

@app.get("/api/actions", response_model=List[ExtractedActionOut])
def list_actions(db: Session = Depends(database.get_db)):
    return db.query(models.ExtractedAction).order_by(models.ExtractedAction.id.desc()).all()


@app.get("/api/actions/{action_id}", response_model=ExtractedActionOut)
def get_action(action_id: int, db: Session = Depends(database.get_db)):
    action = db.query(models.ExtractedAction).filter(models.ExtractedAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    return action


@app.patch("/api/actions/{action_id}/resolve")
def resolve_action(action_id: int, db: Session = Depends(database.get_db)):
    action = db.query(models.ExtractedAction).filter(models.ExtractedAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    action.status = "resolved"
    db.commit()
    return {"message": "Action resolved", "action_id": action_id}


# ─── Shift Changes ───────────────────────────────────────────────────────────

@app.get("/api/shift-changes", response_model=List[ShiftChangeOut])
def list_shift_changes(db: Session = Depends(database.get_db)):
    return db.query(models.ShiftChange).order_by(models.ShiftChange.id.desc()).all()


@app.get("/api/shift-changes/unresolved")
def unresolved_at_shift_change(db: Session = Depends(database.get_db)):
    """Actions still pending at time of shift change."""
    unresolved = (
        db.query(models.ExtractedAction)
        .filter(models.ExtractedAction.status == "pending")
        .all()
    )
    return {
        "count": len(unresolved),
        "actions": [
            {
                "id": a.id,
                "patient_name": a.patient_name,
                "risk": a.risk,
                "action": a.action,
                "owner": a.owner,
                "deadline": a.deadline,
                "confidence": a.confidence,
                "missing_owner": a.missing_owner,
                "human_review_required": a.human_review_required,
            }
            for a in unresolved
        ],
    }


# ─── Subsequent Events ───────────────────────────────────────────────────────

@app.get("/api/subsequent-events", response_model=List[SubsequentEventOut])
def list_subsequent_events(db: Session = Depends(database.get_db)):
    return db.query(models.SubsequentEvent).order_by(models.SubsequentEvent.id.desc()).all()


# ─── Failure Cases ───────────────────────────────────────────────────────────

@app.get("/api/failure-cases", response_model=List[FailureCaseOut])
def list_failure_cases(db: Session = Depends(database.get_db)):
    return db.query(models.FailureCase).order_by(models.FailureCase.id.desc()).all()


@app.get("/api/failure-cases/summary")
def failure_cases_summary(db: Session = Depends(database.get_db)):
    all_cases = db.query(models.FailureCase).all()
    by_type = {}
    for case in all_cases:
        by_type[case.failure_type] = by_type.get(case.failure_type, 0) + 1

    by_severity = {}
    for case in all_cases:
        by_severity[case.severity] = by_severity.get(case.severity, 0) + 1

    return {
        "total": len(all_cases),
        "unresolved": sum(1 for c in all_cases if not c.resolved),
        "by_type": by_type,
        "by_severity": by_severity,
    }


# ─── Metrics ─────────────────────────────────────────────────────────────────

@app.get("/api/metrics", response_model=MetricsOut)
def get_metrics(db: Session = Depends(database.get_db)):
    total_handovers = db.query(models.HandoverNote).count()
    total_actions = db.query(models.ExtractedAction).count()
    resolved = db.query(models.ExtractedAction).filter(models.ExtractedAction.status == "resolved").count()
    unresolved = total_actions - resolved
    overdue = db.query(models.ExtractedAction).filter(models.ExtractedAction.overdue == True).count()
    missing_owner = db.query(models.ExtractedAction).filter(models.ExtractedAction.missing_owner == True).count()
    low_conf = db.query(models.ExtractedAction).filter(models.ExtractedAction.confidence < 0.70).count()
    human_review = db.query(models.ExtractedAction).filter(models.ExtractedAction.human_review_required == True).count()
    subsequent = db.query(models.SubsequentEvent).count()
    preventable = db.query(models.SubsequentEvent).filter(models.SubsequentEvent.was_preventable == True).count()
    failures = db.query(models.FailureCase).count()

    actions = db.query(models.ExtractedAction).all()
    avg_conf = round(sum(a.confidence for a in actions) / len(actions), 2) if actions else 0.0

    # Baseline vs Prototype comparison (synthetic benchmark data)
    baseline_missed = 18
    baseline_adverse = 12
    prototype_missed = unresolved
    prototype_adverse = preventable

    improvement_missed = round((baseline_missed - prototype_missed) / baseline_missed * 100, 1) if baseline_missed > 0 else 0.0
    improvement_adverse = round((baseline_adverse - prototype_adverse) / baseline_adverse * 100, 1) if baseline_adverse > 0 else 0.0

    return MetricsOut(
        total_handovers=total_handovers,
        total_actions=total_actions,
        resolved_actions=resolved,
        unresolved_actions=unresolved,
        overdue_actions=overdue,
        missing_owner_count=missing_owner,
        low_confidence_count=low_conf,
        human_review_required_count=human_review,
        subsequent_events=subsequent,
        preventable_events=preventable,
        failure_cases=failures,
        baseline_missed_actions=baseline_missed,
        baseline_adverse_events=baseline_adverse,
        prototype_missed_actions=prototype_missed,
        prototype_adverse_events=prototype_adverse,
        improvement_missed_actions_pct=improvement_missed,
        improvement_adverse_events_pct=improvement_adverse,
        avg_confidence=avg_conf,
    )
