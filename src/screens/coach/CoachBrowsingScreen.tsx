import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { CoachCard } from '../../components/coach/CoachCard';
import { getCoaches, Coach } from '../../services/coachService';
import { selectCoach, getClientSubscriptionStatus } from '../../services/clientService';
import { canClientSelectPersonalCoach } from '../../utils/planUtils';
import { coachDisplayName } from '../../utils/coachDisplayName';

interface FilterState {
  specialty?: string;
  minRating?: number;
}

type CoachWithDisplay = Coach & { displayName: string };

export const CoachBrowsingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isDark, accent } = useTheme();
  const { subscriptionPlan, setSubscriptionPlan, coachId, setCoach } = useUser();
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});
  const [coaches, setCoaches] = useState<CoachWithDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [choosingUserId, setChoosingUserId] = useState<number | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const canAssign = canClientSelectPersonalCoach(subscriptionPlan);

  const specialtyOptions = ['Strength', 'Cardio', 'Weight Loss', 'Nutrition', 'Flexibility', 'CrossFit', 'HIIT', 'Yoga', 'Pilates'];

  const loadCoaches = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const { coaches: data } = await getCoaches({
        specialty: filters.specialty,
        minRating: filters.minRating,
        limit: 50,
      });
      setCoaches(
        data.map(c => ({
          ...c,
          displayName: coachDisplayName(c),
        }))
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to load coaches');
      setCoaches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters.specialty, filters.minRating]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const { subscription } = await getClientSubscriptionStatus();
          if (!cancelled && subscription?.planName) {
            setSubscriptionPlan(subscription.planName as any);
          }
        } catch {
          /* keep cached plan */
        }
        if (!cancelled) loadCoaches();
      })();

      pollingRef.current = setInterval(() => loadCoaches(), 30000);
      return () => {
        cancelled = true;
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }, [loadCoaches, setSubscriptionPlan])
  );

  const filteredCoaches = useMemo(() => {
    if (!searchText.trim()) return coaches;
    const q = searchText.toLowerCase();
    return coaches.filter(
      c =>
        c.displayName.toLowerCase().includes(q) ||
        c.specialties?.some(s => s.toLowerCase().includes(q)) ||
        c.bio?.toLowerCase().includes(q)
    );
  }, [coaches, searchText]);

  const handleViewProfile = (coach: CoachWithDisplay) => {
    navigation.navigate('CoachProfileDetail', {
      coachId: coach.id,
      coachName: coach.displayName,
    });
  };

  const handleChooseCoach = (coach: CoachWithDisplay) => {
    if (!canAssign) {
      Alert.alert(
        'Upgrade to unlock',
        'Personal coach assignment is included on the Coach Plan (Premium) and Elite. Upgrade to choose and message your coach.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'View plans', onPress: () => navigation.navigate('SubscriptionPlans') },
        ]
      );
      return;
    }

    Alert.alert(
      'Choose this coach?',
      `${coach.displayName} will be your primary coach for training plans, check-ins, and messaging.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose coach',
          onPress: async () => {
            setChoosingUserId(coach.userId);
            try {
              await selectCoach(coach.userId);
              setCoach(String(coach.userId), coach.displayName);
              Alert.alert('You are all set', `${coach.displayName} is now your coach.`, [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err: any) {
              const msg =
                err?.response?.data?.message || err?.message || 'Please try again.';
              Alert.alert('Could not assign coach', msg);
            } finally {
              setChoosingUserId(null);
            }
          },
        },
      ]
    );
  };

  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const heroBg = isDark ? '#0f0f18' : '#fafaf8';

  const renderCoachItem = ({ item }: { item: CoachWithDisplay }) => {
    const isCurrent = !!(coachId && String(coachId) === String(item.userId));
    return (
      <CoachCard
        coach={item}
        onViewProfile={() => handleViewProfile(item)}
        onChooseCoach={() => handleChooseCoach(item)}
        canAssignCoach={canAssign}
        isCurrentCoach={isCurrent}
        isChoosing={choosingUserId === item.userId}
      />
    );
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#08080f' : '#f5f4f1' }]}>
      <View
        style={[
          tw`px-4 pt-3 pb-4`,
          {
            backgroundColor: heroBg,
            borderBottomWidth: 1,
            borderColor,
          },
        ]}
      >
        <View style={tw`flex-row items-center justify-between mb-1`}>
          <View style={tw`flex-row items-center flex-1`}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={tw`mr-2 p-1`}>
              <MaterialIcons name="arrow-back" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
            </TouchableOpacity>
            <View style={tw`flex-1`}>
              <Text style={[tw`text-xs font-semibold uppercase tracking-widest`, { color: accent }]}>
                FitCore network
              </Text>
              <Text style={[tw`text-2xl font-bold mt-0.5`, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                Find your coach
              </Text>
            </View>
          </View>
        </View>
        <Text style={[tw`text-sm mt-2 ml-1`, { color: subtextColor }]}>
          Verified professionals matched to your goals. View full profiles or assign your coach in one tap.
        </Text>

        {!canAssign && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('SubscriptionPlans')}
            style={[
              tw`mt-4 flex-row items-center p-3 rounded-2xl`,
              {
                backgroundColor: isDark ? '#1a1a2e' : '#fff',
                borderWidth: 1,
                borderColor: accent + '44',
              },
            ]}
          >
            <View style={[tw`w-10 h-10 rounded-xl items-center justify-center`, { backgroundColor: accent + '22' }]}>
              <MaterialIcons name="workspace-premium" size={22} color={accent} />
            </View>
            <View style={tw`flex-1 ml-3`}>
              <Text style={[tw`text-sm font-bold`, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>
                Unlock coach assignment
              </Text>
              <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>
                Premium or Elite includes your dedicated coach and messaging.
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={subtextColor} />
          </TouchableOpacity>
        )}

        <View
          style={[
            tw`flex-row items-center px-3 py-2.5 rounded-xl mt-4`,
            { backgroundColor: isDark ? '#12121f' : '#ffffff', borderWidth: 1, borderColor },
          ]}
        >
          <MaterialIcons name="search" size={20} color={subtextColor} style={tw`mr-2`} />
          <TextInput
            style={[tw`flex-1 text-sm`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}
            placeholder="Search by name, specialty, or focus…"
            placeholderTextColor={subtextColor}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <MaterialIcons name="close" size={18} color={subtextColor} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={[
            tw`flex-row items-center self-start mt-3 px-3 py-1.5 rounded-lg`,
            {
              backgroundColor: showFilters ? accent + '14' : isDark ? '#12121f' : '#eef2f6',
              borderWidth: 1,
              borderColor: showFilters ? accent + '40' : borderColor,
            },
          ]}
        >
          <MaterialIcons name="tune" size={16} color={showFilters ? accent : subtextColor} />
          <Text style={[tw`ml-1.5 text-sm font-semibold`, { color: showFilters ? accent : subtextColor }]}>Filters</Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={[tw`px-4 py-4`, { backgroundColor: isDark ? '#0c0c14' : '#eceae6', borderBottomWidth: 1, borderColor }]}>
          <Text style={[tw`text-xs font-bold uppercase tracking-wider mb-2`, { color: subtextColor }]}>Specialty</Text>
          <View style={tw`flex-row flex-wrap gap-2 mb-4`}>
            {specialtyOptions.map(specialty => {
              const isActive = filters.specialty === specialty;
              return (
                <TouchableOpacity
                  key={specialty}
                  onPress={() =>
                    setFilters(prev => ({ ...prev, specialty: prev.specialty === specialty ? undefined : specialty }))
                  }
                  style={[
                    tw`px-3 py-1.5 rounded-full`,
                    {
                      backgroundColor: isActive ? accent : isDark ? '#1e293b' : '#e2e8f0',
                      borderWidth: 1,
                      borderColor: isActive ? accent : 'transparent',
                    },
                  ]}
                >
                  <Text style={[tw`text-xs font-semibold`, { color: isActive ? '#fff' : subtextColor }]}>{specialty}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[tw`text-xs font-bold uppercase tracking-wider mb-2`, { color: subtextColor }]}>Min rating</Text>
          <View style={tw`flex-row gap-2 flex-wrap`}>
            {[3, 4, 4.5].map(rating => {
              const isActive = filters.minRating === rating;
              return (
                <TouchableOpacity
                  key={rating}
                  onPress={() =>
                    setFilters(prev => ({ ...prev, minRating: prev.minRating === rating ? undefined : rating }))
                  }
                  style={[
                    tw`px-3 py-1.5 rounded-full`,
                    { backgroundColor: isActive ? accent : isDark ? '#1e293b' : '#e2e8f0' },
                  ]}
                >
                  <Text style={[tw`text-xs font-semibold`, { color: isActive ? '#fff' : subtextColor }]}>
                    {rating}+ ★
                  </Text>
                </TouchableOpacity>
              );
            })}
            {(filters.specialty || filters.minRating) && (
              <TouchableOpacity onPress={() => setFilters({})} style={[tw`px-3 py-1.5 rounded-full`, { backgroundColor: '#ef444420' }]}>
                <Text style={tw`text-xs font-semibold text-red-500`}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {loading ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color={accent} />
          <Text style={[tw`mt-3 text-sm`, { color: subtextColor }]}>Loading coaches…</Text>
        </View>
      ) : error ? (
        <View style={tw`flex-1 items-center justify-center px-6`}>
          <MaterialIcons name="wifi-off" size={52} color={isDark ? '#334155' : '#cbd5e1'} />
          <Text style={[tw`mt-4 text-lg font-bold`, { color: isDark ? '#475569' : '#94a3b8' }]}>Could not load coaches</Text>
          <Text style={[tw`mt-1 text-sm text-center`, { color: subtextColor }]}>{error}</Text>
          <TouchableOpacity onPress={() => loadCoaches()} style={[tw`mt-4 px-6 py-3 rounded-xl`, { backgroundColor: accent }]}>
            <Text style={tw`text-white font-bold`}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredCoaches.length === 0 ? (
        <View style={tw`flex-1 items-center justify-center px-6`}>
          <MaterialIcons name="person-search" size={52} color={isDark ? '#334155' : '#cbd5e1'} />
          <Text style={[tw`mt-4 text-lg font-bold`, { color: isDark ? '#475569' : '#94a3b8' }]}>No coaches found</Text>
          <Text style={[tw`mt-1 text-sm text-center`, { color: subtextColor }]}>Try adjusting filters or search.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCoaches}
          renderItem={renderCoachItem}
          keyExtractor={coach => `coach-${coach.id}`}
          contentContainerStyle={tw`px-4 pt-4 pb-10`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadCoaches(true)} tintColor={accent} colors={[accent]} />
          }
          ListHeaderComponent={
            <Text style={[tw`text-xs font-semibold uppercase tracking-wider mb-3`, { color: subtextColor }]}>
              {filteredCoaches.length} professional{filteredCoaches.length !== 1 ? 's' : ''} available
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};
