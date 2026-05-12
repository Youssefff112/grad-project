"""
Computer vision exercise form correction using MediaPipe.
Captures camera feed, detects pose, and provides real-time feedback.
"""
import math
from typing import Dict, List, Tuple, Optional
import cv2
import numpy as np
# IMPORTANT: import the compat shim BEFORE mediapipe so it installs the legacy
# ``mp.solutions.pose`` namespace (newer MediaPipe wheels dropped it).
from . import mp_compat  # noqa: F401  (side effect: monkey-patches mp.solutions)
import mediapipe as mp

# MediaPipe pose landmark indices
# https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
LANDMARK_NAMES = [
    "nose", "left_eye_inner", "left_eye", "left_eye_outer",
    "right_eye_inner", "right_eye", "right_eye_outer",
    "left_ear", "right_ear", "mouth_left", "mouth_right",
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist", "left_pinky", "right_pinky",
    "left_index", "right_index", "left_thumb", "right_thumb",
    "left_hip", "right_hip", "left_knee", "right_knee",
    "left_ankle", "right_ankle", "left_heel", "right_heel",
    "left_foot_index", "right_foot_index",
]

LANDMARK_INDEX = {name: i for i, name in enumerate(LANDMARK_NAMES)}


def angle_between_points(p1: Tuple[float, float], p2: Tuple[float, float], p3: Tuple[float, float]) -> float:
    """Calculate angle at p2 formed by p1-p2-p3 in degrees."""
    v1 = (p1[0] - p2[0], p1[1] - p2[1])
    v2 = (p3[0] - p2[0], p3[1] - p2[1])
    dot = v1[0] * v2[0] + v1[1] * v2[1]
    mag1 = math.sqrt(v1[0] ** 2 + v1[1] ** 2) or 1e-6
    mag2 = math.sqrt(v2[0] ** 2 + v2[1] ** 2) or 1e-6
    cos_a = max(-1, min(1, dot / (mag1 * mag2)))
    return math.degrees(math.acos(cos_a))


