"""Client profile schemas with full validation."""
from typing import List, Optional
from pydantic import BaseModel, Field, model_validator


class BasicProfileSchema(BaseModel):
    """Basic client profile for calorie and training guidance."""
    age: int = Field(ge=13, le=120)
    sex: str = Field(description="male or female - used for calorie needs")
    height_cm: Optional[float] = Field(None, ge=100, le=250)
    height_ft_in: Optional[List[int]] = Field(None, min_length=2, max_length=2)
    weight_kg: Optional[float] = Field(None, ge=30, le=300)
    weight_lb: Optional[float] = Field(None, ge=66, le=660)
    country_region: Optional[str] = None
    preferred_units: str = Field(default="metric", description="metric or imperial")

    @model_validator(mode="after")
    def height_or_weight_required(self):
        has_height = self.height_cm is not None or (self.height_ft_in and len(self.height_ft_in) == 2)
        has_weight = self.weight_kg is not None or self.weight_lb is not None
        if not has_height:
            raise ValueError("Height required (height_cm or height_ft_in [ft, in])")
        if not has_weight:
            raise ValueError("Weight required (weight_kg or weight_lb)")
        if self.height_cm is not None and self.height_ft_in:
            raise ValueError("Provide height in one format only")
        if self.weight_kg is not None and self.weight_lb is not None:
            raise ValueError("Provide weight in one format only")
        return self

    def get_height_cm(self) -> float:
        if self.height_cm:
            return self.height_cm
        if self.height_ft_in:
            ft, inch = self.height_ft_in[0], self.height_ft_in[1]
            return ft * 30.48 + inch * 2.54
        return 0.0

    def get_weight_kg(self) -> float:
        if self.weight_kg:
            return self.weight_kg
        if self.weight_lb:
            return self.weight_lb * 0.453592
        return 0.0


class GoalsSchema(BaseModel):
    """Client goals - 1-2 primary goals allowed."""
    primary_goals: List[str] = Field(min_length=1, max_length=2)
    target_weeks: Optional[int] = Field(None, ge=4, le=52)
    motivation_style: Optional[str] = Field(None, description="gentle or strict")

    @model_validator(mode="after")
    def validate_goals(self):
        valid = {"fat_loss", "muscle_gain", "strength", "endurance", "general_fitness", "sports_performance", "rehab_return"}
        for g in self.primary_goals:
            if g not in valid:
                raise ValueError(f"Invalid goal: {g}. Must be one of {valid}")
        return self


class TrainingBackgroundSchema(BaseModel):
    """Training history and availability."""
    experience_level: str = Field(description="beginner, intermediate, advanced")
    activity_level: str = Field(
        default="moderate",
        description="sedentary, light, moderate, active, very_active"
    )
    days_per_week: int = Field(ge=1, le=7, default=4)
    time_per_session_min: int = Field(ge=20, le=90, default=45)
    equipment: str = Field(default="full_gym", description="none, dumbbells, full_gym")
    exercises_enjoy: Optional[List[str]] = Field(default_factory=list)
    exercises_dislike: Optional[List[str]] = Field(default_factory=list)


class HealthSafetySchema(BaseModel):
    """Health and safety - non-medical guidance only."""
    injury_areas: Optional[List[str]] = Field(default_factory=list)
    medical_conditions: Optional[List[str]] = Field(default_factory=list)
    movement_limitations: Optional[List[str]] = Field(default_factory=list)
    doctor_restrictions: bool = Field(default=False)


class NutritionPreferencesSchema(BaseModel):
    """Diet preferences for meal planning."""
    diet_style: str = Field(default="omnivore")
    allergies: Optional[List[str]] = Field(default_factory=list)
    dislikes: Optional[List[str]] = Field(default_factory=list)
    cooking_skill: Optional[str] = None
    budget_range: Optional[str] = None
    meals_per_day: int = Field(default=4, ge=2, le=6)
    has_kitchen: bool = True
    cultural_preferences: Optional[str] = None


class LifestyleSchema(BaseModel):
    """Lifestyle factors for program adaptation."""
    sleep_hours: Optional[float] = Field(None, ge=3, le=14)
    work_schedule: Optional[str] = None
    stress_level: Optional[str] = None
    step_count: Optional[int] = Field(None, ge=0, le=50000)
    travel_frequency: Optional[str] = None


class BehaviorSchema(BaseModel):
    """Adherence and coaching preferences."""
    main_struggle: Optional[str] = Field(None, description="consistency, motivation, time, knowledge")
    coaching_tone: str = Field(default="supportive", description="supportive, strict, data_driven")
    reminders_enabled: bool = False


class ClientCreateFull(BaseModel):
    """Full client onboarding - comprehensive profile."""
    name: str = Field(min_length=1, max_length=100)
    basic_profile: BasicProfileSchema
    goals: GoalsSchema
    training: TrainingBackgroundSchema
    health: HealthSafetySchema
    nutrition: NutritionPreferencesSchema
    lifestyle: Optional[LifestyleSchema] = None
    behavior: Optional[BehaviorSchema] = None


class ClientCreateLegacy(BaseModel):
    """Legacy simplified client creation - backward compatible."""
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
