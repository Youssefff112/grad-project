"""Joint angle calculation from MediaPipe landmarks."""
import math
from typing import Tuple

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


def angle_between_points(
    p1: Tuple[float, float],
    p2: Tuple[float, float],
    p3: Tuple[float, float],
) -> float:
    """Calculate angle at p2 formed by p1-p2-p3 in degrees (0-180)."""
    v1 = (p1[0] - p2[0], p1[1] - p2[1])
    v2 = (p3[0] - p2[0], p3[1] - p2[1])
    dot = v1[0] * v2[0] + v1[1] * v2[1]
    mag1 = math.sqrt(v1[0] ** 2 + v1[1] ** 2) or 1e-6
    mag2 = math.sqrt(v2[0] ** 2 + v2[1] ** 2) or 1e-6
    cos_a = max(-1, min(1, dot / (mag1 * mag2)))
    return round(math.degrees(math.acos(cos_a)), 2)


def get_landmark_coords(landmarks, idx: int) -> Tuple[float, float]:
    """Get (x, y) from landmark (normalized 0-1)."""
    lm = landmarks.landmark[idx]
    return (lm.x, lm.y)
