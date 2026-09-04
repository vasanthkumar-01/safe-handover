"""
Mock AI extraction engine — no API key required.
Parses handover note text using keyword patterns to extract:
  - risk
  - action
  - owner
  - deadline
  - confidence score
"""

import re
import random
from typing import List, Dict, Any

# Known owners (nursing staff) for matching
KNOWN_OWNERS = [
    "Dr. Smith", "Dr. Patel", "Dr. Johnson", "Dr. Lee",
    "Nurse Williams", "Nurse Brown", "Nurse Davis", "Nurse Wilson",
    "Charge Nurse Taylor", "Dr. Martinez", "Nurse Anderson", "Dr. Thompson",
]

# Risk keyword patterns
RISK_PATTERNS = [
    (r"(risk of fall|fall risk|high fall risk)", "Fall risk"),
    (r"(deteriorat\w+|rapid deterioration|clinical deterioration)", "Clinical deterioration"),
    (r"(chest pain|cardiac event|arrhythmia|atrial fibrillation)", "Cardiac event risk"),
    (r"(sepsis|infection|fever|pyrexia|elevated temperature)", "Infection / Sepsis risk"),
    (r"(pressure (sore|ulcer|injury)|skin breakdown)", "Pressure injury risk"),
    (r"(confusion|delirium|agitated|disoriented)", "Delirium / Confusion risk"),
    (r"(low blood pressure|hypotension|hypotensive)", "Haemodynamic instability"),
    (r"(oxygen|spo2|saturation|respiratory distress|breathing)", "Respiratory deterioration"),
    (r"(pain|uncontrolled pain|severe pain)", "Uncontrolled pain"),
    (r"(fluid|dehydration|renal|kidney|urine output)", "Fluid / Renal risk"),
    (r"(wound|post.?op|surgical|drain)", "Post-operative complication risk"),
    (r"(blood sugar|glucose|diabetic|hypoglyc)", "Glycaemic instability"),
]

# Action keyword patterns
ACTION_PATTERNS = [
    (r"(monitor hourly|hourly obs|hourly monitoring)", "Monitor observations hourly"),
    (r"(review by|to be reviewed|needs review|for review)", "Clinical review required"),
    (r"(escalate|escalation|call the team|notify)", "Escalate to clinical team"),
    (r"(reposition|turn patient|pressure care)", "Reposition / Pressure care"),
    (r"(blood test|bloods|fbc|u&e|cultures|blood culture)", "Obtain blood samples"),
    (r"(chest x.?ray|cxr|ecg|imaging)", "Arrange imaging / ECG"),
    (r"(iv fluid|fluid bolus|fluids)", "Administer IV fluids as prescribed"),
    (r"(wound care|dress\w+|redress)", "Wound care / dressing change"),
    (r"(falls protocol|bed alarm|low bed|crash mat)", "Implement falls prevention protocol"),
    (r"(neuro obs|neuro check|pupils)", "Perform neurological observations"),
    (r"(pain reassess|pain review|pain score)", "Reassess pain score"),
    (r"(urine output|catheter|fluid balance)", "Monitor fluid balance / urine output"),
    (r"(consult|refer|referral)", "Refer to specialist"),
    (r"(family|next of kin|nok|relative)", "Update family / next of kin"),
]

# Deadline keyword patterns  
DEADLINE_PATTERNS = [
    (r"by (\d{1,2}[:\.]?\d{0,2}\s?(?:am|pm|AM|PM)?)", r"By \1"),
    (r"within (\d+)\s?(hour|hr)s?", r"Within \1 hour(s)"),
    (r"(immediately|urgent|stat|asap|right away)", "Immediately"),
    (r"(next (?:shift|handover|round))", "Next shift"),
    (r"(tonight|this evening|overnight)", "Tonight"),
    (r"(morning|tomorrow morning|am round)", "Tomorrow morning"),
    (r"(in (\d+) hours?)", r"In \2 hours"),
    (r"(end of shift|before handover)", "End of shift"),
    (r"(daily|once daily|every day)", "Daily"),
]

# Owner mention patterns
OWNER_PATTERNS = [
    r"(?:assign(?:ed)? to|responsibility of|for|notify|call)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)",
    r"(Dr\.?\s+[A-Z][a-z]+)",
    r"(Nurse\s+[A-Z][a-z]+)",
    r"(Charge Nurse\s+[A-Z][a-z]+)",
]


def extract_from_note(note_text: str, patient_id: str, patient_name: str) -> Dict[str, Any]:
    """
    Mock AI extraction: parse a handover note sentence by sentence,
    returning structured risk/action/owner/deadline with a confidence score.
    """
    text_lower = note_text.lower()
    results = []

    # Split into sentences
    sentences = re.split(r'[.\n;]', note_text)

    # Collect overall signals
    risks_found = []
    actions_found = []
    deadlines_found = []
    owners_found = []

    for pattern, label in RISK_PATTERNS:
        if re.search(pattern, text_lower):
            risks_found.append(label)

    for pattern, label in ACTION_PATTERNS:
        if re.search(pattern, text_lower):
            actions_found.append(label)

    for pattern, replacement in DEADLINE_PATTERNS:
        match = re.search(pattern, text_lower, re.IGNORECASE)
        if match:
            deadlines_found.append(replacement if not match.lastindex else re.sub(pattern, replacement, match.group(0), flags=re.IGNORECASE))

    for pattern in OWNER_PATTERNS:
        match = re.search(pattern, note_text)
        if match:
            owners_found.append(match.group(1))

    # Determine primary values
    risk = risks_found[0] if risks_found else "Unspecified clinical risk"
    action = actions_found[0] if actions_found else "Review patient status"
    deadline = deadlines_found[0] if deadlines_found else None
    owner = owners_found[0] if owners_found else None

    # Compute confidence score
    confidence = _compute_confidence(risk, action, owner, deadline, note_text)

    missing_owner = owner is None
    human_review_required = confidence < 0.70 or missing_owner

    return {
        "patient_id": patient_id,
        "patient_name": patient_name,
        "risk": risk,
        "action": action,
        "owner": owner or "",
        "deadline": deadline or "Not specified",
        "confidence": round(confidence, 2),
        "missing_owner": missing_owner,
        "human_review_required": human_review_required,
        "status": "pending",
        "overdue": False,
    }


def _compute_confidence(risk: str, action: str, owner: str, deadline: str, text: str) -> float:
    """
    Heuristic confidence scoring:
      - Presence of specific risk keywords  +0.25
      - Presence of specific action keywords +0.25
      - Owner named                          +0.20
      - Deadline specified                   +0.15
      - Text length (more context = better) +0.15 max
    """
    score = 0.0

    if risk and risk != "Unspecified clinical risk":
        score += 0.25
    if action and action != "Review patient status":
        score += 0.25
    if owner:
        score += 0.20
    if deadline:
        score += 0.15

    # Text length bonus
    word_count = len(text.split())
    if word_count >= 30:
        score += 0.15
    elif word_count >= 15:
        score += 0.08
    elif word_count >= 8:
        score += 0.04

    # Add small noise for realism
    noise = random.uniform(-0.03, 0.03)
    score = max(0.35, min(1.0, score + noise))

    return score


def bulk_extract(notes: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    """Extract from multiple notes."""
    return [extract_from_note(n["text"], n["patient_id"], n["patient_name"]) for n in notes]
