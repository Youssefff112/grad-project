import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { AdminBottomNav } from '../../components/admin/AdminBottomNav';
import * as adminService from '../../services/adminService';

type StatusFilter = 'all' | adminService.SubscriptionStatus;
type RoleFilter = 'all' | 'client' | 'coach';

const STATUS_CONFIG: Record<adminService.SubscriptionStatus, { bg: string; text: string; label: string }> = {
  active: { bg: '#10b98120', text: '#10b981', label: 'Active' },
  pending: { bg: '#f59e0b20', text: '#f59e0b', label: 'Pending' },
  expired: { bg: '#64748b20', text: '#64748b', label: 'Expired' },
  cancelled: { bg: '#ef444420', text: '#ef4444', label: 'Cancelled' },
};

const STATUS_OPTIONS: adminService.SubscriptionStatus[] = ['active', 'pending', 'expired', 'cancelled'];

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const AdminSubscriptionScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();

  const bgColor = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const subtextColor = isDark ? '#94a3b8' : '#64748b';

  const [subscriptions, setSubscriptions] = useState<adminService.AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Modal state for status change
  const [selectedSub, setSelectedSub] = useState<adminService.AdminSubscription | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: adminService.GetSubscriptionsFilters = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (roleFilter !== 'all') filters.role = roleFilter;

      const { subscriptions: data } = await adminService.getAllSubscriptions(filters);
      setSubscriptions(data);
    } catch {
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const openStatusModal = (sub: adminService.AdminSubscription) => {
    setSelectedSub(sub);
    setModalVisible(true);
  };

  const handleStatusChange = async (newStatus: adminService.SubscriptionStatus) => {
    if (!selectedSub) return;
    setModalVisible(false);
    setActionLoading(selectedSub.id);
    try {
      await adminService.updateSubscriptionStatus(selectedSub.id, newStatus);
      setSubscriptions(prev =>
        prev.map(s => s.id === selectedSub.id ? { ...s, status: newStatus } : s)
      );
    } catch {
      Alert.alert('Error', 'Failed to update subscription status.');
    } finally {
      setActionLoading(null);
      setSelectedSub(null);
    }
  };

  const totalAmount = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + s.price, 0);

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[tw`px-5 pt-4 pb-3`, { borderBottomWidth: 1, borderColor: borderColor, backgroundColor: bgColor }]}>
        <View style={tw`flex-row items-center justify-between mb-1`}>
          <Text style={[tw`text-2xl font-black`, { color: textPrimary }]}>Subscriptions</Text>
          <View style={[tw`px-3 py-1 rounded-full`, { backgroundColor: '#10b98114' }]}>
            <Text style={[tw`text-xs font-bold`, { color: '#10b981' }]}>
              ${totalAmount.toFixed(2)}/mo active
            </Text>
          </View>
        </View>
        <Text style={[tw`text-xs mb-4`, { color: subtextColor }]}>{subscriptions.length} total records</Text>

        {/* Status filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-2`}>
          <View style={tw`flex-row gap-2`}>
            {(['all', ...STATUS_OPTIONS] as StatusFilter[]).map(s => {
              const cfg = s === 'all' ? null : STATUS_CONFIG[s];
              const isActive = statusFilter === s;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStatusFilter(s)}
                  style={[tw`px-3 py-1.5 rounded-full`, {
                    backgroundColor: isActive ? (cfg?.bg || accent + '20') : (isDark ? '#1e293b' : '#e2e8f0'),
                  }]}
                >
                  <Text style={[tw`text-xs font-bold capitalize`, {
                    color: isActive ? (cfg?.text || accent) : subtextColor,
                  }]}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Role filter */}
        <View style={tw`flex-row gap-2`}>
          {(['all', 'client', 'coach'] as RoleFilter[]).map(r => (
            <TouchableOpacity
              key={r}
              onPress={() => setRoleFilter(r)}
              style={[tw`px-3 py-1 rounded-full border`, {
                backgroundColor: roleFilter === r ? accent + '18' : 'transparent',
                borderColor: roleFilter === r ? accent + '40' : borderColor,
              }]}
            >
              <Text style={[tw`text-xs font-bold capitalize`, { color: roleFilter === r ? accent : subtextColor }]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      ) : error ? (
        <View style={tw`flex-1 items-center justify-center px-6`}>
          <MaterialIcons name="error-outline" size={48} color="#ef4444" />
          <Text style={[tw`text-base font-bold mt-3 text-center`, { color: textPrimary }]}>{error}</Text>
          <TouchableOpacity onPress={load} style={[tw`mt-4 px-6 py-3 rounded-xl`, { backgroundColor: accent }]}>
            <Text style={tw`text-white font-bold text-sm`}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-5 pt-4 pb-28`}>
          {subscriptions.length === 0 && (
            <View style={tw`items-center py-16`}>
              <MaterialIcons name="card-membership" size={48} color={isDark ? '#334155' : '#cbd5e1'} />
              <Text style={[tw`mt-3 text-base font-bold`, { color: isDark ? '#475569' : '#94a3b8' }]}>No subscriptions found</Text>
            </View>
          )}

          {subscriptions.map(sub => {
            const cfg = STATUS_CONFIG[sub.status];
            const userName = sub.User
              ? `${sub.User.firstName || ''} ${sub.User.lastName || ''}`.trim() || `User #${sub.userId}`
              : `User #${sub.userId}`;
            const isActioning = actionLoading === sub.id;

            return (
              <TouchableOpacity
                key={sub.id}
                onPress={() => openStatusModal(sub)}
                activeOpacity={0.8}
                style={[tw`p-4 rounded-2xl mb-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}
              >
                {/* Top row */}
                <View style={tw`flex-row items-start justify-between mb-2`}>
                  <View style={tw`flex-1`}>
                    <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{userName}</Text>
                    <Text style={[tw`text-xs`, { color: subtextColor }]}>{sub.User?.email || ''}</Text>
                  </View>
                  <View style={tw`items-end gap-1`}>
                    <View style={[tw`px-2.5 py-0.5 rounded-full`, { backgroundColor: cfg.bg }]}>
                      <Text style={[tw`text-xs font-bold`, { color: cfg.text }]}>{cfg.label}</Text>
                    </View>
                    <View style={[tw`px-2 py-0.5 rounded-full`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                      <Text style={[tw`text-[10px] font-semibold capitalize`, { color: subtextColor }]}>{sub.role}</Text>
                    </View>
                  </View>
                </View>

                {/* Plan details */}
                <View style={[tw`py-3 px-3 rounded-xl gap-2.5`, { backgroundColor: isDark ? '#1e293b' : '#f8f7f5' }]}>
                  {/* Row 1: Plan & Price */}
                  <View style={tw`flex-row justify-between`}>
                    <View style={tw`flex-1`}>
                      <Text style={[tw`text-xs`, { color: subtextColor }]}>Plan</Text>
                      <Text style={[tw`text-sm font-bold`, { color: textPrimary }]} numberOfLines={1}>
                        {sub.planName}
                      </Text>
                    </View>
                    <View style={tw`items-end`}>
                      <Text style={[tw`text-xs`, { color: subtextColor }]}>Price</Text>
                      <Text style={[tw`text-sm font-bold`, { color: accent }]}>
                        ${sub.price.toFixed(2)}/mo
                      </Text>
                    </View>
                  </View>
                  {/* Row 2: Start & End dates */}
                  <View
                    style={[
                      tw`flex-row justify-between pt-2`,
                      { borderTopWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
                    ]}
                  >
                    <View style={tw`flex-1`}>
                      <Text style={[tw`text-xs`, { color: subtextColor }]}>Started</Text>
                      <Text style={[tw`text-xs font-semibold`, { color: textPrimary }]} numberOfLines={1}>
                        {formatDate(sub.startDate)}
                      </Text>
                    </View>
                    <View style={tw`items-end flex-1`}>
                      <Text style={[tw`text-xs`, { color: subtextColor }]}>Ends</Text>
                      <Text style={[tw`text-xs font-semibold`, { color: textPrimary }]} numberOfLines={1}>
                        {formatDate(sub.endDate)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={tw`flex-row items-center justify-between mt-2`}>
                  <Text style={[tw`text-xs`, { color: subtextColor }]}>ID #{sub.id} · Tap to change status</Text>
                  {isActioning ? (
                    <ActivityIndicator size="small" color={accent} />
                  ) : (
                    <MaterialIcons name="edit" size={16} color={subtextColor} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <AdminBottomNav activeId="subscriptions" navigation={navigation} />

      {/* Status change modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={tw`flex-1 justify-end`}>
          <TouchableOpacity style={tw`flex-1`} onPress={() => setModalVisible(false)} />
          <View style={[tw`rounded-t-3xl p-6 pb-10`, { backgroundColor: isDark ? '#111128' : '#ffffff' }]}>
            <View style={tw`flex-row items-center justify-between mb-5`}>
              <Text style={[tw`text-lg font-black`, { color: textPrimary }]}>Change Status</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={22} color={subtextColor} />
              </TouchableOpacity>
            </View>
            {selectedSub && (
              <Text style={[tw`text-sm mb-5`, { color: subtextColor }]}>
                Subscription #{selectedSub.id} — {selectedSub.planName} plan
              </Text>
            )}
            <View style={tw`gap-3`}>
              {STATUS_OPTIONS.map(status => {
                const cfg = STATUS_CONFIG[status];
                const isCurrent = selectedSub?.status === status;
                return (
                  <TouchableOpacity
                    key={status}
                    onPress={() => handleStatusChange(status)}
                    disabled={isCurrent}
                    style={[tw`flex-row items-center justify-between p-4 rounded-xl`, {
                      backgroundColor: isCurrent ? cfg.bg : (isDark ? '#1e293b' : '#f1f5f9'),
                      borderWidth: 1,
                      borderColor: isCurrent ? cfg.text + '40' : borderColor,
                      opacity: isCurrent ? 0.7 : 1,
                    }]}
                  >
                    <View style={tw`flex-row items-center gap-3`}>
                      <View style={[tw`w-3 h-3 rounded-full`, { backgroundColor: cfg.text }]} />
                      <Text style={[tw`text-sm font-bold capitalize`, { color: isCurrent ? cfg.text : textPrimary }]}>
                        {cfg.label}
                      </Text>
                    </View>
                    {isCurrent && (
                      <View style={[tw`px-2 py-0.5 rounded-full`, { backgroundColor: cfg.bg }]}>
                        <Text style={[tw`text-[10px] font-bold`, { color: cfg.text }]}>Current</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
