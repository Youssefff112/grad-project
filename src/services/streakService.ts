import * as dietService from './dietService';
import * as workoutService from './workoutService';
import { computeDailyStreak } from '../utils/dailyStreak';

export async function fetchDailyStreak(waterGoalMl: number): Promise<number> {
  try {
    const [{ plan: dietPlan }, { plan: workoutPlan }, dietHistory, workoutHistory] = await Promise.all([
      dietService.getActiveDietPlan(),
      workoutService.getActiveWorkoutPlan(),
      dietService.getDietHistory(1, 120),
      workoutService.getWorkoutHistory(1, 120),
    ]);

    const hasActiveDietPlan = !!dietPlan;
    const planHydration = (dietPlan as { hydrationGoal?: number } | null)?.hydrationGoal;
    const hydrationGoalMl = hasActiveDietPlan
      ? (waterGoalMl > 0 ? waterGoalMl : null) ?? (planHydration != null && planHydration > 0 ? planHydration : 2000)
      : null;

    return computeDailyStreak(dietHistory.logs || [], workoutHistory.logs || [], {
      hasActiveDietPlan,
      hydrationGoalMl,
      weeklyMealPlan: dietPlan?.weeklyMealPlan,
      weeklyWorkoutSchedule: workoutPlan?.weeklySchedule,
    });
  } catch {
    return 0;
  }
}
