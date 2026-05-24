"""Scorers for cardio / full-body exercises.

Covers: Burpees, Jumping Jacks, Mountain Climbers, High Knees,
        Box Jumps, Jump Squats, Skaters, Bear Crawl.
"""
from typing import Dict, List, Tuple

from ..angle_calculator import angle_between_points, LANDMARK_INDEX, get_landmark_coords
from .base import FormScorer


class BurpeeScorer(FormScorer):
    """Burpee: tracks squat-to-plank transition and overhead reach."""

    def get_angles(self, landmarks) -> Dict[str, float]:
        ls = get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        rs = get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        lh = get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])
        rh = get_landmark_coords(landmarks, LANDMARK_INDEX["right_hip"])
        lk = get_landmark_coords(landmarks, LANDMARK_INDEX["left_knee"])
        rk = get_landmark_coords(landmarks, LANDMARK_INDEX["right_knee"])
        la = get_landmark_coords(landmarks, LANDMARK_INDEX["left_ankle"])
        ra = get_landmark_coords(landmarks, LANDMARK_INDEX["right_ankle"])
        le = get_landmark_coords(landmarks, LANDMARK_INDEX["left_elbow"])
        re = get_landmark_coords(landmarks, LANDMARK_INDEX["right_elbow"])
        lw = get_landmark_coords(landmarks, LANDMARK_INDEX["left_wrist"])
        rw = get_landmark_coords(landmarks, LANDMARK_INDEX["right_wrist"])

        knee_l = angle_between_points(lh, lk, la)
        knee_r = angle_between_points(rh, rk, ra)
        hip_l = angle_between_points(ls, lh, lk)
        hip_r = angle_between_points(rs, rh, rk)
        elbow_l = angle_between_points(ls, le, lw)
        elbow_r = angle_between_points(rs, re, rw)

        return {
            "knee_left": knee_l,
            "knee_right": knee_r,
            "knee_avg": round((knee_l + knee_r) / 2, 2),
            "hip_left": hip_l,
            "hip_right": hip_r,
            "hip_avg": round((hip_l + hip_r) / 2, 2),
            "elbow_avg": round((elbow_l + elbow_r) / 2, 2),
        }

    def score_and_feedback(self, landmarks) -> Tuple[List[str], float]:
        angles = self.get_angles(landmarks)
        feedback: List[str] = []
        deductions = 0.0

        knee_avg = angles["knee_avg"]
        hip_avg = angles["hip_avg"]
        knee_l = angles["knee_left"]
        knee_r = angles["knee_right"]

        # Check knee symmetry
        knee_diff = abs(knee_l - knee_r)
        if knee_diff > 15:
            feedback.append(f"Keep both legs in sync — L:{int(knee_l)}° vs R:{int(knee_r)}°")
            deductions += 15

        # Standing phase check
        if knee_avg > 155:
            feedback.append("Good full stand — extend fully at the top!")
        elif knee_avg > 130:
            feedback.append("Extend fully at the top of each rep")
            deductions += 10

        # Hip hinge check (squat / plank transition)
        if hip_avg < 100:
            feedback.append("Core tight — avoid sagging hips in plank position")
            deductions += 20
        else:
            feedback.append("Body alignment looks solid!")

        # Breathing reminder
        feedback.append("Exhale on the jump, inhale on the way down")

        score = max(0, min(100, round(100 - deductions, 1)))
        return feedback, score


class JumpingJackScorer(FormScorer):
    """Jumping Jacks: tracks arm abduction and leg spread symmetry."""

    def get_angles(self, landmarks) -> Dict[str, float]:
        ls = get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        rs = get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        le = get_landmark_coords(landmarks, LANDMARK_INDEX["left_elbow"])
        re = get_landmark_coords(landmarks, LANDMARK_INDEX["right_elbow"])
        lw = get_landmark_coords(landmarks, LANDMARK_INDEX["left_wrist"])
        rw = get_landmark_coords(landmarks, LANDMARK_INDEX["right_wrist"])
        lh = get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])
        rh = get_landmark_coords(landmarks, LANDMARK_INDEX["right_hip"])
        lk = get_landmark_coords(landmarks, LANDMARK_INDEX["left_knee"])
        rk = get_landmark_coords(landmarks, LANDMARK_INDEX["right_knee"])
        la = get_landmark_coords(landmarks, LANDMARK_INDEX["left_ankle"])
        ra = get_landmark_coords(landmarks, LANDMARK_INDEX["right_ankle"])

        # Shoulder abduction: angle at shoulder (hip→shoulder→wrist)
        sh_ab_l = angle_between_points(lh, ls, lw)
        sh_ab_r = angle_between_points(rh, rs, rw)
        elbow_l = angle_between_points(ls, le, lw)
        elbow_r = angle_between_points(rs, re, rw)
        knee_l = angle_between_points(lh, lk, la)
        knee_r = angle_between_points(rh, rk, ra)

        return {
            "shoulder_left": sh_ab_l,
            "shoulder_right": sh_ab_r,
            "shoulder_avg": round((sh_ab_l + sh_ab_r) / 2, 2),
            "elbow_avg": round((elbow_l + elbow_r) / 2, 2),
            "knee_left": knee_l,
            "knee_right": knee_r,
            "knee_avg": round((knee_l + knee_r) / 2, 2),
        }

    def score_and_feedback(self, landmarks) -> Tuple[List[str], float]:
        angles = self.get_angles(landmarks)
        feedback: List[str] = []
        deductions = 0.0

        sh_l = angles["shoulder_left"]
        sh_r = angles["shoulder_right"]
        sh_avg = angles["shoulder_avg"]

        # Arms at sides (low angle) = good resting/bottom position → lower score
        # Arms overhead (high angle) = ideal top position → best score
        # Arms stuck in the middle (transition) → bad, should be moving
        if sh_avg < 40:
            # Arms at sides — bottom of the movement
            feedback.append("Arms down — now jump and raise arms overhead!")
            deductions += 20   # penalise resting at bottom
        elif sh_avg > 120:
            # Arms overhead — top of the movement
            feedback.append("Arms overhead — great! Come back down and go again.")
            # No heavy penalty at the top
        else:
            # Mid-position — user may be stuck or transitioning
            feedback.append("Keep moving — reach arms fully up or bring them fully down!")
            deductions += 35   # penalise staying in neutral

        # Arm symmetry
        sh_diff = abs(sh_l - sh_r)
        if sh_diff > 25:
            feedback.append(f"Raise both arms equally — L:{int(sh_l)}° vs R:{int(sh_r)}°")
            deductions += 15
        else:
            feedback.append("Arm movement symmetric — great!")

        feedback.append("Land softly with knees slightly bent")

        score = max(0, min(100, round(100 - deductions, 1)))
        return feedback, score


