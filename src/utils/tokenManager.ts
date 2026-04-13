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
export const saveTokens = async (data: TokenData): Promise<void> => {
  try {
    await AsyncStorage.multiSet([
      [AUTH_TOKEN_KEY, data.accessToken],
      [REFRESH_TOKEN_KEY, data.refreshToken],
      [TOKEN_EXPIRY_KEY, String(data.expiresIn ? Date.now() + data.expiresIn * 1000 : 0)],
    ]);
  } catch (error) {
    console.error('Failed to save tokens:', error);
    throw error;
  }
};

/**
 * Get access token from AsyncStorage
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
};

/**
 * Get refresh token from AsyncStorage
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get refresh token:', error);
    return null;
  }
};

/**
 * Check if token is still valid (not expired)
 */
export const isTokenValid = async (): Promise<boolean> => {
  try {
    const expiryStr = await AsyncStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryStr) return false;

    const expiryTime = parseInt(expiryStr, 10);
    return expiryTime > Date.now();
  } catch (error) {
    console.error('Failed to check token validity:', error);
    return false;
  }
};

/**
 * Clear all tokens from AsyncStorage
 */
export const clearTokens = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, TOKEN_EXPIRY_KEY]);
  } catch (error) {
    console.error('Failed to clear tokens:', error);
    throw error;
  }
};

/**
 * Get both tokens
 */
export const getTokens = async (): Promise<{ accessToken: string | null; refreshToken: string | null }> => {
  try {
    const [accessToken, refreshToken] = await AsyncStorage.multiGet([
      AUTH_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
    ]);
    return {
      accessToken: accessToken[1],
      refreshToken: refreshToken[1],
    };
  } catch (error) {
    console.error('Failed to get tokens:', error);
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
