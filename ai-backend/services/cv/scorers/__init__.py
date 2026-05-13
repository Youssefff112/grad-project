"""Exercise-specific form scorers."""
from .base import FormScorer
from .squat_scorer import SquatScorer
from .pushup_scorer import PushUpScorer
from .bicep_scorer import BicepCurlScorer
from .plank_scorer import PlankScorer

SCORER_REGISTRY = {
    "squat": SquatScorer,
    "push_up": PushUpScorer,
    "pushup": PushUpScorer,
    "bicep_curl": BicepCurlScorer,
    "bicep": BicepCurlScorer,
    "plank": PlankScorer,
}


def get_scorer(exercise_name: str) -> FormScorer:
    """Get scorer for exercise. Defaults to squat if unknown."""
    name = exercise_name.lower().replace("-", " ").replace("_", " ")
    if "squat" in name:
        return SquatScorer()
    if "push" in name or "pushup" in name:
        return PushUpScorer()
    if "curl" in name or "bicep" in name:
        return BicepCurlScorer()
    if "plank" in name:
        return PlankScorer()
    return SquatScorer()
