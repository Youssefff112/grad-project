import { SubscriptionPlan, PLAN_FEATURES } from '../constants/plans';

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
    'AI Chat': ['Premium', 'Elite'],
    'AI Workout Generation': ['Premium', 'Elite'],
    'AI Meal Generation': ['Premium', 'Elite'],
    'Computer Vision': ['Premium', 'ProCoach', 'Elite'],
    'Coach Chat': ['ProCoach', 'Elite'],
    'Shared Dashboard': ['ProCoach', 'Elite'],
    'Progress Tracking': ['ProCoach', 'Elite'],
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
 * Check if plan has coaching features
 */
export function hasCoachingFeatures(plan: SubscriptionPlan): boolean {
  return plan === 'ProCoach' || plan === 'Elite';
}

/**
 * Get all available plans
 */
export function getAllPlans(): SubscriptionPlan[] {
  return ['Free', 'Standard', 'Premium', 'ProCoach', 'Elite'];
}
