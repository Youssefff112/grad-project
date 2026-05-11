"""Nutrition plan calculation based on client profile."""
import math
from typing import Dict, List, Any


# Activity multipliers (BMR * multiplier = TDEE)
ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "active": 1.725,
    "very_active": 1.9,
}

# Goal adjustments (surplus/deficit)
GOAL_ADJUSTMENTS = {
    "muscle_gain": 300,   # surplus calories
    "fat_loss": -500,     # deficit
    "maintenance": 0,
}


def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
    """Mifflin-St Jeor equation for BMR."""
    if gender.lower() == "male":
        return 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    return 10 * weight_kg + 6.25 * height_cm - 5 * age - 161


def calculate_tdee(bmr: float, activity_level: str) -> float:
    """Total Daily Energy Expenditure."""
    mult = ACTIVITY_MULTIPLIERS.get(activity_level.lower(), 1.55)
    return bmr * mult


def calculate_macros(
    weight_kg: float,
    goal: str,
    daily_calories: float,
) -> Dict[str, float]:
    """Calculate protein, carbs, fat in grams."""
    # Protein: 1.6-2.2g per kg for muscle gain, 1.2-1.6 for fat loss
    if goal == "muscle_gain":
        protein_g = weight_kg * 2.0
    elif goal == "fat_loss":
        protein_g = weight_kg * 1.8  # Higher to preserve muscle
    else:
        protein_g = weight_kg * 1.5

    protein_cals = protein_g * 4
    remaining = daily_calories - protein_cals

    # Fat: 25-35% of calories
    fat_pct = 0.30
    fat_cals = daily_calories * fat_pct
    fat_g = fat_cals / 9

    # Carbs: rest
    carb_cals = daily_calories - protein_cals - fat_cals
    carbs_g = max(0, carb_cals / 4)

    return {
        "protein_g": round(protein_g, 1),
        "carbs_g": round(carbs_g, 1),
        "fat_g": round(fat_g, 1),
    }


def generate_meal_plan(
    daily_calories: float,
    protein_g: float,
    carbs_g: float,
    fat_g: float,
    meals_per_day: int = 4,
    dietary_preferences: str = "",
) -> List[Dict[str, Any]]:
    """Generate a sample meal structure (percentages per meal)."""
    meals = []
    pct = 1.0 / meals_per_day
    for i in range(meals_per_day):
        meals.append({
            "meal_number": i + 1,
            "name": f"Meal {i + 1}",
            "calories_target": round(daily_calories * pct, 0),
            "protein_g": round(protein_g * pct, 1),
            "carbs_g": round(carbs_g * pct, 1),
            "fat_g": round(fat_g * pct, 1),
            "suggestions": _meal_suggestions(i, meals_per_day, dietary_preferences),
        })
    return meals


def _meal_suggestions(meal_num: int, total_meals: int, preferences: str) -> List[str]:
    """Simple meal suggestions based on meal type."""
    if meal_num == 0:
        return ["Oatmeal + eggs", "Greek yogurt + fruit", "Whole grain toast + avocado"]
    if meal_num == total_meals - 1:
        return ["Grilled chicken + vegetables", "Fish + salad", "Lean beef + sweet potato"]
    return [
        "Chicken breast + rice",
        "Tuna salad wrap",
        "Protein shake + banana",
        "Cottage cheese + nuts",
    ]


def create_nutrition_plan(client: Dict) -> Dict[str, Any]:
    """Create full nutrition plan for a client."""
    bmr = calculate_bmr(
        client["weight_kg"],
        client["height_cm"],
        client["age"],
        client["gender"],
    )
    tdee = calculate_tdee(bmr, client["activity_level"])
    adjustment = GOAL_ADJUSTMENTS.get(client["goal"], 0)
    daily_calories = round(tdee + adjustment, 0)

    macros = calculate_macros(
        client["weight_kg"],
        client["goal"],
        daily_calories,
    )

    meal_plan = generate_meal_plan(
        daily_calories,
        macros["protein_g"],
        macros["carbs_g"],
        macros["fat_g"],
        meals_per_day=4,
        dietary_preferences=client.get("dietary_preferences", ""),
    )

    return {
        "daily_calories": daily_calories,
        "protein_g": macros["protein_g"],
        "carbs_g": macros["carbs_g"],
        "fat_g": macros["fat_g"],
        "meals_per_day": 4,
        "meal_plan": meal_plan,
        "notes": f"Based on BMR {round(bmr)} kcal, TDEE {round(tdee)} kcal. Goal: {client['goal']}.",
    }
