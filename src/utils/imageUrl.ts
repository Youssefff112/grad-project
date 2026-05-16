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
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Relative path — prepend backend origin (no API prefix, just the host)
  const base = environment.BACKEND_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
