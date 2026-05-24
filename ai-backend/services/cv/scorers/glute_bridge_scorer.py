"""Glute bridge / hip thrust scorer.

Covers: Glute Bridge, Hip Thrust, Single-leg Glute Bridge, Romanian DL hip-hinge phase.
"""
from typing import Dict, List, Tuple

from ..angle_calculator import angle_between_points, LANDMARK_INDEX, get_landmark_coords
from .base import FormScorer


class GluteBridgeScorer(FormScorer):
    """Score glute bridge / hip thrust form."""

    def get_angles(self, landmarks) -> Dict[str, float]:
        ls = get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        rs = get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        lh = get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])
        rh = get_landmark_coords(landmarks, LANDMARK_INDEX["right_hip"])
        lk = get_landmark_coords(landmarks, LANDMARK_INDEX["left_knee"])
        rk = get_landmark_coords(landmarks, LANDMARK_INDEX["right_knee"])
        la = get_landmark_coords(landmarks, LANDMARK_INDEX["left_ankle"])
        ra = get_landmark_coords(landmarks, LANDMARK_INDEX["right_ankle"])

        hip_l = angle_between_points(ls, lh, lk)
        hip_r = angle_between_points(rs, rh, rk)
        knee_l = angle_between_points(lh, lk, la)
        knee_r = angle_between_points(rh, rk, ra)
        return {
            "hip_left": hip_l,
            "hip_right": hip_r,
            "hip_avg": round((hip_l + hip_r) / 2, 2),
            "knee_left": knee_l,
            "knee_right": knee_r,
            "knee_avg": round((knee_l + knee_r) / 2, 2),
        }

    def score_and_feedback(self, landmarks) -> Tuple[List[str], float]:
        feedback = []
        ls = get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        rs = get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        lh = get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])
        rh = get_landmark_coords(landmarks, LANDMARK_INDEX["right_hip"])
        lk = get_landmark_coords(landmarks, LANDMARK_INDEX["left_knee"])
        rk = get_landmark_coords(landmarks, LANDMARK_INDEX["right_knee"])
        la = get_landmark_coords(landmarks, LANDMARK_INDEX["left_ankle"])
        ra = get_landmark_coords(landmarks, LANDMARK_INDEX["right_ankle"])

        hip_l = angle_between_points(ls, lh, lk)
        hip_r = angle_between_points(rs, rh, rk)
        avg_hip = (hip_l + hip_r) / 2

        knee_l = angle_between_points(lh, lk, la)
        knee_r = angle_between_points(rh, rk, ra)
        avg_knee = (knee_l + knee_r) / 2

        # Hip extension at top
        if avg_hip <= 90:
            feedback.append("Hips on ground — drive hips up until body forms a straight line")
        elif 160 <= avg_hip <= 185:
            feedback.append(f"Hip angle: {int(avg_hip)}° - Full extension! Squeeze glutes at the top")
        elif 120 <= avg_hip < 160:
            feedback.append(f"Hip angle: {int(avg_hip)}° - Push higher. Drive hips to full extension")
        elif avg_hip > 185:
            feedback.append("Hips too high / hyperextending — lower slightly, protect lower back")

        # Knee angle (foot placement)
        if avg_knee < 75:
            feedback.append(f"Knees: {int(avg_knee)}° - Feet too close to hips. Move slightly further")
        elif 80 <= avg_knee <= 100:
            feedback.append(f"Knees: {int(avg_knee)}° - Good foot placement!")
        elif avg_knee > 115:
            feedback.append(f"Knees: {int(avg_knee)}° - Feet too far out. Move closer to hips")

        # Knee symmetry / valgus
        diff_hip = abs(hip_l - hip_r)
        if diff_hip > 15:
            feedback.append(f"Hip asymmetry: L {int(hip_l)}° vs R {int(hip_r)}° - Lift both hips equally")

        if lk[0] < la[0] - 0.06 or rk[0] > ra[0] + 0.06:
            feedback.append("Knees falling inward — push knees out, in line with feet")
        else:
            feedback.append("Knees aligned well — great glute engagement!")

        score = 100 - min(100, abs(avg_hip - 170) * 0.5 + diff_hip * 1.2)
        return feedback, max(0, min(100, round(score, 1)))
