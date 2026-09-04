"""
Seed the database with realistic sample handover data.
Run once to populate all tables.
"""

from database import SessionLocal, engine
import models

models.Base.metadata.create_all(bind=engine)

SAMPLE_NOTES = [
    {
        "note_text": (
            "Patient John Davies (Bed 4) has a high fall risk following sedation. "
            "Bed alarm activated, low bed in place. Nurse Williams to monitor hourly and ensure crash mat remains. "
            "Patient confused and agitated overnight. Escalate to Dr. Smith if condition worsens. "
            "Family updated by Charge Nurse Taylor at 22:00."
        ),
        "ward": "Ward 6B",
        "shift_date": "2026-09-01",
        "shift_type": "night",
        "outgoing_nurse": "Nurse Brown",
        "incoming_nurse": "Nurse Williams",
        "patient_id": "PT-001",
        "patient_name": "John Davies",
    },
    {
        "note_text": (
            "Mary Thompson (Bed 7) showing signs of clinical deterioration — SpO2 dropped to 88% on room air. "
            "Oxygen therapy commenced. Dr. Patel to review by 06:00. "
            "Chest X-ray ordered. Monitor respiratory status every 30 minutes. "
            "Deterioration may indicate sepsis — blood cultures taken, awaiting results."
        ),
        "ward": "Ward 6B",
        "shift_date": "2026-09-01",
        "shift_type": "night",
        "outgoing_nurse": "Nurse Brown",
        "incoming_nurse": "Nurse Williams",
        "patient_id": "PT-002",
        "patient_name": "Mary Thompson",
    },
    {
        "note_text": (
            "Robert Chen (Bed 12) post-operative day 2, wound showing signs of infection — redness and discharge noted. "
            "Wound care and dressing change completed. Requires reassessment at morning round. "
            "Bloods including FBC and cultures sent. Pain score 7/10 — uncontrolled pain, pain reassess in 2 hours."
        ),
        "ward": "Ward 8A",
        "shift_date": "2026-09-01",
        "shift_type": "night",
        "outgoing_nurse": "Nurse Davis",
        "incoming_nurse": "Nurse Anderson",
        "patient_id": "PT-003",
        "patient_name": "Robert Chen",
    },
    {
        "note_text": (
            "Sarah Mitchell (Bed 2) known diabetic — blood sugar erratic, last reading 2.9 mmol. "
            "IV fluids running as prescribed. Hourly glucose monitoring in place. "
            "Notify Dr. Johnson if reading drops below 3.0 again before morning."
        ),
        "ward": "Ward 8A",
        "shift_date": "2026-09-01",
        "shift_type": "night",
        "outgoing_nurse": "Nurse Davis",
        "incoming_nurse": "Nurse Anderson",
        "patient_id": "PT-004",
        "patient_name": "Sarah Mitchell",
    },
    {
        "note_text": (
            "Patient confused — pressure sore risk noted on sacrum. Reposition every 2 hours overnight. "
            "Fluid balance chart to be maintained. Low urine output last 4 hours — escalate if no improvement."
        ),
        "ward": "Ward 6B",
        "shift_date": "2026-09-02",
        "shift_type": "day",
        "outgoing_nurse": "Nurse Williams",
        "incoming_nurse": "Charge Nurse Taylor",
        "patient_id": "PT-005",
        "patient_name": "James Okafor",
    },
    {
        "note_text": (
            "Linda Green (Bed 9) atrial fibrillation — cardiac monitoring in progress. "
            "ECG obtained. Awaiting cardiology review. Risk of further cardiac event — observations every 30 minutes. "
            "Refer to Dr. Lee by end of shift."
        ),
        "ward": "Cardiac Ward",
        "shift_date": "2026-09-02",
        "shift_type": "day",
        "outgoing_nurse": "Charge Nurse Taylor",
        "incoming_nurse": "Nurse Wilson",
        "patient_id": "PT-006",
        "patient_name": "Linda Green",
    },
    {
        "note_text": (
            "Chest pain reported. Urgent review needed. ECG done. Escalate immediately."
        ),
        "ward": "Cardiac Ward",
        "shift_date": "2026-09-02",
        "shift_type": "evening",
        "outgoing_nurse": "Nurse Wilson",
        "incoming_nurse": "Nurse Brown",
        "patient_id": "PT-007",
        "patient_name": "Ahmed Hassan",
    },
    {
        "note_text": (
            "Patient post-op, wound draining. Care given. Reassess tomorrow."
        ),
        "ward": "Ward 8A",
        "shift_date": "2026-09-02",
        "shift_type": "evening",
        "outgoing_nurse": "Nurse Anderson",
        "incoming_nurse": "Nurse Davis",
        "patient_id": "PT-008",
        "patient_name": "Patricia Nguyen",
    },
    {
        "note_text": (
            "Mr. Kevin Walsh (Bed 15) high fall risk — neuro obs required every hour due to recent head injury. "
            "Pupil check performed at 20:00 — equal and reactive. "
            "Patient remains confused, bed rails up. Family notified. "
            "Dr. Thompson to review overnight if GCS drops. Crash mat in place."
        ),
        "ward": "Neuro Ward",
        "shift_date": "2026-09-02",
        "shift_type": "night",
        "outgoing_nurse": "Nurse Brown",
        "incoming_nurse": "Nurse Davis",
        "patient_id": "PT-009",
        "patient_name": "Kevin Walsh",
    },
    {
        "note_text": (
            "Elderly patient, confusion noted, renal function declining — creatinine rising. "
            "Fluid balance monitoring ongoing. Refer nephrology."
        ),
        "ward": "Ward 6B",
        "shift_date": "2026-09-03",
        "shift_type": "day",
        "outgoing_nurse": "Charge Nurse Taylor",
        "incoming_nurse": "Nurse Williams",
        "patient_id": "PT-010",
        "patient_name": "Dorothy Evans",
    },
]

