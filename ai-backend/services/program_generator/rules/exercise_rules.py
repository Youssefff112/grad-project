"""Exercise selection rules - injury exclusion, equipment match."""
from typing import List, Optional, Any

# Injury areas -> exercise keywords to exclude
INJURY_CONTRAINDICATIONS = {
    "knees": ["squat", "lunge", "leg extension", "leg curl", "hack squat", "step-up", "bulgarian split squat", "calf raise"],
    "back": ["deadlift", "barbell row", "romanian deadlift", "good morning", "back extension", "barbell squat"],
    "shoulders": ["overhead press", "bench press", "pull-up", "dip", "lat pulldown", "lateral raise", "front raise", "pec deck", "fly", "face pull"],
    "wrist": ["push-up", "plank", "dip", "bench press", "bicep curl", "tricep"],
    "elbow": ["curl", "tricep", "dip", "bench press", "push-up"],
    "hip": ["squat", "deadlift", "lunge", "hip thrust", "glute bridge"],
    "neck": ["shrug", "overhead press"],
}


def is_safe_for_injuries(
    exercise_name: str,
    injury_areas: List[str],
    exercise_contraindications: Optional[List[str]] = None,
) -> bool:
    """Check if exercise is safe given client's injury areas."""
    if not injury_areas:
        return True

    # Check exercise's own contraindications (from catalog)
    if exercise_contraindications:
        for area in injury_areas:
            if area.lower().strip() in [c.lower() for c in exercise_contraindications]:
                return False

    # Check keyword-based contraindications
    ex_lower = exercise_name.lower()
    for area in injury_areas:
        area_lower = area.lower().strip()
        contraindicated = INJURY_CONTRAINDICATIONS.get(area_lower, [])
        for term in contraindicated:
            if term in ex_lower:
                return False
    return True


def _equipment_matches(client_equipment: str, ex_equipment: str) -> bool:
    """Check if exercise equipment matches client access."""
    client = (client_equipment or "full_gym").lower().replace(" ", "")
    ex = ex_equipment.lower().replace(" ", "")
    if client in ("full_gym", "fullgym"):
        return True
    if client in ("none", "bodyweight", "home_minimal"):
        return ex in ("bodyweight", "none")
    if client == "dumbbells":
        return ex in ("bodyweight", "dumbbell", "dumbbells", "none", "resistance_band")
    return True


def filter_exercises_for_client(
    exercises: List,
    equipment: str,
    injury_areas: List[str],
    doctor_restrictions: bool,
    exclude_names: Optional[List[str]] = None,
) -> List:
    """
    Filter exercises by injuries, equipment, doctor restrictions, dislikes.
    When doctor_restrictions=True, we exclude more aggressive/risky exercises.
    """
    exclude_names = exclude_names or []
    exclude_lower = [n.lower() for n in exclude_names]

    result = []
    risky_keywords = ["deadlift", "barbell squat", "pull-up", "dip", "overhead press"] if doctor_restrictions else []

    for ex in exercises:
        name = getattr(ex, "name", str(ex))
        name_lower = name.lower()
        eq = getattr(ex, "equipment_needed", "bodyweight")

        if name_lower in exclude_lower:
            continue
        if not _equipment_matches(equipment, eq):
            continue
        ex_contra = getattr(ex, "injury_contraindications", None) or []
        if not is_safe_for_injuries(name, injury_areas, ex_contra):
            continue
        if doctor_restrictions and any(kw in name_lower for kw in risky_keywords):
            continue
        result.append(ex)

    return result
