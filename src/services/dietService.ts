/**
 * Diet Service
 * Handles all diet plan API calls.
 *
 * NOTE: Plan generation (generateDietPlan) calls a backend route that currently
 * uses rule-based logic. Once the AI team integrates their model into
 * backend/SRC/Modules/Diet/diet.service.js (_generateDietPlanForUser),
 * this frontend call will automatically use the AI-generated plans.
 */

import { apiGet, apiPost } from './api';

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
  status: 'full' | 'partial' | 'missed';
}

export interface DietLogRequest {
  date?: string;
  mealsCompleted?: Record<string, boolean>;
  caloriesConsumed?: number;
  macrosConsumed?: MacroNutrients;
  notes?: string;
  status?: 'full' | 'partial' | 'missed';
  dietPlanId?: number;
}

/**
 * Trigger AI/rule-based diet plan generation for the current user.
 * Requires: active subscription + complete user profile with goal.
 */
export const generateDietPlan = async (): Promise<{ plan: DietPlan }> => {
  const response: any = await apiPost('/diet/generate', {});
  return { plan: response.data?.plan };
};

/**
 * Get the currently active diet plan for the current user.
 */
export const getActiveDietPlan = async (): Promise<{ plan: DietPlan }> => {
  const response: any = await apiGet('/diet/active');
  return { plan: response.data?.plan };
};

/**
 * Log diet tracking data for a specific day.
 */
export const logDietDay = async (data: DietLogRequest): Promise<{ log: DietLog }> => {
  const response: any = await apiPost('/diet/track', data);
  return { log: response.data?.log };
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
  getDietHistory,
};
