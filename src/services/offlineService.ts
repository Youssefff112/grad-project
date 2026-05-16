import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CachedWorkout {
  id: string;
  date: string;
  type: string;
  duration: string;
  score: string;
  exercises: number;
}

export interface DailyMealLog {
  checkedMeals: Record<string, boolean>;
  waterGlasses: number;
  /** Total ml when set (e.g. from calculator); else infer from glasses × 250 */
  waterMl?: number;
  date: string;
}

export interface CachedMessage {
  id: string;
  conversationId: string;
  text: string;
  sent: boolean;
  timestamp: number;
}

/**
 * Meal log cache key scoped by user AND active plan so that switching plans
 * automatically invalidates stale data from the previous plan without any
 * explicit cache-clearing call.
 *
 * Format: meal_log_<userId>_<planId>_<date>
 * Legacy fall-back (no planId): meal_log_<userId>_<date>
 * Original fall-back (no userId): meal_log_<date>
 */
function mealLogKey(date: string, userId?: string | null, planId?: number | null): string {
  if (userId && planId != null) return `meal_log_${userId}_${planId}_${date}`;
  if (userId) return `meal_log_${userId}_${date}`;
  return `meal_log_${date}`;
}

export const cacheMealLog = async (
  date: string,
  mealLog: DailyMealLog,
  userId?: string | null,
  planId?: number | null,
) => {
  try {
    const key = mealLogKey(date, userId, planId);
    await AsyncStorage.setItem(key, JSON.stringify(mealLog)).catch((error) => {
      console.warn('[OfflineService] Error in AsyncStorage.setItem:', error);
    });
  } catch (error) {
    console.warn('[OfflineService] Error caching meal log:', error);
  }
};

export const getCachedMealLog = async (
  date: string,
  userId?: string | null,
  planId?: number | null,
): Promise<DailyMealLog | null> => {
  try {
    const key = mealLogKey(date, userId, planId);
    const cached = await AsyncStorage.getItem(key).catch(() => null);
    if (!cached) return null;
    try {
      return JSON.parse(cached);
    } catch (parseError) {
      console.warn('[OfflineService] Failed to parse meal log:', parseError);
      return null;
    }
  } catch (error) {
    console.warn('[OfflineService] Error retrieving cached meal log:', error);
    return null;
  }
};

// Workout caching
export const cacheWorkout = async (workout: CachedWorkout) => {
  try {
    await AsyncStorage.setItem('workout_cache_active', JSON.stringify(workout)).catch((error) => {
      console.warn('[OfflineService] Error in AsyncStorage.setItem:', error);
    });
  } catch (error) {
    console.warn('[OfflineService] Error caching active workout:', error);
  }
};

export const getCachedWorkout = async (): Promise<CachedWorkout | null> => {
  try {
    const cached = await AsyncStorage.getItem('workout_cache_active').catch(() => null);
    if (!cached) return null;
    try {
      return JSON.parse(cached);
    } catch (parseError) {
      console.warn('[OfflineService] Failed to parse active workout:', parseError);
      return null;
    }
  } catch (error) {
    console.warn('[OfflineService] Error retrieving cached workout:', error);
    return null;
  }
};

export const cacheWorkoutHistory = async (sessions: CachedWorkout[]) => {
  try {
    await AsyncStorage.setItem('workout_cache_history', JSON.stringify(sessions)).catch((error) => {
      console.warn('[OfflineService] Error in AsyncStorage.setItem:', error);
    });
  } catch (error) {
    console.warn('[OfflineService] Error caching workout history:', error);
  }
};

export const getCachedWorkoutHistory = async (): Promise<CachedWorkout[]> => {
  try {
    const cached = await AsyncStorage.getItem('workout_cache_history').catch(() => null);
    if (!cached) return [];
    try {
      return JSON.parse(cached);
    } catch (parseError) {
      console.warn('[OfflineService] Failed to parse workout history:', parseError);
      return [];
    }
  } catch (error) {
    console.warn('[OfflineService] Error retrieving cached workout history:', error);
    return [];
  }
};

