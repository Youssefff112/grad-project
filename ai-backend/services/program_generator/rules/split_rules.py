"""Deterministic split selection based on client profile."""
from typing import List

SPLIT_MUSCLE_MAP = {
    "full_body": [
        ["legs", "chest", "back", "shoulders", "core"],
    ],
    "upper_lower": [
        ["legs", "core"],
        ["chest", "back", "shoulders", "biceps", "triceps"],
    ],
    "push_pull_legs": [
        ["chest", "shoulders", "triceps"],
        ["back", "biceps"],
        ["legs", "core"],
    ],
    "push_pull_legs_4": [
        ["legs", "core"],
        ["chest", "shoulders", "triceps"],
        ["back", "biceps"],
        ["legs", "shoulders", "core"],
    ],
}

# Map composite groups to DB muscle_group values
MUSCLE_GROUP_ALIASES = {
    "arms": ["biceps", "triceps"],
    "posterior_chain": ["legs", "glutes"],
}


def select_split(
    days_per_week: int,
    experience: str,
    goals: List[str],
    time_per_session_min: int,
) -> str:
    """
    Select workout split based on client profile.
    Returns: full_body, upper_lower, push_pull_legs, push_pull_legs_4
    """
    if days_per_week <= 2:
        return "full_body"
    if days_per_week == 3:
        return "full_body" if experience == "beginner" else "upper_lower"
    if days_per_week == 4:
        if "strength" in goals or experience == "advanced":
            return "push_pull_legs"
        return "upper_lower"
    if days_per_week >= 5:
        return "push_pull_legs_4"
    return "full_body"


def get_muscle_plan(split: str, days_per_week: int) -> List[List[str]]:
    """Get muscle groups per day for the split."""
    base = SPLIT_MUSCLE_MAP.get(split, SPLIT_MUSCLE_MAP["full_body"])
    if split == "full_body" and days_per_week > 1:
        return [base[0] for _ in range(days_per_week)]
    if split == "upper_lower" and days_per_week == 4:
        return [base[0], base[1], base[0], base[1]]
    if split == "push_pull_legs" and days_per_week == 3:
        return base
    if split == "push_pull_legs" and days_per_week == 4:
        return base + [base[0]]
    if split == "push_pull_legs_4":
        return base
    return base[:days_per_week] if len(base) >= days_per_week else base
