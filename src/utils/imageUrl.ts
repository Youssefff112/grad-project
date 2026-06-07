import { environment } from '../config/environment';

/**
 * Converts a server-relative image path (e.g. "/uploads/file.jpg") into a
 * fully-qualified URL using the configured backend base URL.
 *
 * If the value is already a full URL (starts with http/https), it is returned
 * as-is so that production CDN/cloud storage URLs work without modification.
 *
 * Returns undefined when the input is falsy so callers can use it directly in
 * conditional rendering.
 */
export function buildImageUrl(path: string | null | undefined): string | undefined {
  const normalized = normalizeProfilePicturePath(path);
  if (!normalized) return undefined;
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) return normalized;
  const base = environment.BACKEND_URL.replace(/\/$/, '');
  return `${base}${normalized.startsWith('/') ? normalized : `/${normalized}`}`;
}

/** Trim and validate a stored profile-picture path; empty strings become null. */
export function normalizeProfilePicturePath(path: string | null | undefined): string | null {
  if (typeof path !== 'string') return null;
  const trimmed = path.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Client avatars live in the user JSONB profile blob. */
export function getProfilePictureFromUserProfile(profile: unknown): string | null {
  if (!profile || typeof profile !== 'object') return null;
  return normalizeProfilePicturePath((profile as { profilePicture?: string }).profilePicture);
}

/** Prefer coach_profiles.picture, then fall back to user.profile.profilePicture. */
export function resolveCoachAvatarPath(
  coachProfile?: { profilePicture?: string | null } | null,
  userProfile?: unknown,
): string | null {
  return (
    normalizeProfilePicturePath(coachProfile?.profilePicture) ??
    getProfilePictureFromUserProfile(userProfile)
  );
}