// Message caching
export const cacheMessages = async (date: string, messages: CachedMessage[]) => {
  try {
    const key = `messages_cache_${date}`;
    await AsyncStorage.setItem(key, JSON.stringify(messages)).catch((error) => {
      console.warn('[OfflineService] Error in AsyncStorage.setItem:', error);
    });
  } catch (error) {
    console.warn('[OfflineService] Error caching messages:', error);
  }
};

export const getCachedMessages = async (date: string): Promise<CachedMessage[]> => {
  try {
    const key = `messages_cache_${date}`;
    const cached = await AsyncStorage.getItem(key).catch(() => null);
    if (!cached) return [];
    try {
      return JSON.parse(cached);
    } catch (parseError) {
      console.warn('[OfflineService] Failed to parse messages:', parseError);
      return [];
    }
  } catch (error) {
    console.warn('[OfflineService] Error retrieving cached messages:', error);
    return [];
  }
};

// Generic API response caching (for GET requests)
export const cacheResponse = async (endpoint: string, data: any) => {
  try {
    const key = `api_cache_${endpoint}`;
    await AsyncStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() })).catch((error) => {
      console.warn('[OfflineService] Error in AsyncStorage.setItem:', error);
    });
  } catch (error) {
    console.warn('[OfflineService] Error caching response:', error);
  }
};

export const getCachedResponse = async (endpoint: string): Promise<any | null> => {
  try {
    const key = `api_cache_${endpoint}`;
    const cached = await AsyncStorage.getItem(key).catch(() => null);
    if (!cached) return null;
    try {
      const { data } = JSON.parse(cached);
      return data;
    } catch (parseError) {
      console.warn('[OfflineService] Failed to parse cached response:', parseError);
      return null;
    }
  } catch (error) {
    console.warn('[OfflineService] Error retrieving cached response:', error);
    return null;
  }
};

/**
 * Invalidate cached GET responses by endpoint prefix.
 *
 * Use this after any write (POST/PATCH/DELETE) that mutates server state we
 * also cache (e.g. workout/diet plan delete & regenerate). Otherwise the
 * offline interceptor in api.ts will happily resurrect the deleted plan from
 * the cache the next time the device is briefly offline.
 *
 * Accepts a single endpoint or an array. Matches by `startsWith` so passing
 * "/workout" clears /workout/active, /workout/history, etc.
 */
export const invalidateCachedResponse = async (endpoints: string | string[]) => {
  try {
    const list = Array.isArray(endpoints) ? endpoints : [endpoints];
    const keys = await AsyncStorage.getAllKeys().catch(() => []);
    if (!keys || keys.length === 0) return;
    const targets = keys.filter((key) => {
      if (!key.startsWith('api_cache_')) return false;
      const ep = key.slice('api_cache_'.length);
      return list.some((p) => ep.startsWith(p));
    });
    if (targets.length === 0) return;
    await Promise.all(
      targets.map((key) =>
        AsyncStorage.removeItem(key).catch((error) => {
          console.warn('[OfflineService] Error invalidating cache key:', error);
        }),
      ),
    );
  } catch (error) {
    console.warn('[OfflineService] Error invalidating cached response:', error);
  }
};

// Clear all offline cache
export const clearAllCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys().catch(() => []);
    if (!keys || keys.length === 0) return;

    const cacheKeys = keys.filter(
      (key) =>
        key.startsWith('meal_log_') ||    // covers both meal_log_<date> and meal_log_<uid>_<date>
        key.startsWith('workout_cache_') ||
        key.startsWith('messages_cache_') ||
        key.startsWith('api_cache_')
    );

    if (cacheKeys.length > 0) {
      await Promise.all(
        cacheKeys.map((key) => AsyncStorage.removeItem(key).catch((error) => {
          console.warn('[OfflineService] Error removing cache key:', error);
        }))
      );
    }
  } catch (error) {
    console.warn('[OfflineService] Error clearing cache:', error);
  }
};
