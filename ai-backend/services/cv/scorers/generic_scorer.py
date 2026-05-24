"""Generic / fallback scorer for unrecognized exercises.

Computes basic joint angles and gives general posture cues.
"""
from typing import Dict, List, Tuple

from ..angle_calculator import angle_between_points, LANDMARK_INDEX, get_landmark_coords
from .base import FormScorer


class GenericScorer(FormScorer):
    """Generic scorer: basic posture cues, all major joints."""

    def get_angles(self, landmarks) -> Dict[str, float]:
        ls = get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        le = get_landmark_coords(landmarks, LANDMARK_INDEX["left_elbow"])
        lw = get_landmark_coords(landmarks, LANDMARK_INDEX["left_wrist"])
        rs = get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        re = get_landmark_coords(landmarks, LANDMARK_INDEX["right_elbow"])
        rw = get_landmark_coords(landmarks, LANDMARK_INDEX["right_wrist"])
        lh = get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])
        rh = get_landmark_coords(landmarks, LANDMARK_INDEX["right_hip"])
        lk = get_landmark_coords(landmarks, LANDMARK_INDEX["left_knee"])
        rk = get_landmark_coords(landmarks, LANDMARK_INDEX["right_knee"])
        la = get_landmark_coords(landmarks, LANDMARK_INDEX["left_ankle"])
        ra = get_landmark_coords(landmarks, LANDMARK_INDEX["right_ankle"])

        el_l = angle_between_points(ls, le, lw)
        el_r = angle_between_points(rs, re, rw)
        knee_l = angle_between_points(lh, lk, la)
        knee_r = angle_between_points(rh, rk, ra)
        hip_l = angle_between_points(ls, lh, lk)
        hip_r = angle_between_points(rs, rh, rk)
        return {
            "elbow_left": el_l,
            "elbow_right": el_r,
            "elbow_avg": round((el_l + el_r) / 2, 2),
            "knee_left": knee_l,
            "knee_right": knee_r,
            "knee_avg": round((knee_l + knee_r) / 2, 2),
            "hip_avg": round((hip_l + hip_r) / 2, 2),
        }

    def score_and_feedback(self, landmarks) -> Tuple[List[str], float]:
        feedback = []
        ls = get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        rs = get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        lh = get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])
        rh = get_landmark_coords(landmarks, LANDMARK_INDEX["right_hip"])
        le = get_landmark_coords(landmarks, LANDMARK_INDEX["left_elbow"])
        lw = get_landmark_coords(landmarks, LANDMARK_INDEX["left_wrist"])
        lk = get_landmark_coords(landmarks, LANDMARK_INDEX["left_knee"])
        la = get_landmark_coords(landmarks, LANDMARK_INDEX["left_ankle"])
        re = get_landmark_coords(landmarks, LANDMARK_INDEX["right_elbow"])
        rw = get_landmark_coords(landmarks, LANDMARK_INDEX["right_wrist"])
        rk = get_landmark_coords(landmarks, LANDMARK_INDEX["right_knee"])
        ra = get_landmark_coords(landmarks, LANDMARK_INDEX["right_ankle"])

        el_l = angle_between_points(ls, le, lw)
        el_r = angle_between_points(rs, re, rw)
        avg_elbow = (el_l + el_r) / 2

        knee_l = angle_between_points(lh, lk, la)
        knee_r = angle_between_points(rh, rk, ra)
        avg_knee = (knee_l + knee_r) / 2

        # Shoulder alignment
        sh_diff = abs(ls[1] - rs[1])
        if sh_diff > 0.06:
            feedback.append("Shoulders not level — keep them even throughout the movement")
        else:
            feedback.append("Shoulders aligned — good posture!")

        # Hip alignment
        hip_diff = abs(lh[1] - rh[1])
        if hip_diff > 0.06:
            feedback.append("Hips tilting — keep hips level and stable")

        # Arm symmetry
        el_diff = abs(el_l - el_r)
        if el_diff > 18:
            feedback.append(f"Arms uneven: L {int(el_l)}° vs R {int(el_r)}° - Keep both arms synchronized")
        else:
            feedback.append("Arm movement symmetric — well done!")

        # Knee symmetry
        kn_diff = abs(knee_l - knee_r)
        if kn_diff > 15:
            feedback.append(f"Leg asymmetry: L knee {int(knee_l)}° vs R knee {int(knee_r)}°")

        # General posture reminder
        feedback.append("Focus on full range of motion and controlled breathing")

        # Cap the resting-symmetry score at 70 so the UI is not misleadingly high
        # before the user begins exercising.
        raw = 100 - min(100, el_diff * 1.5 + sh_diff * 40)
        score = min(raw, 70)
        return feedback, max(0, min(100, round(score, 1)))
