import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';
import { CoachBottomNav } from '../../components/coach/CoachBottomNav';

const MOCK_RECENT_CLIENTS = [
  { id: '1', name: 'Alex Johnson', plan: 'Weight Loss', lastCheckin: '2h ago', progress: 78, status: 'active' },
  { id: '2', name: 'Maria Garcia', plan: 'Strength Training', lastCheckin: '5h ago', progress: 92, status: 'active' },
  { id: '3', name: 'James Wilson', plan: 'Muscle Gain', lastCheckin: '1d ago', progress: 65, status: 'active' },
  { id: '4', name: 'Sarah Chen', plan: 'Cardio & Endurance', lastCheckin: '2d ago', progress: 55, status: 'pending' },
];

const MOCK_UPCOMING_SESSIONS = [
  { id: '1', clientName: 'Alex Johnson', time: '10:00 AM', type: 'Check-in Call', today: true },
  { id: '2', clientName: 'Maria Garcia', time: '2:30 PM', type: 'Plan Review', today: true },
  { id: '3', clientName: 'James Wilson', time: 'Tomorrow 9:00 AM', type: 'Assessment', today: false },
];

export const CoachCommandCenterScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { fullName } = useUser();
  const { totalUnread } = useNotifications();
  const firstName = fullName?.split(' ')[0] || 'Coach';

  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';

  const stats = [
    { label: 'Active Clients', value: '12', icon: 'group' as const, color: accent },
    { label: 'Sessions Today', value: '3', icon: 'event' as const, color: '#10b981' },
    { label: 'Unread', value: String(totalUnread || 5), icon: 'chat-bubble' as const, color: '#f59e0b' },
    { label: 'This Month', value: '$1,240', icon: 'attach-money' as const, color: '#8b5cf6' },
  ];

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      {/* Header */}
      <View style={[tw`flex-row items-center p-4 pb-2 justify-between z-10`, {
        backgroundColor: isDark ? '#0a0a12' : '#f8f7f5',
        borderBottomWidth: 1,
        borderColor: borderColor,
      }]}>
        <TouchableOpacity style={tw`relative p-2`} onPress={() => navigation.navigate('Notifications')}>
          <MaterialIcons name="notifications" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
          {!!totalUnread && (
            <View style={[tw`absolute top-1 right-0 rounded-full items-center justify-center h-5 w-5`, { backgroundColor: accent }]}>
              <Text style={tw`text-white text-xs font-bold`}>{totalUnread > 99 ? '99+' : totalUnread}</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold tracking-tighter`, { color: accent }]}>VERTEX Pro</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CoachProfileEdit')} style={tw`flex size-10 items-center justify-center`}>
          <MaterialIcons name="person" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-28`}>
        {/* Greeting */}
        <View style={tw`px-4 pt-6 pb-2`}>
          <Text style={[tw`text-sm font-medium`, { color: subtextColor }]}>Welcome back,</Text>
          <Text style={[tw`text-2xl font-bold`, { color: textPrimary }]}>{firstName}</Text>
        </View>

        {/* Stats Row */}
        <View style={tw`px-4 pt-2`}>
          <View style={tw`flex-row flex-wrap justify-between gap-y-3`}>
            {stats.map(stat => (
              <View
                key={stat.label}
                style={[tw`w-[48%] p-4 rounded-xl`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}
              >
                <View style={[tw`w-9 h-9 rounded-xl items-center justify-center mb-2`, { backgroundColor: stat.color + '18' }]}>
                  <MaterialIcons name={stat.icon} size={18} color={stat.color} />
                </View>
                <Text style={[tw`text-xl font-black`, { color: textPrimary }]}>{stat.value}</Text>
                <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={tw`px-4 mt-8`}>
          <Text style={[tw`text-2xl font-bold leading-tight tracking-tight mb-4`, { color: textPrimary }]}>Quick Actions</Text>
          <View style={tw`flex-row gap-3`}>
            <TouchableOpacity
              onPress={() => navigation.navigate('CoachClientList')}
              style={[tw`flex-1 rounded-xl p-4`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}
            >
              <MaterialIcons name="person-add" size={26} color={accent} style={tw`mb-2`} />
              <Text style={[tw`font-bold text-sm`, { color: textPrimary }]}>Add Client</Text>
              <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>Manage roster</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('CoachWorkoutPlan')}
              style={[tw`flex-1 rounded-xl p-4`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}
            >
              <MaterialIcons name="fitness-center" size={26} color={accent} style={tw`mb-2`} />
              <Text style={[tw`font-bold text-sm`, { color: textPrimary }]}>New Workout</Text>
              <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>Create program</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('CoachMealPlan')}
              style={[tw`flex-1 rounded-xl p-4`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}
            >
              <MaterialIcons name="restaurant-menu" size={26} color={accent} style={tw`mb-2`} />
              <Text style={[tw`font-bold text-sm`, { color: textPrimary }]}>Meal Plan</Text>
              <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>For client</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Sessions */}
        <View style={tw`px-4 mt-8`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={[tw`text-2xl font-bold leading-tight tracking-tight`, { color: textPrimary }]}>Today's Sessions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CoachSchedule')}>
              <Text style={[tw`text-sm font-bold`, { color: accent }]}>View All</Text>
            </TouchableOpacity>
          </View>
          {MOCK_UPCOMING_SESSIONS.filter(s => s.today).map(session => (
            <View
              key={session.id}
              style={[tw`flex-row items-center gap-4 p-4 rounded-xl mb-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}
            >
              <View style={[tw`w-10 h-10 rounded-xl items-center justify-center flex-shrink-0`, { backgroundColor: accent + '14' }]}>
                <MaterialIcons name="event" size={20} color={accent} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{session.clientName}</Text>
                <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>{session.type}</Text>
              </View>
              <View style={[tw`px-2.5 py-1 rounded-full`, { backgroundColor: accent + '14' }]}>
                <Text style={[tw`text-xs font-bold`, { color: accent }]}>{session.time}</Text>
              </View>
            </View>
          ))}
          {MOCK_UPCOMING_SESSIONS.filter(s => !s.today).map(session => (
            <View
              key={session.id}
              style={[tw`flex-row items-center gap-4 p-4 rounded-xl mb-3 opacity-70`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}
            >
              <View style={[tw`w-10 h-10 rounded-xl items-center justify-center flex-shrink-0`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                <MaterialIcons name="event" size={20} color={subtextColor} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{session.clientName}</Text>
                <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>{session.type}</Text>
              </View>
              <Text style={[tw`text-xs font-semibold`, { color: subtextColor }]}>{session.time}</Text>
            </View>
          ))}
        </View>

        {/* Recent Clients */}
        <View style={tw`px-4 mt-8`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={[tw`text-2xl font-bold leading-tight tracking-tight`, { color: textPrimary }]}>Recent Clients</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CoachClientList')}>
              <Text style={[tw`text-sm font-bold`, { color: accent }]}>View All</Text>
            </TouchableOpacity>
          </View>
          {MOCK_RECENT_CLIENTS.map(client => (
            <TouchableOpacity
              key={client.id}
              onPress={() => navigation.navigate('CoachClientDetail', { clientId: client.id, clientName: client.name })}
              style={[tw`flex-row items-center gap-3 p-4 rounded-xl mb-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}
            >
              <View style={[tw`w-11 h-11 rounded-full items-center justify-center flex-shrink-0`, { backgroundColor: accent + '20' }]}>
                <MaterialIcons name="person" size={22} color={accent} />
              </View>
              <View style={tw`flex-1`}>
                <View style={tw`flex-row items-center justify-between mb-1`}>
                  <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{client.name}</Text>
                  {client.status === 'pending' && (
                    <View style={[tw`px-2 py-0.5 rounded-full`, { backgroundColor: '#f59e0b20' }]}>
                      <Text style={tw`text-xs font-bold text-yellow-500`}>Pending</Text>
                    </View>
                  )}
                </View>
                <Text style={[tw`text-xs`, { color: subtextColor }]}>{client.plan}</Text>
                <View style={tw`flex-row items-center gap-2 mt-2`}>
                  <View style={[tw`flex-1 h-1 rounded-full overflow-hidden`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                    <View style={{ width: `${client.progress}%`, height: '100%', borderRadius: 4, backgroundColor: client.progress >= 80 ? '#10b981' : accent }} />
                  </View>
                  <Text style={[tw`text-xs font-bold w-8 text-right`, { color: subtextColor }]}>{client.progress}%</Text>
                </View>
              </View>
              <View style={tw`items-end`}>
                <Text style={[tw`text-xs`, { color: subtextColor }]}>{client.lastCheckin}</Text>
                <MaterialIcons name="chevron-right" size={20} color={subtextColor} style={tw`mt-1`} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Hub */}
        <View style={tw`px-4 mt-8 mb-4`}>
          <Text style={[tw`text-2xl font-bold leading-tight tracking-tight mb-4`, { color: textPrimary }]}>Manage</Text>
          <View style={tw`flex-row flex-wrap gap-3`}>
            {[
              { label: 'Earnings', icon: 'attach-money' as const, route: 'CoachEarnings' },
              { label: 'Reviews', icon: 'star' as const, route: 'CoachReviewManagement' },
              { label: 'Templates', icon: 'inventory' as const, route: 'CoachProgramTemplates' },
              { label: 'Messages', icon: 'chat-bubble' as const, route: 'Messages' },
            ].map(item => (
              <TouchableOpacity
                key={item.label}
                onPress={() => navigation.navigate(item.route)}
                style={[tw`flex-1 min-w-28 rounded-xl p-4 items-center`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}
              >
                <View style={[tw`w-10 h-10 rounded-xl items-center justify-center mb-2`, { backgroundColor: accent + '14' }]}>
                  <MaterialIcons name={item.icon} size={20} color={accent} />
                </View>
                <Text style={[tw`text-xs font-bold text-center`, { color: textPrimary }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <CoachBottomNav activeId="dashboard" navigation={navigation} totalUnread={totalUnread} />
    </SafeAreaView>
  );
};
