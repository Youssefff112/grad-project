/**
 * Environment Configuration
 *
 * Priority order for backend URL:
 *  1. EXPO_PUBLIC_BACKEND_URL in .env  ← set this to your ngrok static domain
 *  2. Falls back to localhost (same-machine emulator only)
 *
 * To make the app work from any device / network:
 *   - Run `npm run tunnel` in the backend folder
 *   - Copy the ngrok URL into .env as EXPO_PUBLIC_BACKEND_URL
 *   - Restart Expo with `npx expo start --clear`
 */
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const API_PREFIX = process.env.EXPO_PUBLIC_API_PREFIX || '/api/v1';
const ENV = process.env.EXPO_PUBLIC_ENV || 'development';

export const environment = {
  BACKEND_URL,
  API_PREFIX,
  API_BASE_URL: `${BACKEND_URL}${API_PREFIX}`,
  ENV,
  isDevelopment: ENV === 'development',
  isProduction: ENV === 'production',
};

export default environment;
