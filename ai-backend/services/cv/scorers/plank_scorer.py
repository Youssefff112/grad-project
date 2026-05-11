"""Plank form scorer."""
from typing import Dict, List, Tuple

from ..angle_calculator import angle_between_points, LANDMARK_INDEX, get_landmark_coords
from .base import FormScorer


class PlankScorer(FormScorer):
    """Score plank form from pose landmarks."""

    def get_angles(self, landmarks) -> Dict[str, float]:
        ls = get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        lh = get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])
        la = get_landmark_coords(landmarks, LANDMARK_INDEX["left_ankle"])
        rs = get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        rh = get_landmark_coords(landmarks, LANDMARK_INDEX["right_hip"])
        ra = get_landmark_coords(landmarks, LANDMARK_INDEX["right_ankle"])
        body_l = angle_between_points(ls, lh, la)
        body_r = angle_between_points(rs, rh, ra)
        return {
            "body_left": body_l,
            "body_right": body_r,
            "body_avg": round((body_l + body_r) / 2, 2),
        }

    def score_and_feedback(self, landmarks) -> Tuple[List[str], float]:
        feedback = []
        ls = get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        lh = get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])
        la = get_landmark_coords(landmarks, LANDMARK_INDEX["left_ankle"])
        rs = get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        rh = get_landmark_coords(landmarks, LANDMARK_INDEX["right_hip"])
        ra = get_landmark_coords(landmarks, LANDMARK_INDEX["right_ankle"])
        body_l = angle_between_points(ls, lh, la)
        body_r = angle_between_points(rs, rh, ra)
        avg_body = (body_l + body_r) / 2

        if avg_body >= 165:
            feedback.append(f"Body angle: {int(avg_body)}° - Straight line, good!")
        elif avg_body > 150:
            feedback.append(f"Body angle: {int(avg_body)}° - Slight hip raise. Lower hips to 170°+")
        elif avg_body > 130:
            feedback.append(f"Body angle: {int(avg_body)}° - Hips too high. LOWER hips, engage core")
        else:
            feedback.append(f"Body angle: {int(avg_body)}° - Hips sagging. LIFT hips to form straight line")

        score = max(0, min(100, 100 - abs(avg_body - 180) * 0.5))
        return feedback, round(score, 1)
