"""Deadlift / Romanian deadlift scorer.

Covers: Conventional Deadlift, Romanian Deadlift, Sumo Deadlift.
"""
from typing import Dict, List, Tuple

from ..angle_calculator import angle_between_points, LANDMARK_INDEX, get_landmark_coords
from .base import FormScorer


class DeadliftScorer(FormScorer):
    """Score deadlift form from pose landmarks."""

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
        back_l = angle_between_points(ls, lh, la)
        return {
            "hip_left": hip_l,
            "hip_right": hip_r,
            "hip_avg": round((hip_l + hip_r) / 2, 2),
            "knee_left": knee_l,
            "knee_right": knee_r,
            "knee_avg": round((knee_l + knee_r) / 2, 2),
            "back_angle": back_l,
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

        hip_l = angle_between_points(ls, lh, lk)
        hip_r = angle_between_points(rs, rh, rk)
        avg_hip = (hip_l + hip_r) / 2

        knee_l = angle_between_points(lh, lk, la)
        knee_r = angle_between_points(rh, rk, la)
        avg_knee = (knee_l + knee_r) / 2

        back_angle = angle_between_points(ls, lh, la)

        # Hip hinge check
        if avg_hip >= 160:
            feedback.append(f"Hip angle: {int(avg_hip)}° - Standing. Hinge at hips and load the bar")
        elif 90 <= avg_hip < 140:
            feedback.append(f"Hip angle: {int(avg_hip)}° - Good hip hinge! Driving hips forward to lockout")
        elif avg_hip < 60:
            feedback.append(f"Hip angle: {int(avg_hip)}° - Too much forward lean — hips higher, chest up")

        # Knee bend (should be slight to moderate)
        if avg_knee < 130:
            feedback.append(f"Knee angle: {int(avg_knee)}° - Knees too bent (turning into a squat) — hinge hips back more")
        elif 140 <= avg_knee <= 165:
            feedback.append(f"Knee angle: {int(avg_knee)}° - Good knee bend for deadlift")
        elif avg_knee > 165:
            feedback.append(f"Knee angle: {int(avg_knee)}° - Nearly locked. Soft knees protect the joint")

        # Back angle (straight vs rounded)
        if back_angle < 140:
            feedback.append("Back rounding detected — engage lats, chest up, neutral spine!")
        elif 155 <= back_angle <= 180:
            feedback.append("Back straight — excellent neutral spine!")
        else:
            feedback.append(f"Back angle: {int(back_angle)}° - Keep chest tall, back neutral")

        # Knee tracking
        if lk[0] > la[0] + 0.06:
            feedback.append("Left knee caving in — push knees out in line with toes")
        if rk[0] < la[0] - 0.06:
            feedback.append("Right knee caving in — push knees out in line with toes")

        score = 100 - min(100, abs(avg_hip - 100) * 0.4 + abs(back_angle - 170) * 0.5)
        return feedback, max(0, min(100, round(score, 1)))
