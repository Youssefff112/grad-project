import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';

const MOCK_CHECKINS = [
  { date: 'Apr 14', weight: 82.5, bodyFat: 18.2, notes: 'Feeling strong this week' },
  { date: 'Apr 7', weight: 83.1, bodyFat: 18.8, notes: 'Struggled with diet mid-week' },
  { date: 'Mar 31', weight: 84.0, bodyFat: 19.5, notes: 'Good energy levels' },
];

const MOCK_ASSIGNED_PLANS = [
  { id: '1', type: 'workout', name: 'Hypertrophy Program Phase 2', assigned: 'Apr 1', active: true },
  { id: '2', type: 'meal', name: 'High Protein Cut Plan', assigned: 'Mar 15', active: true },
  { id: '3', type: 'workout', name: 'Foundation Strength', assigned: 'Jan 10', active: false },
];

export const CoachClientDetailScreen = ({ navigation, route }: any) => {
  const { clientId, clientName = 'Client' } = route.params ?? {};
  const { isDark, accent } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'checkins'>('overview');

  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';

  const latestCheckin = MOCK_CHECKINS[0];
  const prevCheckin = MOCK_CHECKINS[1];
  const weightDiff = latestCheckin.weight - prevCheckin.weight;
  const fatDiff = latestCheckin.bodyFat - prevCheckin.bodyFat;

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center px-4 py-3 justify-between`, { borderBottomWidth: 1, borderColor: borderColor, backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-1`}>
          <MaterialIcons name="arrow-back" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>{clientName}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Chat', { conversationName: clientName })}>
          <MaterialIcons name="chat-bubble" size={24} color={accent} />
        </TouchableOpacity>
      </View>

      {/* Client hero */}
      <View style={[tw`px-4 py-5 flex-row items-center gap-4`, { borderBottomWidth: 1, borderColor: borderColor }]}>
        <View style={[tw`w-16 h-16 rounded-full items-center justify-center`, { backgroundColor: accent + '20' }]}>
          <MaterialIcons name="person" size={32} color={accent} />
        </View>
        <View style={tw`flex-1`}>
          <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>{clientName}</Text>
          <Text style={[tw`text-sm`, { color: subtextColor }]}>Weight Loss · Joined Jan 2026</Text>
          <View style={[tw`flex-row items-center gap-1 mt-1`]}>
            <View style={[tw`px-2 py-0.5 rounded-full`, { backgroundColor: '#10b98120' }]}>
              <Text style={tw`text-xs font-bold text-green-500`}>Active</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={[tw`flex-row px-4 pt-3 pb-0 gap-2`, { borderBottomWidth: 1, borderColor: borderColor }]}>
        {(['overview', 'plans', 'checkins'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[tw`flex-1 items-center py-2 rounded-t-lg`, {
              borderBottomWidth: 2,
              borderColor: activeTab === tab ? accent : 'transparent',
            }]}
          >
            <Text style={[tw`text-xs font-bold capitalize`, { color: activeTab === tab ? accent : subtextColor }]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-4 pb-8`}>
        {activeTab === 'overview' && (
          <View style={tw`gap-4`}>
            {/* Progress stats */}
            <View style={tw`flex-row gap-3`}>
              {[
                { label: 'Current Weight', value: `${latestCheckin.weight} kg`, delta: weightDiff, icon: 'monitor-weight' as const },
                { label: 'Body Fat', value: `${latestCheckin.bodyFat}%`, delta: fatDiff, icon: 'percent' as const },
              ].map(stat => (
                <View key={stat.label} style={[tw`flex-1 p-4 rounded-xl`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
                  <MaterialIcons name={stat.icon} size={18} color={accent} style={tw`mb-1`} />
                  <Text style={[tw`text-xl font-black`, { color: textPrimary }]}>{stat.value}</Text>
                  <Text style={[tw`text-xs`, { color: subtextColor }]}>{stat.label}</Text>
                  <View style={tw`flex-row items-center mt-1`}>
                    <MaterialIcons
                      name={stat.delta < 0 ? 'trending-down' : 'trending-up'}
                      size={14}
                      color={stat.delta < 0 ? '#10b981' : '#ef4444'}
                    />
                    <Text style={[tw`text-xs ml-0.5 font-bold`, { color: stat.delta < 0 ? '#10b981' : '#ef4444' }]}>
                      {stat.delta > 0 ? '+' : ''}{stat.delta.toFixed(1)} this week
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Goal progress */}
            <View style={[tw`p-4 rounded-xl`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}>
              <View style={tw`flex-row items-center justify-between mb-2`}>
                <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>Overall Goal Progress</Text>
                <Text style={[tw`text-xl font-black`, { color: accent }]}>78%</Text>
              </View>
              <View style={[tw`w-full h-2 rounded-full overflow-hidden`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                <View style={{ width: '78%', height: '100%', borderRadius: 4, backgroundColor: accent }} />
              </View>
              <Text style={[tw`text-xs mt-2`, { color: subtextColor }]}>On track to reach goal by June 2026</Text>
            </View>

            {/* Quick actions */}
            <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>Quick Actions</Text>
            <View style={tw`flex-row gap-3`}>
              {[
                { label: 'Create Meal Plan', icon: 'restaurant-menu' as const, route: 'CoachMealPlan', params: { clientId, clientName } },
                { label: 'Create Workout', icon: 'fitness-center' as const, route: 'CoachWorkoutPlan', params: { clientId, clientName } },
              ].map(a => (
                <TouchableOpacity
                  key={a.label}
                  onPress={() => navigation.navigate(a.route, a.params)}
                  style={[tw`flex-1 p-4 rounded-xl items-center`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}
                >
                  <View style={[tw`w-10 h-10 rounded-xl items-center justify-center mb-2`, { backgroundColor: accent + '14' }]}>
                    <MaterialIcons name={a.icon} size={20} color={accent} />
                  </View>
                  <Text style={[tw`text-xs font-bold text-center`, { color: textPrimary }]}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'plans' && (
          <View style={tw`gap-3`}>
            <View style={tw`flex-row justify-end`}>
              <TouchableOpacity
                onPress={() => navigation.navigate('CoachMealPlan', { clientId, clientName })}
                style={[tw`flex-row items-center gap-1 px-4 py-2 rounded-xl`, { backgroundColor: accent }]}
              >
                <MaterialIcons name="add" size={16} color="white" />
                <Text style={tw`text-xs text-white font-bold`}>Add Plan</Text>
              </TouchableOpacity>
            </View>
            {MOCK_ASSIGNED_PLANS.map(plan => (
              <View key={plan.id} style={[tw`p-4 rounded-xl`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
                <View style={tw`flex-row items-center gap-3`}>
                  <View style={[tw`w-10 h-10 rounded-xl items-center justify-center`, { backgroundColor: accent + '14' }]}>
                    <MaterialIcons name={plan.type === 'workout' ? 'fitness-center' : 'restaurant-menu'} size={18} color={accent} />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{plan.name}</Text>
                    <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>Assigned {plan.assigned}</Text>
                  </View>
                  <View style={[tw`px-2 py-0.5 rounded-full`, { backgroundColor: plan.active ? '#10b98120' : isDark ? '#1e293b' : '#e2e8f0' }]}>
                    <Text style={[tw`text-xs font-bold`, { color: plan.active ? '#10b981' : subtextColor }]}>
                      {plan.active ? 'Active' : 'Past'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'checkins' && (
          <View style={tw`gap-3`}>
            {MOCK_CHECKINS.map((checkin, i) => (
              <View key={i} style={[tw`p-4 rounded-xl`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
                <View style={tw`flex-row items-center justify-between mb-3`}>
                  <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{checkin.date}</Text>
                  {i === 0 && (
                    <View style={[tw`px-2 py-0.5 rounded-full`, { backgroundColor: accent + '14' }]}>
                      <Text style={[tw`text-xs font-bold`, { color: accent }]}>Latest</Text>
                    </View>
                  )}
                </View>
                <View style={tw`flex-row gap-4 mb-2`}>
                  <View>
                    <Text style={[tw`text-xs`, { color: subtextColor }]}>Weight</Text>
                    <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>{checkin.weight} kg</Text>
                  </View>
                  <View>
                    <Text style={[tw`text-xs`, { color: subtextColor }]}>Body Fat</Text>
                    <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>{checkin.bodyFat}%</Text>
                  </View>
                </View>
                {checkin.notes && (
                  <Text style={[tw`text-xs leading-relaxed`, { color: subtextColor }]}>"{checkin.notes}"</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
