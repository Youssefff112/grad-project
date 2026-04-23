/**
 * API Client Service
 * Handles all HTTP requests with JWT token injection and refresh logic
 * Includes offline support with queue and caching
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { environment } from '../config/environment';
import * as tokenManager from '../utils/tokenManager';
import * as offlineService from './offlineService';
import * as syncQueueService from './syncQueueService';
import type { OperationType } from './syncQueueService';
import { getCurrentNetworkState } from './networkService';

const URL_TO_OPERATION_TYPE: Record<string, OperationType> = {
  messages: 'message',
  message: 'message',
  notifications: 'notification_read',
  notification: 'notification_read',
  workouts: 'workout_complete',
  workout: 'workout_complete',
  meals: 'meal_log',
  meal: 'meal_log',
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: environment.API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're already refreshing token to avoid multiple refresh calls
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Request interceptor - Add JWT token to headers
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor - Handle token refresh, offline queuing, and caching
 */
apiClient.interceptors.response.use(
  async (response) => {
    // Cache successful GET responses for offline access
    if (response.config.method === 'get') {
      const endpoint = response.config.url || '';
      await offlineService.cacheResponse(endpoint, response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    if (!error.config) {
      return Promise.reject(error);
    }
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const method = originalRequest.method?.toUpperCase() as 'POST' | 'PUT' | 'PATCH' | 'GET' | 'DELETE' | undefined;

    // Handle network errors (no response) for write operations
    if (!error.response && method && ['POST', 'PUT', 'PATCH'].includes(method)) {
      const writeMethod = method as 'POST' | 'PUT' | 'PATCH';
      const networkState = await getCurrentNetworkState();
      if (!networkState.isOnline) {
        console.log(`[Offline] Queuing ${writeMethod} request: ${originalRequest.url}`);
        let payload: Record<string, any> = {};
        try {
          if (originalRequest.data) {
            payload = typeof originalRequest.data === 'string'
              ? JSON.parse(originalRequest.data)
              : JSON.parse(JSON.stringify(originalRequest.data));
          }
        } catch {
          payload = {};
        }
        // Derive operation type from URL (e.g. /messages → 'message', /workouts → 'workout_complete')
        const urlSegment = (originalRequest.url || '').split('/').filter(Boolean)[0] || '';
        const operationType: OperationType = URL_TO_OPERATION_TYPE[urlSegment] ?? 'message';
        await syncQueueService.enqueueOperation(
          operationType,
          originalRequest.url || '',
          writeMethod,
          payload,
          2 // priority
        );
        return Promise.resolve({ data: { queued: true } } as any);
      }
    }

    // For GET requests when offline, try to return cached data
    if (!error.response && originalRequest.method === 'get') {
      const endpoint = originalRequest.url || '';
      const cached = await offlineService.getCachedResponse(endpoint);
      if (cached) {
        console.log(`[Offline] Returning cached response for: ${endpoint}`);
        return Promise.resolve({ data: cached } as any);
      }
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenManager.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${environment.API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { token, refreshToken: newRefreshToken } = response.data.data;
        if (token) {
          await tokenManager.saveTokens({
            accessToken: token,
            refreshToken: newRefreshToken || refreshToken,
            expiresIn: response.data.data.expiresIn,
          });

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }

          processQueue(null, token);
          isRefreshing = false;

          return apiClient(originalRequest);
        }
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;

        // Clear tokens and force logout
        await tokenManager.clearTokens();
        throw error;
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      await tokenManager.clearTokens();
    }

    return Promise.reject(error);
  }
);

/**
 * Make GET request
 */
export const apiGet = <T = any>(url: string, config?: any): Promise<T> => {
  return apiClient.get(url, config).then((res) => res.data);
};

/**
 * Make POST request
 */
export const apiPost = <T = any>(url: string, data?: any, config?: any): Promise<T> => {
  return apiClient.post(url, data, config).then((res) => res.data);
};

/**
 * Make PATCH request
 */
export const apiPatch = <T = any>(url: string, data?: any, config?: any): Promise<T> => {
  return apiClient.patch(url, data, config).then((res) => res.data);
};

/**
 * Make PUT request
 */
export const apiPut = <T = any>(url: string, data?: any, config?: any): Promise<T> => {
  return apiClient.put(url, data, config).then((res) => res.data);
};

/**
 * Make DELETE request
 */
export const apiDelete = <T = any>(url: string, config?: any): Promise<T> => {
  return apiClient.delete(url, config).then((res) => res.data);
};

/**
 * Health check - Check if backend is available
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${environment.BACKEND_URL}/health`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};

export default {
  apiGet,
  apiPost,
  apiPatch,
  apiPut,
  apiDelete,
  checkBackendHealth,
  client: apiClient,
};
