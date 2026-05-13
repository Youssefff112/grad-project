"""Bicep curl form scorer."""
from typing import Dict, List, Tuple

from ..angle_calculator import angle_between_points, LANDMARK_INDEX, get_landmark_coords
from .base import FormScorer


class BicepCurlScorer(FormScorer):
    """Score bicep curl form from pose landmarks."""

    def get_angles(self, landmarks) -> Dict[str, float]:
        ls = get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        le = get_landmark_coords(landmarks, LANDMARK_INDEX["left_elbow"])
        lw = get_landmark_coords(landmarks, LANDMARK_INDEX["left_wrist"])
        rs = get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        re = get_landmark_coords(landmarks, LANDMARK_INDEX["right_elbow"])
        rw = get_landmark_coords(landmarks, LANDMARK_INDEX["right_wrist"])
        el_l = angle_between_points(ls, le, lw)
        el_r = angle_between_points(rs, re, rw)
        return {
            "elbow_left": el_l,
            "elbow_right": el_r,
            "elbow_avg": round((el_l + el_r) / 2, 2),
        }

    def score_and_feedback(self, landmarks) -> Tuple[List[str], float]:
        feedback = []
        ls = get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        le = get_landmark_coords(landmarks, LANDMARK_INDEX["left_elbow"])
        lw = get_landmark_coords(landmarks, LANDMARK_INDEX["left_wrist"])
        rs = get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        re = get_landmark_coords(landmarks, LANDMARK_INDEX["right_elbow"])
        rw = get_landmark_coords(landmarks, LANDMARK_INDEX["right_wrist"])

        el_l = angle_between_points(ls, le, lw)
        el_r = angle_between_points(rs, re, rw)
        avg_elbow = (el_l + el_r) / 2

        if avg_elbow >= 150:
            feedback.append(f"Elbow angle: {int(avg_elbow)}° - Extended. Curl up to 30-45° at top")
        elif avg_elbow >= 90:
            feedback.append(f"Elbow angle: {int(avg_elbow)}° - Keep curling. Full contraction at 30-45°")
        elif 25 <= avg_elbow <= 55:
            feedback.append(f"Elbow angle: {int(avg_elbow)}° - Good contraction at top!")
        elif avg_elbow < 25:
            feedback.append(f"Elbow angle: {int(avg_elbow)}° - Lower weight. Extend to 170°+ at bottom")
        else:
            feedback.append(f"Elbow angle: {int(avg_elbow)}° - Full ROM: 30-45° top, 165-180° bottom")

        angle_diff = abs(el_l - el_r)
        if angle_diff > 20:
            feedback.append(f"Arms: L {int(el_l)}° vs R {int(el_r)}° - Curl both arms together")

        score = 100 - min(100, angle_diff)
        return feedback, max(0, min(100, round(score, 1)))
