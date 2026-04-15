import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  icon: string;
  color: string;
  read: boolean;
  type: 'message' | 'workout' | 'meal' | 'achievement' | 'system';
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Great Workout!',
    message: 'You completed your Push Day workout. +250 streak points!',
    timestamp: '5m ago',
    icon: 'fitness-center',
    color: '#f87171',
    read: false,
    type: 'workout' },
  {
    id: '2',
    title: 'Meal Logged',
    message: 'Your lunch has been logged. Protein goals: 45/160g',
    timestamp: '2h ago',
    icon: 'restaurant',
    color: '#4ade80',
    read: false,
    type: 'meal' },
  {
    id: '3',
    title: 'New Message',
    message: 'Coach Sarah: Keep up the great form on those squats!',
    timestamp: '4h ago',
    icon: 'chat-bubble',
    color: '#3b82f6',
    read: true,
    type: 'message' },
  {
    id: '4',
    title: 'Achievement Unlocked!',
    message: '7-Day Streak! You\'re on fire 🔥',
    timestamp: '1d ago',
    icon: 'local-fire-department',
    color: '#facc15',
    read: true,
    type: 'achievement' },
  {
    id: '5',
    title: 'System Update',
    message: 'New exercises added to library. Check them out!',
    timestamp: '2d ago',
    icon: 'notifications',
    color: '#8b5cf6',
    read: true,
    type: 'system' },
];

export const NotificationsScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { totalUnread } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const bgColor = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  const filteredNotifications = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleClearAll = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
              {tab} {tab === 'unread' && totalUnread > 0 ? `(${totalUnread})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications List */}
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-5 pb-10`} showsVerticalScrollIndicator={false}>
        {filteredNotifications.length > 0 ? (
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
                  <Text style={[tw`text-xs`, { color: textMuted }]}>{notification.timestamp}</Text>
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
