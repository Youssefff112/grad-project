"""CV pipeline: frame/video -> angles, score, structured feedback."""
import os
import tempfile
from typing import Dict, List, Any, Optional
import cv2
import numpy as np
# Install the legacy mp.solutions shim before importing mediapipe.
from .. import mp_compat  # noqa: F401  (side effect)
import mediapipe as mp

from .angle_calculator import LANDMARK_INDEX
from .scorers import get_scorer


def _get_pose_detector():
    return mp.solutions.pose.Pose(
        min_detection_confidence=0.7,
        min_tracking_confidence=0.5,
    )


def analyze_frame_full(
    frame: np.ndarray,
    exercise_name: str,
    form_rules: Optional[Dict] = None,
) -> Dict[str, Any]:
    """
    Analyze single frame. Returns angles, score, feedback, structured (done_well, to_fix, next_reps).
    """
    pose = _get_pose_detector()
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(rgb)
    pose.close()

    if not results.pose_landmarks:
        return {
            "angles": {},
            "score": 0.0,
            "feedback": [],
            "done_well": [],
            "to_fix": ["No pose detected - ensure full body is visible"],
            "next_reps": ["Position camera to capture full body"],
        }

    scorer = get_scorer(exercise_name)
    angles = scorer.get_angles(results.pose_landmarks)
    feedback, score = scorer.score_and_feedback(results.pose_landmarks)
    structured = scorer.get_structured_feedback(feedback, score)

    return {
        "angles": {k: round(v, 2) for k, v in angles.items()},
        "score": score,
        "feedback": feedback,
        "done_well": structured["done_well"],
        "to_fix": structured["to_fix"],
        "next_reps": structured["next_reps"],
    }


def analyze_video_full(
    video_source,
    exercise_name: str,
    sample_every_n: int = 5,
    max_frames: int = 120,
) -> Dict[str, Any]:
    """
    Analyze video. Returns angles_observed, targets, summary, reps_detected,
    score, mistakes_detected, improvement_notes (structured feedback).
    """
    pose = _get_pose_detector()
    cap: Optional[cv2.VideoCapture] = None
    tmp_path: Optional[str] = None

    try:
        if isinstance(video_source, (bytes, bytearray)):
            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
                tmp.write(video_source)
                tmp_path = tmp.name
            cap = cv2.VideoCapture(tmp_path)
        elif isinstance(video_source, str):
            cap = cv2.VideoCapture(video_source)
        else:
            return _empty_video_result("Invalid video source")

        if not cap.isOpened():
            return _empty_video_result("Could not open video")

        angle_samples: Dict[str, List[float]] = {}
        scores: List[float] = []
        all_feedback: List[str] = []
        frame_count = 0

        while frame_count < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            if frame_count % sample_every_n != 0:
                frame_count += 1
                continue

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(rgb)
            if results.pose_landmarks:
                scorer = get_scorer(exercise_name)
                angles = scorer.get_angles(results.pose_landmarks)
                feedback, score = scorer.score_and_feedback(results.pose_landmarks)
                scores.append(score)
                all_feedback.extend(feedback)
                for k, v in angles.items():
                    angle_samples.setdefault(k, []).append(float(v))

            frame_count += 1

        angles_summary = {}
        for k, v in angle_samples.items():
            if v:
                angles_summary[k] = {
                    "min": round(min(v), 1),
                    "max": round(max(v), 1),
                    "avg": round(sum(v) / len(v), 1),
                }

        avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
        reps = _estimate_reps(angle_samples, exercise_name.lower())
        scorer = get_scorer(exercise_name)
        structured = scorer.get_structured_feedback(all_feedback, avg_score)

        summary_lines = [
            f"{k}: min={v['min']}° max={v['max']}° avg={v['avg']}°"
            for k, v in angles_summary.items()
        ]
        summary = "Your angles: " + "; ".join(summary_lines[:5]) if summary_lines else "No pose detected."

        return {
            "angles_observed": angles_summary,
            "targets": _get_targets(exercise_name),
            "summary": summary,
            "reps_detected": reps,
            "score": avg_score,
            "mistakes_detected": structured["to_fix"],
            "improvement_notes": "; ".join(structured["next_reps"]),
            "done_well": structured["done_well"],
        }

    except Exception as e:
        return _empty_video_result(str(e))

    finally:
        pose.close()
        if cap is not None:
            cap.release()
        if tmp_path is not None:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass


def _empty_video_result(msg: str) -> Dict:
    return {
        "angles_observed": {},
        "targets": {},
        "summary": msg,
        "reps_detected": 0,
        "score": 0.0,
        "mistakes_detected": [],
        "improvement_notes": "",
        "done_well": [],
    }


def _get_targets(exercise_name: str) -> Dict:
    name = exercise_name.lower()
    if "squat" in name:
        return {"knee_bottom": "70-90°", "knee_top": "170°+", "hip": "varies"}
    if "push" in name:
        return {"elbow_bottom": "80-90°", "elbow_top": "170°+", "body": "180° straight"}
    if "curl" in name or "bicep" in name:
        return {"elbow_top": "30-45°", "elbow_bottom": "165-180°"}
    if "plank" in name:
        return {"body": "170-180° straight line"}
    return {}


def _estimate_reps(angle_samples: Dict[str, List[float]], exercise_name: str) -> int:
    if not angle_samples:
        return 0
    key = "knee" if "squat" in exercise_name else "elbow"
    key = next((k for k in angle_samples if key in k), list(angle_samples.keys())[0])
    vals = angle_samples[key]
    if len(vals) < 10:
        return 0
    count = 0
    prev = vals[0]
    for v in vals[1:]:
        if prev < 100 and v >= 120:
            count += 1
        elif prev > 150 and v < 100:
            count += 1
        prev = v
    return max(0, count // 2)
