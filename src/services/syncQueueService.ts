import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

export type OperationType = 'meal_log' | 'message' | 'workout_complete' | 'notification_read';

export interface QueuedOperation {
  id: string;
  type: OperationType;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH';
  payload: Record<string, any>;
  timestamp: number;
  priority: 1 | 2 | 3; // 1 = high (sync first)
  retries: number;
  maxRetries: number;
}

const QUEUE_KEY = 'sync_queue';

// Add operation to queue
export const enqueueOperation = async (
  type: OperationType,
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH',
  payload: Record<string, any>,
  priority: 1 | 2 | 3 = 2
): Promise<QueuedOperation> => {
  try {
    const operation: QueuedOperation = {
      id: uuidv4().toString(),
      type,
      endpoint,
      method,
      payload,
      timestamp: Date.now(),
      priority,
      retries: 0,
      maxRetries: 3,
    };

    const queue = await getQueue();
    queue.push(operation);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)).catch((error) => {
      console.warn('[SyncQueue] Error in AsyncStorage.setItem:', error);
    });

    console.log(`[SyncQueue] Queued operation: ${operation.id} (${type})`);
    return operation;
  } catch (error) {
    console.warn('[SyncQueue] Error enqueueing operation:', error);
    throw error;
  }
};

// Get all queued operations sorted by priority
export const getQueue = async (): Promise<QueuedOperation[]> => {
  try {
    const queued = await AsyncStorage.getItem(QUEUE_KEY).catch(() => null);
    if (!queued) {
      return [];
    }

    try {
      const operations = JSON.parse(queued);
      // Sort by priority (1 first), then by timestamp
      return operations.sort((a: QueuedOperation, b: QueuedOperation) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.timestamp - b.timestamp;
      });
    } catch (parseError) {
      console.warn('[SyncQueue] Failed to parse queue:', parseError);
      return [];
    }
  } catch (error) {
    console.warn('[SyncQueue] Error retrieving queue:', error);
    return [];
  }
};

// Get queue size
export const getQueueSize = async (): Promise<number> => {
  const queue = await getQueue();
  return queue.length;
};

// Remove operation from queue
export const removeFromQueue = async (operationId: string) => {
  try {
    const queue = await getQueue();
    const filtered = queue.filter((op) => op.id !== operationId);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered)).catch((error) => {
      console.warn('[SyncQueue] Error in AsyncStorage.setItem:', error);
    });
    console.log(`[SyncQueue] Removed operation: ${operationId}`);
  } catch (error) {
    console.warn('[SyncQueue] Error removing from queue:', error);
  }
};

// Increment retries for an operation
export const incrementRetry = async (operationId: string) => {
  try {
    const queue = await getQueue();
    const operation = queue.find((op) => op.id === operationId);
    if (operation) {
      operation.retries += 1;
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)).catch((error) => {
        console.warn('[SyncQueue] Error in AsyncStorage.setItem:', error);
      });
      console.log(
        `[SyncQueue] Incremented retries for ${operationId}: ${operation.retries}/${operation.maxRetries}`
      );
    }
  } catch (error) {
    console.warn('[SyncQueue] Error incrementing retries:', error);
  }
};

// Check if operation has exceeded max retries
export const hasExceededMaxRetries = async (operationId: string): Promise<boolean> => {
  try {
    const queue = await getQueue();
    const operation = queue.find((op) => op.id === operationId);
    if (operation) {
      return operation.retries >= operation.maxRetries;
    }
    return false;
  } catch (error) {
    console.error('Error checking retries:', error);
    return false;
  }
};

// Clear entire queue
export const clearQueue = async () => {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY).catch((error) => {
      console.warn('[SyncQueue] Error in AsyncStorage.removeItem:', error);
    });
    console.log('[SyncQueue] Queue cleared');
  } catch (error) {
    console.warn('[SyncQueue] Error clearing queue:', error);
  }
};

// Execute queue - process all queued operations
export const executeQueue = async (apiClient: any): Promise<{ successful: number; failed: number }> => {
  const queue = await getQueue();
  let successCount = 0;
  let failureCount = 0;

  console.log(`[SyncQueue] Starting queue execution with ${queue.length} operations`);

  for (const operation of queue) {
    try {
      // Skip if max retries exceeded
      if (operation.retries >= operation.maxRetries) {
        console.log(`[SyncQueue] Skipping ${operation.id} - max retries exceeded`);
        failureCount++;
        continue;
      }

      // Execute the API call
      console.log(`[SyncQueue] Executing ${operation.type}: ${operation.endpoint}`);

      try {
        if (operation.method === 'POST') {
          await apiClient.post(operation.endpoint, operation.payload);
        } else if (operation.method === 'PUT') {
          await apiClient.put(operation.endpoint, operation.payload);
        } else if (operation.method === 'PATCH') {
          await apiClient.patch(operation.endpoint, operation.payload);
        }

        // Success - remove from queue
        await removeFromQueue(operation.id);
        successCount++;
        console.log(`[SyncQueue] Successfully synced ${operation.id}`);
      } catch (apiError) {
        // Failed - increment retries
        failureCount++;
        await incrementRetry(operation.id);
        console.error(`[SyncQueue] Failed to sync ${operation.id}:`, apiError);
      }
    } catch (error) {
      console.error(`[SyncQueue] Error processing operation:`, error);
      failureCount++;
    }
  }

  console.log(`[SyncQueue] Queue execution complete: ${successCount} successful, ${failureCount} failed`);
  return { successful: successCount, failed: failureCount };
};
