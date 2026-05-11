"""Personalized chatbot for each client - answers questions about nutrition, exercises, progress."""
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from models import Client, NutritionPlan, ExercisePlan, ChatMessage, Exercise, ExercisePerformance


def _build_client_context(db: Session, client_id: int) -> str:
    """Build context string about the client for the LLM."""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        return ""

    context_parts = [
        f"Client: {client.name}, {client.age}y, {client.gender}.",
        f"Weight: {client.weight_kg}kg, Height: {client.height_cm}cm.",
        f"Goal: {client.goal}. Fitness: {client.fitness_level}. Activity: {client.activity_level}.",
    ]

    plan = db.query(NutritionPlan).filter(NutritionPlan.client_id == client_id).first()
    if plan:
        context_parts.append(
            f"Nutrition: {plan.daily_calories} kcal/day, "
            f"P:{plan.protein_g}g C:{plan.carbs_g}g F:{plan.fat_g}g, {plan.meals_per_day} meals."
        )

    ex_plans = db.query(ExercisePlan).filter(ExercisePlan.client_id == client_id).all()
    if ex_plans:
        exercises_set = set()
        for ep in ex_plans:
            for ex in ep.exercises or []:
                name = ex.get("exercise_name") or ex.get("exercise_id")
                if name:
                    exercises_set.add(str(name))
        if exercises_set:
            context_parts.append(f"Exercises in plan: {', '.join(list(exercises_set)[:15])}.")

    if client.medical_notes:
        context_parts.append(f"Medical notes: {client.medical_notes[:200]}")

    if client.dietary_preferences:
        context_parts.append(f"Diet: {client.dietary_preferences}")

    # Recent form scores from computer vision
    performances = (
        db.query(ExercisePerformance)
        .filter(ExercisePerformance.client_id == client_id)
        .order_by(ExercisePerformance.session_date.desc())
        .limit(5)
        .all()
    )
    if performances:
        score_lines = []
        mistakes_all = []
        for p in performances:
            score_lines.append(f"{p.exercise_name}: {p.score}%")
            if p.mistakes_detected:
                mistakes_all.extend(p.mistakes_detected[:2])
        context_parts.append(f"Recent form scores: {', '.join(score_lines)}.")
        if mistakes_all:
            context_parts.append(f"Common form issues detected: {'; '.join(list(set(mistakes_all))[:5])}")

    return "\n".join(context_parts)


def _get_system_prompt(context: str) -> str:
    """System prompt for the chatbot."""
    return f"""You are a friendly, knowledgeable personal fitness and nutrition coach.
You have access to this client's profile, plans, and recent form analysis:

{context}

Coach rules (MUST follow):
- NEVER diagnose medical conditions or give medical advice. Always recommend consulting a doctor for injuries, pain, or health conditions.
- Encourage safe training and proper recovery.
- When the client has form scores or "Common form issues detected", use that to explain what to fix and how - use the same language as the computer vision feedback.
- Be supportive and specific. Reference their actual plan and performance data.

Answer questions about:
- Nutrition (calories, macros, meal suggestions)
- Exercises (form tips, sets/reps, how to fix detected mistakes)
- Recovery and motivation
- General fitness advice

Be concise. Do not make up meal plans or exercises - reference what they have.
"""


def chat_with_client(
    db: Session,
    client_id: int,
    user_message: str,
    openai_api_key: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Process a chat message and return the assistant's response.
    Uses OpenAI if API key is set; otherwise returns a rule-based fallback.
    """
    from config import settings
    api_key = openai_api_key or settings.openai_api_key

    # Load chat history (last 10 messages)
    history = (
        db.query(ChatMessage)
        .filter(ChatMessage.client_id == client_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(10)
        .all()
    )
    history = list(reversed(history))

    # Save user message
    user_msg = ChatMessage(client_id=client_id, role="user", content=user_message)
    db.add(user_msg)
    db.commit()

    context = _build_client_context(db, client_id)
    system_prompt = _get_system_prompt(context)

    messages = [{"role": "system", "content": system_prompt}]
    for m in history:
        messages.append({"role": m.role, "content": m.content})
    messages.append({"role": "user", "content": user_message})

    if api_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            resp = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=500,
            )
            reply = resp.choices[0].message.content
        except Exception as e:
            reply = _fallback_reply(user_message, context, str(e))
    else:
        reply = _fallback_reply(user_message, context, "No API key")

    # Save assistant message
    asst_msg = ChatMessage(client_id=client_id, role="assistant", content=reply)
    db.add(asst_msg)
    db.commit()

    return {"response": reply, "role": "assistant"}


def _fallback_reply(user_message: str, context: str, reason: str = "") -> str:
    """Rule-based fallback when OpenAI is not available."""
    msg = user_message.lower()
    replies = []

    if "calori" in msg or "eat" in msg or "food" in msg or "meal" in msg:
        if context and "Nutrition:" in context:
            replies.append("Your nutrition plan is personalized to your goals. Check your dashboard for daily calories and macros.")
        else:
            replies.append("I don't have your nutrition plan yet. Ask your trainer to generate one based on your profile.")
    if "exercise" in msg or "workout" in msg or "train" in msg:
        if context and "Recent form scores" in context and "form issues" in context.lower():
            replies.append("Check your recent form scores in the dashboard. I can explain any form issues detected and how to improve - just ask!")
        else:
            replies.append("Your exercise plan is customized for your fitness level. Use the camera correction feature to get form feedback after each set!")
    if "protein" in msg or "macro" in msg:
        if context and "Nutrition:" in context:
            replies.append("Your macros are set in your nutrition plan. Aim to hit your protein target first - it helps with muscle and satiety.")
        else:
            replies.append("A typical target is 1.6-2g protein per kg of body weight for muscle gain.")
    if "help" in msg or "how" in msg:
        replies.append("I can answer questions about your nutrition, exercises, and goals. Set OPENAI_API_KEY for full AI replies.")

    if replies:
        return " ".join(replies[:2])
    return (
        "I'm your fitness assistant. Ask me about your nutrition plan, exercises, or general tips. "
        f"(Full AI requires OPENAI_API_KEY: {reason})"
    )
