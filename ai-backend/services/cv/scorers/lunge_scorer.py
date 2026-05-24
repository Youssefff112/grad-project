"""Lunge / split-squat family scorer.

Covers: Forward Lunge, Reverse Lunge, Bulgarian Split Squat,
        Step-up, Walking Lunge.
"""
from typing import Dict, List, Tuple

from ..angle_calculator import angle_between_points, LANDMARK_INDEX, get_landmark_coords
from .base import FormScorer


class LungeScorer(FormScorer):
    """Score lunge form from pose landmarks."""

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

        # Identify front leg (lower knee angle = more bent = front leg)
        front_knee = min(knee_l, knee_r)
        back_knee = max(knee_l, knee_r)
        is_left_front = knee_l <= knee_r

        # Front knee depth
        if front_knee >= 150:
            feedback.append("Barely bending — step further forward and lower your hips")
        elif front_knee >= 120:
            feedback.append(f"Front knee angle: {int(front_knee)}° - Lower until front knee is 90°")
        elif 80 <= front_knee <= 100:
            feedback.append(f"Front knee: {int(front_knee)}° - Good depth! 90° is the target")
        elif front_knee < 70:
            feedback.append(f"Front knee: {int(front_knee)}° - Too low, rise slightly to protect the knee")

        # Back knee near ground (should approach 90°)
        if back_knee > 110:
            feedback.append(f"Back knee angle: {int(back_knee)}° - Lower your hips, back knee toward floor")
        elif 80 <= back_knee <= 100:
            feedback.append("Back knee close to ground — great depth!")

        # Front knee over toe check
        front_k = lk if is_left_front else rk
        front_a = la if is_left_front else ra
        if front_k[0] > front_a[0] + 0.07:
            feedback.append("Front knee caving in — push knee outward, in line with toes")
        elif front_k[1] < front_a[1] - 0.12:
            feedback.append("Front knee too far forward past toes — shorten step or shift hips back")

        # Torso upright
        torso_lean = abs(ls[0] - lh[0] + rs[0] - rh[0]) / 2
        if torso_lean > 0.12:
            feedback.append("Leaning forward — keep torso upright, core tight")
        else:
            feedback.append("Torso upright — good posture!")

        score = 100 - min(100, abs(front_knee - 90) * 0.6 + abs(back_knee - 90) * 0.4)
        return feedback, max(0, min(100, round(score, 1)))
