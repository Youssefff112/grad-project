"""Enums for client data validation."""
from enum import Enum


class Sex(str, Enum):
    male = "male"
    female = "female"


class UnitPreference(str, Enum):
    metric = "metric"      # kg, cm
    imperial = "imperial"  # lb, ft


class PrimaryGoal(str, Enum):
    fat_loss = "fat_loss"
    muscle_gain = "muscle_gain"
    strength = "strength"
    endurance = "endurance"
    general_fitness = "general_fitness"
    sports_performance = "sports_performance"
    rehab_return = "rehab_return"


class ExperienceLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class Equipment(str, Enum):
    none = "none"           # home bodyweight only
    dumbbells = "dumbbells"
    full_gym = "full_gym"


class DietStyle(str, Enum):
    omnivore = "omnivore"
    vegetarian = "vegetarian"
    vegan = "vegan"
    halal = "halal"
    kosher = "kosher"


class CoachingTone(str, Enum):
    supportive = "supportive"
    strict = "strict"
    data_driven = "data_driven"


class MotivationStyle(str, Enum):
    gentle = "gentle"
    strict = "strict"


class TimePerSession(str, Enum):
    t20 = "20"
    t30 = "30"
    t45 = "45"
    t60 = "60"
    t60plus = "60+"
