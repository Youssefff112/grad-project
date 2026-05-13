"""
Exercise Test mode - the app records the client, then analyzes and shows feedback.

Modes:
  1. RECORD mode (default): App opens camera, records while client does exercise,
     client presses S to stop, app analyzes and shows feedback.
     Usage: python run_video_test.py record squat
            python run_video_test.py record push-up

  2. FILE mode: Analyze an existing video file.
     Usage: python run_video_test.py file path/to/video.mp4 squat
"""
import sys
from services.pose_corrector import analyze_video_test, run_exercise_test_and_show


def print_report(report, exercise_name):
    print("\n" + "=" * 50)
    print("YOUR ANGLES - Test Results (use these to fix in live mode)")
    print("=" * 50)
    print(f"\nExercise: {exercise_name}")
    print(f"Reps detected: {report.get('reps_detected', 0)}")
    print(f"\nSummary:\n{report.get('summary', '')}")
    if report.get("angles_observed"):
        print("\n--- Angles Observed ---")
        for k, v in report["angles_observed"].items():
            print(f"  {k}: min={v['min']}° max={v['max']}° avg={v['avg']}°")
    if report.get("targets"):
        print("\n--- Target Angles ---")
        for k, v in report["targets"].items():
            print(f"  {k}: {v}")
    print("=" * 50)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nExamples:")
        print("  python run_video_test.py record squat     # App records, you do exercise, press S")
        print("  python run_video_test.py file video.mp4 squat")
        sys.exit(1)

    mode = sys.argv[1].lower()

    if mode == "record":
        exercise_name = sys.argv[2] if len(sys.argv) > 2 else "squat"
        run_exercise_test_and_show(exercise_name)
        return

    if mode == "file":
        if len(sys.argv) < 4:
            print("Usage: python run_video_test.py file <video_path> <exercise_name>")
            sys.exit(1)
        video_path = sys.argv[2]
        exercise_name = sys.argv[3]
        report = analyze_video_test(video_path, exercise_name)
        print_report(report, exercise_name)
        return

    # Legacy: file path as first arg
    if len(sys.argv) >= 3:
        video_path = sys.argv[1]
        exercise_name = sys.argv[2]
        report = analyze_video_test(video_path, exercise_name)
        print_report(report, exercise_name)
        return

    print(__doc__)
    sys.exit(1)


if __name__ == "__main__":
    main()
