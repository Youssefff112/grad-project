export type SubscriptionPlan = 'Free' | 'Standard' | 'Premium' | 'ProCoach' | 'Elite';

export interface PlanFeatures {
  plan: SubscriptionPlan;
  name: string;
  price: number;
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
    name: 'Standard Plan',
    price: 9.99,
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
  Premium: {
    plan: 'Premium',
    name: 'Premium (AI Plan)',
    price: 19.99,
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
  ProCoach: {
    plan: 'ProCoach',
    name: 'Pro Coach Plan',
    price: 49.99,
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
  Elite: {
    plan: 'Elite',
    name: 'Elite Plan',
    price: 99.99,
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