class MountainClimberScorer(FormScorer):
    """Mountain Climbers: tracks hip position and knee drive."""

    def get_angles(self, landmarks) -> Dict[str, float]:
        ls = get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        rs = get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        lh = get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])
        rh = get_landmark_coords(landmarks, LANDMARK_INDEX["right_hip"])
        lk = get_landmark_coords(landmarks, LANDMARK_INDEX["left_knee"])
        rk = get_landmark_coords(landmarks, LANDMARK_INDEX["right_knee"])
        la = get_landmark_coords(landmarks, LANDMARK_INDEX["left_ankle"])
        ra = get_landmark_coords(landmarks, LANDMARK_INDEX["right_ankle"])

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
            "hip_avg": round((hip_l + hip_r) / 2, 2),
        }

    def score_and_feedback(self, landmarks) -> Tuple[List[str], float]:
        angles = self.get_angles(landmarks)
        feedback: List[str] = []
        deductions = 0.0

        hip_avg = angles["hip_avg"]
        knee_l = angles["knee_left"]
        knee_r = angles["knee_right"]

        # Hip should stay relatively level — not too high or too low
        if hip_avg < 130:
            feedback.append("Hips too high — keep hips level with shoulders")
            deductions += 20
        elif hip_avg > 195:
            feedback.append("Hips sagging — engage core to keep body straight")
            deductions += 25
        else:
            feedback.append("Great plank position — hips level!")

        # Knee drive check
        min_knee = min(knee_l, knee_r)
        if min_knee < 85:
            feedback.append("Strong knee drive — pulling all the way in!")
        else:
            feedback.append("Drive your knee further toward your chest each rep")
            deductions += 10

        feedback.append("Keep your wrists under your shoulders")
        feedback.append("Maintain a quick, controlled rhythm")

        score = max(0, min(100, round(100 - deductions, 1)))
        return feedback, score


class HighKneeScorer(FormScorer):
    """High Knees: tracks knee lift and upright torso."""

    def get_angles(self, landmarks) -> Dict[str, float]:
        ls = get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        rs = get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        lh = get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])
        rh = get_landmark_coords(landmarks, LANDMARK_INDEX["right_hip"])
        lk = get_landmark_coords(landmarks, LANDMARK_INDEX["left_knee"])
        rk = get_landmark_coords(landmarks, LANDMARK_INDEX["right_knee"])
        la = get_landmark_coords(landmarks, LANDMARK_INDEX["left_ankle"])
        ra = get_landmark_coords(landmarks, LANDMARK_INDEX["right_ankle"])

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
            "hip_avg": round((hip_l + hip_r) / 2, 2),
        }

    def score_and_feedback(self, landmarks) -> Tuple[List[str], float]:
        angles = self.get_angles(landmarks)
        feedback: List[str] = []
        deductions = 0.0

        knee_l = angles["knee_left"]
        knee_r = angles["knee_right"]
        hip_avg = angles["hip_avg"]
        min_knee = min(knee_l, knee_r)

        # Knee height — smaller angle = higher lift
        if min_knee < 75:
            feedback.append("Excellent knee height — great drive!")
        elif min_knee < 105:
            feedback.append("Drive your knees up to hip level for full effect")
            deductions += 10
        else:
            feedback.append("Lift your knees much higher — aim for hip height or above")
            deductions += 25

        # Torso upright
        if hip_avg > 155:
            feedback.append("Good upright posture — keep your chest tall")
        else:
            feedback.append("Stand tall — avoid leaning forward")
            deductions += 15

        # Symmetry
        knee_diff = abs(knee_l - knee_r)
        if knee_diff > 20:
            feedback.append("Keep leg drive even on both sides")
            deductions += 10
        else:
            feedback.append("Leg symmetry looks solid!")

        feedback.append("Pump your arms to increase intensity and pace")

        score = max(0, min(100, round(100 - deductions, 1)))
        return feedback, score
