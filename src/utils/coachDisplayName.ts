import type { Coach, CoachDetail } from '../services/coachService';

type CoachLike = Pick<Coach, 'userId'> & {
  User?: { firstName?: string; lastName?: string; email?: string };
  name?: string;
};

/**
 * Human-readable coach name — never uses numeric placeholders like "Coach #12".
 */
export function coachDisplayName(coach: CoachLike | CoachDetail | null | undefined): string {
  if (!coach) return 'Coach';

  const user = coach.User as { firstName?: string; lastName?: string; email?: string } | undefined;
  const first = user?.firstName?.trim();
  if (first) {
    const last = user?.lastName?.trim();
    return last ? `${first} ${last}` : first;
  }

  const legacy = (coach as { name?: string }).name?.trim();
  if (legacy) return legacy;

  const email = user?.email?.trim();
  if (email) {
    const local = email.split('@')[0] || '';
    const parts = local.replace(/[._-]+/g, ' ').split(/\s+/).filter(Boolean);
    if (parts.length) {
      return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
    }
  }

  return 'Coach';
}
