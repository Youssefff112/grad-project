export type SubscriptionPlan = 'Free' | 'Standard' | 'Premium' | 'ProCoach' | 'Elite';

export interface PlanFeatures {
  plan: SubscriptionPlan;
  name: string;
  price: number;
  isCoachAccount: boolean;
  hasFoodTracking: boolean;
  hasWaterTracking: boolean;
  hasExerciseLogging: boolean;
  hasExerciseVideos: boolean;
  hasAIChat: boolean;
  hasAIWorkoutGeneration: boolean;
  hasAIMealPlanGeneration: boolean;
  hasComputerVision: boolean;
  hasCoachChat: boolean;
  hasSharedDashboard: boolean;
  hasProgressTracking: boolean;
}

export const PLAN_FEATURES: Record<SubscriptionPlan, PlanFeatures> = {
  Free: {
    plan: 'Free',
    name: 'Free Plan',
    price: 0,
    isCoachAccount: false,
    hasFoodTracking: true,
    hasWaterTracking: true,
    hasExerciseLogging: true,
    hasExerciseVideos: true,
    hasAIChat: false,
    hasAIWorkoutGeneration: false,
    hasAIMealPlanGeneration: false,
    hasComputerVision: false,
    hasCoachChat: false,
    hasSharedDashboard: false,
    hasProgressTracking: false,
  },
  Standard: {
    plan: 'Standard',
    name: 'Standard (AI Plan)',
    price: 9.99,
    isCoachAccount: false,
    hasFoodTracking: true,
    hasWaterTracking: true,
    hasExerciseLogging: true,
    hasExerciseVideos: true,
    hasAIChat: true,
    hasAIWorkoutGeneration: true,
    hasAIMealPlanGeneration: true,
    hasComputerVision: true,
    hasCoachChat: false,
    hasSharedDashboard: false,
    hasProgressTracking: false,
  },
  Premium: {
    plan: 'Premium',
    name: 'Premium (Coach Plan)',
    price: 19.99,
    isCoachAccount: false,
    hasFoodTracking: true,
    hasWaterTracking: true,
    hasExerciseLogging: true,
    hasExerciseVideos: true,
    hasAIChat: false,
    hasAIWorkoutGeneration: false,
    hasAIMealPlanGeneration: false,
    hasComputerVision: true,
    hasCoachChat: true,
    hasSharedDashboard: true,
    hasProgressTracking: true,
  },
  ProCoach: {
    plan: 'ProCoach',
    name: 'Pro Coach Account',
    price: 49.99,
    isCoachAccount: true,
    hasFoodTracking: false,
    hasWaterTracking: false,
    hasExerciseLogging: false,
    hasExerciseVideos: false,
    hasAIChat: false,
    hasAIWorkoutGeneration: false,
    hasAIMealPlanGeneration: false,
    hasComputerVision: false,
    hasCoachChat: false,
    hasSharedDashboard: false,
    hasProgressTracking: false,
  },
  Elite: {
    plan: 'Elite',
    name: 'Elite Plan',
    price: 99.99,
    isCoachAccount: false,
    hasFoodTracking: true,
    hasWaterTracking: true,
    hasExerciseLogging: true,
    hasExerciseVideos: true,
    hasAIChat: true,
    hasAIWorkoutGeneration: true,
    hasAIMealPlanGeneration: true,
    hasComputerVision: true,
    hasCoachChat: true,
    hasSharedDashboard: true,
    hasProgressTracking: true,
  },
};
