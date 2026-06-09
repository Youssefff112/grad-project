"""Deterministic workout plan generator."""
from typing import Dict, List, Any
from sqlalchemy.orm import Session

from models import Client
from services.exercise_service import select_exercises, create_exercise_plan
from .rules.split_rules import select_split, get_muscle_plan
from .rules.exercise_rules import filter_exercises_for_client
from .rules.goal_utils import normalize_goal, normalize_goal_list


def _client_profile_from_model(client: Client) -> Dict:
    """Build profile dict from Client model (supports extended JSON)."""
    normalized_goal = normalize_goal(client.goal)
    profile = {
        "training": {
            "days_per_week": 4,
            "experience_level": client.fitness_level,
            "time_per_session_min": 45,
            "equipment": client.equipment or "full_gym",
            "exercises_dislike": [],
        },
        "goals": {"primary_goals": [normalized_goal]},
        "health": {
            "injury_areas": [],
            "doctor_restrictions": False,
        },
    }
    ext = getattr(client, "profile_extended", None) or {}
    if isinstance(ext, dict):
        profile["training"].update(ext.get("training", {}))
        merged_goals = ext.get("goals", {})
        if merged_goals:
            primary = merged_goals.get("primary_goals") or merged_goals.get("primary")
            if primary:
                if isinstance(primary, list):
                    profile["goals"]["primary_goals"] = normalize_goal_list(primary)
                else:
                    profile["goals"]["primary_goals"] = [normalize_goal(primary)]
        profile["health"].update(ext.get("health", {}))
    return profile


def _prescription_for_goal(goal: str, fitness_level: str) -> Dict[str, Any]:
    """Sets, reps, and rest tailored to the client's fitness goal."""
    if goal == "strength":
        return {"sets": 4 if fitness_level != "beginner" else 3, "reps": "4-6", "rest": 120}
    if goal == "muscle_gain":
        return {"sets": 4 if fitness_level != "beginner" else 3, "reps": "8-12", "rest": 75}
    if goal == "fat_loss":
        return {"sets": 3 if fitness_level == "beginner" else 4, "reps": "12-20", "rest": 35}
    if goal in ("sports_performance", "endurance"):
        return {"sets": 3, "reps": "15-25", "rest": 30}
    return {"sets": 3, "reps": "10-15", "rest": 60}


def _day_label(goal: str, groups: List[str], index: int) -> str:
    if goal == "fat_loss":
        if "legs" in groups and "chest" not in groups:
            return f"Fat Burn — Day {index + 1}"
        return f"Full Body Burn — Day {index + 1}"
    if goal == "muscle_gain":
        focus = groups[0] if groups else "workout"
        return f"Hypertrophy — {focus.replace('_', ' ').title()} — Day {index + 1}"
    if goal in ("sports_performance", "endurance"):
        return f"Conditioning — Day {index + 1}"
    return f"Day {index + 1}"


def generate_workout_plan(
    db: Session,
    client: Client,
    days_per_week: int = None,
    rotation_offset: int = 0,
) -> List[Dict[str, Any]]:
    """
    Generate personalized workout plan.
    Uses split rules, injury exclusion, equipment match, experience level.
    """
    client.goal = normalize_goal(client.goal)
    profile = _client_profile_from_model(client)
    training = profile["training"]
    goals = profile["goals"]
    health = profile["health"]
    primary_goal = goals.get("primary_goals", [client.goal])[0]
    prescription = _prescription_for_goal(primary_goal, client.fitness_level)

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
            db,
            client,
            muscle_groups=groups,
            num_exercises=15,
            rotation_offset=rotation_offset + i,
        )
        dislike = training.get("exercises_dislike", [])
        filtered = filter_exercises_for_client(
            exercises,
            equipment=training.get("equipment", client.equipment or "full_gym"),
            injury_areas=health.get("injury_areas", []),
            doctor_restrictions=health.get("doctor_restrictions", False),
            exclude_names=dislike,
        )
        if len(filtered) < 3 and dislike:
            filtered = filter_exercises_for_client(
                exercises,
                equipment=training.get("equipment", client.equipment or "full_gym"),
                injury_areas=health.get("injury_areas", []),
                doctor_restrictions=health.get("doctor_restrictions", False),
                exclude_names=[],
            )

        plan_exercises = []
        for ex in filtered[:5]:
            plan_exercises.append({
                "exercise_id": ex.id,
                "exercise_name": ex.name,
                "sets": prescription["sets"],
                "reps": prescription["reps"],
                "rest_sec": prescription["rest"],
            })

        plans.append({
            "name": _day_label(primary_goal, groups, i),
            "day_of_week": i,
            "split": split,
            "muscle_groups": groups,
            "exercises": plan_exercises,
            "progression_notes": _progression_notes(client, split, primary_goal),
        })

    return plans


def _progression_notes(client: Client, split: str, goal: str) -> str:
    """Generate progression guidance."""
    level = client.fitness_level
    notes = []
    if level == "beginner":
        notes.append("Focus on form. Add weight only when you can complete all reps with control.")
    if goal == "strength":
        notes.append("Progressive overload: add weight when you hit top of rep range.")
    if goal == "muscle_gain":
        notes.append("Aim for 8-12 reps; when easy, add weight or reps.")
    if goal == "fat_loss":
        notes.append("Keep rest periods short. Prioritize consistent effort and weekly calorie deficit.")
    if goal in ("sports_performance", "endurance"):
        notes.append("Build work capacity gradually; add rounds or time before adding load.")
    if split == "full_body":
        notes.append("Rest at least 48h between sessions.")
    return " ".join(notes) if notes else "Track weights and progress weekly."
