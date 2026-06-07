"""Gym project - Nutrition, Exercise Selection, CV Form Correction, Chatbot."""
from contextlib import asynccontextmanager
from typing import Optional
import base64
import io

from fastapi import FastAPI, Depends, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from config import settings
from models import Base, engine, Client, NutritionPlan, ExercisePlan, Exercise, ChatMessage, ExercisePerformance, init_db, get_db
from services.nutrition_service import create_nutrition_plan as calc_nutrition
from services.exercise_service import _seed_exercises
from services.program_generator import generate_workout_plan
from services.program_generator.nutrition_generator import generate_nutrition_plan_full
from services.chatbot_service import chat_with_client

# Lazy imports for heavy CV libraries (mediapipe/opencv) - loaded on first use
def _get_pose_corrector_class():
    from services.pose_corrector import PoseCorrector
    return PoseCorrector

def _get_analyze_video_test():
    from services.pose_corrector import analyze_video_test
    return analyze_video_test


# --- Pydantic schemas ---
class ClientCreate(BaseModel):
    name: str
    age: int
    gender: str
    weight_kg: float
    height_cm: float
    goal: str = "muscle_gain"
    fitness_level: str = "beginner"
    activity_level: str = "moderate"
    equipment: str = "full_gym"
    dietary_preferences: str = ""
    medical_notes: str = ""


class ChatRequest(BaseModel):
    message: str


class FrameAnalysisRequest(BaseModel):
    """Base64-encoded image frame from camera."""
    image_base64: str
    exercise_name: str = "squat"


class TestExerciseRequest(BaseModel):
    """Video test - base64 video from web recording."""
    video_base64: str
    exercise_name: str = "squat"
    client_id: Optional[int] = None  # If set, save performance for client


class PerformanceSaveRequest(BaseModel):
    """Save CV analysis result for a client."""
    exercise_name: str
    score: float
    mistakes_detected: list = []
    improvement_notes: str = ""
    angles_observed: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Seed exercises if empty
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    db = Session()
    try:
        if db.query(Exercise).count() == 0:
            _seed_exercises(db)
    finally:
        db.close()
    yield
    # cleanup if needed


