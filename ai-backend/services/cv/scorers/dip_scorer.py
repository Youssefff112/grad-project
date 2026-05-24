"""Dip / tricep dip family scorer.

Covers: Parallel Bar Dips, Bench Dips, Chair Dips,
        Tricep Dip Machine, Diamond Push-ups (similar elbow mechanics).
"""
from typing import Dict, List, Tuple

from ..angle_calculator import angle_between_points, LANDMARK_INDEX, get_landmark_coords
from .base import FormScorer


class DipScorer(FormScorer):
    """Score dip / tricep-focused push movement form."""

    def get_angles(self, landmarks) -> Dict[str, float]:
        ls = get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        le = get_landmark_coords(landmarks, LANDMARK_INDEX["left_elbow"])
        lw = get_landmark_coords(landmarks, LANDMARK_INDEX["left_wrist"])
        rs = get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        re = get_landmark_coords(landmarks, LANDMARK_INDEX["right_elbow"])
        rw = get_landmark_coords(landmarks, LANDMARK_INDEX["right_wrist"])
        lh = get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])
        la = get_landmark_coords(landmarks, LANDMARK_INDEX["left_ankle"])

        el_l = angle_between_points(ls, le, lw)
        el_r = angle_between_points(rs, re, rw)
        torso = angle_between_points(ls, lh, la)
        sh_l = angle_between_points(le, ls, lh)
        sh_r = angle_between_points(re, rs, get_landmark_coords(landmarks, LANDMARK_INDEX["right_hip"]))
        return {
            "elbow_left": el_l,
            "elbow_right": el_r,
            "elbow_avg": round((el_l + el_r) / 2, 2),
            "shoulder_left": sh_l,
            "shoulder_right": sh_r,
            "torso_angle": torso,
        }

    def score_and_feedback(self, landmarks) -> Tuple[List[str], float]:
        feedback = []
        ls = get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        le = get_landmark_coords(landmarks, LANDMARK_INDEX["left_elbow"])
        lw = get_landmark_coords(landmarks, LANDMARK_INDEX["left_wrist"])
        rs = get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        re = get_landmark_coords(landmarks, LANDMARK_INDEX["right_elbow"])
        rw = get_landmark_coords(landmarks, LANDMARK_INDEX["right_wrist"])
        lh = get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])
        la = get_landmark_coords(landmarks, LANDMARK_INDEX["left_ankle"])

        el_l = angle_between_points(ls, le, lw)
        el_r = angle_between_points(rs, re, rw)
        avg_elbow = (el_l + el_r) / 2
        torso = angle_between_points(ls, lh, la)

        # Elbow angle at bottom
        if avg_elbow >= 160:
            feedback.append(f"Elbows locked out: {int(avg_elbow)}° - Lower down, bending elbows to 90°")
        elif 80 <= avg_elbow <= 100:
            feedback.append(f"Elbows: {int(avg_elbow)}° - Good depth at bottom! Push back up")
        elif avg_elbow < 65:
            feedback.append(f"Elbows: {int(avg_elbow)}° - Too deep, stress on shoulders. Stop at 90°")
        else:
            feedback.append(f"Elbows: {int(avg_elbow)}° - Target 90° at bottom for full tricep stretch")

        # Torso lean (upright = tricep focus; leaning forward = chest focus)
        if torso > 170:
            feedback.append("Torso upright — tricep-focused dip. Lean slightly forward for chest dips")
        elif 150 <= torso <= 170:
            feedback.append("Slight forward lean — balanced chest and tricep activation")
        elif torso < 130:
            feedback.append("Too much forward lean — shoulder strain risk. Keep more upright")

        # Elbow flare check
        el_flare = abs(le[0] - ls[0])
        if el_flare > 0.15:
            feedback.append("Elbows flaring wide — tuck elbows slightly to protect shoulders")
        else:
            feedback.append("Elbows tracking well — good shoulder stability!")

        # Symmetry
        diff = abs(el_l - el_r)
        if diff > 15:
            feedback.append(f"Arms uneven: L {int(el_l)}° vs R {int(el_r)}° - Lower evenly on both sides")

        score = 100 - min(100, abs(avg_elbow - 90) * 0.5 + diff * 1.2)
        return feedback, max(0, min(100, round(score, 1)))
