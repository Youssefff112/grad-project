"""Exercise-specific form scorers.

Registry maps exercise name patterns → scorer class.
get_scorer() is the single public entry point — pass any exercise name string.
"""
from .base import FormScorer
from .squat_scorer import SquatScorer
from .pushup_scorer import PushUpScorer
from .bicep_scorer import BicepCurlScorer
from .plank_scorer import PlankScorer
from .shoulder_press_scorer import ShoulderPressScorer, LateralRaiseScorer
from .lunge_scorer import LungeScorer
from .deadlift_scorer import DeadliftScorer
from .row_scorer import RowScorer
from .dip_scorer import DipScorer
from .glute_bridge_scorer import GluteBridgeScorer
from .pullup_scorer import PullUpScorer
from .generic_scorer import GenericScorer
from .cardio_scorer import (
    BurpeeScorer,
    JumpingJackScorer,
    MountainClimberScorer,
    HighKneeScorer,
)


def get_scorer(exercise_name: str) -> FormScorer:
    """Return the best-matching scorer for a given exercise name.

    Matching is purely keyword-based so callers can pass natural language names
    (e.g. "Barbell Bench Press", "bulgarian split squat") without pre-normalisation.
    """
    n = exercise_name.lower().replace("-", " ").replace("_", " ")

    # ── Legs ──────────────────────────────────────────────────────────────
    # More-specific patterns before generic "squat"
    if any(k in n for k in ("lunge", "split squat", "bulgarian", "step up", "step-up")):
        return LungeScorer()

    if any(k in n for k in ("squat", "goblet", "hack squat", "leg press", "wall sit")):
        return SquatScorer()

    if any(k in n for k in ("deadlift", "rdl", "romanian", "stiff leg")):
        return DeadliftScorer()

    if any(k in n for k in ("glute bridge", "hip thrust", "glute", "hip extension")):
        return GluteBridgeScorer()

    if any(k in n for k in ("calf raise", "calf")):
        # Calf raises — use generic (ankle flex not well visible from side camera)
        return GenericScorer()

    # ── Chest ─────────────────────────────────────────────────────────────
    if any(k in n for k in ("push up", "pushup", "push-up", "floor press", "chest press",
                             "bench press", "incline", "chest fly", "pec deck",
                             "cable crossover", "diamond push")):
        return PushUpScorer()

    # ── Back ──────────────────────────────────────────────────────────────
    if any(k in n for k in ("pull up", "pullup", "pull-up", "chin up", "chinup",
                             "chin-up", "lat pulldown", "assisted pull")):
        return PullUpScorer()

    if any(k in n for k in ("row", "inverted row", "t-bar", "cable row", "seated row",
                             "barbell row", "dumbbell row", "band row", "superman")):
        return RowScorer()

    # ── Shoulders ─────────────────────────────────────────────────────────
    if any(k in n for k in ("lateral raise", "front raise", "side raise",
                             "cable lateral", "rear delt", "face pull")):
        return LateralRaiseScorer()

    if any(k in n for k in ("shoulder press", "overhead press", "ohp", "military press",
                             "arnold press", "pike push")):
        return ShoulderPressScorer()

    # ── Arms ──────────────────────────────────────────────────────────────
    if any(k in n for k in ("curl", "bicep", "hammer curl", "concentration curl",
                             "preacher", "ez bar curl", "incline curl", "cable curl",
                             "towel curl", "band curl")):
        return BicepCurlScorer()

    if any(k in n for k in ("tricep", "skull crusher", "close grip", "pushdown",
                             "overhead extension", "triceps")):
        return DipScorer()

    if any(k in n for k in ("dip", "bench dip", "chair dip", "parallel bar")):
        return DipScorer()

    # ── Core / isometric ──────────────────────────────────────────────────
    if any(k in n for k in ("plank", "side plank", "hollow hold", "dead bug")):
        return PlankScorer()

    # ── Cardio / Full-body ─────────────────────────────────────────────────
    if any(k in n for k in ("burpee", "burpees")):
        return BurpeeScorer()

    if any(k in n for k in ("jumping jack", "jumping jacks", "star jump")):
        return JumpingJackScorer()

    if any(k in n for k in ("mountain climber", "mountain climbers")):
        return MountainClimberScorer()

    if any(k in n for k in ("high knee", "high knees")):
        return HighKneeScorer()

    if any(k in n for k in ("box jump", "jump squat", "squat jump", "tuck jump")):
        return SquatScorer()

    if any(k in n for k in ("skater", "lateral bound")):
        return LungeScorer()

    if any(k in n for k in ("bear crawl", "inchworm")):
        return GenericScorer()

    # ── Fallback ──────────────────────────────────────────────────────────
    return GenericScorer()
