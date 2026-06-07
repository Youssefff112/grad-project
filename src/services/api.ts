/**
 * API Client Service
 * Handles all HTTP requests with JWT token injection and refresh logic.
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { environment } from '../config/environment';
import * as tokenManager from '../utils/tokenManager';
import { unwrapApiData } from '../utils/apiResponse';

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
 * Response interceptor - Handle token refresh and error normalisation
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (!error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers?.['retry-after'];
      const msg = retryAfter
        ? `Too many requests. Please wait ${retryAfter}s and try again.`
        : 'Too many requests. Please wait a moment and try again.';
      return Promise.reject(new Error(msg));
    }

    // Handle 401 Unauthorized — attempt token refresh
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
 * Upload FormData via fetch (not axios) so React Native can inject the
 * correct multipart/form-data boundary automatically.
 */
export const apiUpload = async <T = any>(url: string, formData: FormData): Promise<T> => {
  const token = await tokenManager.getAccessToken();
  const fullUrl = `${environment.API_BASE_URL}${url}`;

  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = new Error(json.message || `Upload failed (${response.status})`) as any;
    err.response = { status: response.status, data: json };
    throw err;
  }

  return unwrapApiData<T>(json);
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
