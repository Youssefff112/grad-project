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
  date: string;
}

export interface CachedMessage {
  id: string;
  conversationId: string;
  text: string;
  sent: boolean;
  timestamp: number;
}

// Meal caching
export const cacheMealLog = async (date: string, mealLog: DailyMealLog) => {
  try {
    const key = `meal_log_${date}`;
    await AsyncStorage.setItem(key, JSON.stringify(mealLog));
  } catch (error) {
    console.error('Error caching meal log:', error);
  }
};

export const getCachedMealLog = async (date: string): Promise<DailyMealLog | null> => {
  try {
    const key = `meal_log_${date}`;
    const cached = await AsyncStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Error retrieving cached meal log:', error);
    return null;
  }
};

// Workout caching
export const cacheWorkout = async (workout: CachedWorkout) => {
  try {
    await AsyncStorage.setItem('workout_cache_active', JSON.stringify(workout));
  } catch (error) {
    console.error('Error caching active workout:', error);
  }
};

export const getCachedWorkout = async (): Promise<CachedWorkout | null> => {
  try {
    const cached = await AsyncStorage.getItem('workout_cache_active');
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Error retrieving cached workout:', error);
    return null;
  }
};

export const cacheWorkoutHistory = async (sessions: CachedWorkout[]) => {
  try {
    await AsyncStorage.setItem('workout_cache_history', JSON.stringify(sessions));
  } catch (error) {
    console.error('Error caching workout history:', error);
  }
};

export const getCachedWorkoutHistory = async (): Promise<CachedWorkout[]> => {
  try {
    const cached = await AsyncStorage.getItem('workout_cache_history');
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Error retrieving cached workout history:', error);
    return [];
  }
};

// Message caching
export const cacheMessages = async (date: string, messages: CachedMessage[]) => {
  try {
    const key = `messages_cache_${date}`;
    await AsyncStorage.setItem(key, JSON.stringify(messages));
  } catch (error) {
    console.error('Error caching messages:', error);
  }
};

export const getCachedMessages = async (date: string): Promise<CachedMessage[]> => {
  try {
    const key = `messages_cache_${date}`;
    const cached = await AsyncStorage.getItem(key);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Error retrieving cached messages:', error);
    return [];
  }
};

// Generic API response caching (for GET requests)
export const cacheResponse = async (endpoint: string, data: any) => {
  try {
    const key = `api_cache_${endpoint}`;
    await AsyncStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (error) {
    console.error('Error caching response:', error);
  }
};

export const getCachedResponse = async (endpoint: string): Promise<any | null> => {
  try {
    const key = `api_cache_${endpoint}`;
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      const { data } = JSON.parse(cached);
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving cached response:', error);
    return null;
  }
};

// Clear all offline cache
export const clearAllCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(
      (key) =>
        key.startsWith('meal_log_') ||
        key.startsWith('workout_cache_') ||
        key.startsWith('messages_cache_') ||
        key.startsWith('api_cache_')
    );
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};
