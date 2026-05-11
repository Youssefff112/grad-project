"""Squat form scorer."""
from typing import Dict, List, Tuple

from ..angle_calculator import angle_between_points, LANDMARK_INDEX, get_landmark_coords
from .base import FormScorer


class SquatScorer(FormScorer):
    """Score squat form from pose landmarks."""

    def get_angles(self, landmarks) -> Dict[str, float]:
        lh = get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])
        lk = get_landmark_coords(landmarks, LANDMARK_INDEX["left_knee"])
        la = get_landmark_coords(landmarks, LANDMARK_INDEX["left_ankle"])
        rh = get_landmark_coords(landmarks, LANDMARK_INDEX["right_hip"])
        rk = get_landmark_coords(landmarks, LANDMARK_INDEX["right_knee"])
        ra = get_landmark_coords(landmarks, LANDMARK_INDEX["right_ankle"])
        ls = get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        rs = get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])

        knee_l = angle_between_points(lh, lk, la)
        knee_r = angle_between_points(rh, rk, ra)
        hip_l = angle_between_points(ls, lh, lk)
        hip_r = angle_between_points(rs, rh, rk)
        return {
            "knee_left": knee_l,
            "knee_right": knee_r,
            "knee_avg": round((knee_l + knee_r) / 2, 2),
            "hip_left": hip_l,
            "hip_right": hip_r,
        }

    def score_and_feedback(self, landmarks) -> Tuple[List[str], float]:
        feedback = []
        lh = get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])
        lk = get_landmark_coords(landmarks, LANDMARK_INDEX["left_knee"])
        la = get_landmark_coords(landmarks, LANDMARK_INDEX["left_ankle"])
        rh = get_landmark_coords(landmarks, LANDMARK_INDEX["right_hip"])
        rk = get_landmark_coords(landmarks, LANDMARK_INDEX["right_knee"])
        ra = get_landmark_coords(landmarks, LANDMARK_INDEX["right_ankle"])
        ls = get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        rs = get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])

        knee_l = angle_between_points(lh, lk, la)
        knee_r = angle_between_points(rh, rk, ra)
        avg_knee = (knee_l + knee_r) / 2
        hip_l = angle_between_points(ls, lh, lk)
        hip_r = angle_between_points(rs, rh, rk)
        avg_hip = (hip_l + hip_r) / 2

        if avg_knee >= 160:
            feedback.append(f"Knee angle: {int(avg_knee)}° - Standing. Bend knees to 70-90° at bottom")
        elif avg_knee >= 120:
            feedback.append(f"Knee angle: {int(avg_knee)}° - BEND MORE. Go deeper to 70-90°")
        elif avg_knee <= 50:
            feedback.append(f"Knee angle: {int(avg_knee)}° - Too low. Rise slightly to 70-90°")
        elif 70 <= avg_knee <= 100:
            feedback.append(f"Knee angle: {int(avg_knee)}° - Good depth!")
        else:
            feedback.append(f"Knee angle: {int(avg_knee)}° - Target: 70-90° at bottom")

        if lk[0] > la[0] + 0.05:
            feedback.append("Left knee: Push knees OUT, sit hips BACK - keep behind toes")
        if rk[0] < ra[0] - 0.05:
            feedback.append("Right knee: Push knees OUT, sit hips BACK - keep behind toes")

        angle_diff = abs(knee_l - knee_r)
        if angle_diff > 15:
            feedback.append(f"Asymmetry: L {int(knee_l)}° vs R {int(knee_r)}° - Balance both legs")

        score = 100 - min(100, angle_diff * 2 + max(0, abs(avg_knee - 85) * 0.3))
        return feedback, max(0, min(100, round(score, 1)))
