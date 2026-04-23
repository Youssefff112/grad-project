import { apiGet, apiPatch } from './api';

export interface AppNotification {
  id: number;
  userId: number;
  title: string;
  message: string;
  icon: string;
  color: string;
  type: 'message' | 'workout' | 'meal' | 'achievement' | 'system';
  read: boolean;
  scheduledAt: string;
  createdAt: string;
}

export const getNotifications = async (): Promise<AppNotification[]> => {
  const response: any = await apiGet('/notifications');
  return response.notifications || [];
};

export const markNotificationAsRead = async (id: number): Promise<boolean> => {
  try {
    await apiPatch(`/notifications/${id}/read`, {});
    return true;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return false;
  }
};

/**
 * Mark ALL unread notifications as read in one API call.
 * Use this instead of looping over each notification.
 */
export const markAllNotificationsRead = async (): Promise<boolean> => {
  try {
    await apiPatch('/notifications/mark-all-read', {});
    return true;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return false;
  }
};
