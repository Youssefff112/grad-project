/**
 * Token Manager
 * Handles JWT token storage, retrieval, and validation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

/**
 * Save tokens to AsyncStorage
 */
const DEFAULT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — matches JWT_EXPIRES_IN on the backend

export const saveTokens = async (data: TokenData): Promise<void> => {
  try {
    const expiryMs = data.expiresIn ? data.expiresIn * 1000 : DEFAULT_EXPIRY_MS;
    await Promise.all([
      AsyncStorage.setItem(AUTH_TOKEN_KEY, data.accessToken),
      AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken),
      AsyncStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + expiryMs)),
    ]);
  } catch (error) {
    console.warn('[TokenManager] Failed to save tokens:', error);
  }
};

/**
 * Get access token from AsyncStorage
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY).catch(() => null);
  } catch (error) {
    console.warn('[TokenManager] Failed to get access token:', error);
    return null;
  }
};

/**
 * Get refresh token from AsyncStorage
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY).catch(() => null);
  } catch (error) {
    console.warn('[TokenManager] Failed to get refresh token:', error);
    return null;
  }
};

/**
 * Check if token is still valid (not expired)
 */
export const isTokenValid = async (): Promise<boolean> => {
  try {
    const expiryStr = await AsyncStorage.getItem(TOKEN_EXPIRY_KEY).catch(() => null);
    if (!expiryStr) return false;

    try {
      const expiryTime = parseInt(expiryStr, 10);
      return expiryTime > Date.now();
    } catch (parseError) {
      console.warn('[TokenManager] Failed to parse expiry time:', parseError);
      return false;
    }
  } catch (error) {
    console.warn('[TokenManager] Failed to check token validity:', error);
    return false;
  }
};

/**
 * Clear all tokens from AsyncStorage
 */
export const clearTokens = async (): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(TOKEN_EXPIRY_KEY),
    ]);
  } catch (error) {
    console.warn('[TokenManager] Failed to clear tokens:', error);
  }
};

/**
 * Get both tokens
 */
export const getTokens = async (): Promise<{ accessToken: string | null; refreshToken: string | null }> => {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      AsyncStorage.getItem(AUTH_TOKEN_KEY).catch(() => null),
      AsyncStorage.getItem(REFRESH_TOKEN_KEY).catch(() => null),
    ]);
    return { accessToken, refreshToken };
  } catch (error) {
    console.warn('[TokenManager] Failed to get tokens:', error);
    return { accessToken: null, refreshToken: null };
  }
};

export default {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  isTokenValid,
  clearTokens,
  getTokens,
};
