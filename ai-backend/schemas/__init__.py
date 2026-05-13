"""Pydantic schemas and validation for the fitness coaching platform."""
from .enums import (
    Sex,
    UnitPreference,
    PrimaryGoal,
    ExperienceLevel,
    Equipment,
    DietStyle,
    CoachingTone,
    MotivationStyle,
    TimePerSession,
)
from .client import (
    BasicProfileSchema,
    GoalsSchema,
    TrainingBackgroundSchema,
    HealthSafetySchema,
    NutritionPreferencesSchema,
    LifestyleSchema,
    BehaviorSchema,
    ClientCreateFull,
    ClientCreateLegacy,
)

__all__ = [
    "Sex",
    "UnitPreference",
    "PrimaryGoal",
    "ExperienceLevel",
    "Equipment",
    "DietStyle",
    "CoachingTone",
    "MotivationStyle",
    "TimePerSession",
    "BasicProfileSchema",
    "GoalsSchema",
    "TrainingBackgroundSchema",
    "HealthSafetySchema",
    "NutritionPreferencesSchema",
    "LifestyleSchema",
    "BehaviorSchema",
    "ClientCreateFull",
    "ClientCreateLegacy",
]
