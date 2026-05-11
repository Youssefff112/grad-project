"""Push-up form scorer."""
from typing import Dict, List, Tuple

from ..angle_calculator import angle_between_points, LANDMARK_INDEX, get_landmark_coords
from .base import FormScorer


class PushUpScorer(FormScorer):
    """Score push-up form from pose landmarks."""

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
        body = angle_between_points(ls, lh, la)
        return {
            "elbow_left": el_l,
            "elbow_right": el_r,
            "elbow_avg": round((el_l + el_r) / 2, 2),
            "body_angle": body,
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

        if avg_elbow >= 160:
            feedback.append(f"Elbow angle: {int(avg_elbow)}° - Top position OK. Lower down to 80-90°")
        elif avg_elbow >= 120:
            feedback.append(f"Elbow angle: {int(avg_elbow)}° - Lower more. Aim 80-90° at bottom")
        elif 75 <= avg_elbow <= 105:
            feedback.append(f"Elbow angle: {int(avg_elbow)}° - Good depth at bottom!")
        elif avg_elbow < 60:
            feedback.append(f"Elbow angle: {int(avg_elbow)}° - Rise up. Target 80-90° at bottom")
        else:
            feedback.append(f"Elbow angle: {int(avg_elbow)}° - Target: 80-90° at bottom, 170°+ at top")

        torso_rise = ((ls[1] - lh[1]) + (rs[1] - rh[1])) / 2
        if abs(torso_rise) > 0.12:
            if torso_rise > 0:
                feedback.append("Body: Hips too high - LOWER hips to align with shoulders")
            else:
                feedback.append("Body: Hips sagging - LIFT hips, engage core for straight line")

        angle_diff = abs(el_l - el_r)
        if angle_diff > 15:
            feedback.append(f"Arms: L {int(el_l)}° vs R {int(el_r)}° - Keep elbows same depth")

        score = 100 - min(100, angle_diff * 2 + abs(avg_elbow - 90) * 0.2)
        return feedback, max(0, min(100, round(score, 1)))
