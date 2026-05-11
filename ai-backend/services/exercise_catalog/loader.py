"""Load exercise catalog from JSON and seed database."""
import json
import os
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from models import Exercise

# Form rules for CV - keyed by form_rules_key in catalog
FORM_RULES = {
    "squat": {
        "landmarks": ["left_hip", "left_knee", "left_ankle", "right_hip", "right_knee", "right_ankle"],
        "top_position": {"knee_angle_min": 170, "knee_angle_max": 190},
        "bottom_position": {"knee_angle_min": 70, "knee_angle_max": 100},
        "feedback": {"knees_over_toes": "Keep knees behind toes", "back_straight": "Keep back straight, chest up"},
    },
    "push_up": {
        "landmarks": ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist"],
        "top_position": {"elbow_angle_min": 170, "elbow_angle_max": 190},
        "bottom_position": {"elbow_angle_min": 80, "elbow_angle_max": 100},
        "feedback": {"body_straight": "Keep body in a straight line", "elbows_in": "Keep elbows at 45 degrees from body"},
    },
    "bicep_curl": {
        "landmarks": ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist"],
        "top_position": {"elbow_angle_min": 30, "elbow_angle_max": 50},
        "bottom_position": {"elbow_angle_min": 165, "elbow_angle_max": 190},
        "feedback": {"no_swing": "Don't swing - control the movement", "full_rom": "Full range of motion - extend fully at bottom"},
    },
    "plank": {"feedback": {"hips_level": "Keep hips level with shoulders", "core_tight": "Engage core"}},
    "dip": {"feedback": {"elbows_in": "Keep elbows back", "control_descent": "Lower with control"}},
}


def _catalog_path() -> str:
    base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    return os.path.join(base, "data", "exercises_catalog.json")


def load_catalog() -> List[Dict[str, Any]]:
    """Load exercise catalog from JSON file."""
    path = _catalog_path()
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def seed_from_catalog(db: Session, clear_existing: bool = False) -> int:
    """
    Seed exercise table from catalog.
    If clear_existing=True, deletes all exercises first.
    Returns number of exercises seeded.
    """
    if clear_existing:
        db.query(Exercise).delete()
        db.commit()

    catalog = load_catalog()
    if not catalog:
        return 0

    for item in catalog:
        form_key = item.get("form_rules_key")
        form_rules = FORM_RULES.get(form_key, {}) if form_key else {}
        injury = item.get("injury_contraindications", [])
        if isinstance(injury, str):
            injury = [injury] if injury else []

        ex = Exercise(
            name=item["name"],
            category="strength",
            muscle_group=item["muscle_group"],
            equipment_needed=item.get("equipment_needed", "bodyweight"),
            difficulty=item.get("difficulty", "beginner"),
            description=item.get("description", ""),
            form_rules=form_rules,
            injury_contraindications=injury,
            default_sets=item.get("default_sets", 3),
            default_reps=item.get("default_reps", "8-12"),
            rest_sec=item.get("rest_sec", 60),
            location=item.get("location", "gym"),
        )
        db.add(ex)

    db.commit()
    return len(catalog)
