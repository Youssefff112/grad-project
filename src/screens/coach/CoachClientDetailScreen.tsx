import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import * as progressService from '../../services/progressService';

interface Measurement {
  date: string;
  weight?: number;
  bodyFat?: number;
  notes?: string;
}

export const CoachClientDetailScreen = ({ navigation, route }: any) => {
  const { clientId, clientName = 'Client' } = route.params ?? {};
  const { isDark, accent } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'checkins'>('overview');
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { measurements: data } = await progressService.getMeasurements();
        const mapped: Measurement[] = (data || []).map((m: any) => ({
          date: new Date(m.recordedAt || m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          weight: m.weight,
          bodyFat: m.bodyFat,
          notes: m.notes,
        }));
        setMeasurements(mapped.reverse());
      } catch {
        setMeasurements([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [clientId]);

  const latestCheckin = measurements[0];
  const prevCheckin = measurements[1];
  const weightDiff = latestCheckin && prevCheckin && latestCheckin.weight != null && prevCheckin.weight != null
    ? latestCheckin.weight - prevCheckin.weight
    : null;
  const fatDiff = latestCheckin && prevCheckin && latestCheckin.bodyFat != null && prevCheckin.bodyFat != null
    ? latestCheckin.bodyFat - prevCheckin.bodyFat
    : null;

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
          <Text style={[tw`text-sm`, { color: subtextColor }]}>Client #{clientId}</Text>
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

      {loading ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      ) : (
        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-4 pb-8`}>
          {activeTab === 'overview' && (
            <View style={tw`gap-4`}>
              {latestCheckin ? (
                <View style={tw`flex-row gap-3`}>
                  {[
                    { label: 'Current Weight', value: latestCheckin.weight ? `${latestCheckin.weight} kg` : '—', delta: weightDiff, icon: 'monitor-weight' as const },
                    { label: 'Body Fat', value: latestCheckin.bodyFat ? `${latestCheckin.bodyFat}%` : '—', delta: fatDiff, icon: 'percent' as const },
                  ].map(stat => (
                    <View key={stat.label} style={[tw`flex-1 p-4 rounded-xl`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
                      <MaterialIcons name={stat.icon} size={18} color={accent} style={tw`mb-1`} />
                      <Text style={[tw`text-xl font-black`, { color: textPrimary }]}>{stat.value}</Text>
                      <Text style={[tw`text-xs`, { color: subtextColor }]}>{stat.label}</Text>
                      {stat.delta != null && (
                        <View style={tw`flex-row items-center mt-1`}>
                          <MaterialIcons
                            name={stat.delta < 0 ? 'trending-down' : 'trending-up'}
                            size={14}
                            color={stat.delta < 0 ? '#10b981' : '#ef4444'}
                          />
                          <Text style={[tw`text-xs ml-0.5 font-bold`, { color: stat.delta < 0 ? '#10b981' : '#ef4444' }]}>
                            {stat.delta > 0 ? '+' : ''}{stat.delta.toFixed(1)} since last
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={[tw`p-5 rounded-xl items-center`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
                  <MaterialIcons name="monitor-weight" size={32} color={subtextColor} />
                  <Text style={[tw`text-sm mt-2`, { color: subtextColor }]}>No measurements recorded yet</Text>
                </View>
              )}

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
              <View style={[tw`p-6 rounded-xl items-center`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
                <MaterialIcons name="inventory" size={32} color={subtextColor} />
                <Text style={[tw`text-sm mt-2 text-center`, { color: subtextColor }]}>
                  Plans assigned via the Coach Workout{'\n'}and Meal Plan screens
                </Text>
              </View>
            </View>
          )}

          {activeTab === 'checkins' && (
            <View style={tw`gap-3`}>
              {measurements.length === 0 && (
                <View style={[tw`p-8 rounded-xl items-center`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
                  <MaterialIcons name="assignment" size={36} color={isDark ? '#334155' : '#cbd5e1'} />
                  <Text style={[tw`text-sm mt-2`, { color: subtextColor }]}>No check-ins recorded yet</Text>
                </View>
              )}
              {measurements.map((checkin, i) => (
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
                    {checkin.weight != null && (
                      <View>
                        <Text style={[tw`text-xs`, { color: subtextColor }]}>Weight</Text>
                        <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>{checkin.weight} kg</Text>
                      </View>
                    )}
                    {checkin.bodyFat != null && (
                      <View>
                        <Text style={[tw`text-xs`, { color: subtextColor }]}>Body Fat</Text>
                        <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>{checkin.bodyFat}%</Text>
                      </View>
                    )}
                  </View>
                  {checkin.notes && (
                    <Text style={[tw`text-xs leading-relaxed`, { color: subtextColor }]}>"{checkin.notes}"</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};
