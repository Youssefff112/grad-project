/**
 * Fail fast when required secrets are missing (especially in production).
 */
export function validateRequiredEnv() {
  const required = ['JWT_SECRET', 'DATABASE_URL'];
  const missing = required.filter((key) => !process.env[key]?.trim());

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (!process.env.JWT_REFRESH_SECRET?.trim()) {
    throw new Error('JWT_REFRESH_SECRET is required. Do not reuse JWT_SECRET for refresh tokens.');
  }

  if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL?.trim()) {
    console.warn('⚠️  FRONTEND_URL is not set — Socket.IO CORS will block browser clients in production.');
  }
}
