"""Exercise filtering rules engine."""
from typing import List, Optional

from services.program_generator.rules.exercise_rules import filter_exercises_for_client


def filter_exercises(
    exercises: List,
    equipment: str,
    injury_areas: List[str],
    doctor_restrictions: bool = False,
    exclude_names: Optional[List[str]] = None,
) -> List:
    """
    Filter exercises by equipment, injuries, doctor restrictions, dislikes.
    Wrapper around program_generator exercise_rules.
    """
    return filter_exercises_for_client(
        exercises=exercises,
        equipment=equipment,
        injury_areas=injury_areas,
        doctor_restrictions=doctor_restrictions,
        exclude_names=exclude_names,
    )
