"""Exercise selection and plan generation based on client profile."""
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from models import Exercise, Client

# Exercise library (will be seeded in DB)
EXERCISE_LIBRARY = [
    # Beginner full body
    {"name": "Bodyweight Squat", "category": "strength", "muscle_group": "legs", "equipment_needed": "bodyweight", "difficulty": "beginner"},
    {"name": "Push-up", "category": "strength", "muscle_group": "chest", "equipment_needed": "bodyweight", "difficulty": "beginner"},
    {"name": "Plank", "category": "strength", "muscle_group": "core", "equipment_needed": "bodyweight", "difficulty": "beginner"},
    {"name": "Glute Bridge", "category": "strength", "muscle_group": "glutes", "equipment_needed": "bodyweight", "difficulty": "beginner"},
    {"name": "Bicep Curl", "category": "strength", "muscle_group": "biceps", "equipment_needed": "dumbbell", "difficulty": "beginner"},
    {"name": "Tricep Dip", "category": "strength", "muscle_group": "triceps", "equipment_needed": "bodyweight", "difficulty": "beginner"},
    # Intermediate
    {"name": "Goblet Squat", "category": "strength", "muscle_group": "legs", "equipment_needed": "dumbbell", "difficulty": "intermediate"},
    {"name": "Dumbbell Row", "category": "strength", "muscle_group": "back", "equipment_needed": "dumbbell", "difficulty": "intermediate"},
    {"name": "Dumbbell Press", "category": "strength", "muscle_group": "chest", "equipment_needed": "dumbbell", "difficulty": "intermediate"},
    {"name": "Romanian Deadlift", "category": "strength", "muscle_group": "posterior_chain", "equipment_needed": "barbell", "difficulty": "intermediate"},
    {"name": "Lunges", "category": "strength", "muscle_group": "legs", "equipment_needed": "bodyweight", "difficulty": "intermediate"},
    {"name": "Overhead Press", "category": "strength", "muscle_group": "shoulders", "equipment_needed": "barbell", "difficulty": "intermediate"},
    # Advanced
    {"name": "Barbell Squat", "category": "strength", "muscle_group": "legs", "equipment_needed": "barbell", "difficulty": "advanced"},
    {"name": "Bench Press", "category": "strength", "muscle_group": "chest", "equipment_needed": "barbell", "difficulty": "advanced"},
    {"name": "Deadlift", "category": "strength", "muscle_group": "posterior_chain", "equipment_needed": "barbell", "difficulty": "advanced"},
    {"name": "Pull-up", "category": "strength", "muscle_group": "back", "equipment_needed": "pull_up_bar", "difficulty": "advanced"},
]

# Form rules for computer vision (MediaPipe landmark indices)
FORM_RULES = {
    "squat": {
        "landmarks": ["left_hip", "left_knee", "left_ankle", "right_hip", "right_knee", "right_ankle"],
        "top_position": {"knee_angle_min": 170, "knee_angle_max": 190},
        "bottom_position": {"knee_angle_min": 70, "knee_angle_max": 100},
        "feedback": {
            "knees_over_toes": "Keep knees behind toes",
            "back_straight": "Keep back straight, chest up",
        },
    },
    "push_up": {
        "landmarks": ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist"],
        "top_position": {"elbow_angle_min": 170, "elbow_angle_max": 190},
        "bottom_position": {"elbow_angle_min": 80, "elbow_angle_max": 100},
        "feedback": {
            "body_straight": "Keep body in a straight line",
            "elbows_in": "Keep elbows at 45 degrees from body",
        },
    },
    "bicep_curl": {
        "landmarks": ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist"],
        "top_position": {"elbow_angle_min": 30, "elbow_angle_max": 50},
        "bottom_position": {"elbow_angle_min": 165, "elbow_angle_max": 190},
        "feedback": {
            "no_swing": "Don't swing - control the movement",
            "full_rom": "Full range of motion - extend fully at bottom",
        },
    },
    "plank": {
        "feedback": {"hips_level": "Keep hips level with shoulders", "core_tight": "Engage core"},
    },
}


def _matches_equipment(client_equipment: str, ex_equipment: str) -> bool:
    """Check if exercise matches client's available equipment."""
    if client_equipment == "full_gym":
        return True
    if client_equipment == "bodyweight":
        return ex_equipment == "bodyweight"
    if client_equipment == "home_minimal":
        return ex_equipment in ("bodyweight", "dumbbell")
    return True


