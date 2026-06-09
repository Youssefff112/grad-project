"""Normalize fitness goals from app onboarding into generator enums."""

GOAL_ALIASES = {
    "fatloss": "fat_loss",
    "fat_loss": "fat_loss",
    "weight_loss": "fat_loss",
    "lose_weight": "fat_loss",
    "hypertrophy": "muscle_gain",
    "muscle_gain": "muscle_gain",
    "muscle": "muscle_gain",
    "bulk": "muscle_gain",
    "athletic": "sports_performance",
    "sports_performance": "sports_performance",
    "sports": "sports_performance",
    "longevity": "general_fitness",
    "maintenance": "general_fitness",
    "general_fitness": "general_fitness",
    "endurance": "endurance",
    "strength": "strength",
}


def normalize_goal(raw: str) -> str:
    if not raw:
        return "general_fitness"
    g = str(raw).lower().replace(" ", "_").replace("-", "_")
    if g in GOAL_ALIASES:
        return GOAL_ALIASES[g]
    if "fat" in g or "weight" in g or "loss" in g:
        return "fat_loss"
    if "muscle" in g or "hyper" in g or "bulk" in g or "gain" in g:
        return "muscle_gain"
    if "athlet" in g or "sport" in g:
        return "sports_performance"
    if "endur" in g or "cardio" in g or "stamina" in g:
        return "endurance"
    if "longev" in g or "health" in g:
        return "general_fitness"
    return "general_fitness"


def normalize_goal_list(goals) -> list:
    if not goals:
        return ["general_fitness"]
    if isinstance(goals, str):
        return [normalize_goal(goals)]
    return [normalize_goal(g) for g in goals if g]
