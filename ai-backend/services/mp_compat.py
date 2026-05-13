"""
MediaPipe legacy ``solutions.pose`` compatibility shim.

Newer MediaPipe wheels (0.10.30+) for Python 3.12 ship only the ``tasks`` API
and dropped the legacy ``mp.solutions.pose`` namespace. This module re-creates
just enough of that legacy surface so the rest of the codebase can keep using:

    self.mp_pose = mp.solutions.pose
    self.pose = self.mp_pose.Pose(min_detection_confidence=..., ...)
    results = self.pose.process(rgb_frame)
    if results.pose_landmarks:
        results.pose_landmarks.landmark[idx].x / .y / .z / .visibility

It works by wrapping :class:`mediapipe.tasks.python.vision.PoseLandmarker` and
auto-downloading the lite model file on first use.
"""
from __future__ import annotations

import os
import threading
import urllib.request
from pathlib import Path
from typing import List, Optional

import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision

# Same indices as the legacy API
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

# 33 connections used by drawing utilities (kept for compat — not used in live path)
POSE_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 7), (0, 4), (4, 5), (5, 6), (6, 8),
    (9, 10),
    (11, 12), (11, 13), (13, 15), (15, 17), (15, 19), (15, 21), (17, 19),
    (12, 14), (14, 16), (16, 18), (16, 20), (16, 22), (18, 20),
    (11, 23), (12, 24), (23, 24),
    (23, 25), (25, 27), (27, 29), (27, 31), (29, 31),
    (24, 26), (26, 28), (28, 30), (28, 32), (30, 32),
]

# ── Model management ────────────────────────────────────────────────────────
_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/"
    "pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
)
_MODEL_CACHE_DIR = Path(os.environ.get("MEDIAPIPE_MODEL_DIR")
                        or Path(__file__).resolve().parent.parent / "models")
_MODEL_PATH = _MODEL_CACHE_DIR / "pose_landmarker_lite.task"
_DOWNLOAD_LOCK = threading.Lock()


def _ensure_model() -> str:
    """Download the pose-landmarker lite model on first use (~5 MB)."""
    if _MODEL_PATH.exists() and _MODEL_PATH.stat().st_size > 1_000_000:
        return str(_MODEL_PATH)
    with _DOWNLOAD_LOCK:
        if _MODEL_PATH.exists() and _MODEL_PATH.stat().st_size > 1_000_000:
            return str(_MODEL_PATH)
        _MODEL_CACHE_DIR.mkdir(parents=True, exist_ok=True)
        print(f"[mp_compat] downloading pose model -> {_MODEL_PATH}")
        urllib.request.urlretrieve(_MODEL_URL, str(_MODEL_PATH))
        print("[mp_compat] download complete")
    return str(_MODEL_PATH)


# ── Legacy-shaped result wrappers ───────────────────────────────────────────
class _Landmark:
    """Behaves like the legacy NormalizedLandmark — has .x .y .z .visibility."""
    __slots__ = ("x", "y", "z", "visibility")

    def __init__(self, x: float, y: float, z: float, visibility: float):
        self.x = x
        self.y = y
        self.z = z
        self.visibility = visibility


class _LandmarkList:
    """Legacy ``results.pose_landmarks`` exposes a ``.landmark`` list."""
    __slots__ = ("landmark",)

    def __init__(self, landmarks: List[_Landmark]):
        self.landmark = landmarks


class _Result:
    __slots__ = ("pose_landmarks",)

    def __init__(self, pose_landmarks: Optional[_LandmarkList]):
        self.pose_landmarks = pose_landmarks


# ── Pose detector replacement ───────────────────────────────────────────────
class Pose:
    """Drop-in replacement for ``mp.solutions.pose.Pose``.

    Only the methods actually used by the codebase are implemented:
    ``process(rgb_frame)`` and ``close()``. Drawing utilities are not needed
    by the live ``/analyze-frame`` path.
    """

    def __init__(
        self,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
        **_kwargs,
    ):
        model_path = _ensure_model()
        base_options = mp_python.BaseOptions(model_asset_path=model_path)
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            num_poses=1,
            min_pose_detection_confidence=float(min_detection_confidence),
            min_tracking_confidence=float(min_tracking_confidence),
            min_pose_presence_confidence=0.5,
        )
        self._landmarker = vision.PoseLandmarker.create_from_options(options)

    def process(self, rgb_frame: np.ndarray) -> _Result:
        """Run detection on an RGB image (H, W, 3) uint8."""
        if rgb_frame is None:
            return _Result(None)
        if rgb_frame.dtype != np.uint8:
            rgb_frame = rgb_frame.astype(np.uint8)
        # Tasks expects an ``mp.Image`` SRGB
        try:
            mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        except Exception:
            return _Result(None)

        try:
            detection = self._landmarker.detect(mp_img)
        except Exception:
            return _Result(None)

        poses = getattr(detection, "pose_landmarks", None)
        if not poses:
            return _Result(None)

        first = poses[0]
        landmarks = [
            _Landmark(
                x=float(getattr(lm, "x", 0.0)),
                y=float(getattr(lm, "y", 0.0)),
                z=float(getattr(lm, "z", 0.0)),
                visibility=float(getattr(lm, "visibility", 1.0)),
            )
            for lm in first
        ]
        return _Result(_LandmarkList(landmarks))

    def close(self):
        try:
            self._landmarker.close()
        except Exception:
            pass


# Legacy drawing-utils stubs (no-ops). The live endpoint never draws.
class _DrawingUtils:
    @staticmethod
    def draw_landmarks(*_args, **_kwargs):
        return None


class _DrawingStyles:
    @staticmethod
    def get_default_pose_landmarks_style(*_args, **_kwargs):
        return None


# Module-level objects that mirror ``mp.solutions.pose`` / ``mp.solutions.drawing_utils``
class _PoseModule:
    """Stand-in for ``mp.solutions.pose``."""
    Pose = Pose
    POSE_CONNECTIONS = POSE_CONNECTIONS


pose = _PoseModule()
drawing_utils = _DrawingUtils()
drawing_styles = _DrawingStyles()


def install() -> None:
    """Monkey-patch ``mediapipe.solutions`` so legacy code keeps working.

    Call once at import time before any code touches ``mp.solutions.*``.
    Safe to call multiple times.
    """
    if hasattr(mp, "solutions"):
        existing = mp.solutions
        if hasattr(existing, "pose"):
            return  # already patched / native version present

    class _SolutionsNamespace:
        pass

    ns = _SolutionsNamespace()
    ns.pose = pose
    ns.drawing_utils = drawing_utils
    ns.drawing_styles = drawing_styles
    setattr(mp, "solutions", ns)


# Auto-install at import time.
install()
