export type CoachApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface CoachAuthProfile {
  isApproved?: boolean;
  applicationStatus?: CoachApplicationStatus | string;
}

/**
 * Resolves coach gate from login/register `coachProfile` or GET /coach/profile.
 */
export function resolveCoachGate(
  coachProfile?: CoachAuthProfile | null
): CoachApplicationStatus {
  if (!coachProfile) return 'pending';
  const s = coachProfile.applicationStatus as CoachApplicationStatus | undefined;
  if (s === 'rejected') return 'rejected';
  if (s === 'approved' || coachProfile.isApproved === true) return 'approved';
  return 'pending';
}
