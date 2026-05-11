"""Extended nutrition plan generator - diet style, budget, cooking skill."""
from typing import Dict, List, Any

from services.nutrition_service import (
    calculate_bmr,
    calculate_tdee,
    calculate_macros,
    generate_meal_plan,
    ACTIVITY_MULTIPLIERS,
)

GOAL_ADJUSTMENTS = {
    "muscle_gain": 300,
    "fat_loss": -500,
    "maintenance": 0,
    "strength": 200,
    "endurance": 0,
    "general_fitness": 0,
    "sports_performance": 100,
}


def generate_nutrition_plan_full(client: Dict) -> Dict[str, Any]:
    """
    Full nutrition plan respecting:
    - diet_style (omnivore, vegetarian, vegan, halal, kosher)
    - allergies
    - cooking_skill
    - budget_range
    - meals_per_day
    - has_kitchen
    - cultural_preferences
    """
    weight_kg = client.get("weight_kg", 70)
    height_cm = client.get("height_cm", 170)
    age = client.get("age", 30)
    gender = client.get("gender", "male")
    activity_level = client.get("activity_level", "moderate")
    goal = client.get("goal", "maintenance")
    primary_goals = client.get("primary_goals", [goal])
    goal = primary_goals[0] if primary_goals else goal

    nutrition = client.get("nutrition", {}) or {}
    diet_style = nutrition.get("diet_style", client.get("dietary_preferences", "omnivore"))
    if isinstance(diet_style, str) and " " in diet_style:
        diet_style = diet_style.split()[0].lower()
    meals_per_day = nutrition.get("meals_per_day", 4)
    allergies = nutrition.get("allergies", [])
    dislikes = nutrition.get("dislikes", [])
    cooking_skill = nutrition.get("cooking_skill", "intermediate")
    budget = nutrition.get("budget_range", "moderate")
    has_kitchen = nutrition.get("has_kitchen", True)
    cultural = nutrition.get("cultural_preferences", "")

    bmr = calculate_bmr(weight_kg, height_cm, age, gender)
    tdee = calculate_tdee(bmr, activity_level)
    adjustment = GOAL_ADJUSTMENTS.get(goal, 0)
    daily_calories = round(tdee + adjustment, 0)

    macros = calculate_macros(weight_kg, goal, daily_calories)

    meal_plan = _generate_meal_plan_extended(
        daily_calories=daily_calories,
        protein_g=macros["protein_g"],
        carbs_g=macros["carbs_g"],
        fat_g=macros["fat_g"],
        meals_per_day=meals_per_day,
        diet_style=str(diet_style).lower(),
        allergies=allergies or [],
        dislikes=dislikes or [],
        cooking_skill=cooking_skill,
        budget=budget,
        has_kitchen=has_kitchen,
        cultural=cultural,
    )

    notes = (
        f"Based on BMR {round(bmr)} kcal, TDEE {round(tdee)} kcal. "
        f"Goal: {goal}. Diet: {diet_style}."
    )

    return {
        "daily_calories": daily_calories,
        "protein_g": macros["protein_g"],
        "carbs_g": macros["carbs_g"],
        "fat_g": macros["fat_g"],
        "meals_per_day": meals_per_day,
        "meal_plan": meal_plan,
        "notes": notes,
    }


def _generate_meal_plan_extended(
    daily_calories: float,
    protein_g: float,
    carbs_g: float,
    fat_g: float,
    meals_per_day: int,
    diet_style: str = "omnivore",
    allergies: List[str] = None,
    dislikes: List[str] = None,
    cooking_skill: str = "intermediate",
    budget: str = "moderate",
    has_kitchen: bool = True,
    cultural: str = "",
) -> List[Dict[str, Any]]:
    """Meal suggestions respecting diet, cooking, budget."""
    allergies = allergies or []
    dislikes = dislikes or []
    avoid = set(a.lower() for a in allergies) | set(d.lower() for d in dislikes)

    # Protein sources by diet
    proteins = {
        "omnivore": ["chicken", "fish", "eggs", "beef", "tuna", "turkey"],
        "vegetarian": ["eggs", "cottage cheese", "tofu", "greek yogurt", "lentils", "beans"],
        "vegan": ["tofu", "tempeh", "lentils", "chickpeas", "beans", "edamame"],
        "halal": ["chicken", "lamb", "fish", "eggs", "turkey"],
        "kosher": ["chicken", "fish", "eggs", "turkey"],
    }
    protein_options = proteins.get(diet_style, proteins["omnivore"])

    # Simple meals - filter out avoided
    def ok(s: str) -> bool:
        return not any(a in s.lower() for a in avoid)

    breakfast = ["Oatmeal + eggs", "Greek yogurt + fruit", "Whole grain toast + avocado", "Protein smoothie"]
    lunch_dinner = [
        "Chicken breast + rice", "Fish + vegetables", "Tuna salad",
        "Lentil soup + bread", "Tofu stir-fry", "Bean chili",
        "Egg scramble + vegetables", "Cottage cheese + nuts",
    ]
    if diet_style == "vegan":
        lunch_dinner = [m for m in lunch_dinner if ok(m) and "chicken" not in m and "fish" not in m and "tuna" not in m and "egg" not in m]
    elif diet_style == "vegetarian":
        lunch_dinner = [m for m in lunch_dinner if ok(m) and "chicken" not in m and "fish" not in m and "tuna" not in m and "beef" not in m]

    if not has_kitchen:
        lunch_dinner = ["Salads", "Sandwiches", "Pre-made meals", "Protein bars + fruit"]

    if cooking_skill == "beginner":
        lunch_dinner = [m for m in lunch_dinner if "stir-fry" not in m and "chili" not in m][:6]

    pct = 1.0 / meals_per_day
    meals = []
    for i in range(meals_per_day):
        if i == 0:
            suggestions = [b for b in breakfast if ok(b)][:3]
        elif i == meals_per_day - 1:
            suggestions = lunch_dinner[:3]
        else:
            suggestions = lunch_dinner[2:5]
        meals.append({
            "meal_number": i + 1,
            "name": f"Meal {i + 1}",
            "calories_target": round(daily_calories * pct, 0),
            "protein_g": round(protein_g * pct, 1),
            "carbs_g": round(carbs_g * pct, 1),
            "fat_g": round(fat_g * pct, 1),
            "suggestions": suggestions if suggestions else ["Balanced plate: protein + carbs + vegetables"],
        })
    return meals