def _difficulty_score(client_level: str, ex_difficulty: str) -> int:
    """Prefer exercises at or slightly above client level."""
    levels = ["beginner", "intermediate", "advanced"]
    c = levels.index(client_level) if client_level in levels else 0
    e = levels.index(ex_difficulty) if ex_difficulty in levels else 0
    diff = e - c
    if diff == 0:
        return 10  # Perfect match
    if diff == 1:
        return 7   # Slightly challenging
    if diff == -1:
        return 5   # Easier - ok for recovery
    return 0  # Too easy or too hard


def select_exercises(
    db: Session,
    client: Client,
    muscle_groups: Optional[List[str]] = None,
    num_exercises: int = 6,
) -> List[Exercise]:
    """Select exercises suited to the client."""
    exercises = db.query(Exercise).all()
    if not exercises:
        # Seed and retry
        _seed_exercises(db)
        exercises = db.query(Exercise).all()

    scored = []
    expanded_groups = set()
    if muscle_groups:
        for g in muscle_groups:
            if g == "arms":
                expanded_groups.update(["biceps", "triceps"])
            elif g == "posterior_chain":
                expanded_groups.update(["legs", "glutes", "posterior_chain"])
            else:
                expanded_groups.add(g)

    for ex in exercises:
        if not _matches_equipment(client.equipment or "full_gym", ex.equipment_needed):
            continue
        if expanded_groups and ex.muscle_group not in expanded_groups:
            continue
        score = _difficulty_score(client.fitness_level, ex.difficulty)
        if score > 0:
            scored.append((score, ex))

    scored.sort(key=lambda x: -x[0])
    return [ex for _, ex in scored[:num_exercises]]


def create_exercise_plan(
    db: Session,
    client: Client,
    days_per_week: int = 4,
) -> List[Dict[str, Any]]:
    """Create weekly exercise plan for client."""
    # Split muscle groups across days
    split = {
        3: [["legs", "core"], ["chest", "triceps", "shoulders"], ["back", "biceps"]],
        4: [
            ["legs"],
            ["chest", "triceps"],
            ["back", "biceps"],
            ["shoulders", "core"],
        ],
        5: [
            ["legs"],
            ["chest"],
            ["back"],
            ["shoulders"],
            ["arms", "core"],
        ],
    }
    muscle_plan = split.get(days_per_week, split[4])

    plans = []
    for i, groups in enumerate(muscle_plan):
        exercises = select_exercises(db, client, muscle_groups=groups, num_exercises=5)
        plan_exercises = []
        for ex in exercises:
            sets = 3 if client.fitness_level == "beginner" else 4
            reps = "8-12" if client.goal == "muscle_gain" else "12-15"
            plan_exercises.append({
                "exercise_id": ex.id,
                "exercise_name": ex.name,
                "sets": sets,
                "reps": reps,
                "rest_sec": 60,
            })
        plans.append({
            "name": f"Day {i + 1}",
            "day_of_week": i,
            "muscle_groups": groups,
            "exercises": plan_exercises,
        })
    return plans


def _seed_exercises(db: Session) -> None:
    """Seed exercise library from catalog or fallback to built-in."""
    try:
        from services.exercise_catalog.loader import seed_from_catalog
        count = seed_from_catalog(db, clear_existing=False)
        if count > 0:
            return
    except Exception:
        pass
    # Fallback to legacy seed
    name_to_rule = {
        "bodyweight squat": "squat",
        "goblet squat": "squat",
        "barbell squat": "squat",
        "push-up": "push_up",
        "bicep curl": "bicep_curl",
        "plank": "plank",
    }
    for ex_data in EXERCISE_LIBRARY:
        key = ex_data["name"].lower()
        form_rule = FORM_RULES.get(name_to_rule.get(key, ""), {})
        ex = Exercise(
            name=ex_data["name"],
            category=ex_data["category"],
            muscle_group=ex_data["muscle_group"],
            equipment_needed=ex_data["equipment_needed"],
            difficulty=ex_data["difficulty"],
            form_rules=form_rule,
        )
        db.add(ex)
    db.commit()
