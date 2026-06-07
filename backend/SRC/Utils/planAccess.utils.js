/** Client tiers that include a personal coach (Coach Plan / Elite). */
export const COACH_CLIENT_PLANS = ['Premium', 'Elite'];

/** Client tiers with self-serve AI generation. */
export const AI_CLIENT_PLANS = ['Standard', 'Elite'];

/**
 * Generated workout/meal plans need coach approval only when the client is on a
 * coach-inclusive tier AND has an assigned coach. Standard ("AI Plan") never does.
 */
export function clientShouldRequireCoachPlanApproval(subscription, selectedCoachId) {
  if (!selectedCoachId) return false;
  if (!subscription?.planName) return false;
  return COACH_CLIENT_PLANS.includes(subscription.planName);
}
