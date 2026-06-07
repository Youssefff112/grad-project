/** Server-side subscription catalog — source of truth for plan names & prices. */
export const CLIENT_PLAN_NAMES = ['Free', 'Standard', 'Premium', 'Elite'];
export const COACH_PLAN_NAMES = ['ProCoach'];

export const PLAN_PRICES = {
  Free: 0,
  Standard: 9.99,
  Premium: 29.99,
  Elite: 49.99,
  ProCoach: 19.99,
};

export function plansForRole(role) {
  if (role === 'coach') return COACH_PLAN_NAMES;
  if (role === 'client') return CLIENT_PLAN_NAMES;
  return [];
}

export function resolvePlanPrice(planName) {
  return PLAN_PRICES[planName] ?? null;
}

export function isValidPlanForRole(role, planName) {
  return plansForRole(role).includes(planName);
}
