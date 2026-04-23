import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { AdminBottomNav } from '../../components/admin/AdminBottomNav';
import * as adminService from '../../services/adminService';

type FilterTab = 'all' | 'active' | 'inactive';

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  admin: { bg: '#8b5cf620', text: '#8b5cf6' },
  coach: { bg: '#f59e0b20', text: '#f59e0b' },
  client: { bg: '#10b98120', text: '#10b981' },
};

export const AdminUserManagementScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();

  const bgColor = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const subtextColor = isDark ? '#94a3b8' : '#64748b';

  const [users, setUsers] = useState<adminService.AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (searchQuery = '') => {
    setLoading(true);
    setError(null);
    try {
      const filters: adminService.GetUsersFilters = { limit: 50 };
      if (filter === 'active') filters.isActive = true;
      if (filter === 'inactive') filters.isActive = false;
      if (searchQuery.trim()) filters.search = searchQuery.trim();

      const { users: data } = await adminService.getUsers(filters);
      setUsers(data);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(search); }, [filter]);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(text), 500);
  };

  const handleActivate = async (user: adminService.AdminUser) => {
    Alert.alert(
      'Activate User',
      `Activate "${user.firstName} ${user.lastName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: async () => {
            setActionLoading(user.id);
            try {
              await adminService.updateUser(user.id, { isActive: true });
              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: true } : u));
            } catch {
              Alert.alert('Error', 'Failed to activate user.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleDeactivate = async (user: adminService.AdminUser) => {
    Alert.alert(
      'Deactivate User',
      `Deactivate "${user.firstName} ${user.lastName}"? They will no longer be able to sign in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(user.id);
            try {
              await adminService.deactivateUser(user.id);
              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: false } : u));
            } catch {
              Alert.alert('Error', 'Failed to deactivate user.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const counts = {
    all: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[tw`px-5 pt-4 pb-3`, { borderBottomWidth: 1, borderColor: borderColor, backgroundColor: bgColor }]}>
        <View style={tw`flex-row items-center justify-between mb-4`}>
          <Text style={[tw`text-2xl font-black`, { color: textPrimary }]}>User Management</Text>
          <View style={[tw`px-3 py-1 rounded-full`, { backgroundColor: accent + '14' }]}>
            <Text style={[tw`text-sm font-bold`, { color: accent }]}>{counts.all} total</Text>
          </View>
        </View>

        {/* Search */}
        <View style={[tw`flex-row items-center px-3 py-2.5 rounded-xl mb-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
          <MaterialIcons name="search" size={18} color={subtextColor} style={tw`mr-2`} />
          <TextInput
            style={[tw`flex-1 text-sm`, { color: textPrimary }]}
            placeholder="Search by name or email..."
            placeholderTextColor={subtextColor}
            value={search}
            onChangeText={handleSearchChange}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); load(''); }}>
              <MaterialIcons name="close" size={16} color={subtextColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={tw`flex-row gap-2`}>
            {(['all', 'active', 'inactive'] as FilterTab[]).map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[tw`px-4 py-1.5 rounded-full`, { backgroundColor: filter === f ? accent : isDark ? '#1e293b' : '#e2e8f0' }]}
              >
                <Text style={[tw`text-xs font-bold capitalize`, { color: filter === f ? '#fff' : subtextColor }]}>
                  {f} ({counts[f]})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {loading ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      ) : error ? (
        <View style={tw`flex-1 items-center justify-center px-6`}>
          <MaterialIcons name="error-outline" size={48} color="#ef4444" />
          <Text style={[tw`text-base font-bold mt-3 text-center`, { color: textPrimary }]}>{error}</Text>
          <TouchableOpacity onPress={() => load(search)} style={[tw`mt-4 px-6 py-3 rounded-xl`, { backgroundColor: accent }]}>
            <Text style={tw`text-white font-bold text-sm`}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-5 pt-4 pb-28`}>
          {users.length === 0 && (
            <View style={tw`items-center py-16`}>
              <MaterialIcons name="person-search" size={48} color={isDark ? '#334155' : '#cbd5e1'} />
              <Text style={[tw`mt-3 text-base font-bold`, { color: isDark ? '#475569' : '#94a3b8' }]}>No users found</Text>
            </View>
          )}

          {users.map(user => {
            const roleColors = ROLE_COLORS[user.role] || ROLE_COLORS.client;
            const isActioning = actionLoading === user.id;
            return (
              <View
                key={user.id}
                style={[tw`p-4 rounded-2xl mb-3`, {
                  backgroundColor: cardBg,
                  borderWidth: 1,
                  borderColor: user.isActive ? borderColor : '#ef444430',
                  opacity: user.isActive ? 1 : 0.75,
                }]}
              >
                {/* User info row */}
                <View style={tw`flex-row items-center gap-3`}>
                  <View style={[tw`w-11 h-11 rounded-full items-center justify-center flex-shrink-0`, { backgroundColor: accent + '18' }]}>
                    <MaterialIcons name="person" size={22} color={accent} />
                  </View>
                  <View style={tw`flex-1`}>
                    <View style={tw`flex-row items-center gap-2 flex-wrap`}>
                      <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>
                        {user.firstName} {user.lastName}
                      </Text>
                      <View style={[tw`px-2 py-0.5 rounded-full`, { backgroundColor: roleColors.bg }]}>
                        <Text style={[tw`text-[10px] font-bold capitalize`, { color: roleColors.text }]}>{user.role}</Text>
                      </View>
                      {!user.isActive && (
                        <View style={[tw`px-2 py-0.5 rounded-full`, { backgroundColor: '#ef444420' }]}>
                          <Text style={tw`text-[10px] font-bold text-red-500`}>Inactive</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>{user.email}</Text>
                    <Text style={[tw`text-xs mt-0.5 capitalize`, { color: subtextColor }]}>
                      {user.userType} · ID #{user.id}
                    </Text>
                  </View>
                </View>

                {/* Action buttons */}
                <View style={tw`flex-row gap-2 mt-3`}>
                  {user.isActive ? (
                    <TouchableOpacity
                      onPress={() => handleDeactivate(user)}
                      disabled={isActioning}
                      style={[tw`flex-1 py-2 rounded-lg items-center flex-row justify-center gap-1`, { backgroundColor: '#ef444414', borderWidth: 1, borderColor: '#ef444428' }]}
                    >
                      {isActioning ? (
                        <ActivityIndicator size="small" color="#ef4444" />
                      ) : (
                        <>
                          <MaterialIcons name="person-off" size={14} color="#ef4444" />
                          <Text style={tw`text-xs font-bold text-red-500`}>Deactivate</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleActivate(user)}
                      disabled={isActioning}
                      style={[tw`flex-1 py-2 rounded-lg items-center flex-row justify-center gap-1`, { backgroundColor: '#10b98114', borderWidth: 1, borderColor: '#10b98128' }]}
                    >
                      {isActioning ? (
                        <ActivityIndicator size="small" color="#10b981" />
                      ) : (
                        <>
                          <MaterialIcons name="person-add" size={14} color="#10b981" />
                          <Text style={tw`text-xs font-bold text-green-500`}>Activate</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <AdminBottomNav activeId="users" navigation={navigation} />
    </SafeAreaView>
  );
};
