export type SubscriptionPlan = 'Free' | 'Standard' | 'Premium' | 'ProCoach' | 'Elite';

export interface PlanFeatures {
  plan: SubscriptionPlan;
  name: string;
  price: number;
  isCoachAccount: boolean;
  // Client features
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
  // Coach features
  hasClientManagement: boolean;
  hasMealPlanCreation: boolean;
  hasWorkoutPlanCreation: boolean;
  hasEarningsTracking: boolean;
  hasScheduleManagement: boolean;
  hasProgramTemplates: boolean;
  hasClientProgressTracking: boolean;
  hasReviewManagement: boolean;
}

export const PLAN_FEATURES: Record<SubscriptionPlan, PlanFeatures> = {
  // ────────────────────────────────────────────────────────────────────────
  // CLIENT TIERS (consumer plans, role = 'client')
  // ────────────────────────────────────────────────────────────────────────
  Free: {
    plan: 'Free',
    name: 'Free',
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
    hasClientManagement: false,
    hasMealPlanCreation: false,
    hasWorkoutPlanCreation: false,
    hasEarningsTracking: false,
    hasScheduleManagement: false,
    hasProgramTemplates: false,
    hasClientProgressTracking: false,
    hasReviewManagement: false,
  },
  Standard: {
    plan: 'Standard',
    name: 'AI Plan',
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
    hasClientManagement: false,
    hasMealPlanCreation: false,
    hasWorkoutPlanCreation: false,
    hasEarningsTracking: false,
    hasScheduleManagement: false,
    hasProgramTemplates: false,
    hasClientProgressTracking: false,
    hasReviewManagement: false,
  },
  Premium: {
    plan: 'Premium',
    name: 'Coach Plan',
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
    hasClientManagement: false,
    hasMealPlanCreation: false,
    hasWorkoutPlanCreation: false,
    hasEarningsTracking: false,
    hasScheduleManagement: false,
    hasProgramTemplates: false,
    hasClientProgressTracking: false,
    hasReviewManagement: false,
  },
  // ────────────────────────────────────────────────────────────────────────
  // COACH TIER (separate from the client tiers above — role = 'coach')
  // This is what someone pays to BE a coach on the platform; clients should
  // never see this in the subscription selection list.
  // ────────────────────────────────────────────────────────────────────────
  ProCoach: {
    plan: 'ProCoach',
    name: 'Coach Account',
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
    hasCoachChat: true,
    hasSharedDashboard: true,
    hasProgressTracking: false,
    hasClientManagement: true,
    hasMealPlanCreation: true,
    hasWorkoutPlanCreation: true,
    hasEarningsTracking: true,
    hasScheduleManagement: true,
    hasProgramTemplates: true,
    hasClientProgressTracking: true,
    hasReviewManagement: true,
  },
  // Back to CLIENT TIERS
  Elite: {
    plan: 'Elite',
    name: 'Elite',
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
    hasClientManagement: false,
    hasMealPlanCreation: false,
    hasWorkoutPlanCreation: false,
    hasEarningsTracking: false,
    hasScheduleManagement: false,
    hasProgramTemplates: false,
    hasClientProgressTracking: false,
    hasReviewManagement: false,
  },
};

/**
 * The plans a client can subscribe to in onboarding / upgrade screens.
 * ``ProCoach`` is intentionally excluded — it's a coach-only account type,
 * not a tier a client should ever pick. Use this list everywhere a "choose
 * your subscription" UI is rendered.
 */
export const CLIENT_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  'Free',
  'Standard',
  'Premium',
  'Elite',
];

/** True if the given plan key belongs to a client (consumer) tier. */
export const isClientPlan = (plan: SubscriptionPlan): boolean =>
  !PLAN_FEATURES[plan].isCoachAccount;

/** True if the given plan key is the coach-account tier. */
export const isCoachPlan = (plan: SubscriptionPlan): boolean =>
  PLAN_FEATURES[plan].isCoachAccount;