SAMPLE_SUBSEQUENT_EVENTS = [
    {
        "action_id": 1,
        "patient_id": "PT-001",
        "patient_name": "John Davies",
        "event_description": "Patient fell while attempting to use bathroom unassisted at 03:15. Minor bruising to left hip. No fracture on X-ray.",
        "related_risk": "Fall risk",
        "event_type": "Fall",
        "severity": "medium",
        "was_preventable": True,
        "shift_date": "2026-09-02",
    },
    {
        "action_id": 2,
        "patient_id": "PT-002",
        "patient_name": "Mary Thompson",
        "event_description": "Rapid deterioration at 07:30 — SpO2 fell to 82%. MET call activated. Patient transferred to ICU.",
        "related_risk": "Clinical deterioration",
        "event_type": "Deterioration",
        "severity": "critical",
        "was_preventable": True,
        "shift_date": "2026-09-02",
    },
    {
        "action_id": 6,
        "patient_id": "PT-006",
        "patient_name": "Linda Green",
        "event_description": "Sustained ventricular tachycardia episode at 14:00. Emergency response required. Cardioverted successfully.",
        "related_risk": "Cardiac event risk",
        "event_type": "Cardiac Event",
        "severity": "critical",
        "was_preventable": False,
        "shift_date": "2026-09-02",
    },
    {
        "action_id": 7,
        "patient_id": "PT-007",
        "patient_name": "Ahmed Hassan",
        "event_description": "Confirmed NSTEMI at 22:00. Transferred to cath lab. No handover note documented owner for escalation.",
        "related_risk": "Cardiac event risk",
        "event_type": "Cardiac Event",
        "severity": "critical",
        "was_preventable": True,
        "shift_date": "2026-09-02",
    },
    {
        "action_id": 5,
        "patient_id": "PT-005",
        "patient_name": "James Okafor",
        "event_description": "Grade 2 pressure injury identified on sacrum at 14:00 assessment. Repositioning was not documented as performed.",
        "related_risk": "Pressure injury risk",
        "event_type": "Pressure Injury",
        "severity": "medium",
        "was_preventable": True,
        "shift_date": "2026-09-03",
    },
]

