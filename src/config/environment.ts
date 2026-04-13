/**
 * Environment Configuration
 * Loads environment variables for the app
 */

// Use Expo public environment variables (prefixed with EXPO_PUBLIC_)
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
