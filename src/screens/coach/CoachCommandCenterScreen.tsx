import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';
import { CoachBottomNav } from '../../components/coach/CoachBottomNav';
import * as coachService from '../../services/coachService';

export const CoachCommandCenterScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { fullName } = useUser();
  const { totalUnread } = useNotifications();
  const firstName = fullName?.split(' ')[0] || 'Coach';

  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';

  type ClientRow = { id: string; userId: number; name: string; plan: string; lastCheckin: string; progress: number; status: string; };

  const [allClients, setAllClients] = useState<ClientRow[]>([]);
  const [analytics, setAnalytics] = useState<coachService.CoachAnalytics>({
    totalClients: 0,
    activeClients: 0,
    pendingClients: 0,
    monthlyRevenue: 0,
  });
  const [showQuickMessage, setShowQuickMessage] = useState(false);
  const [messagingClientId, setMessagingClientId] = useState<string | null>(null);

  type PlanType = 'workout' | 'meal';
  const [planPicker, setPlanPicker] = useState<{ type: PlanType; step: 'client' | 'method'; client: ClientRow | null } | null>(null);

  const openPlanPicker = (type: PlanType) =>
    setPlanPicker({ type, step: 'client', client: null });

  const selectPlanClient = (client: ClientRow) =>
    setPlanPicker((p) => p ? { ...p, step: 'method', client } : null);

  const launchPlan = (method: 'manual' | 'ai') => {
    if (!planPicker?.client) return;
    const { type, client } = planPicker;
    setPlanPicker(null);
    const params = { clientId: client.id, clientName: client.name, autoGenerate: method === 'ai' };
    navigation.navigate(type === 'workout' ? 'CoachWorkoutPlan' : 'CoachMealPlan', params);
  };

  const mapClient = (c: coachService.CoachClient): ClientRow => ({
    id: String(c.id),
    userId: c.userId,
    name: c.User ? `${c.User.firstName || ''} ${c.User.lastName || ''}`.trim() || `Client #${c.id}` : `Client #${c.id}`,
    plan: (c.goals as any)?.primary || 'General Fitness',
    lastCheckin: c.lastActivity || 'Recently',
    progress: 0,
    status: c.status || 'active',
  });

  const loadDashboard = useCallback(async () => {
    try {
      const [clientsRes, analyticsRes] = await Promise.allSettled([
        coachService.getMyClients(),
        coachService.getCoachAnalytics(),
      ]);
      if (clientsRes.status === 'fulfilled') {
        setAllClients(clientsRes.value.clients.map(mapClient));
      }
      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value.analytics);
      }
    } catch {
      // keep defaults on error
    }
  }, []);

  // Reload on every focus so newly assigned clients appear when navigating back
  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  // Derive the four most-recent clients and inactive ones
  const recentClients = allClients.slice(0, 4);

  const isInactive = (lastCheckin: string): boolean => {
    const d = new Date(lastCheckin);
    if (isNaN(d.getTime())) return false;
    return (Date.now() - d.getTime()) > 3 * 24 * 60 * 60 * 1000;
  };
  const inactiveClients = allClients.filter(
    (c) => c.status === 'active' && isInactive(c.lastCheckin),
  );

  const startChat = async (client: ClientRow) => {
    setMessagingClientId(client.id);
    try {
      setShowQuickMessage(false);
      navigation.navigate('Chat', {
        conversationName: client.name,
        receiverId: client.userId,
        conversationId: null,
      });
    } catch {
      setShowQuickMessage(false);
      navigation.navigate('Messages');
    } finally {
      setMessagingClientId(null);
    }
  };

  const stats = [
    { label: 'Active Clients', value: String(analytics.activeClients || recentClients.length), icon: 'group' as const, color: accent },
    { label: 'Pending', value: String(analytics.pendingClients || 0), icon: 'event' as const, color: '#10b981' },
    { label: 'Unread', value: String(totalUnread || 0), icon: 'chat-bubble' as const, color: '#f59e0b' },
    { label: 'This Month', value: analytics.monthlyRevenue ? `$${analytics.monthlyRevenue}` : '—', icon: 'attach-money' as const, color: '#8b5cf6' },
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
        <Text style={[tw`text-lg font-bold tracking-tighter`, { color: accent }]}>Vertex</Text>
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
          <View style={tw`flex-row flex-wrap gap-3`}>
            {[
              { label: 'Add Client', sub: 'Manage roster', icon: 'person-add' as const, onPress: () => navigation.navigate('CoachClientList'), featured: true },
              { label: 'New Workout', sub: 'Create program', icon: 'fitness-center' as const, onPress: () => openPlanPicker('workout'), featured: false },
              { label: 'Meal Plan', sub: 'Assign to client', icon: 'restaurant-menu' as const, onPress: () => openPlanPicker('meal'), featured: false },
              { label: 'Message', sub: 'Quick chat', icon: 'send' as const, onPress: () => setShowQuickMessage(true), featured: false },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={item.onPress}
                style={[
                  tw`w-[48%] rounded-2xl p-4`,
                  item.featured
                    ? { backgroundColor: accent + '18', borderWidth: 1.5, borderColor: accent + '40' }
                    : { backgroundColor: cardBg, borderWidth: 1, borderColor },
                ]}
              >
                <View style={[tw`w-11 h-11 rounded-xl items-center justify-center mb-3`, { backgroundColor: item.featured ? accent + '28' : accent + '14' }]}>
                  <MaterialIcons name={item.icon} size={24} color={accent} />
                </View>
                <Text style={[tw`font-bold text-sm`, { color: textPrimary }]}>{item.label}</Text>
                <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>{item.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Clients */}
        <View style={tw`px-4 mt-8`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={[tw`text-2xl font-bold leading-tight tracking-tight`, { color: textPrimary }]}>Recent Clients</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CoachClientList')}>
              <Text style={[tw`text-sm font-bold`, { color: accent }]}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentClients.length === 0 ? (
            <View style={[tw`p-6 rounded-xl items-center`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
              <MaterialIcons name="group" size={32} color={subtextColor} />
              <Text style={[tw`text-sm mt-2`, { color: subtextColor }]}>No clients yet</Text>
            </View>
          ) : recentClients.map(client => (
            <TouchableOpacity
              key={client.id}
              onPress={() => navigation.navigate('CoachClientDetail', { clientId: client.id, userId: client.userId, clientName: client.name })}
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
              </View>
              <View style={tw`items-end`}>
                <Text style={[tw`text-xs`, { color: subtextColor }]}>{client.lastCheckin}</Text>
                <MaterialIcons name="chevron-right" size={20} color={subtextColor} style={tw`mt-1`} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Client Activity Alerts */}
        {inactiveClients.length > 0 && (
          <View style={tw`px-4 mt-8`}>
            <View style={tw`flex-row items-center gap-2 mb-4`}>
              <MaterialIcons name="warning-amber" size={20} color="#f59e0b" />
              <Text style={[tw`text-2xl font-bold leading-tight tracking-tight`, { color: textPrimary }]}>
                Needs Attention
              </Text>
              <View style={[tw`ml-1 px-2 py-0.5 rounded-full`, { backgroundColor: '#f59e0b20' }]}>
                <Text style={tw`text-xs font-bold text-yellow-500`}>{inactiveClients.length}</Text>
              </View>
            </View>
            <View style={[tw`rounded-2xl overflow-hidden`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
              {inactiveClients.map((client, i) => (
                <TouchableOpacity
                  key={client.id}
                  onPress={() => navigation.navigate('CoachClientDetail', { clientId: client.id, userId: client.userId, clientName: client.name })}
                  style={[
                    tw`flex-row items-center gap-3 px-4 py-3.5`,
                    i < inactiveClients.length - 1 && { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
                  ]}
                >
                  <View style={[tw`w-10 h-10 rounded-full items-center justify-center flex-shrink-0`, { backgroundColor: '#f59e0b18' }]}>
                    <MaterialIcons name="person" size={20} color="#f59e0b" />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{client.name}</Text>
                    <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>Last seen: {client.lastCheckin}</Text>
                  </View>
                  <View style={tw`flex-row items-center gap-1`}>
                    <View style={[tw`w-2 h-2 rounded-full`, { backgroundColor: '#f59e0b' }]} />
                    <Text style={[tw`text-xs font-bold`, { color: '#f59e0b' }]}>Inactive</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Roster Progress Snapshot */}
        {allClients.length > 0 && (
          <View style={tw`px-4 mt-8`}>
            <Text style={[tw`text-2xl font-bold leading-tight tracking-tight mb-4`, { color: textPrimary }]}>
              Roster Overview
            </Text>
            <View style={[tw`rounded-2xl p-4`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
              {/* Active vs Pending bar */}
              <View style={tw`mb-4`}>
                <View style={tw`flex-row items-center justify-between mb-2`}>
                  <Text style={[tw`text-xs font-bold uppercase tracking-wider`, { color: subtextColor }]}>Active vs Pending</Text>
                  <Text style={[tw`text-xs font-black`, { color: textPrimary }]}>
                    {analytics.activeClients} / {analytics.totalClients || allClients.length}
                  </Text>
                </View>
                <View style={[tw`h-2.5 rounded-full overflow-hidden`, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
                  <View
                    style={[
                      tw`h-full rounded-full`,
                      {
                        width: `${analytics.totalClients ? Math.round((analytics.activeClients / analytics.totalClients) * 100) : 0}%`,
                        backgroundColor: accent,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Stat pills */}
              <View style={tw`flex-row gap-2`}>
                {[
                  { label: 'Total', value: analytics.totalClients || allClients.length, color: accent },
                  { label: 'Active', value: analytics.activeClients, color: '#10b981' },
                  { label: 'Pending', value: analytics.pendingClients, color: '#f59e0b' },
                  ...(analytics.totalSessions != null ? [{ label: 'Sessions', value: analytics.totalSessions, color: '#8b5cf6' }] : []),
                ].map((s) => (
                  <View
                    key={s.label}
                    style={[tw`flex-1 items-center py-3 rounded-xl`, { backgroundColor: s.color + '12' }]}
                  >
                    <Text style={[tw`text-base font-black`, { color: s.color }]}>{s.value}</Text>
                    <Text style={[tw`text-[10px] font-bold uppercase tracking-wide mt-0.5`, { color: subtextColor }]}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* Inactive warning pill */}
              {inactiveClients.length > 0 && (
                <View style={[tw`flex-row items-center gap-2 mt-3 px-3 py-2 rounded-xl`, { backgroundColor: '#f59e0b12' }]}>
                  <MaterialIcons name="warning-amber" size={14} color="#f59e0b" />
                  <Text style={[tw`text-xs font-semibold flex-1`, { color: '#f59e0b' }]}>
                    {inactiveClients.length} client{inactiveClients.length > 1 ? 's' : ''} inactive for 3+ days
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Hydration: coaches set targets in meal plans; clients log intake in the app */}
        {allClients.filter((c) => c.status === 'active').length > 0 && (
          <View style={tw`px-4 mt-8`}>
            <View style={[tw`rounded-2xl p-4 flex-row gap-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
              <MaterialIcons name="water-drop" size={22} color="#38bdf8" style={tw`mt-0.5`} />
              <View style={tw`flex-1`}>
                <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>Water goals vs. intake</Text>
                <Text style={[tw`text-xs mt-1 leading-relaxed`, { color: subtextColor }]}>
                  Set how much water each client should aim for in their active meal plan (hydration goal). Only the client logs glasses or litres in the app—you do not log water for them.
                </Text>
              </View>
            </View>
          </View>
        )}

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

      {/* Quick Message Modal */}
      <Modal
        visible={showQuickMessage}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQuickMessage(false)}
      >
        <TouchableOpacity
          style={[tw`flex-1`, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          activeOpacity={1}
          onPress={() => setShowQuickMessage(false)}
        />
        <View style={[tw`rounded-t-3xl px-4 pt-4 pb-8`, { backgroundColor: isDark ? '#111128' : '#ffffff', maxHeight: '70%' }]}>
          {/* Handle */}
          <View style={[tw`w-10 h-1 rounded-full self-center mb-4`, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]} />

          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>Message a Client</Text>
            <TouchableOpacity onPress={() => setShowQuickMessage(false)}>
              <MaterialIcons name="close" size={22} color={subtextColor} />
            </TouchableOpacity>
          </View>

          {allClients.length === 0 ? (
            <View style={tw`items-center py-8`}>
              <MaterialIcons name="group" size={36} color={subtextColor} />
              <Text style={[tw`text-sm mt-2`, { color: subtextColor }]}>No clients yet</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {allClients.map((client, i) => {
                const isSending = messagingClientId === client.id;
                return (
                  <TouchableOpacity
                    key={client.id}
                    onPress={() => !messagingClientId && startChat(client)}
                    disabled={!!messagingClientId}
                    style={[
                      tw`flex-row items-center gap-3 py-3`,
                      i < allClients.length - 1 && { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                    ]}
                  >
                    <View style={[tw`w-10 h-10 rounded-full items-center justify-center flex-shrink-0`, { backgroundColor: accent + '20' }]}>
                      <MaterialIcons name="person" size={20} color={accent} />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{client.name}</Text>
                      <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>{client.plan}</Text>
                    </View>
                    {isSending ? (
                      <ActivityIndicator size="small" color={accent} />
                    ) : (
                      <View style={[tw`w-8 h-8 rounded-full items-center justify-center`, { backgroundColor: accent + '18' }]}>
                        <MaterialIcons name="send" size={16} color={accent} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </Modal>
      {/* Plan Picker Modal */}
      <Modal
        visible={!!planPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setPlanPicker(null)}
      >
        <TouchableOpacity
          style={[tw`flex-1`, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          activeOpacity={1}
          onPress={() => setPlanPicker(null)}
        />
        <View style={[tw`rounded-t-3xl px-4 pt-4 pb-10`, { backgroundColor: isDark ? '#111128' : '#ffffff', maxHeight: '75%' }]}>
          {/* Handle */}
          <View style={[tw`w-10 h-1 rounded-full self-center mb-4`, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]} />

          {planPicker?.step === 'client' ? (
            <>
              <View style={tw`flex-row items-center justify-between mb-1`}>
                <View>
                  <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>
                    {planPicker.type === 'workout' ? 'New Workout Plan' : 'New Meal Plan'}
                  </Text>
                  <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>Choose a client</Text>
                </View>
                <TouchableOpacity onPress={() => setPlanPicker(null)}>
                  <MaterialIcons name="close" size={22} color={subtextColor} />
                </TouchableOpacity>
              </View>

              <View style={[tw`flex-row items-center gap-2 my-3 px-3 py-2 rounded-xl`, { backgroundColor: planPicker.type === 'workout' ? accent + '12' : '#10b98112' }]}>
                <MaterialIcons
                  name={planPicker.type === 'workout' ? 'fitness-center' : 'restaurant-menu'}
                  size={15}
                  color={planPicker.type === 'workout' ? accent : '#10b981'}
                />
                <Text style={[tw`text-xs font-semibold`, { color: planPicker.type === 'workout' ? accent : '#10b981' }]}>
                  {planPicker.type === 'workout' ? 'Workout plan will be assigned to the selected client' : 'Meal plan will be assigned to the selected client'}
                </Text>
              </View>

              {allClients.length === 0 ? (
                <View style={tw`items-center py-8`}>
                  <MaterialIcons name="group" size={36} color={subtextColor} />
                  <Text style={[tw`text-sm mt-2`, { color: subtextColor }]}>No clients yet</Text>
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {allClients.map((client, i) => (
                    <TouchableOpacity
                      key={client.id}
                      onPress={() => selectPlanClient(client)}
                      style={[
                        tw`flex-row items-center gap-3 py-3.5`,
                        i < allClients.length - 1 && { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                      ]}
                    >
                      <View style={[tw`w-10 h-10 rounded-full items-center justify-center flex-shrink-0`, { backgroundColor: accent + '20' }]}>
                        <MaterialIcons name="person" size={20} color={accent} />
                      </View>
                      <View style={tw`flex-1`}>
                        <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{client.name}</Text>
                        <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>{client.plan}</Text>
                      </View>
                      <View style={[tw`w-7 h-7 rounded-full items-center justify-center`, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                        <MaterialIcons name="chevron-right" size={18} color={subtextColor} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          ) : (
            <>
              <View style={tw`flex-row items-center justify-between mb-4`}>
                <TouchableOpacity
                  onPress={() => setPlanPicker((p) => p ? { ...p, step: 'client' } : null)}
                  style={tw`flex-row items-center gap-1`}
                >
                  <MaterialIcons name="arrow-back" size={18} color={accent} />
                  <Text style={[tw`text-sm font-bold`, { color: accent }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPlanPicker(null)}>
                  <MaterialIcons name="close" size={22} color={subtextColor} />
                </TouchableOpacity>
              </View>

              {/* Selected client summary */}
              <View style={[tw`flex-row items-center gap-3 p-3 rounded-2xl mb-6`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
                <View style={[tw`w-11 h-11 rounded-full items-center justify-center`, { backgroundColor: accent + '20' }]}>
                  <MaterialIcons name="person" size={22} color={accent} />
                </View>
                <View>
                  <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{planPicker?.client?.name}</Text>
                  <Text style={[tw`text-xs`, { color: subtextColor }]}>{planPicker?.client?.plan}</Text>
                </View>
              </View>

              <Text style={[tw`text-base font-bold mb-4`, { color: textPrimary }]}>How do you want to create this plan?</Text>

              {/* Manual */}
              <TouchableOpacity
                onPress={() => launchPlan('manual')}
                style={[tw`flex-row items-center gap-4 p-4 rounded-2xl mb-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}
              >
                <View style={[tw`w-12 h-12 rounded-2xl items-center justify-center`, { backgroundColor: accent + '14' }]}>
                  <MaterialIcons name={planPicker?.type === 'workout' ? 'fitness-center' : 'restaurant-menu'} size={24} color={accent} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>Build Manually</Text>
                  <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>
                    {planPicker?.type === 'workout'
                      ? 'Add exercises day-by-day at your own pace'
                      : 'Add meals and macros day-by-day at your own pace'}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={subtextColor} />
              </TouchableOpacity>

              {/* AI Generate */}
              <TouchableOpacity
                onPress={() => launchPlan('ai')}
                style={[tw`flex-row items-center gap-4 p-4 rounded-2xl`, { backgroundColor: isDark ? '#1e1b4b' : '#ede9fe', borderWidth: 1.5, borderColor: isDark ? '#4f46e5' : '#a5b4fc' }]}
              >
                <View style={[tw`w-12 h-12 rounded-2xl items-center justify-center`, { backgroundColor: '#6366f118' }]}>
                  <MaterialIcons name="auto-awesome" size={24} color="#6366f1" />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-sm font-bold`, { color: '#6366f1' }]}>Generate with AI</Text>
                  <Text style={[tw`text-xs mt-0.5`, { color: isDark ? '#a5b4fc' : '#6366f1aa' }]}>
                    {planPicker?.type === 'workout'
                      ? "Auto-build a personalised program from the client's profile"
                      : "Auto-build a personalised diet from the client's profile"}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color="#6366f1" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};
