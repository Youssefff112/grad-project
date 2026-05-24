"""Row family scorer.

Covers: Bent-over Barbell Row, Dumbbell Row, Seated Cable Row,
        T-bar Row, Inverted Row, Resistance Band Row.
"""
from typing import Dict, List, Tuple

from ..angle_calculator import angle_between_points, LANDMARK_INDEX, get_landmark_coords
from .base import FormScorer


class RowScorer(FormScorer):
    """Score bent-over / seated row form."""

    def get_angles(self, landmarks) -> Dict[str, float]:
        ls = get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        le = get_landmark_coords(landmarks, LANDMARK_INDEX["left_elbow"])
        lw = get_landmark_coords(landmarks, LANDMARK_INDEX["left_wrist"])
        rs = get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        re = get_landmark_coords(landmarks, LANDMARK_INDEX["right_elbow"])
        rw = get_landmark_coords(landmarks, LANDMARK_INDEX["right_wrist"])
        lh = get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])
        rh = get_landmark_coords(landmarks, LANDMARK_INDEX["right_hip"])
        la = get_landmark_coords(landmarks, LANDMARK_INDEX["left_ankle"])

        el_l = angle_between_points(ls, le, lw)
        el_r = angle_between_points(rs, re, rw)
        torso = angle_between_points(ls, lh, la)
        sh_l = angle_between_points(le, ls, lh)
        sh_r = angle_between_points(re, rs, rh)
        return {
            "elbow_left": el_l,
            "elbow_right": el_r,
            "elbow_avg": round((el_l + el_r) / 2, 2),
            "torso_angle": torso,
            "shoulder_left": sh_l,
            "shoulder_right": sh_r,
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

        # Elbow pull (contracted = elbow behind torso ≈ small angle)
        if avg_elbow >= 155:
            feedback.append(f"Elbows extended: {int(avg_elbow)}° - Arms hanging. Pull bar to lower chest/abdomen")
        elif 65 <= avg_elbow <= 95:
            feedback.append(f"Elbows: {int(avg_elbow)}° - Good pull! Squeeze shoulder blades together")
        elif avg_elbow < 55:
            feedback.append(f"Elbows: {int(avg_elbow)}° - Over-pulling. Control the full range")
        else:
            feedback.append(f"Elbows: {int(avg_elbow)}° - Pull until elbows pass torso (70-90° at peak)")

        # Torso angle
        if torso > 165:
            feedback.append("Torso upright — hinge forward 45° for bent-over rows")
        elif 40 <= torso <= 70:
            feedback.append(f"Torso angle: {int(torso)}° - Good hinge for bent-over row")
        elif torso < 35:
            feedback.append("Too far forward — risk of back strain. Raise torso slightly")

        # Elbow symmetry
        diff = abs(el_l - el_r)
        if diff > 18:
            feedback.append(f"Arms uneven: L {int(el_l)}° vs R {int(el_r)}° - Pull both arms simultaneously")
        else:
            feedback.append("Both arms pulling evenly — good symmetry!")

        # Elbow flare (should stay close to body)
        if abs(le[0] - ls[0]) > 0.14:
            feedback.append("Elbows flaring wide — keep elbows close to torso for lat engagement")

        score = 100 - min(100, diff * 1.5 + abs(avg_elbow - 80) * 0.3)
        return feedback, max(0, min(100, round(score, 1)))
