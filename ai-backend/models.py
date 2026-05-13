"""Database models for clients, exercises, and nutrition plans."""
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import declarative_base, relationship
from config import settings

engine = create_engine(settings.database_url, connect_args={"check_same_thread": False})
Base = declarative_base()


class Client(Base):
    """Client profile with goals and constraints."""
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)  # male, female
    weight_kg = Column(Float, nullable=False)
    height_cm = Column(Float, nullable=False)
    goal = Column(String(50), nullable=False)  # muscle_gain, fat_loss, maintenance
    fitness_level = Column(String(30), nullable=False)  # beginner, intermediate, advanced
    activity_level = Column(String(30), nullable=False)  # sedentary, light, moderate, active, very_active
    equipment = Column(Text, default="full_gym")  # full_gym, home_minimal, bodyweight
    dietary_preferences = Column(Text, default="")  # vegetarian, vegan, etc.
    medical_notes = Column(Text, default="")
    # Extended profile: goals, training, health, nutrition, lifestyle, behavior (JSON)
    profile_extended = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    nutrition_plan = relationship("NutritionPlan", back_populates="client", uselist=False)
    exercise_plans = relationship("ExercisePlan", back_populates="client")
    chat_messages = relationship("ChatMessage", back_populates="client")
    performances = relationship("ExercisePerformance", back_populates="client")


class NutritionPlan(Base):
    """Nutrition plan assigned to a client."""
    __tablename__ = "nutrition_plans"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    daily_calories = Column(Float, nullable=False)
    protein_g = Column(Float, nullable=False)
    carbs_g = Column(Float, nullable=False)
    fat_g = Column(Float, nullable=False)
    meals_per_day = Column(Integer, default=4)
    meal_plan = Column(JSON, default=list)  # List of meal objects
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("Client", back_populates="nutrition_plan")


class Exercise(Base):
    """Exercise library with form rules for CV correction."""
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # strength, cardio, flexibility
    muscle_group = Column(String(100), nullable=False)
    equipment_needed = Column(String(50), default="bodyweight")
    difficulty = Column(String(20), nullable=False)  # beginner, intermediate, advanced
    description = Column(Text, default="")
    # For computer vision: landmarks and expected angles (configurable per exercise)
    form_rules = Column(JSON, default=dict)
    injury_contraindications = Column(JSON, default=list)  # ["knees", "back", ...]
    default_sets = Column(Integer, default=3)
    default_reps = Column(String(20), default="8-12")
    rest_sec = Column(Integer, default=60)
    location = Column(String(20), default="gym")  # home, gym
    created_at = Column(DateTime, default=datetime.utcnow)


class ExercisePlan(Base):
    """Exercise plan (workout) assigned to a client."""
    __tablename__ = "exercise_plans"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    name = Column(String(100), nullable=False)
    day_of_week = Column(Integer)  # 0-6, or null for custom
    exercises = Column(JSON, nullable=False)  # List of {exercise_id, sets, reps, rest_sec}
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("Client", back_populates="exercise_plans")


class ChatMessage(Base):
    """Chat history for client chatbot."""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    role = Column(String(20), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("Client", back_populates="chat_messages")


class ExercisePerformance(Base):
    """Stored CV analysis results per set/session."""
    __tablename__ = "exercise_performances"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    exercise_name = Column(String(100), nullable=False)
    session_date = Column(DateTime, default=datetime.utcnow)
    video_path = Column(String(500), default="")
    score = Column(Float, nullable=False)
    mistakes_detected = Column(JSON, default=list)
    improvement_notes = Column(Text, default="")
    angles_observed = Column(JSON, default=dict)

    client = relationship("Client", back_populates="performances")


def init_db():
    """Create all tables and seed exercise library."""
    Base.metadata.create_all(bind=engine)
    _migrate_exercise_columns()


def _migrate_exercise_columns():
    """Add new columns to exercises table if they don't exist."""
    from sqlalchemy import text
    conn = engine.connect()
    try:
        result = conn.execute(text("PRAGMA table_info(exercises)"))
        cols = {row[1] for row in result}
        if "injury_contraindications" not in cols:
            conn.execute(text("ALTER TABLE exercises ADD COLUMN injury_contraindications TEXT"))
        if "default_sets" not in cols:
            conn.execute(text("ALTER TABLE exercises ADD COLUMN default_sets INTEGER DEFAULT 3"))
        if "default_reps" not in cols:
            conn.execute(text("ALTER TABLE exercises ADD COLUMN default_reps VARCHAR(20) DEFAULT '8-12'"))
        if "rest_sec" not in cols:
            conn.execute(text("ALTER TABLE exercises ADD COLUMN rest_sec INTEGER DEFAULT 60"))
        if "location" not in cols:
            conn.execute(text("ALTER TABLE exercises ADD COLUMN location VARCHAR(20) DEFAULT 'gym'"))
        result = conn.execute(text("PRAGMA table_info(clients)"))
        client_cols = {row[1] for row in result}
        if "profile_extended" not in client_cols:
            conn.execute(text("ALTER TABLE clients ADD COLUMN profile_extended TEXT"))
        conn.commit()
    except Exception:
        conn.rollback()
    finally:
        conn.close()


def get_db():
    """Database session dependency for FastAPI."""
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
