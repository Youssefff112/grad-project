/**
 * Diet Service
 * Handles all diet plan API calls.
 *
 * NOTE: Plan generation (generateDietPlan) calls a backend route that currently
 * uses rule-based logic. Once the AI team integrates their model into
 * backend/SRC/Modules/Diet/diet.service.js (_generateDietPlanForUser),
 * this frontend call will automatically use the AI-generated plans.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet, apiPost, apiDelete } from './api';

async function dietPlanCacheKey(): Promise<string | null> {
  const userId = await AsyncStorage.getItem('user_id');
  return userId ? `persist_diet_plan_${userId}` : null;
}

async function saveDietPlanLocally(plan: DietPlan | null) {
  const key = await dietPlanCacheKey();
  if (!key) return;
  if (plan) {
    await AsyncStorage.setItem(key, JSON.stringify(plan));
  } else {
    await AsyncStorage.removeItem(key);
  }
}

async function loadDietPlanLocally(): Promise<DietPlan | null> {
  const key = await dietPlanCacheKey();
  if (!key) return null;
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DietPlan;
  } catch {
    return null;
  }
}

export interface MacroNutrients {
  protein: number;
  carbs: number;
  fats: number;
}

export interface Meal {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  description: string;
  ingredients: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  preparationTime: number;
}

export interface DayPlan {
  day: string;
  meals: Meal[];
}

export interface DietPlan {
  id: number;
  userId: number;
  goal: string;
  dietaryPreference: string;
  dailyCalorieTarget: number;
  macronutrients: MacroNutrients;
  weeklyMealPlan: DayPlan[];
  isActive: boolean;
  pendingCoachReview?: boolean;
  assignedByCoachId?: number;
  assignedAt?: string;
  weekStartDate: string;
  createdAt: string;
}

export interface DietLog {
  id: number;
  userId: number;
  dietPlanId: number;
  date: string;
  mealsCompleted: Record<string, boolean>;
  caloriesConsumed?: number;
  macrosConsumed?: MacroNutrients;
  notes?: string;
  status: 'full' | 'partial' | 'missed' | 'followed';
  /** Millilitres logged for the day */
  waterMl?: number | null;
}

export interface DietLogRequest {
  date?: string;
  mealsCompleted?: Record<string, boolean>;
  caloriesConsumed?: number;
  macrosConsumed?: MacroNutrients;
  notes?: string;
  status?: 'full' | 'partial' | 'missed';
  dietPlanId?: number;
  /** Total water that day in millilitres */
  waterMl?: number;
}

/**
 * Trigger AI/rule-based diet plan generation for the current user.
 * Requires: active subscription + complete user profile with goal.
 */
export const generateDietPlan = async (): Promise<{ plan: DietPlan }> => {
  // AI generation can take 60-120 s on a cold start — use a generous timeout.
  const response: any = await apiPost('/diet/generate', {}, { timeout: 120000 });
  const plan = response.data?.plan ?? null;
  if (plan) await saveDietPlanLocally(plan);
  return { plan };
};

/**
 * Get the currently active diet plan for the current user.
 * Returns ``{ plan: null }`` if the user has no active plan.
 */
export const getActiveDietPlan = async (): Promise<{ plan: DietPlan | null }> => {
  try {
    const response: any = await apiGet('/diet/active');
    const plan = response.data?.plan ?? null;
    await saveDietPlanLocally(plan);
    return { plan };
  } catch (err) {
    const cached = await loadDietPlanLocally();
    if (cached) return { plan: cached };
    throw err;
  }
};

export const deleteActiveDietPlan = async (): Promise<void> => {
  await apiDelete('/diet/active');
  await saveDietPlanLocally(null);
};

/**
 * Log diet tracking data for a specific day.
 */
export const logDietDay = async (data: DietLogRequest): Promise<{ log: DietLog }> => {
  const response: any = await apiPost('/diet/track', data);
  return { log: response.data?.log };
};

/**
 * Fetch the diet log for a specific calendar date (YYYY-MM-DD).
 * Returns null if no log exists for that date yet.
 * Used by MealsScreen to restore per-day completion state.
 */
export const getDietLog = async (date: string): Promise<{ log: DietLog | null }> => {
  const response: any = await apiGet(`/diet/log?date=${encodeURIComponent(date)}`);
  return { log: response.data?.log ?? null };
};

/**
 * Get diet tracking history with pagination.
 */
export const getDietHistory = async (
  page = 1,
  limit = 10
): Promise<{ logs: DietLog[]; pagination: any }> => {
  const response: any = await apiGet(`/diet/history?page=${page}&limit=${limit}`);
  return {
    logs: response.data || [],
    pagination: response.pagination
  };
};

export default {
  generateDietPlan,
  getActiveDietPlan,
  logDietDay,
  getDietLog,
  getDietHistory,
};
