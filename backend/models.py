from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.sql import func
from database import Base


class HandoverNote(Base):
    __tablename__ = "handover_notes"

    id = Column(Integer, primary_key=True, index=True)
    note_text = Column(Text, nullable=False)
    ward = Column(String(100))
    shift_date = Column(String(50))
    shift_type = Column(String(20))  # day / night / evening
    outgoing_nurse = Column(String(100))
    incoming_nurse = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ExtractedAction(Base):
    __tablename__ = "extracted_actions"

    id = Column(Integer, primary_key=True, index=True)
    handover_id = Column(Integer, nullable=False)
    patient_id = Column(String(50))
    patient_name = Column(String(100))
    risk = Column(String(500))
    action = Column(String(500))
    owner = Column(String(100))
    deadline = Column(String(100))
    confidence = Column(Float, default=0.85)
    status = Column(String(30), default="pending")  # pending / resolved / overdue
    human_review_required = Column(Boolean, default=False)
    missing_owner = Column(Boolean, default=False)
    overdue = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ShiftChange(Base):
    __tablename__ = "shift_changes"

    id = Column(Integer, primary_key=True, index=True)
    handover_id = Column(Integer, nullable=False)
    shift_date = Column(String(50))
    ward = Column(String(100))
    unresolved_count = Column(Integer, default=0)
    resolved_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SubsequentEvent(Base):
    __tablename__ = "subsequent_events"

    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(Integer, nullable=False)
    patient_id = Column(String(50))
    patient_name = Column(String(100))
    event_description = Column(Text)
    related_risk = Column(String(500))
    event_type = Column(String(100))  # fall, deterioration, medication error, etc.
    severity = Column(String(20))  # low / medium / high / critical
    was_preventable = Column(Boolean, default=False)
    shift_date = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class FailureCase(Base):
    __tablename__ = "failure_cases"

    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(Integer, nullable=True)
    failure_type = Column(String(100))  # missing_owner, overdue, low_confidence, unresolved
    description = Column(Text)
    patient_id = Column(String(50))
    patient_name = Column(String(100))
    ward = Column(String(100))
    severity = Column(String(20))
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