SAMPLE_FAILURE_CASES = [
    {
        "action_id": 7,
        "failure_type": "missing_owner",
        "description": "Handover note for Ahmed Hassan (Bed PT-007) did not specify an owner for cardiac escalation. No staff member was assigned responsibility.",
        "patient_id": "PT-007",
        "patient_name": "Ahmed Hassan",
        "ward": "Cardiac Ward",
        "severity": "critical",
        "resolved": False,
    },
    {
        "action_id": 8,
        "failure_type": "missing_owner",
        "description": "Post-operative handover for Patricia Nguyen lacked an assigned owner. Note was too brief — low confidence extraction.",
        "patient_id": "PT-008",
        "patient_name": "Patricia Nguyen",
        "ward": "Ward 8A",
        "severity": "medium",
        "resolved": False,
    },
    {
        "action_id": 3,
        "failure_type": "overdue",
        "description": "Wound reassessment for Robert Chen was due at morning round but not documented as completed by 12:00.",
        "patient_id": "PT-003",
        "patient_name": "Robert Chen",
        "ward": "Ward 8A",
        "severity": "medium",
        "resolved": True,
    },
    {
        "action_id": 2,
        "failure_type": "unresolved",
        "description": "Dr. Patel review of Mary Thompson was scheduled for 06:00 but not completed before shift change at 07:30.",
        "patient_id": "PT-002",
        "patient_name": "Mary Thompson",
        "ward": "Ward 6B",
        "severity": "critical",
        "resolved": False,
    },
    {
        "action_id": None,
        "failure_type": "low_confidence",
        "description": "Handover note for Patricia Nguyen (Ward 8A) had confidence score of 0.42 — insufficient detail for reliable extraction. Human review flagged.",
        "patient_id": "PT-008",
        "patient_name": "Patricia Nguyen",
        "ward": "Ward 8A",
        "severity": "high",
        "resolved": False,
    },
    {
        "action_id": None,
        "failure_type": "low_confidence",
        "description": "Handover note for Ahmed Hassan was only 2 sentences with no owner or deadline. Confidence 0.38. Human review required.",
        "patient_id": "PT-007",
        "patient_name": "Ahmed Hassan",
        "ward": "Cardiac Ward",
        "severity": "critical",
        "resolved": False,
    },
    {
        "action_id": 5,
        "failure_type": "unresolved",
        "description": "Repositioning action for James Okafor not completed — no documentation found after shift change.",
        "patient_id": "PT-005",
        "patient_name": "James Okafor",
        "ward": "Ward 6B",
        "severity": "medium",
        "resolved": False,
    },
]


def seed():
    from ai_extractor import extract_from_note

    db = SessionLocal()
    try:
        # Guard: only seed when the database is completely empty.
        # This prevents re-running seed_data.py from wiping handovers
        # that were submitted via the UI after the initial seed.
        if db.query(models.HandoverNote).count() > 0:
            print("ℹ️  Database already contains data — skipping seed to preserve existing records.")
            return

        # (Tables are empty — safe to insert sample data)

        # Insert handover notes and extracted actions
        handover_ids = []
        for i, note_data in enumerate(SAMPLE_NOTES):
            note = models.HandoverNote(
                note_text=note_data["note_text"],
                ward=note_data["ward"],
                shift_date=note_data["shift_date"],
                shift_type=note_data["shift_type"],
                outgoing_nurse=note_data["outgoing_nurse"],
                incoming_nurse=note_data["incoming_nurse"],
            )
            db.add(note)
            db.flush()
            handover_ids.append(note.id)

            # Extract AI action
            extracted = extract_from_note(
                note_data["note_text"],
                note_data["patient_id"],
                note_data["patient_name"],
            )
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

        db.commit()

        # Seed shift changes
        shift_changes_data = [
            {"handover_id": 1, "shift_date": "2026-09-01", "ward": "Ward 6B", "unresolved_count": 2, "resolved_count": 3},
            {"handover_id": 3, "shift_date": "2026-09-01", "ward": "Ward 8A", "unresolved_count": 1, "resolved_count": 4},
            {"handover_id": 5, "shift_date": "2026-09-02", "ward": "Ward 6B", "unresolved_count": 3, "resolved_count": 2},
            {"handover_id": 6, "shift_date": "2026-09-02", "ward": "Cardiac Ward", "unresolved_count": 2, "resolved_count": 1},
            {"handover_id": 9, "shift_date": "2026-09-02", "ward": "Neuro Ward", "unresolved_count": 1, "resolved_count": 5},
            {"handover_id": 10, "shift_date": "2026-09-03", "ward": "Ward 6B", "unresolved_count": 1, "resolved_count": 6},
        ]
        for sc in shift_changes_data:
            db.add(models.ShiftChange(**sc))
        db.commit()

        # Seed subsequent events
        for ev in SAMPLE_SUBSEQUENT_EVENTS:
            db.add(models.SubsequentEvent(**ev))
        db.commit()

        # Seed failure cases
        for fc in SAMPLE_FAILURE_CASES:
            db.add(models.FailureCase(**fc))
        db.commit()

        print("✅ Database seeded successfully.")
    except Exception as e:
        db.rollback()
        print(f"❌ Seed error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
