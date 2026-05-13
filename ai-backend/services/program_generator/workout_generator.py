"""Deterministic workout plan generator."""
from typing import Dict, List, Any
from sqlalchemy.orm import Session

from models import Client
from services.exercise_service import select_exercises, create_exercise_plan
from .rules.split_rules import select_split, get_muscle_plan
from .rules.exercise_rules import filter_exercises_for_client


def _client_profile_from_model(client: Client) -> Dict:
    """Build profile dict from Client model (supports extended JSON)."""
    profile = {
        "training": {
            "days_per_week": 4,
            "experience_level": client.fitness_level,
            "time_per_session_min": 45,
            "equipment": client.equipment or "full_gym",
            "exercises_dislike": [],
        },
        "goals": {"primary_goals": [client.goal]},
        "health": {
            "injury_areas": [],
            "doctor_restrictions": False,
        },
    }
    ext = getattr(client, "profile_extended", None) or {}
    if isinstance(ext, dict):
        profile["training"].update(ext.get("training", {}))
        profile["goals"].update(ext.get("goals", {}))
        profile["health"].update(ext.get("health", {}))
    return profile


def generate_workout_plan(
    db: Session,
    client: Client,
    days_per_week: int = None,
) -> List[Dict[str, Any]]:
    """
    Generate personalized workout plan.
    Uses split rules, injury exclusion, equipment match, experience level.
    """
    profile = _client_profile_from_model(client)
    training = profile["training"]
    goals = profile["goals"]
    health = profile["health"]

    days = days_per_week or training.get("days_per_week", 4)
    split = select_split(
        days,
        training.get("experience_level", client.fitness_level),
        goals.get("primary_goals", [client.goal]),
        training.get("time_per_session_min", 45),
    )
    muscle_plan = get_muscle_plan(split, days)

    plans = []
    for i, groups in enumerate(muscle_plan):
        exercises = select_exercises(
            db, client, muscle_groups=groups, num_exercises=6
        )
        filtered = filter_exercises_for_client(
            exercises,
            equipment=training.get("equipment", client.equipment or "full_gym"),
            injury_areas=health.get("injury_areas", []),
            doctor_restrictions=health.get("doctor_restrictions", False),
            exclude_names=training.get("exercises_dislike", []),
        )

        plan_exercises = []
        for ex in filtered[:5]:
            sets = 3 if client.fitness_level == "beginner" else 4
            if client.goal == "strength":
                reps = "4-6"
                rest = 120
            elif client.goal in ("muscle_gain", "fat_loss"):
                reps = "8-12"
                rest = 60
            else:
                reps = "12-15"
                rest = 45

            plan_exercises.append({
                "exercise_id": ex.id,
                "exercise_name": ex.name,
                "sets": sets,
                "reps": reps,
                "rest_sec": rest,
            })

        plans.append({
            "name": f"Day {i + 1}",
            "day_of_week": i,
            "split": split,
            "muscle_groups": groups,
            "exercises": plan_exercises,
            "progression_notes": _progression_notes(client, split),
        })

    return plans


def _progression_notes(client: Client, split: str) -> str:
    """Generate progression guidance."""
    level = client.fitness_level
    goal = client.goal
    notes = []
    if level == "beginner":
        notes.append("Focus on form. Add weight only when you can complete all reps with control.")
    if goal == "strength":
        notes.append("Progressive overload: add weight when you hit top of rep range.")
    if goal == "muscle_gain":
        notes.append("Aim for 8-12 reps; when easy, add weight or reps.")
    if split == "full_body":
        notes.append("Rest at least 48h between sessions.")
    return " ".join(notes) if notes else "Track weights and progress weekly."
