"""Pull-up / chin-up / lat pulldown scorer.

Covers: Pull-ups, Chin-ups, Lat Pulldown, Assisted Pull-ups,
        Inverted Rows (horizontal pull).
"""
from typing import Dict, List, Tuple

from ..angle_calculator import angle_between_points, LANDMARK_INDEX, get_landmark_coords
from .base import FormScorer


class PullUpScorer(FormScorer):
    """Score pull-up / vertical pull form."""

    def get_angles(self, landmarks) -> Dict[str, float]:
        ls = get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        le = get_landmark_coords(landmarks, LANDMARK_INDEX["left_elbow"])
        lw = get_landmark_coords(landmarks, LANDMARK_INDEX["left_wrist"])
        rs = get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        re = get_landmark_coords(landmarks, LANDMARK_INDEX["right_elbow"])
        rw = get_landmark_coords(landmarks, LANDMARK_INDEX["right_wrist"])
        lh = get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])

        el_l = angle_between_points(ls, le, lw)
        el_r = angle_between_points(rs, re, rw)
        sh_l = angle_between_points(le, ls, lh)
        sh_r = angle_between_points(re, rs, get_landmark_coords(landmarks, LANDMARK_INDEX["right_hip"]))
        return {
            "elbow_left": el_l,
            "elbow_right": el_r,
            "elbow_avg": round((el_l + el_r) / 2, 2),
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
        rh = get_landmark_coords(landmarks, LANDMARK_INDEX["right_hip"])

        el_l = angle_between_points(ls, le, lw)
        el_r = angle_between_points(rs, re, rw)
        avg_elbow = (el_l + el_r) / 2

        sh_l = angle_between_points(le, ls, lh)
        sh_r = angle_between_points(re, rs, rh)
        avg_sh = (sh_l + sh_r) / 2

        # Elbow angle — dead hang vs top
        if avg_elbow >= 160:
            feedback.append(f"Arms extended: {int(avg_elbow)}° - Dead hang position. Pull yourself up!")
        elif avg_elbow <= 50:
            feedback.append(f"Elbows: {int(avg_elbow)}° - Chin above bar! Hold briefly, lower slowly")
        elif 55 <= avg_elbow <= 90:
            feedback.append(f"Elbows: {int(avg_elbow)}° - Almost there — pull chin above the bar!")
        else:
            feedback.append(f"Elbows: {int(avg_elbow)}° - Keep pulling. Full ROM: dead hang to chin over bar")

        # Elbow flare (should stay in front, not too wide)
        if abs(le[0] - ls[0]) > 0.18:
            feedback.append("Elbows flaring too wide — engage lats by pulling elbows toward hips")
        else:
            feedback.append("Elbows tracking well — good lat engagement!")

        # Symmetry
        diff = abs(el_l - el_r)
        if diff > 18:
            feedback.append(f"Arms uneven: L {int(el_l)}° vs R {int(el_r)}° - Pull evenly with both arms")

        # Shoulder depression (avoid shrugging)
        if avg_sh > 140:
            feedback.append("Shoulders rising toward ears — depress and retract scapulae first")
        elif 60 <= avg_sh <= 120:
            feedback.append("Good shoulder position — keep chest tall, depressed scapulae!")

        # Kipping / swinging (body should stay relatively still)
        hip_y = (lh[1] + rh[1]) / 2
        sh_y = (ls[1] + rs[1]) / 2
        if abs(hip_y - sh_y) > 0.55:
            feedback.append("Body swinging — control the movement. Avoid kipping for strength training")

        score = 100 - min(100, diff * 1.5 + abs(avg_elbow - 70) * 0.2)
        return feedback, max(0, min(100, round(score, 1)))
