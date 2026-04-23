import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { AdminBottomNav } from '../../components/admin/AdminBottomNav';
import * as adminService from '../../services/adminService';

type TabType = 'pending' | 'approved';

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const AdminCoachApprovalsScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();

  const bgColor = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const subtextColor = isDark ? '#94a3b8' : '#64748b';

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [applications, setApplications] = useState<adminService.CoachApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const isApproved = activeTab === 'approved';
      const { applications: data } = await adminService.getCoachApplications(isApproved);
      setApplications(data);
    } catch {
      setError('Failed to load coach applications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleApprove = (app: adminService.CoachApplication) => {
    const name = app.User
      ? `${app.User.firstName || ''} ${app.User.lastName || ''}`.trim() || `Coach #${app.id}`
      : `Coach #${app.id}`;
    Alert.alert(
      'Approve Coach',
      `Approve "${name}" as a verified coach? They will gain access to the coach dashboard.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setActionLoading(app.id);
            try {
              await adminService.approveCoach(app.id);
              setApplications(prev => prev.filter(a => a.id !== app.id));
            } catch {
              Alert.alert('Error', 'Failed to approve coach.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleRevoke = (app: adminService.CoachApplication) => {
    const name = app.User
      ? `${app.User.firstName || ''} ${app.User.lastName || ''}`.trim() || `Coach #${app.id}`
      : `Coach #${app.id}`;
    Alert.alert(
      'Revoke Approval',
      `Revoke coach approval for "${name}"? They will lose access to coaching features.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(app.id);
            try {
              await adminService.revokeCoach(app.id);
              setApplications(prev => prev.filter(a => a.id !== app.id));
            } catch {
              Alert.alert('Error', 'Failed to revoke approval.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[tw`px-5 pt-4 pb-3`, { borderBottomWidth: 1, borderColor: borderColor, backgroundColor: bgColor }]}>
        <View style={tw`flex-row items-center justify-between mb-4`}>
          <Text style={[tw`text-2xl font-black`, { color: textPrimary }]}>Coach Approvals</Text>
          <View style={[tw`px-3 py-1 rounded-full`, { backgroundColor: activeTab === 'pending' ? '#f59e0b20' : '#10b98120' }]}>
            <Text style={[tw`text-sm font-bold`, { color: activeTab === 'pending' ? '#f59e0b' : '#10b981' }]}>
              {applications.length} {activeTab}
            </Text>
          </View>
        </View>

        {/* Tab Toggle */}
        <View style={[tw`flex-row rounded-xl overflow-hidden`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
          {(['pending', 'approved'] as TabType[]).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[tw`flex-1 py-2.5 items-center rounded-xl`, { backgroundColor: activeTab === tab ? accent : 'transparent' }]}
            >
              <Text style={[tw`text-sm font-bold capitalize`, { color: activeTab === tab ? '#fff' : subtextColor }]}>
                {tab}
              </Text>
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
          <TouchableOpacity onPress={() => load()} style={[tw`mt-4 px-6 py-3 rounded-xl`, { backgroundColor: accent }]}>
            <Text style={tw`text-white font-bold text-sm`}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`px-5 pt-4 pb-28`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { load(true); }}
              tintColor={accent}
              colors={[accent]}
            />
          }
        >
          {applications.length === 0 && (
            <View style={tw`items-center py-20`}>
              <MaterialIcons
                name={activeTab === 'pending' ? 'pending-actions' : 'verified-user'}
                size={52}
                color={isDark ? '#334155' : '#cbd5e1'}
              />
              <Text style={[tw`mt-3 text-base font-bold`, { color: isDark ? '#475569' : '#94a3b8' }]}>
                No {activeTab} applications
              </Text>
            </View>
          )}

          {applications.map(app => {
            const name = app.User
              ? `${app.User.firstName || ''} ${app.User.lastName || ''}`.trim() || `Coach #${app.id}`
              : `Coach #${app.id}`;
            const email = app.User?.email || '';
            const isActioning = actionLoading === app.id;

            return (
              <View
                key={app.id}
                style={[tw`p-4 rounded-2xl mb-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}
              >
                {/* Coach header */}
                <View style={tw`flex-row items-center gap-3 mb-3`}>
                  <View style={[tw`w-12 h-12 rounded-full items-center justify-center flex-shrink-0`, { backgroundColor: accent + '18' }]}>
                    <MaterialIcons name="person" size={26} color={accent} />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={[tw`text-base font-bold`, { color: textPrimary }]}>{name}</Text>
                    <Text style={[tw`text-xs`, { color: subtextColor }]}>{email}</Text>
                    <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>
                      Applied {formatDate(app.createdAt)}
                      {app.isApproved && app.approvedAt ? ` · Approved ${formatDate(app.approvedAt)}` : ''}
                    </Text>
                  </View>
                  <View style={[tw`px-2 py-0.5 rounded-full`, { backgroundColor: app.isApproved ? '#10b98120' : '#f59e0b20' }]}>
                    <Text style={[tw`text-[10px] font-bold`, { color: app.isApproved ? '#10b981' : '#f59e0b' }]}>
                      {app.isApproved ? 'Approved' : 'Pending'}
                    </Text>
                  </View>
                </View>

                {/* Profile details */}
                <View style={[tw`p-3 rounded-xl mb-3`, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                  <View style={tw`flex-row gap-4`}>
                    <View>
                      <Text style={[tw`text-[10px] uppercase tracking-wider`, { color: subtextColor }]}>Experience</Text>
                      <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>
                        {app.experienceYears ? `${app.experienceYears} yrs` : 'N/A'}
                      </Text>
                    </View>
                    <View>
                      <Text style={[tw`text-[10px] uppercase tracking-wider`, { color: subtextColor }]}>Certifications</Text>
                      <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>
                        {app.certifications?.length ?? 0}
                      </Text>
                    </View>
                    {app.specialties && app.specialties.length > 0 && (
                      <View style={tw`flex-1`}>
                        <Text style={[tw`text-[10px] uppercase tracking-wider mb-1`, { color: subtextColor }]}>Specialties</Text>
                        <View style={tw`flex-row flex-wrap gap-1`}>
                          {app.specialties.slice(0, 3).map((s, i) => (
                            <View key={i} style={[tw`px-2 py-0.5 rounded-full`, { backgroundColor: accent + '18' }]}>
                              <Text style={[tw`text-[10px] font-semibold`, { color: accent }]}>{s}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                  {app.bio ? (
                    <Text style={[tw`text-xs mt-2 leading-relaxed`, { color: subtextColor }]} numberOfLines={2}>
                      {app.bio}
                    </Text>
                  ) : null}
                </View>

                {/* Action buttons */}
                <View style={tw`flex-row gap-2`}>
                  {activeTab === 'pending' && (
                    <TouchableOpacity
                      onPress={() => handleApprove(app)}
                      disabled={isActioning}
                      style={[tw`flex-1 py-2.5 rounded-xl items-center flex-row justify-center gap-1.5`, { backgroundColor: '#10b98118', borderWidth: 1, borderColor: '#10b98130' }]}
                    >
                      {isActioning ? <ActivityIndicator size="small" color="#10b981" /> : (
                        <>
                          <MaterialIcons name="check-circle" size={16} color="#10b981" />
                          <Text style={tw`text-sm font-bold text-green-500`}>Approve</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleRevoke(app)}
                    disabled={isActioning}
                    style={[tw`flex-1 py-2.5 rounded-xl items-center flex-row justify-center gap-1.5`, { backgroundColor: '#ef444414', borderWidth: 1, borderColor: '#ef444428' }]}
                  >
                    {isActioning && activeTab === 'approved' ? <ActivityIndicator size="small" color="#ef4444" /> : (
                      <>
                        <MaterialIcons name="cancel" size={16} color="#ef4444" />
                        <Text style={tw`text-sm font-bold text-red-500`}>{activeTab === 'pending' ? 'Reject' : 'Revoke'}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <AdminBottomNav activeId="coaches" navigation={navigation} />
    </SafeAreaView>
  );
};
