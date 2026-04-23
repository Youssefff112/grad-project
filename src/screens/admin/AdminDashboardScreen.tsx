import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { AdminBottomNav } from '../../components/admin/AdminBottomNav';
import * as adminService from '../../services/adminService';

const QUICK_ACTIONS = [
  { id: 'users', label: 'User Management', sub: 'Activate · Deactivate', icon: 'group' as const, route: 'AdminUsers' },
  { id: 'coaches', label: 'Coach Approvals', sub: 'Approve · Revoke', icon: 'verified-user' as const, route: 'AdminCoaches' },
  { id: 'subscriptions', label: 'Subscriptions', sub: 'View · Update status', icon: 'card-membership' as const, route: 'AdminSubscriptions' },
];

export const AdminDashboardScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { fullName, logout } = useUser();
  const firstName = fullName?.split(' ')[0] || 'Admin';

  const [stats, setStats] = useState<adminService.DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bgColor = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const subtextColor = isDark ? '#94a3b8' : '#64748b';

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { stats: data } = await adminService.getDashboardStats();
      setStats(data);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? '—', icon: 'people' as const, color: accent },
    { label: 'New This Week', value: stats?.newUsersThisWeek ?? '—', icon: 'person-add' as const, color: '#10b981' },
    { label: 'Total Exercises', value: stats?.totalExercises ?? '—', icon: 'fitness-center' as const, color: '#f59e0b' },
    { label: 'User Types', value: stats?.usersByType?.length ?? '—', icon: 'category' as const, color: '#8b5cf6' },
  ];

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[tw`flex-row items-center justify-between px-5 py-4`, { borderBottomWidth: 1, borderColor: borderColor, backgroundColor: bgColor }]}>
        <View>
          <Text style={[tw`text-xs font-bold uppercase tracking-widest`, { color: accent }]}>VERTEX Admin</Text>
          <Text style={[tw`text-xl font-black mt-0.5`, { color: textPrimary }]}>Hey {firstName}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          style={[tw`w-10 h-10 rounded-full items-center justify-center`, { backgroundColor: accent + '14' }]}
        >
          <MaterialIcons name="notifications" size={20} color={accent} />
        </TouchableOpacity>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-28`} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={tw`items-center justify-center py-20`}>
            <ActivityIndicator size="large" color={accent} />
            <Text style={[tw`text-sm mt-3`, { color: subtextColor }]}>Loading dashboard...</Text>
          </View>
        ) : error ? (
          <View style={tw`items-center justify-center py-20 px-6`}>
            <MaterialIcons name="error-outline" size={48} color="#ef4444" />
            <Text style={[tw`text-base font-bold mt-3 text-center`, { color: textPrimary }]}>{error}</Text>
            <TouchableOpacity
              onPress={loadStats}
              style={[tw`mt-4 px-6 py-3 rounded-xl`, { backgroundColor: accent }]}
            >
              <Text style={tw`text-white font-bold text-sm`}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Stats Grid */}
            <View style={tw`px-5 pt-5`}>
              <Text style={[tw`text-xs font-bold uppercase tracking-widest mb-3`, { color: subtextColor }]}>Platform Overview</Text>
              <View style={tw`flex-row flex-wrap gap-3`}>
                {statCards.map((card) => (
                  <View
                    key={card.label}
                    style={[tw`rounded-2xl p-4`, {
                      width: '47.5%',
                      backgroundColor: cardBg,
                      borderWidth: 1,
                      borderColor: borderColor,
                    }]}
                  >
                    <View style={[tw`w-9 h-9 rounded-xl items-center justify-center mb-3`, { backgroundColor: card.color + '18' }]}>
                      <MaterialIcons name={card.icon} size={18} color={card.color} />
                    </View>
                    <Text style={[tw`text-2xl font-black`, { color: textPrimary }]}>{String(card.value)}</Text>
                    <Text style={[tw`text-xs mt-0.5 font-medium`, { color: subtextColor }]}>{card.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* User type breakdown */}
            {stats?.usersByType && stats.usersByType.length > 0 && (
              <View style={tw`px-5 mt-5`}>
                <Text style={[tw`text-xs font-bold uppercase tracking-widest mb-3`, { color: subtextColor }]}>Users by Type</Text>
                <View style={[tw`rounded-2xl overflow-hidden`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
                  {stats.usersByType.map((item, i) => (
                    <View
                      key={item.userType}
                      style={[tw`flex-row items-center justify-between px-4 py-3.5`, {
                        borderBottomWidth: i < stats.usersByType.length - 1 ? 1 : 0,
                        borderColor: borderColor,
                      }]}
                    >
                      <View style={tw`flex-row items-center gap-3`}>
                        <View style={[tw`w-2 h-2 rounded-full`, { backgroundColor: accent }]} />
                        <Text style={[tw`text-sm font-semibold capitalize`, { color: textPrimary }]}>{item.userType}</Text>
                      </View>
                      <View style={[tw`px-3 py-0.5 rounded-full`, { backgroundColor: accent + '14' }]}>
                        <Text style={[tw`text-xs font-bold`, { color: accent }]}>{item.count}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Quick Actions */}
            <View style={tw`px-5 mt-6`}>
              <Text style={[tw`text-xs font-bold uppercase tracking-widest mb-3`, { color: subtextColor }]}>Management</Text>
              <View style={tw`gap-3`}>
                {QUICK_ACTIONS.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    onPress={() => navigation.navigate(action.route)}
                    style={[tw`flex-row items-center gap-4 p-4 rounded-2xl`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}
                  >
                    <View style={[tw`w-12 h-12 rounded-xl items-center justify-center flex-shrink-0`, { backgroundColor: accent + '14' }]}>
                      <MaterialIcons name={action.icon} size={24} color={accent} />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={[tw`text-base font-bold`, { color: textPrimary }]}>{action.label}</Text>
                      <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>{action.sub}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={22} color={subtextColor} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sign out */}
            <View style={tw`px-5 mt-6`}>
              <TouchableOpacity
                onPress={async () => { await logout(); navigation.navigate('Splash'); }}
                style={[tw`flex-row items-center justify-center gap-2 py-4 rounded-2xl`, { backgroundColor: '#ef444420', borderWidth: 1, borderColor: '#ef444430' }]}
              >
                <MaterialIcons name="logout" size={18} color="#ef4444" />
                <Text style={tw`text-red-500 font-bold text-sm`}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <AdminBottomNav activeId="dashboard" navigation={navigation} />
    </SafeAreaView>
  );
};
