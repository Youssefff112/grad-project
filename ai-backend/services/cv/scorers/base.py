"""Abstract base for exercise form scorers."""
from abc import ABC, abstractmethod
from typing import Dict, List, Tuple


class FormScorer(ABC):
    """Base class for exercise-specific form scoring."""

    @abstractmethod
    def get_angles(self, landmarks) -> Dict[str, float]:
        """Return joint angles for display."""
        pass

    @abstractmethod
    def score_and_feedback(self, landmarks) -> Tuple[List[str], float]:
        """Returns (feedback_messages, score_0_100)."""
        pass

    def get_structured_feedback(
        self, feedback: List[str], score: float
    ) -> Dict:
        """Convert raw feedback to structured: done_well, to_fix, next_reps."""
        positive = [f for f in feedback if "good" in f.lower() or "!" in f]
        to_fix = [f for f in feedback if f not in positive]
        next_reps = []
        if to_fix:
            next_reps = [f.split(" - ")[-1] if " - " in f else f for f in to_fix[:3]]
        return {
            "done_well": positive[:3] if positive else ["Keep practicing!"],
            "to_fix": to_fix[:5],
            "next_reps": next_reps[:3] if next_reps else ["Focus on form"],
        }
