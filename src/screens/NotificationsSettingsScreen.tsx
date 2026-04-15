import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useUser, NotificationSettings } from '../context/UserContext';

export const NotificationsSettingsScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { notificationSettings, setNotificationSettings } = useUser();

  const toggle = (key: keyof NotificationSettings) => {
    setNotificationSettings({
      ...notificationSettings,
      [key]: !notificationSettings[key]
    });
  };

  const SECTIONS = [
    { title: 'Training', items: [
      { key: 'workoutReminders' as const, icon: 'fitness-center', label: 'Workout Reminders', desc: 'Daily workout notifications' },
      { key: 'formAlerts' as const, icon: 'videocam', label: 'Form Alerts', desc: 'Real-time form correction alerts' },
      { key: 'restTimer' as const, icon: 'timer', label: 'Rest Timer', desc: 'Notify when rest period ends' },
    ]},
    { title: 'Nutrition', items: [
      { key: 'mealReminders' as const, icon: 'restaurant', label: 'Meal Reminders', desc: 'Meal timing notifications' },
    ]},
    { title: 'Communication', items: [
      { key: 'coachMessages' as const, icon: 'smart-toy', label: 'AI Coach Messages', desc: 'Tips and insights from your AI coach' },
      { key: 'weeklyReport' as const, icon: 'assessment', label: 'Weekly Report', desc: 'Weekly progress summary' },
    ]},
  ];

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center p-4 justify-between`, { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-12 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold tracking-tight flex-1 text-center`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>Notifications</Text>
        <View style={tw`w-12`} />
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-8`}>
        {/* Banner */}
        <View style={[tw`mx-4 mt-6 p-4 rounded-2xl flex-row items-center gap-3`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}>
          <MaterialIcons name="info-outline" size={24} color={accent} />
          <View style={tw`flex-1`}>
            <Text style={[tw`font-bold text-sm`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              Smart Notifications
            </Text>
            <Text style={[tw`text-xs mt-1`, { color: '#94a3b8' }]}>
              We'll notify you at optimal times based on your activity
            </Text>
          </View>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.title} style={tw`px-4 mt-5`}>
            <Text style={[tw`text-xs font-bold uppercase tracking-widest mb-2 px-1`, { color: isDark ? '#64748b' : '#94a3b8' }]}>{section.title}</Text>
            <View style={[tw`rounded-2xl overflow-hidden`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => toggle(item.key as keyof NotificationSettings)}
                  style={[tw`flex-row items-center justify-between px-4 py-4`, i < section.items.length - 1 && { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}
                >
                  <View style={tw`flex-row items-center gap-3 flex-1`}>
                    <View style={[tw`w-9 h-9 rounded-lg items-center justify-center`, { backgroundColor: accent + '14' }]}>
                      <MaterialIcons name={item.icon as any} size={20} color={accent} />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={[tw`text-sm font-semibold`, { color: isDark ? '#e2e8f0' : '#334155' }]}>{item.label}</Text>
                      <Text style={[tw`text-xs mt-0.5`, { color: '#94a3b8' }]}>{item.desc}</Text>
                    </View>
                  </View>
                  <View style={[tw`w-12 h-7 rounded-full justify-center px-0.5`, { backgroundColor: notificationSettings[item.key as keyof NotificationSettings] ? accent : isDark ? '#334155' : '#cbd5e1' }]}>
                    <View style={[tw`w-6 h-6 rounded-full bg-white shadow`, { alignSelf: notificationSettings[item.key as keyof NotificationSettings] ? 'flex-end' : 'flex-start' }]} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};