app = FastAPI(title="Gym Project API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Clients ---
def _client_to_dict(client: Client):
    d = {
        "id": client.id,
        "name": client.name,
        "age": client.age,
        "gender": client.gender,
        "weight_kg": client.weight_kg,
        "height_cm": client.height_cm,
        "goal": client.goal,
        "fitness_level": client.fitness_level,
        "activity_level": client.activity_level,
        "equipment": client.equipment,
        "dietary_preferences": client.dietary_preferences,
        "profile_extended": getattr(client, "profile_extended", None) or {},
    }
    return d


@app.post("/clients", response_model=dict)
def create_client(data: ClientCreate, db: Session = Depends(get_db)):
    """Create a new client (legacy schema)."""
    client = Client(**data.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    return {"id": client.id, "name": client.name, "message": "Client created"}


@app.post("/clients/full", response_model=dict)
def create_client_full(data: dict, db: Session = Depends(get_db)):
    """Create client with full onboarding schema. Body: name, basic_profile, goals, training, health, nutrition, lifestyle?, behavior?"""
    name = data.get("name", "")
    if not name:
        raise HTTPException(400, "name required")
    bp = data.get("basic_profile", {})
    bp = bp if isinstance(bp, dict) else {}
    goals = data.get("goals", {})
    training = data.get("training", {})
    health = data.get("health", {})
    nutrition = data.get("nutrition", {})

    height_cm = bp.get("height_cm")
    if not height_cm and bp.get("height_ft_in"):
        ft, inch = bp["height_ft_in"][0], bp["height_ft_in"][1]
        height_cm = ft * 30.48 + inch * 2.54
    weight_kg = bp.get("weight_kg")
    if not weight_kg and bp.get("weight_lb"):
        weight_kg = bp["weight_lb"] * 0.453592
    primary_goals = goals.get("primary_goals", ["general_fitness"])
    goal = primary_goals[0] if primary_goals else "general_fitness"

    client = Client(
        name=name,
        age=bp.get("age", 30),
        gender=bp.get("sex", "male"),
        weight_kg=weight_kg or 70,
        height_cm=height_cm or 170,
        goal=goal,
        fitness_level=training.get("experience_level", "beginner"),
        activity_level=training.get("activity_level", "moderate"),
        equipment=training.get("equipment", "full_gym"),
        dietary_preferences=nutrition.get("diet_style", "omnivore"),
        medical_notes="; ".join(health.get("medical_conditions", [])) if health.get("medical_conditions") else "",
        profile_extended={
            "goals": goals,
            "training": training,
            "health": health,
            "nutrition": nutrition,
            "lifestyle": data.get("lifestyle"),
            "behavior": data.get("behavior"),
        },
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return {"id": client.id, "name": client.name, "message": "Client created (full profile)"}


@app.put("/clients/{client_id}")
def update_client(client_id: int, data: dict, db: Session = Depends(get_db)):
    """Update client profile. Supports partial updates and profile_extended."""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(404, "Client not found")
    for k in ("name", "age", "gender", "weight_kg", "height_cm", "goal", "fitness_level", "activity_level", "equipment", "dietary_preferences", "medical_notes"):
        if k in data:
            setattr(client, k, data[k])
    if "profile_extended" in data:
        client.profile_extended = data["profile_extended"]
    db.commit()
    db.refresh(client)
    return {"id": client.id, "message": "Client updated"}


@app.get("/clients/{client_id}")
def get_client(client_id: int, db: Session = Depends(get_db)):
    """Get client profile."""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(404, "Client not found")
    return _client_to_dict(client)


# --- Nutrition Plan ---
@app.post("/clients/{client_id}/nutrition-plan")
def generate_nutrition_plan(client_id: int, db: Session = Depends(get_db)):
    """Generate and assign nutrition plan for client. Uses full generator when profile_extended exists."""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(404, "Client not found")

    profile_ext = getattr(client, "profile_extended", None) or {}
    if isinstance(profile_ext, str):
        import json
        try:
            profile_ext = json.loads(profile_ext) if profile_ext else {}
        except Exception:
            profile_ext = {}

    if profile_ext:
        nutrition = dict(profile_ext.get("nutrition") or {})
        health = profile_ext.get("health") or {}
        if not nutrition.get("allergies"):
            nutrition["allergies"] = health.get("allergies") or []
        if not nutrition.get("diet_style") and client.dietary_preferences:
            nutrition["diet_style"] = client.dietary_preferences
        client_dict = {
            "weight_kg": client.weight_kg,
            "height_cm": client.height_cm,
            "age": client.age,
            "gender": client.gender,
            "goal": client.goal,
            "activity_level": client.activity_level,
            "dietary_preferences": client.dietary_preferences or "",
            "primary_goals": profile_ext.get("goals", {}).get("primary_goals", [client.goal]),
            "nutrition": nutrition,
        }
        plan_data = generate_nutrition_plan_full(client_dict)
    else:
        client_dict = {
            "weight_kg": client.weight_kg,
            "height_cm": client.height_cm,
            "age": client.age,
            "gender": client.gender,
            "goal": client.goal,
            "activity_level": client.activity_level,
            "dietary_preferences": client.dietary_preferences or "",
        }
        plan_data = calc_nutrition(client_dict)

    db.query(NutritionPlan).filter(NutritionPlan.client_id == client_id).delete()
    plan = NutritionPlan(
        client_id=client_id,
        daily_calories=plan_data["daily_calories"],
        protein_g=plan_data["protein_g"],
        carbs_g=plan_data["carbs_g"],
        fat_g=plan_data["fat_g"],
        meals_per_day=plan_data.get("meals_per_day", 4),
        meal_plan=plan_data["meal_plan"],
        notes=plan_data.get("notes", ""),
    )
    db.add(plan)
    db.commit()
    return plan_data


@app.get("/clients/{client_id}/nutrition-plan")
def get_nutrition_plan(client_id: int, db: Session = Depends(get_db)):
    """Get client's nutrition plan."""
    plan = db.query(NutritionPlan).filter(NutritionPlan.client_id == client_id).first()
    if not plan:
        raise HTTPException(404, "Nutrition plan not generated yet")
    return {
        "daily_calories": plan.daily_calories,
        "protein_g": plan.protein_g,
        "carbs_g": plan.carbs_g,
        "fat_g": plan.fat_g,
        "meals_per_day": plan.meals_per_day,
        "meal_plan": plan.meal_plan,
        "notes": plan.notes,
    }


# --- Exercise Plan ---
@app.post("/clients/{client_id}/exercise-plan")
def generate_exercise_plan_endpoint(
    client_id: int,
    days_per_week: int = 4,
    db: Session = Depends(get_db),
):
    """Generate and assign exercise plan using rule-based program generator."""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(404, "Client not found")

    plans = generate_workout_plan(db, client, days_per_week=days_per_week)

    db.query(ExercisePlan).filter(ExercisePlan.client_id == client_id).delete()
    for p in plans:
        ep = ExercisePlan(
            client_id=client_id,
            name=p["name"],
            day_of_week=p["day_of_week"],
            exercises=p["exercises"],
        )
        db.add(ep)
    db.commit()
    return {"plans": plans}


@app.post("/clients/{client_id}/regenerate-plans")
def regenerate_plans(client_id: int, db: Session = Depends(get_db)):
    """Regenerate workout and nutrition plans (call when profile updated)."""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(404, "Client not found")
    # Nutrition
    profile_ext = getattr(client, "profile_extended", None) or {}
    if isinstance(profile_ext, str):
        import json
        try:
            profile_ext = json.loads(profile_ext) if profile_ext else {}
        except Exception:
            profile_ext = {}
    if profile_ext and profile_ext.get("nutrition"):
        client_dict = {"weight_kg": client.weight_kg, "height_cm": client.height_cm, "age": client.age, "gender": client.gender, "goal": client.goal, "activity_level": client.activity_level, "dietary_preferences": client.dietary_preferences or "", "primary_goals": profile_ext.get("goals", {}).get("primary_goals", [client.goal]), "nutrition": profile_ext.get("nutrition", {})}
        plan_data = generate_nutrition_plan_full(client_dict)
    else:
        plan_data = calc_nutrition({"weight_kg": client.weight_kg, "height_cm": client.height_cm, "age": client.age, "gender": client.gender, "goal": client.goal, "activity_level": client.activity_level, "dietary_preferences": client.dietary_preferences or ""})
    db.query(NutritionPlan).filter(NutritionPlan.client_id == client_id).delete()
    db.add(NutritionPlan(client_id=client_id, daily_calories=plan_data["daily_calories"], protein_g=plan_data["protein_g"], carbs_g=plan_data["carbs_g"], fat_g=plan_data["fat_g"], meals_per_day=plan_data.get("meals_per_day", 4), meal_plan=plan_data["meal_plan"], notes=plan_data.get("notes", "")))
    # Workout
    plans = generate_workout_plan(db, client)
    db.query(ExercisePlan).filter(ExercisePlan.client_id == client_id).delete()
    for p in plans:
        db.add(ExercisePlan(client_id=client_id, name=p["name"], day_of_week=p["day_of_week"], exercises=p["exercises"]))
    db.commit()
    return {"message": "Plans regenerated", "nutrition": plan_data, "workout_plans": plans}


@app.get("/clients/{client_id}/exercise-plan")
def get_exercise_plan(client_id: int, db: Session = Depends(get_db)):
    """Get client's exercise plan."""
    plans = db.query(ExercisePlan).filter(ExercisePlan.client_id == client_id).all()
    if not plans:
        raise HTTPException(404, "Exercise plan not generated yet")
    return {
        "plans": [
            {
                "name": p.name,
                "day_of_week": p.day_of_week,
                "exercises": p.exercises,
                "notes": p.notes or "",
            }
            for p in plans
        ]
    }


# --- Computer Vision Exercise Correction ---
_pose_corrector = None


def get_pose_corrector():
    global _pose_corrector
    if _pose_corrector is None:
        PoseCorrector = _get_pose_corrector_class()
        _pose_corrector = PoseCorrector()
    return _pose_corrector


@app.post("/analyze-frame")
def analyze_exercise_frame(req: FrameAnalysisRequest):
    """
    Analyze a single camera frame.

    Returns:
      - angles: joint angles (float values keyed by joint name)
      - targets: ideal angle ranges per joint (strings)
      - feedback: list of live correction messages shown on screen
      - done_well: list of positive observations
      - to_fix: list of form issues to correct
      - score: form quality 0-100
    """
    try:
        raw = req.image_base64
        if "base64," in raw:
            raw = raw.split("base64,")[1]
        img_data = base64.b64decode(raw)
    except Exception as e:
        raise HTTPException(400, f"Invalid image: {e}")

    import cv2
    import numpy as np
    nparr = np.frombuffer(img_data, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(400, "Could not decode image")

    try:
        from services.cv.pipeline import analyze_frame_full
        result = analyze_frame_full(frame, req.exercise_name)
        return {
            "angles": result.get("angles", {}),
            "targets": _get_frame_targets(req.exercise_name),
            "feedback": result.get("feedback", []),
            "done_well": result.get("done_well", []),
            "to_fix": result.get("to_fix", []),
            "score": result.get("score", 0.0),
        }
    except Exception:
        # Fallback to legacy corrector so the endpoint never hard-fails
        corrector = get_pose_corrector()
        angles = corrector.get_frame_angles(frame, req.exercise_name)
        if angles:
            return {
                "angles": {k: v for k, v in angles.items() if k != "targets" and isinstance(v, (int, float))},
                "targets": angles.get("targets", {}),
                "feedback": [],
                "done_well": [],
                "to_fix": [],
                "score": 0.0,
            }
        return {"angles": {}, "targets": {}, "feedback": [], "done_well": [], "to_fix": [], "score": 0.0}


def _get_frame_targets(exercise_name: str) -> dict:
    """Return ideal angle target strings for a given exercise (used by frontend form-score logic)."""
    n = exercise_name.lower()
    if "squat" in n or "lunge" in n or "leg press" in n:
        return {"knee_bottom": "70-90°", "knee_top": "170°+", "hip": "varies"}
    if "deadlift" in n or "rdl" in n:
        return {"hip": "160°+ at top", "back": "170-180°", "knee": "140-165°"}
    if "glute" in n or "hip thrust" in n:
        return {"hip_top": "165-180°", "knee": "80-100°"}
    if "push" in n or "bench" in n or "chest press" in n or "fly" in n:
        return {"elbow_bottom": "80-90°", "elbow_top": "170°+", "body": "180° straight"}
    if "curl" in n or "bicep" in n:
        return {"elbow_top": "30-45°", "elbow_bottom": "165-180°"}
    if "row" in n:
        return {"elbow_peak": "70-90°", "elbow_extended": "160°+"}
    if "dip" in n or "tricep" in n or "skull" in n:
        return {"elbow_bottom": "80-100°", "elbow_top": "170°+"}
    if "pull" in n or "chin" in n or "lat" in n:
        return {"elbow_top": "40-60°", "elbow_bottom": "160°+"}
    if "shoulder" in n or "overhead" in n or "ohp" in n or "press" in n:
        return {"elbow_bottom": "80-90°", "elbow_top": "170°+", "shoulder": "varies"}
    if "lateral" in n or "front raise" in n:
        return {"shoulder_top": "80-100°", "shoulder_bottom": "0-20°"}
    if "plank" in n:
        return {"body": "170-180° straight line"}
    return {}


@app.post("/test-exercise")
def test_exercise_video(
    video: UploadFile = File(...),
    exercise_name: str = Form("squat"),
):
    """
    TEST mode: App records client, analyzes video, returns angles (min/max/avg per joint).
    Use multipart/form-data: video=file, exercise_name=squat
    Returns: angles_observed, targets, summary, reps_detected
    """
    try:
        video_bytes = video.file.read()
    except Exception as e:
        raise HTTPException(400, f"Could not read video: {e}")
    if len(video_bytes) < 1000:
        raise HTTPException(400, "Video file too small or empty")
    analyze_video_test = _get_analyze_video_test()
    report = analyze_video_test(video_bytes, exercise_name)
    return report


@app.post("/test-exercise-base64")
def test_exercise_video_base64(req: TestExerciseRequest, db: Session = Depends(get_db)):
    """
    TEST mode: Same as test-exercise but accepts base64 video in JSON body.
    If client_id provided, saves performance for the client.
    """
    try:
        raw = req.video_base64
        if "base64," in raw:
            raw = raw.split("base64,")[1]
        video_bytes = base64.b64decode(raw)
    except Exception as e:
        raise HTTPException(400, f"Invalid base64 video: {e}")
    if len(video_bytes) < 1000:
        raise HTTPException(400, "Video data too small")
    analyze_video_test = _get_analyze_video_test()
    report = analyze_video_test(video_bytes, req.exercise_name)
    if req.client_id:
        client = db.query(Client).filter(Client.id == req.client_id).first()
        if client:
            perf = ExercisePerformance(
                client_id=req.client_id,
                exercise_name=req.exercise_name,
                score=report.get("score", 0.0),
                mistakes_detected=report.get("mistakes_detected", []),
                improvement_notes=report.get("improvement_notes", ""),
                angles_observed=report.get("angles_observed", {}),
            )
            db.add(perf)
            db.commit()
    return report


@app.post("/clients/{client_id}/performances")
def save_performance(client_id: int, data: PerformanceSaveRequest, db: Session = Depends(get_db)):
    """Save CV analysis result for a client."""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(404, "Client not found")
    perf = ExercisePerformance(
        client_id=client_id,
        exercise_name=data.exercise_name,
        score=data.score,
        mistakes_detected=data.mistakes_detected,
        improvement_notes=data.improvement_notes,
        angles_observed=data.angles_observed,
    )
    db.add(perf)
    db.commit()
    return {"id": perf.id, "message": "Performance saved"}


@app.get("/clients/{client_id}/performances")
def get_performances(client_id: int, limit: int = 20, db: Session = Depends(get_db)):
    """Get recent form scores for a client."""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(404, "Client not found")
    perfs = db.query(ExercisePerformance).filter(ExercisePerformance.client_id == client_id).order_by(ExercisePerformance.session_date.desc()).limit(limit).all()
    return [{"id": p.id, "exercise_name": p.exercise_name, "score": p.score, "mistakes_detected": p.mistakes_detected, "improvement_notes": p.improvement_notes, "session_date": str(p.session_date)} for p in perfs]


@app.get("/exercises")
def list_exercises(db: Session = Depends(get_db)):
    """List all exercises (for CV correction dropdown)."""
    exercises = db.query(Exercise).all()
    return [{"id": e.id, "name": e.name, "form_rules": e.form_rules} for e in exercises]


# --- Chatbot ---
@app.post("/clients/{client_id}/chat")
def chat(client_id: int, req: ChatRequest, db: Session = Depends(get_db)):
    """Send a message to the client's personal chatbot."""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(404, "Client not found")
    return chat_with_client(db, client_id, req.message)


@app.get("/clients/{client_id}/chat-history")
def chat_history(client_id: int, limit: int = 50, db: Session = Depends(get_db)):
    """Get chat history for a client."""
    msgs = (
        db.query(ChatMessage)
        .filter(ChatMessage.client_id == client_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
        .all()
    )
    return [{"role": m.role, "content": m.content} for m in msgs]


# --- Health & Info ---
MEDICAL_DISCLAIMER = (
    "This platform is not a medical professional. Users with injuries, medical conditions, "
    "or doctor restrictions must consult a qualified healthcare provider before starting any program."
)

@app.get("/")
def root():
    return {
        "message": "Gym API - Nutrition, Exercises, CV Correction, Chatbot",
        "disclaimer": MEDICAL_DISCLAIMER,
    }

@app.get("/disclaimer")
def get_disclaimer():
    """Medical disclaimer for onboarding display."""
    return {"disclaimer": MEDICAL_DISCLAIMER}


# Serve exercise test page
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

    @app.get("/exercise-test")
    def exercise_test_page():
        """Web page: app records client, analyzes, shows feedback."""
        return FileResponse(os.path.join(static_dir, "exercise_test.html"))


if __name__ == "__main__":
    import uvicorn
    print("Starting Gym AI Backend...")
    print("API docs: http://localhost:8000/docs")
    print("Press CTRL+C to stop the server.")
    uvicorn.run(app, host="0.0.0.0", port=8000)
