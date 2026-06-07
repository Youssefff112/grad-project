import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import * as coachService from '../../services/coachService';

export const CoachEarningsScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const [analytics, setAnalytics] = useState<coachService.CoachAnalytics | null>(null);
  const [clients, setClients] = useState<coachService.CoachClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';

  const loadData = useCallback(async () => {
    try {
      const [analyticsRes, clientsRes] = await Promise.all([
        coachService.getCoachAnalytics(),
        coachService.getMyClients(),
      ]);
      setAnalytics(analyticsRes.analytics);
      setClients(clientsRes.clients || []);
    } catch {
      // keep previous state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const monthlyRevenue = analytics?.monthlyRevenue ?? 0;
  const totalClients = analytics?.totalClients ?? 0;
  const activeClients = analytics?.activeClients ?? 0;
  const totalSessions = analytics?.totalSessions ?? 0;
  const avgPerClient = totalClients > 0 ? (monthlyRevenue / totalClients).toFixed(0) : '0';

  if (loading) {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
        <ActivityIndicator size="large" color={accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center px-4 py-3`, { borderBottomWidth: 1, borderColor: borderColor, backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-1 mr-3`}>
          <MaterialIcons name="arrow-back" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold flex-1`, { color: textPrimary }]}>Earnings</Text>
        <TouchableOpacity onPress={onRefresh} style={tw`p-1`}>
          <MaterialIcons name="refresh" size={22} color={accent} />
        </TouchableOpacity>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled"
        style={tw`flex-1`}
        contentContainerStyle={tw`px-4 py-4 pb-8`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
      >
        {/* Main stat */}
        <View style={[tw`p-6 rounded-2xl mb-4`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}>
          <Text style={[tw`text-xs font-bold uppercase tracking-wider mb-1`, { color: subtextColor }]}>Monthly Revenue</Text>
          <Text style={[tw`text-5xl font-black`, { color: accent }]}>
            ${monthlyRevenue > 0 ? monthlyRevenue.toLocaleString() : '0'}
          </Text>
          {monthlyRevenue === 0 && (
            <Text style={[tw`text-sm mt-2`, { color: subtextColor }]}>
              Revenue data will appear as clients subscribe to your plans
            </Text>
          )}
        </View>

        {/* Summary stats */}
        <View style={tw`flex-row gap-3 mb-6`}>
          {[
            { label: 'Sessions', value: String(totalSessions), icon: 'event' as const },
            { label: 'Active Clients', value: String(activeClients), icon: 'group' as const },
            { label: 'Avg/Client', value: `$${avgPerClient}`, icon: 'payments' as const },
          ].map(s => (
            <View key={s.label} style={[tw`flex-1 p-3 rounded-xl items-center`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
              <MaterialIcons name={s.icon} size={18} color={accent} style={tw`mb-1`} />
              <Text style={[tw`text-lg font-black`, { color: textPrimary }]}>{s.value}</Text>
              <Text style={[tw`text-xs text-center`, { color: subtextColor }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Client breakdown */}
        <Text style={[tw`text-sm font-bold mb-3`, { color: textPrimary }]}>Per Client Breakdown</Text>

        {clients.length === 0 ? (
          <View style={[tw`p-8 rounded-xl items-center`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
            <MaterialIcons name="people-outline" size={36} color={isDark ? '#334155' : '#cbd5e1'} />
            <Text style={[tw`text-sm mt-2 font-bold`, { color: subtextColor }]}>No clients yet</Text>
            <Text style={[tw`text-xs mt-1 text-center`, { color: subtextColor }]}>
              Clients who subscribe to your plans will appear here
            </Text>
          </View>
        ) : (
          clients.map((client, i) => {
            const firstName = client.User?.firstName || '';
            const lastName = client.User?.lastName || '';
            const name = `${firstName} ${lastName}`.trim() || client.User?.email || `Client #${client.userId}`;
            const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || '?';
            return (
              <View
                key={client.id}
                style={[tw`flex-row items-center gap-3 p-4 rounded-xl mb-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}
              >
                <View style={[tw`w-10 h-10 rounded-full items-center justify-center flex-shrink-0`, { backgroundColor: accent + '20' }]}>
                  <Text style={[tw`text-sm font-black`, { color: accent }]}>{initials}</Text>
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{name}</Text>
                  <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>
                    {client.status ? client.status.charAt(0).toUpperCase() + client.status.slice(1) : 'Active'}
                    {client.lastActivity ? ` · Last active ${new Date(client.lastActivity).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                  </Text>
                </View>
                <View style={[tw`px-2 py-1 rounded-full`, { backgroundColor: '#10b98118' }]}>
                  <Text style={[tw`text-xs font-bold`, { color: '#10b981' }]}>Active</Text>
                </View>
              </View>
            );
          })
        )}

        {/* Empty state for revenue */}
        {monthlyRevenue === 0 && clients.length > 0 && (
          <View style={[tw`mt-4 p-4 rounded-xl`, { backgroundColor: accent + '0d', borderWidth: 1, borderColor: accent + '20' }]}>
            <View style={tw`flex-row items-start gap-2`}>
              <MaterialIcons name="info-outline" size={18} color={accent} style={tw`mt-0.5`} />
              <Text style={[tw`text-xs flex-1 leading-relaxed`, { color: subtextColor }]}>
                Revenue tracking requires subscription billing to be configured on the backend. Session and client counts are live from your profile.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
