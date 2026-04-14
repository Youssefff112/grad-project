/**
 * Offline Functionality Tests
 * Tests for the offline-first architecture implementation
 */

import * as syncQueueService from '../services/syncQueueService';
import * as offlineService from '../services/offlineService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage for testing
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
  multiGet: jest.fn(),
  getAllKeys: jest.fn(),
}));

describe('Offline Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Sync Queue Service', () => {
    test('enqueueOperation should create a queued operation', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const result = await syncQueueService.enqueueOperation(
        'meal_log',
        '/api/meals/log',
        'POST',
        { mealId: 'lunch', logged: true },
        1
      );

      expect(result.type).toBe('meal_log');
      expect(result.endpoint).toBe('/api/meals/log');
      expect(result.method).toBe('POST');
      expect(result.priority).toBe(1);
      expect(result.retries).toBe(0);
      expect(result.maxRetries).toBe(3);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('getQueue should return sorted operations by priority', async () => {
      const mockQueue = [
        {
          id: '1',
          type: 'message' as const,
          endpoint: '/api/messages',
          method: 'POST' as const,
          payload: {},
          timestamp: 1000,
          priority: 2,
          retries: 0,
          maxRetries: 3,
        },
        {
          id: '2',
          type: 'meal_log' as const,
          endpoint: '/api/meals',
          method: 'POST' as const,
          payload: {},
          timestamp: 2000,
          priority: 1,
          retries: 0,
          maxRetries: 3,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockQueue)
      );

      const queue = await syncQueueService.getQueue();

      expect(queue.length).toBe(2);
      expect(queue[0].priority).toBe(1); // Higher priority first
      expect(queue[1].priority).toBe(2);
    });

    test('removeFromQueue should remove operation by ID', async () => {
      const mockQueue = [
        {
          id: 'op1',
          type: 'message' as const,
          endpoint: '/api/messages',
          method: 'POST' as const,
          payload: {},
          timestamp: 1000,
          priority: 2,
          retries: 0,
          maxRetries: 3,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockQueue)
      );
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await syncQueueService.removeFromQueue('op1');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'sync_queue',
        JSON.stringify([])
      );
    });

    test('incrementRetry should increase retry count', async () => {
      const mockQueue = [
        {
          id: 'op1',
          type: 'message' as const,
          endpoint: '/api/messages',
          method: 'POST' as const,
          payload: {},
          timestamp: 1000,
          priority: 2,
          retries: 0,
          maxRetries: 3,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockQueue)
      );
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await syncQueueService.incrementRetry('op1');

      const setCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const savedQueue = JSON.parse(setCall[1]);
      expect(savedQueue[0].retries).toBe(1);
    });

    test('hasExceededMaxRetries should return true when retries >= maxRetries', async () => {
      const mockQueue = [
        {
          id: 'op1',
          type: 'message' as const,
          endpoint: '/api/messages',
          method: 'POST' as const,
          payload: {},
          timestamp: 1000,
          priority: 2,
          retries: 3,
          maxRetries: 3,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockQueue)
      );

      const result = await syncQueueService.hasExceededMaxRetries('op1');
      expect(result).toBe(true);
    });

    test('clearQueue should remove all queued operations', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await syncQueueService.clearQueue();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('sync_queue');
    });
  });

  describe('Offline Service', () => {
    test('cacheMealLog should save meal log to AsyncStorage', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await offlineService.cacheMealLog('2026-04-14', {
        checkedMeals: { breakfast: true },
        waterGlasses: 5,
        date: '2026-04-14',
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'meal_log_2026-04-14',
        expect.stringContaining('breakfast')
      );
    });

    test('getCachedMealLog should retrieve meal log from AsyncStorage', async () => {
      const mockMealLog = {
        checkedMeals: { breakfast: true },
        waterGlasses: 5,
        date: '2026-04-14',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockMealLog)
      );

      const result = await offlineService.getCachedMealLog('2026-04-14');

      expect(result).toEqual(mockMealLog);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('meal_log_2026-04-14');
    });

    test('cacheWorkout should save workout to AsyncStorage', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const workout = {
        id: 'w1',
        date: '2026-04-14',
        type: 'Push Day',
        duration: '1h',
        score: '92%',
        exercises: 6,
      };

      await offlineService.cacheWorkout(workout);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'workout_cache_active',
        JSON.stringify(workout)
      );
    });

    test('getCachedWorkoutHistory should return workout history', async () => {
      const mockHistory = [
        {
          id: 'w1',
          date: '2026-04-14',
          type: 'Push',
          duration: '1h',
          score: '92%',
          exercises: 6,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockHistory)
      );

      const result = await offlineService.getCachedWorkoutHistory();

      expect(result).toEqual(mockHistory);
    });

    test('cacheMessages should save messages to AsyncStorage', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const messages = [
        {
          id: 'm1',
          conversationId: '1',
          text: 'Hello',
          sent: true,
          timestamp: 1000,
        },
      ];

      await offlineService.cacheMessages('2026-04-14', messages);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'messages_cache_2026-04-14',
        JSON.stringify(messages)
      );
    });

    test('cacheResponse should save API response with timestamp', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const mockData = { meals: [] };

      await offlineService.cacheResponse('/api/meals', mockData);

      const setCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const savedData = JSON.parse(setCall[1]);
      expect(savedData.data).toEqual(mockData);
      expect(savedData.timestamp).toBeDefined();
    });
  });

  describe('Offline Data Flow', () => {
    test('Complete meal logging offline flow', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      // 1. Cache meal log
      await offlineService.cacheMealLog('2026-04-14', {
        checkedMeals: { breakfast: true },
        waterGlasses: 3,
        date: '2026-04-14',
      });

      // 2. Queue operation
      const operation = await syncQueueService.enqueueOperation(
        'meal_log',
        '/api/meals/log',
        'POST',
        { mealId: 'breakfast', logged: true },
        1
      );

      expect(operation).toBeDefined();
      expect(operation.type).toBe('meal_log');
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2); // cache + queue
    });

    test('Queue operations should maintain priority order', async () => {
      const mockQueue = [
        {
          id: 'op1',
          type: 'message' as const,
          endpoint: '/api/messages',
          method: 'POST' as const,
          payload: {},
          timestamp: 3000,
          priority: 3,
          retries: 0,
          maxRetries: 3,
        },
        {
          id: 'op2',
          type: 'meal_log' as const,
          endpoint: '/api/meals',
          method: 'POST' as const,
          payload: {},
          timestamp: 2000,
          priority: 1,
          retries: 0,
          maxRetries: 3,
        },
        {
          id: 'op3',
          type: 'notification_read' as const,
          endpoint: '/api/notifications',
          method: 'PATCH' as const,
          payload: {},
          timestamp: 1000,
          priority: 2,
          retries: 0,
          maxRetries: 3,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockQueue)
      );

      const queue = await syncQueueService.getQueue();

      // Should be ordered by priority: 1, 2, 3
      expect(queue[0].priority).toBe(1);
      expect(queue[1].priority).toBe(2);
      expect(queue[2].priority).toBe(3);
    });
  });
});
