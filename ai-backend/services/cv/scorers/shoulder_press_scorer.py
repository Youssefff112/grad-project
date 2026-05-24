"""Shoulder / overhead-press family scorer.

Covers: Overhead Press (barbell/dumbbell), Dumbbell Shoulder Press,
        Pike Push-up, Lateral Raise, Front Raise, Cable Lateral Raise.
"""
from typing import Dict, List, Tuple

from ..angle_calculator import angle_between_points, LANDMARK_INDEX, get_landmark_coords
from .base import FormScorer


class ShoulderPressScorer(FormScorer):
    """Score overhead/shoulder press form."""

    def get_angles(self, landmarks) -> Dict[str, float]:
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
        sh_l = angle_between_points(le, ls, lh)
        sh_r = angle_between_points(re, rs, rh)
        return {
            "elbow_left": el_l,
            "elbow_right": el_r,
            "elbow_avg": round((el_l + el_r) / 2, 2),
            "shoulder_left": sh_l,
            "shoulder_right": sh_r,
            "shoulder_avg": round((sh_l + sh_r) / 2, 2),
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

        # Elbow depth at bottom (start position)
        if avg_elbow <= 75:
            feedback.append(f"Elbow angle: {int(avg_elbow)}° - Bottom position. Press up to full extension")
        elif 75 < avg_elbow <= 110:
            feedback.append(f"Elbow angle: {int(avg_elbow)}° - Keep pressing through the sticking point!")
        elif avg_elbow > 155:
            feedback.append(f"Elbow angle: {int(avg_elbow)}° - Good lockout at top!")
        else:
            feedback.append(f"Elbow angle: {int(avg_elbow)}° - Push to full lockout (170°+)")

        # Shoulder elevation
        if avg_sh > 130:
            feedback.append("Shoulders rising — keep shoulders packed down, don't shrug")
        elif avg_sh < 50:
            feedback.append(f"Shoulder angle: {int(avg_sh)}° - Elbows at 90° at start, press straight up")

        # Symmetry check
        elbow_diff = abs(el_l - el_r)
        if elbow_diff > 18:
            feedback.append(f"Arms uneven: L {int(el_l)}° vs R {int(el_r)}° - Press both arms at the same pace")

        # Check wrist over elbow (elbow flare)
        if abs(lw[0] - le[0]) > 0.08:
            feedback.append("Left wrist flaring — keep wrists stacked over elbows")
        if abs(rw[0] - re[0]) > 0.08:
            feedback.append("Right wrist flaring — keep wrists stacked over elbows")

        if elbow_diff <= 12 and 60 <= avg_elbow <= 160:
            feedback.append("Good! Arms symmetrical throughout the press")

        score = 100 - min(100, elbow_diff * 1.5 + abs(avg_elbow - 90) * 0.25)
        return feedback, max(0, min(100, round(score, 1)))


class LateralRaiseScorer(FormScorer):
    """Score lateral raise / front raise form."""

    def get_angles(self, landmarks) -> Dict[str, float]:
        ls = get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        le = get_landmark_coords(landmarks, LANDMARK_INDEX["left_elbow"])
        lh = get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])
        rs = get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        re = get_landmark_coords(landmarks, LANDMARK_INDEX["right_elbow"])
        rh = get_landmark_coords(landmarks, LANDMARK_INDEX["right_hip"])

        sh_l = angle_between_points(lh, ls, le)
        sh_r = angle_between_points(rh, rs, re)
        return {
            "shoulder_left": sh_l,
            "shoulder_right": sh_r,
            "shoulder_avg": round((sh_l + sh_r) / 2, 2),
        }

    def score_and_feedback(self, landmarks) -> Tuple[List[str], float]:
        feedback = []
        ls = get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        le = get_landmark_coords(landmarks, LANDMARK_INDEX["left_elbow"])
        lh = get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])
        rs = get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        re = get_landmark_coords(landmarks, LANDMARK_INDEX["right_elbow"])
        rh = get_landmark_coords(landmarks, LANDMARK_INDEX["right_hip"])

        sh_l = angle_between_points(lh, ls, le)
        sh_r = angle_between_points(rh, rs, re)
        avg_sh = (sh_l + sh_r) / 2

        if avg_sh < 20:
            feedback.append("Arms at sides — raise them to shoulder height (90°)")
        elif 75 <= avg_sh <= 105:
            feedback.append(f"Shoulder angle: {int(avg_sh)}° - Good raise! Hold briefly at top")
        elif avg_sh > 115:
            feedback.append("Too high — stop at shoulder height to protect rotator cuff")
        else:
            feedback.append(f"Shoulder angle: {int(avg_sh)}° - Raise to 90° (parallel to ground)")

        diff = abs(sh_l - sh_r)
        if diff > 15:
            feedback.append(f"Arms uneven: L {int(sh_l)}° vs R {int(sh_r)}° - Lift both arms equally")
        else:
            feedback.append("Good arm symmetry!")

        # Check for elbow bend (slight bend allowed)
        le_l = get_landmark_coords(landmarks, LANDMARK_INDEX["left_elbow"])
        lw = get_landmark_coords(landmarks, LANDMARK_INDEX["left_wrist"])
        elbow_bend = angle_between_points(ls, le_l, lw)
        if elbow_bend < 140:
            feedback.append(f"Elbows too bent ({int(elbow_bend)}°) — keep arms nearly straight for lateral raises")

        score = 100 - min(100, diff * 2 + abs(avg_sh - 90) * 0.5)
        return feedback, max(0, min(100, round(score, 1)))
