/** AsyncStorage: set when a new client account is created; cleared after intro is shown. */
export const PENDING_WEEKLY_WEIGH_IN_INTRO_KEY = 'pending_weekly_weigh_in_intro';
/** AsyncStorage: permanent flag — intro alert must only appear once per install/account flow. */
export const WEEKLY_WEIGH_IN_INTRO_SEEN_KEY = 'weekly_weigh_in_intro_seen';

export const WEEKLY_WEIGH_IN_INTRO_TITLE = 'Weekly weigh-in reminders';
export const WEEKLY_WEIGH_IN_INTRO_MESSAGE =
  'Vertex can remind you to update your weight once a week. After 7 days, a short weigh-in form appears on your home screen so your plan and progress stay accurate.';

export function daysSinceDate(isoDate: string): number {
  const last = new Date(isoDate);
  const today = new Date();
  last.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
}

/** Show the banner only after a full week since the last weigh-in / cycle start. */
export function shouldShowWeeklyWeighInForm(lastPlanReviewDate: string | null): boolean {
  if (!lastPlanReviewDate) return false;
  return daysSinceDate(lastPlanReviewDate) >= 7;
}
