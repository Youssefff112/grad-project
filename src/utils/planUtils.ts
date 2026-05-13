import { SubscriptionPlan, PLAN_FEATURES, isClientPlan } from '../constants/plans';

/**
 * Check if a user with a specific plan has access to a feature
 */
export function hasFeatureAccess(
  plan: SubscriptionPlan,
  feature: 'hasFoodTracking' | 'hasWaterTracking' | 'hasExerciseLogging' | 'hasExerciseVideos' | 'hasAIChat' | 'hasAIWorkoutGeneration' | 'hasAIMealPlanGeneration' | 'hasComputerVision' | 'hasCoachChat' | 'hasSharedDashboard' | 'hasProgressTracking'
): boolean {
  const planFeatures = PLAN_FEATURES[plan];
  return (planFeatures[feature] as boolean) || false;
}

/**
 * Get user's plan features
 */
export function getPlanFeatures(plan: SubscriptionPlan) {
  return PLAN_FEATURES[plan];
}

/**
 * Check if feature is restricted and show appropriate message
 */
export function getFeatureAccessMessage(plan: SubscriptionPlan, featureName: string): { hasAccess: boolean; message?: string } {
  const planFeatures = PLAN_FEATURES[plan];

  // Map feature names to their property keys
  const featureMap: Record<string, string> = {
    'AI Chat': 'hasAIChat',
    'AI Workout Generation': 'hasAIWorkoutGeneration',
    'AI Meal Generation': 'hasAIMealPlanGeneration',
    'Computer Vision': 'hasComputerVision',
    'Coach Chat': 'hasCoachChat',
    'Shared Dashboard': 'hasSharedDashboard',
    'Progress Tracking': 'hasProgressTracking',
  };

  const featureKey = featureMap[featureName];
  if (!featureKey) return { hasAccess: true };

  const hasAccess = (planFeatures as any)[featureKey] as boolean;

  if (!hasAccess) {
    const recommendations = getUpgradeRecommendations(plan, featureName);
    return {
      hasAccess: false,
      message: `${featureName} is not available on your ${plan} plan. ${recommendations}`,
    };
  }

  return { hasAccess: true };
}

/**
 * Get recommended plan upgrades for a feature
 */
export function getUpgradeRecommendations(plan: SubscriptionPlan, featureName: string): string {
  const featureMap: Partial<Record<string, SubscriptionPlan[]>> = {
    'AI Chat': ['Standard', 'Elite'],
    'AI Workout Generation': ['Standard', 'Elite'],
    'AI Meal Generation': ['Standard', 'Elite'],
    'Computer Vision': ['Standard', 'Premium', 'Elite'],
    'Coach Chat': ['Premium', 'Elite'],
    'Shared Dashboard': ['Premium', 'Elite'],
    'Progress Tracking': ['Premium', 'Elite'],
  };

  const recommendedPlans = featureMap[featureName] || [];
  if (recommendedPlans.length === 0) return 'Upgrade your plan to access this feature.';

  return `Upgrade to ${recommendedPlans.join(' or ')} to access this feature.`;
}

/**
 * Check if plan is AI-focused (has AI features)
 */
export function isAIPlan(plan: SubscriptionPlan): boolean {
  return plan === 'Premium' || plan === 'Elite';
}

/**
 * Client tiers that can browse, assign, and message a human coach (Premium = "Coach Plan", Elite).
 * Uses plan metadata — not hardcoded strings scattered across the app.
 */
export function canClientSelectPersonalCoach(plan: SubscriptionPlan): boolean {
  if (!isClientPlan(plan)) return false;
  return !!(PLAN_FEATURES[plan]?.hasCoachChat);
}

/**
 * Coach platform account OR any tier that includes human-coach features.
 */
export function hasCoachingFeatures(plan: SubscriptionPlan): boolean {
  return plan === 'ProCoach' || canClientSelectPersonalCoach(plan);
}

/**
 * Get all available plans
 */
export function getAllPlans(): SubscriptionPlan[] {
  return ['Free', 'Standard', 'Premium', 'ProCoach', 'Elite'];
}
