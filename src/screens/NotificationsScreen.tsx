import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useFocusEffect } from '@react-navigation/native';
import { getNotifications, markNotificationAsRead, AppNotification } from '../services/notification.service';

export const NotificationsScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  // We use totalUnread from context for Chat, but we can compute internal Notification unreads here too
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const bgColor = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  useFocusEffect(
    React.useCallback(() => {
      const fetchNotifications = async () => {
        try {
          const apiNotifications = await getNotifications().catch(e => {
            console.log('Notifications API not available, gracefully catching', e);
            return [];
          });
          setNotifications(apiNotifications);
        } catch (error) {
          console.log('Error fetching notifications caught gracefully', error);
          setNotifications([]);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchNotifications();
    }, [])
  );

  const filteredNotifications = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;
  // Calculate specific push notification unread counts
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: number) => {
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    // Backend sync
    await markNotificationAsRead(id);
  };

  const handleClearAll = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    
    // Background sync all
    for (const id of unreadIds) {
      await markNotificationAsRead(id);
    }
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View
        style={[
          tw`flex-row items-center justify-between px-5 py-4`,
          { borderBottomWidth: 1, borderColor: cardBorder },
        ]}
      >
        <View>
          <Text style={[tw`text-sm font-semibold`, { color: accent }]}>Notifications</Text>
          <Text style={[tw`text-2xl font-black mt-1`, { color: textPrimary }]}>Activity</Text>
        </View>
        <TouchableOpacity onPress={handleClearAll}>
          <MaterialIcons name="done-all" size={24} color={accent} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={tw`px-5 py-4 flex-row gap-2`}>
        {['all', 'unread'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setFilter(tab as any)}
            style={[
              tw`px-4 py-2 rounded-full`,
              {
                backgroundColor: filter === tab ? accent : isDark ? '#1e293b' : '#f1f5f9' },
            ]}
          >
            <Text
              style={[
                tw`text-xs font-bold capitalize`,
                { color: filter === tab ? '#ffffff' : textSecondary },
              ]}
            >
              {tab} {tab === 'unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications List */}
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-5 pb-10`} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={tw`py-16 items-center justify-center`}>
            <Text style={[tw`text-sm font-semibold mt-4`, { color: textMuted }]}>Loading alerts...</Text>
          </View>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification, index) => (
            <TouchableOpacity
              key={notification.id}
              onPress={() => handleMarkAsRead(notification.id)}
              style={[
                tw`flex-row items-start gap-3 p-4 rounded-2xl mb-3`,
                {
                  backgroundColor: notification.read ? isDark ? '#1e293b' : '#f1f5f9' : cardBg,
                  borderWidth: 1,
                  borderColor: notification.read ? 'transparent' : accent + '40' },
              ]}
            >
              {/* Icon */}
              <View
                style={[
                  tw`w-12 h-12 rounded-full items-center justify-center flex-shrink-0`,
                  { backgroundColor: notification.color + '20' },
                ]}
              >
                <MaterialIcons name={notification.icon as any} size={24} color={notification.color} />
              </View>

              {/* Content */}
              <View style={tw`flex-1`}>
                <View style={tw`flex-row items-center justify-between mb-1`}>
                  <Text style={[tw`font-bold text-base`, { color: textPrimary }]}>{notification.title}</Text>
                  <Text style={[tw`text-xs`, { color: textMuted }]}>
                    {notification.scheduledAt ? new Date(notification.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </Text>
                </View>
                <Text style={[tw`text-sm`, { color: textSecondary }]}>{notification.message}</Text>
              </View>

              {/* Read indicator */}
              {!notification.read && (
                <View
                  style={[
                    tw`w-3 h-3 rounded-full flex-shrink-0 mt-1.5`,
                    { backgroundColor: accent },
                  ]}
                />
              )}
            </TouchableOpacity>
          ))
        ) : (
          <View style={tw`items-center justify-center py-16`}>
            <MaterialIcons name="notifications-off" size={48} color={textMuted} />
            <Text style={[tw`text-base font-semibold mt-4`, { color: textPrimary }]}>
              No notifications
            </Text>
            <Text style={[tw`text-sm mt-2`, { color: textMuted }]}>
              {filter === 'unread' ? 'You\'re all caught up!' : 'Check back soon'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