class PoseCorrector:
    """Real-time pose detection and exercise form feedback."""

    def __init__(self, min_detection_confidence: float = 0.7):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=0.5,
        )
        self.exercise_rules = self._default_rules()

    def _default_rules(self) -> Dict:
        """Default form rules for common exercises."""
        return {
            "squat": {
                "left_knee_angle": {"top": (170, 190), "bottom": (70, 100)},
                "right_knee_angle": {"top": (170, 190), "bottom": (70, 100)},
                "feedback": {
                    "knees_over_toes": "Keep knees behind toes",
                    "back_straight": "Chest up, back straight",
                },
            },
            "push_up": {
                "left_elbow_angle": {"top": (170, 190), "bottom": (80, 100)},
                "right_elbow_angle": {"top": (170, 190), "bottom": (80, 100)},
                "feedback": {
                    "body_straight": "Keep body in straight line",
                    "elbows_in": "Elbows at 45° from body",
                },
            },
            "bicep_curl": {
                "left_elbow_angle": {"top": (30, 50), "bottom": (165, 190)},
                "right_elbow_angle": {"top": (30, 50), "bottom": (165, 190)},
                "feedback": {
                    "no_swing": "Control the movement, no swinging",
                    "full_rom": "Full range of motion",
                },
            },
            "plank": {
                "feedback": {
                    "hips_level": "Hips level with shoulders",
                    "core_tight": "Engage your core",
                },
            },
        }

    def get_landmark_coords(self, landmarks, idx: int) -> Tuple[float, float]:
        """Get x, y from landmark (normalized 0-1)."""
        lm = landmarks.landmark[idx]
        return (lm.x, lm.y)

    # --- Angle calculation (no corrections) - for Test & live angle display ---
    def get_squat_angles(self, landmarks) -> Dict:
        """Return angles only. Targets: knee 70-90° at bottom, 170°+ at top."""
        left_hip = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])
        left_knee = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_knee"])
        left_ankle = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_ankle"])
        right_hip = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_hip"])
        right_knee = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_knee"])
        right_ankle = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_ankle"])
        left_shoulder = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        right_shoulder = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])

        knee_l = angle_between_points(left_hip, left_knee, left_ankle)
        knee_r = angle_between_points(right_hip, right_knee, right_ankle)
        hip_l = angle_between_points(left_shoulder, left_hip, left_knee)
        hip_r = angle_between_points(right_shoulder, right_hip, right_knee)
        return {
            "knee_left": round(knee_l, 1), "knee_right": round(knee_r, 1),
            "knee_avg": round((knee_l + knee_r) / 2, 1),
            "hip_left": round(hip_l, 1), "hip_right": round(hip_r, 1),
            "targets": {"knee_bottom": "70-90°", "knee_top": "170°+", "hip": "varies"},
        }

    def get_push_up_angles(self, landmarks) -> Dict:
        """Return angles only. Targets: elbow 80-90° at bottom, 170°+ at top."""
        ls = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        le = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_elbow"])
        lw = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_wrist"])
        rs = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        re = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_elbow"])
        rw = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_wrist"])
        lh = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])
        la = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_ankle"])
        el_l = angle_between_points(ls, le, lw)
        el_r = angle_between_points(rs, re, rw)
        body = angle_between_points(ls, lh, la)
        return {
            "elbow_left": round(el_l, 1), "elbow_right": round(el_r, 1),
            "elbow_avg": round((el_l + el_r) / 2, 1),
            "body_angle": round(body, 1),
            "targets": {"elbow_bottom": "80-90°", "elbow_top": "170°+", "body": "180° straight"},
        }

    def get_bicep_curl_angles(self, landmarks) -> Dict:
        """Return angles only. Targets: 30-45° at top, 165-180° at bottom."""
        ls = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        le = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_elbow"])
        lw = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_wrist"])
        rs = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        re = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_elbow"])
        rw = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_wrist"])
        el_l = angle_between_points(ls, le, lw)
        el_r = angle_between_points(rs, re, rw)
        return {
            "elbow_left": round(el_l, 1), "elbow_right": round(el_r, 1),
            "elbow_avg": round((el_l + el_r) / 2, 1),
            "targets": {"elbow_top": "30-45°", "elbow_bottom": "165-180°"},
        }

    def get_plank_angles(self, landmarks) -> Dict:
        """Return angles only. Target: body 170-180° straight line."""
        ls = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        lh = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])
        la = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_ankle"])
        rs = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        rh = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_hip"])
        ra = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_ankle"])
        body_l = angle_between_points(ls, lh, la)
        body_r = angle_between_points(rs, rh, ra)
        return {
            "body_left": round(body_l, 1), "body_right": round(body_r, 1),
            "body_avg": round((body_l + body_r) / 2, 1),
            "targets": {"body": "170-180° straight line"},
        }

    def get_exercise_angles(self, landmarks, exercise_name: str) -> Dict:
        """Get angles only for an exercise. No corrective feedback."""
        name = exercise_name.lower().replace("-", " ").replace("_", " ")
        if "squat" in name:
            return self.get_squat_angles(landmarks)
        if "push" in name or "pushup" in name:
            return self.get_push_up_angles(landmarks)
        if "curl" in name or "bicep" in name:
            return self.get_bicep_curl_angles(landmarks)
        if "plank" in name:
            return self.get_plank_angles(landmarks)
        return {"targets": {}}

    def analyze_squat(self, landmarks) -> Tuple[List[str], float]:
        """Analyze squat form. Returns (feedback_messages, score 0-100)."""
        feedback = []
        left_hip = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])
        left_knee = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_knee"])
        left_ankle = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_ankle"])
        right_hip = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_hip"])
        right_knee = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_knee"])
        right_ankle = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_ankle"])

        left_shoulder = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        right_shoulder = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])

        left_knee_angle = angle_between_points(left_hip, left_knee, left_ankle)
        right_knee_angle = angle_between_points(right_hip, right_knee, right_ankle)
        avg_knee = (left_knee_angle + right_knee_angle) / 2

        # Hip angle (torso vs thigh)
        left_hip_angle = angle_between_points(left_shoulder, left_hip, left_knee)
        right_hip_angle = angle_between_points(right_shoulder, right_hip, right_knee)
        avg_hip = (left_hip_angle + right_hip_angle) / 2

        # Determine position: standing (knee 160+) or bottom (knee < 120)
        if avg_knee >= 160:
            feedback.append(f"Knee angle: {int(avg_knee)}° - Standing. Bend knees to 70-90° at bottom")
        elif avg_knee >= 120:
            feedback.append(f"Knee angle: {int(avg_knee)}° - BEND MORE. Go deeper to 70-90°")
        elif avg_knee <= 50:
            feedback.append(f"Knee angle: {int(avg_knee)}° - Too low. Rise slightly to 70-90°")
        elif 70 <= avg_knee <= 100:
            feedback.append(f"Knee angle: {int(avg_knee)}° - Good depth!")
        else:
            feedback.append(f"Knee angle: {int(avg_knee)}° - Target: 70-90° at bottom")

        # Knees over toes check
        if left_knee[0] > left_ankle[0] + 0.05:
            feedback.append("Left knee: Push knees OUT, sit hips BACK - keep behind toes")
        if right_knee[0] < right_ankle[0] - 0.05:
            feedback.append("Right knee: Push knees OUT, sit hips BACK - keep behind toes")

        # Back angle - keep torso more upright
        if avg_hip < 45 and avg_knee < 120:
            feedback.append("Back: Lean torso forward more, chest up")
        elif avg_hip > 90 and avg_knee < 100:
            feedback.append("Back: Keep chest up, don't round lower back")

        # Symmetry
        angle_diff = abs(left_knee_angle - right_knee_angle)
        if angle_diff > 15:
            feedback.append(f"Asymmetry: L {int(left_knee_angle)}° vs R {int(right_knee_angle)}° - Balance both legs")

        score = 100 - min(100, angle_diff * 2 + max(0, abs(avg_knee - 85) * 0.3))
        return feedback, max(0, min(100, score))

    def analyze_push_up(self, landmarks) -> Tuple[List[str], float]:
        """Analyze push-up form with angle feedback."""
        feedback = []
        left_shoulder = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        left_elbow = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_elbow"])
        left_wrist = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_wrist"])
        right_shoulder = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        right_elbow = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_elbow"])
        right_wrist = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_wrist"])
        left_hip = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])
        right_hip = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_hip"])

        left_elbow_angle = angle_between_points(left_shoulder, left_elbow, left_wrist)
        right_elbow_angle = angle_between_points(right_shoulder, right_elbow, right_wrist)
        avg_elbow = (left_elbow_angle + right_elbow_angle) / 2

        # Elbow angle feedback - top (arms straight) vs bottom (chest low)
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

        # Body alignment (shoulder-hip line slope)
        torso_rise = (left_shoulder[1] - left_hip[1]) + (right_shoulder[1] - right_hip[1])
        torso_rise /= 2
        if abs(torso_rise) > 0.12:
            if torso_rise > 0:
                feedback.append("Body: Hips too high - LOWER hips to align with shoulders")
            else:
                feedback.append("Body: Hips sagging - LIFT hips, engage core for straight line")

        # Arm symmetry
        angle_diff = abs(left_elbow_angle - right_elbow_angle)
        if angle_diff > 15:
            feedback.append(f"Arms: L {int(left_elbow_angle)}° vs R {int(right_elbow_angle)}° - Keep elbows same depth")

        score = 100 - min(100, angle_diff * 2 + abs(avg_elbow - 90) * 0.2)
        return feedback, max(0, min(100, score))

    def analyze_bicep_curl(self, landmarks) -> Tuple[List[str], float]:
        """Analyze bicep curl form with angle feedback."""
        feedback = []
        left_shoulder = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        left_elbow = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_elbow"])
        left_wrist = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_wrist"])
        right_shoulder = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        right_elbow = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_elbow"])
        right_wrist = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_wrist"])

        left_elbow_angle = angle_between_points(left_shoulder, left_elbow, left_wrist)
        right_elbow_angle = angle_between_points(right_shoulder, right_elbow, right_wrist)
        avg_elbow = (left_elbow_angle + right_elbow_angle) / 2

        # Bicep curl: top = 30-50° (contracted), bottom = 165-180° (extended)
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

        # Symmetry
        angle_diff = abs(left_elbow_angle - right_elbow_angle)
        if angle_diff > 20:
            feedback.append(f"Arms: L {int(left_elbow_angle)}° vs R {int(right_elbow_angle)}° - Curl both arms together")

        score = 100 - min(100, angle_diff)
        return feedback, max(0, min(100, score))

    def analyze_plank(self, landmarks) -> Tuple[List[str], float]:
        """Analyze plank form with angle feedback."""
        feedback = []
        left_shoulder = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_shoulder"])
        right_shoulder = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_shoulder"])
        left_hip = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_hip"])
        right_hip = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_hip"])
        left_ankle = self.get_landmark_coords(landmarks, LANDMARK_INDEX["left_ankle"])
        right_ankle = self.get_landmark_coords(landmarks, LANDMARK_INDEX["right_ankle"])

        # Body line angle (shoulder-hip-ankle)
        body_angle_l = angle_between_points(left_shoulder, left_hip, left_ankle)
        body_angle_r = angle_between_points(right_shoulder, right_hip, right_ankle)
        avg_body = (body_angle_l + body_angle_r) / 2

        # Target: straight line ~170-190°
        if avg_body >= 165:
            feedback.append(f"Body angle: {int(avg_body)}° - Straight line, good!")
        elif avg_body > 150:
            feedback.append(f"Body angle: {int(avg_body)}° - Slight hip raise. Lower hips to 170°+")
        elif avg_body > 130:
            feedback.append(f"Body angle: {int(avg_body)}° - Hips too high. LOWER hips, engage core")
        else:
            feedback.append(f"Body angle: {int(avg_body)}° - Hips sagging. LIFT hips to form straight line")

        score = max(0, min(100, 100 - abs(avg_body - 180) * 0.5))
        return feedback, score

    def analyze_pose(self, exercise_name: str, landmarks) -> Tuple[List[str], float]:
        """Route to correct analyzer based on exercise."""
        name = exercise_name.lower().replace("-", " ").replace("_", " ")
        if "squat" in name:
            return self.analyze_squat(landmarks)
        if "push" in name or "pushup" in name:
            return self.analyze_push_up(landmarks)
        if "curl" in name or "bicep" in name:
            return self.analyze_bicep_curl(landmarks)
        if "plank" in name:
            return self.analyze_plank(landmarks)
        return (["Exercise analysis not configured"], 70)

    def process_frame(
        self,
        frame: np.ndarray,
        exercise_name: str = "squat",
        angles_only: bool = True,
    ) -> Tuple[np.ndarray, List[str], float]:
        """
        Process a single frame.
        angles_only=True: Show live angles only (client corrects by watching angles).
        angles_only=False: Show corrective feedback (legacy).
        Returns (annotated_frame, messages_list, score).
        """
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb)

        messages = []
        score = 0.0
        angles_dict = {}

        if results.pose_landmarks:
            mp.solutions.drawing_utils.draw_landmarks(
                frame,
                results.pose_landmarks,
                self.mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=mp.solutions.drawing_styles.get_default_pose_landmarks_style(),
            )
            angles_dict = self.get_exercise_angles(results.pose_landmarks, exercise_name)
            if angles_only:
                messages = self._angles_to_display_lines(angles_dict, exercise_name)
                score = 75  # No score in angles mode
            else:
                messages, score = self.analyze_pose(exercise_name, results.pose_landmarks)

        # Draw panel - angles display
        panel_h = min(220, 35 + len(messages) * 26)
        cv2.rectangle(frame, (5, 5), (frame.shape[1] - 5, panel_h), (20, 20, 20), -1)
        cv2.rectangle(frame, (5, 5), (frame.shape[1] - 5, panel_h), (0, 255, 255), 1)
        title = "YOUR ANGLES - Correct them to hit targets" if angles_only else "Form feedback"
        cv2.putText(frame, title, (12, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
        y_offset = 48
        for msg in messages[:8]:
            cv2.putText(frame, msg[:60], (12, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 255, 100), 1)
            y_offset += 26

        cv2.putText(frame, f"Angles live", (10, frame.shape[0] - 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

        return frame, messages, score

    def _angles_to_display_lines(self, angles: Dict, exercise_name: str) -> List[str]:
        """Convert angles dict to display lines. Exclude 'targets' key."""
        lines = []
        targets = angles.get("targets", {})
        for k, v in angles.items():
            if k == "targets" or not isinstance(v, (int, float)):
                continue
            lines.append(f"{k}: {v}°")
        if targets:
            lines.append("---")
            lines.append("Targets: " + ", ".join(f"{k}={v}" for k, v in list(targets.items())[:4]))
        return lines if lines else ["No pose detected"]

    def get_frame_analysis(self, frame: np.ndarray, exercise_name: str) -> Tuple[List[str], float]:
        """Analyze frame without drawing. Returns (feedback, score) for video processing."""
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb)
        if not results.pose_landmarks:
            return [], 0.0
        return self.analyze_pose(exercise_name, results.pose_landmarks)

    def get_frame_angles(self, frame: np.ndarray, exercise_name: str) -> Optional[Dict]:
        """Get angles only for a frame. For test mode."""
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb)
        if not results.pose_landmarks:
            return None
        return self.get_exercise_angles(results.pose_landmarks, exercise_name)

    def close(self):
        """Release resources."""
        self.pose.close()


def analyze_video_test(
    video_source,  # str path, bytes, or file-like
    exercise_name: str,
    sample_every_n: int = 5,
    max_frames: int = 120,
) -> Dict:
    """
    Analyze recorded exercise video - returns angles, score, feedback.
    Uses modular CV pipeline when available.
    Returns: angles_observed, targets, summary, reps_detected, score, mistakes_detected, improvement_notes, done_well
    """
    try:
        from services.cv.pipeline import analyze_video_full
        return analyze_video_full(video_source, exercise_name, sample_every_n, max_frames)
    except ImportError:
        pass

    corrector = None
    cap = None
    try:
        corrector = PoseCorrector()
        if isinstance(video_source, (bytes, bytearray)):
            import tempfile
            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
                tmp.write(video_source)
                tmp_path = tmp.name
            cap = cv2.VideoCapture(tmp_path)
        elif isinstance(video_source, str):
            cap = cv2.VideoCapture(video_source)
        else:
            raise ValueError("video_source must be path (str) or bytes")

        if not cap.isOpened():
            return {"angles_observed": {}, "targets": {}, "summary": "Could not open video.", "reps_detected": 0, "score": 0.0, "mistakes_detected": [], "improvement_notes": "", "done_well": []}

        angle_samples = {}
        targets_seen = {}
        frame_count = 0
        while frame_count < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            if frame_count % sample_every_n == 0:
                angles = corrector.get_frame_angles(frame, exercise_name)
                if angles:
                    targets_seen = angles.get("targets", {})
                    for k, v in angles.items():
                        if k != "targets" and isinstance(v, (int, float)):
                            angle_samples.setdefault(k, []).append(float(v))
            frame_count += 1

        corrector.close()
        if isinstance(video_source, (bytes, bytearray)):
            import os
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
        cap.release()

        angles_summary = {k: {"min": round(min(v), 1), "max": round(max(v), 1), "avg": round(sum(v) / len(v), 1)} for k, v in angle_samples.items() if v}
        reps = _estimate_reps(angle_samples, exercise_name.lower()) if angle_samples else 0
        summary = _build_angles_summary(angles_summary, targets_seen)
        return {
            "angles_observed": angles_summary,
            "targets": targets_seen,
            "summary": summary,
            "reps_detected": reps,
            "score": 0.0,
            "mistakes_detected": [],
            "improvement_notes": "",
            "done_well": [],
        }
    except Exception as e:
        try:
            if cap is not None:
                cap.release()
        except Exception:
            pass
        try:
            if corrector is not None:
                corrector.close()
        except Exception:
            pass
        return {
            "angles_observed": {},
            "targets": {},
            "summary": f"Error analyzing video: {str(e)}",
            "reps_detected": 0,
            "score": 0.0,
            "mistakes_detected": [],
            "improvement_notes": "",
            "done_well": [],
        }


def _build_angles_summary(angles: Dict, targets: Dict) -> str:
    """Build summary from observed angles vs targets."""
    if not angles:
        return "No pose detected in video."
    lines = []
    for k, v in angles.items():
        t = targets.get(k.replace("_left", "").replace("_right", "").replace("_avg", ""), "")
        if t:
            lines.append(f"{k}: min={v['min']}° max={v['max']}° avg={v['avg']}° (target: {t})")
        else:
            lines.append(f"{k}: min={v['min']}° max={v['max']}° avg={v['avg']}°")
    return "Your angles: " + "; ".join(lines[:5])


def _get_exercise_tips(exercise_name: str) -> List[str]:
    """Return how-to tips for each exercise."""
    if "squat" in exercise_name:
        return [
            "Knees: Bend to 70-90° at bottom, full extension at top",
            "Keep knees behind toes - push them out, sit hips back",
            "Chest up, back straight throughout",
            "Feet shoulder-width, weight in heels",
        ]
    if "push" in exercise_name or "pushup" in exercise_name:
        return [
            "Elbows: 80-90° at bottom, arms straight at top",
            "Body in straight line - don't let hips sag or pike up",
            "Elbows at 45° from body, not flared out",
            "Lower chest to near floor, full lockout at top",
        ]
    if "curl" in exercise_name or "bicep" in exercise_name:
        return [
            "Full range: 30-45° at top (contracted), 165-180° at bottom",
            "Control the movement - no swinging",
            "Keep elbows at your sides",
        ]
    if "plank" in exercise_name:
        return [
            "Body in straight line - shoulders, hips, ankles aligned",
            "Engage core, don't let hips sag or pike",
        ]
    return ["Focus on controlled movement and full range of motion."]


def _estimate_reps(angle_samples: Dict[str, List[float]], exercise_name: str) -> int:
    """Rough rep count from angle cycles."""
    if not angle_samples:
        return 0
    key = "knee" if "squat" in exercise_name else "elbow"
    if key not in angle_samples:
        key = list(angle_samples.keys())[0]
    vals = angle_samples[key]
    if len(vals) < 10:
        return 0
    # Count peaks (simple: count transitions from low to high)
    count = 0
    prev = vals[0]
    for v in vals[1:]:
        if prev < 100 and v >= 120:
            count += 1
        elif prev > 150 and v < 100:
            count += 1
        prev = v
    return max(0, count // 2)


def _build_summary(avg_score: float, issues: List[str], exercise_name: str) -> str:
    """Build human-readable summary."""
    if avg_score >= 85:
        base = "Great job! Your form looks solid. "
    elif avg_score >= 70:
        base = "Good effort. A few adjustments will help. "
    else:
        base = "Focus on these corrections to improve. "
    if issues:
        base += "Main issues: " + "; ".join(issues[:3])[:200] + "."
    return base


def run_camera_correction(exercise_name: str = "squat", camera_id: int = 0):
    """
    Run real-time camera correction. Press 'q' to quit.
    Call from API or CLI.
    """
    corrector = PoseCorrector()
    cap = cv2.VideoCapture(camera_id)

    if not cap.isOpened():
        raise RuntimeError("Cannot open camera")

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame, feedback, score = corrector.process_frame(frame, exercise_name)
            cv2.imshow("Exercise Form Correction", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()
        corrector.close()


def run_exercise_test(exercise_name: str = "squat", camera_id: int = 0, max_seconds: int = 30):
    """
    TEST mode: App records the client doing the exercise, then analyzes and shows feedback.
    - Camera opens, client sees "RECORDING - Do your exercise"
    - Press S to stop recording and get feedback
    - App analyzes the video and displays the report
    """
    import tempfile
    import os

    cap = cv2.VideoCapture(camera_id)
    if not cap.isOpened():
        raise RuntimeError("Cannot open camera")

    fps = int(cap.get(cv2.CAP_PROP_FPS)) or 30
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    if w <= 0 or h <= 0:
        ret, frame = cap.read()
        if ret:
            h, w = frame.shape[:2]
        else:
            w, h = 640, 480

    tmp = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
    tmp_path = tmp.name
    tmp.close()
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(tmp_path, fourcc, fps, (w, h))

    print("\n" + "=" * 50)
    print(f"TEST MODE - {exercise_name.upper()}")
    print("=" * 50)
    print("Recording... Do your exercise. Press S to STOP and get feedback.")
    print("=" * 50 + "\n")

    frame_count = 0
    max_frames = max_seconds * fps

    try:
        while frame_count < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            writer.write(frame)
            frame_count += 1

            # Show live view with recording indicator
            overlay = frame.copy()
            cv2.rectangle(overlay, (0, 0), (w, 80), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.5, frame, 0.5, 0, frame)
            cv2.putText(frame, "RECORDING - Do your exercise", (20, 35),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
            cv2.putText(frame, "Press S to STOP and get feedback", (20, 65),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

            cv2.imshow("Exercise Test - Recording", frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord("s") or key == ord("S"):
                break
    finally:
        cap.release()
        writer.release()
        cv2.destroyAllWindows()

    if frame_count < 30:
        print("Recording too short. Do at least 1-2 seconds of exercise.")
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
        return None

    print("Analyzing your exercise...")
    report = analyze_video_test(tmp_path, exercise_name)
    try:
        os.unlink(tmp_path)
    except Exception:
        pass

    return report


def run_exercise_test_and_show(exercise_name: str = "squat", camera_id: int = 0, max_seconds: int = 30):
    """
    Run test mode, record, analyze, and display the report in a window.
    """
    report = run_exercise_test(exercise_name, camera_id, max_seconds)
    if report is None:
        return

    # Build report image - angles focused
    lines = [
        "YOUR ANGLES - Test Results",
        "",
        f"Reps detected: {report.get('reps_detected', 0)}",
        "",
        "--- Summary ---",
        report.get("summary", ""),
        "",
        "--- Angles observed ---",
    ]
    ang = report.get("angles_observed", {})
    for k, v in ang.items():
        lines.append(f"  {k}: min={v['min']}° max={v['max']}° avg={v['avg']}°")
    if report.get("targets"):
        lines.append("")
        lines.append("--- Target angles ---")
        for k, v in report["targets"].items():
            lines.append(f"  {k}: {v}")

    # Create image
    img_h = 50 + len(lines) * 22
    img = np.zeros((img_h, 700, 3), dtype=np.uint8)
    img[:] = (40, 40, 40)
    y = 35
    for i, line in enumerate(lines):
        color = (0, 255, 255) if i == 0 else (255, 255, 255) if "---" in line else (180, 255, 180)
        cv2.putText(img, line[:90], (20, y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
        y += 22

    cv2.imshow("Your Angles - Test Results", img)
    print("\n" + "=" * 50)
    print("YOUR ANGLES - Use these to fix your form in live mode")
    print("=" * 50)
    for line in lines:
        print(line)
    print("=" * 50)
    print("\nPress any key to close...")
    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    import sys
    if len(sys.argv) >= 2 and sys.argv[1] == "test":
        ex = sys.argv[2] if len(sys.argv) > 2 else "squat"
        run_exercise_test_and_show(ex)
    else:
        run_camera_correction("squat")
