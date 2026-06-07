/**
 * Environment Configuration
 *
 * Backend URL priority order:
 *  1. EXPO_PUBLIC_BACKEND_URL in .env  ← use this for ngrok / production
 *  2. Auto-detected from Expo's dev-server host (works for any device on LAN)
 *  3. localhost fallback (same-machine emulator only)
 *
 * For LAN testing (physical device / emulator on same Wi-Fi):
 *   Just run `npx expo start --clear` — the host is detected automatically.
 *
 * For cross-network / production:
 *   Set EXPO_PUBLIC_BACKEND_URL=https://your-ngrok-or-prod-url in .env
 */
import Constants from 'expo-constants';

const getHostFromExpo = (): string | null => {
  const hostUri =
    Constants.expoConfig?.hostUri
    ?? Constants.expoGoConfig?.hostUri
    ?? Constants.manifest2?.extra?.expoGo?.debuggerHost
    ?? null;
  if (hostUri) return hostUri.split(':')[0];
  return null;
};

const normalizeEnvUrl = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const getBackendUrl = (): string => {
  // Physical devices load JS from Expo's LAN host — use that IP in dev so we
  // never point at a stale address in .env after the machine changes networks.
  if (__DEV__) {
    const expoHost = getHostFromExpo();
    if (expoHost) return `http://${expoHost}:5000`;
  }
  const explicit = normalizeEnvUrl(process.env.EXPO_PUBLIC_BACKEND_URL);
  if (explicit) return explicit.replace(/\/$/, '');
  const host = getHostFromExpo();
  if (host) return `http://${host}:5000`;
  return 'http://localhost:5000';
};

const getAIBackendUrl = (): string => {
  if (__DEV__) {
    const expoHost = getHostFromExpo();
    if (expoHost) return `http://${expoHost}:8000`;
  }
  const explicit = normalizeEnvUrl(process.env.EXPO_PUBLIC_AI_BACKEND_URL);
  if (explicit) return explicit.replace(/\/$/, '');
  const host = getHostFromExpo();
  if (host) return `http://${host}:8000`;
  return 'http://localhost:8000';
};

const BACKEND_URL = getBackendUrl();
const AI_BACKEND_URL = getAIBackendUrl();
const API_PREFIX = process.env.EXPO_PUBLIC_API_PREFIX || '/api/v1';
const ENV = process.env.EXPO_PUBLIC_ENV || 'development';
const isProduction = ENV === 'production';

if (isProduction && BACKEND_URL.startsWith('http://')) {
  console.error(
    '[Vertex] SECURITY: Production builds must use HTTPS for EXPO_PUBLIC_BACKEND_URL. ' +
    'Cleartext HTTP exposes auth tokens on the network.',
  );
}

export const environment = {
  BACKEND_URL,
  AI_BACKEND_URL,
  API_PREFIX,
  API_BASE_URL: `${BACKEND_URL}${API_PREFIX}`,
  ENV,
  isDevelopment: ENV === 'development',
  isProduction,
  /** True when API traffic should use TLS (production or explicit https URL). */
  requiresHttps: isProduction || BACKEND_URL.startsWith('https://'),
};

if (__DEV__) {
  console.log('[Vertex] API_BASE_URL =', environment.API_BASE_URL);
}

export default environment;
