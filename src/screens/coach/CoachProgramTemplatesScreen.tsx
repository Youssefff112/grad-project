import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import * as coachService from '../../services/coachService';

type TemplateType = 'workout' | 'meal';

interface Template {
  id: string | number;
  type: TemplateType;
  name: string;
  description: string;
  clientCount: number;
  createdAt: string;
  rawPlan?: any;
}

export const CoachProgramTemplatesScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const [activeTab, setActiveTab] = useState<TemplateType>('workout');
  const [workoutPlans, setWorkoutPlans] = useState<Template[]>([]);
  const [mealPlans, setMealPlans] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';

  const loadTemplates = useCallback(async () => {
    try {
      // Fetch all clients and then their plans — aggregate unique plans as templates
      const { clients } = await coachService.getMyClients();

      // Collect unique workout plans
      const workoutSeen = new Map<string, Template>();
      const mealSeen = new Map<string, Template>();

      await Promise.all(
        (clients || []).slice(0, 20).map(async (client) => {
          try {
            const [wp, dp] = await Promise.all([
              coachService.getClientWorkoutPlan(client.userId),
              coachService.getClientDietPlan(client.userId),
            ]);

            if (wp.plan && wp.plan.id) {
              const key = String(wp.plan.id);
              if (!workoutSeen.has(key)) {
                workoutSeen.set(key, {
                  id: wp.plan.id,
                  type: 'workout',
                  name: wp.plan.planName || `Workout Plan #${wp.plan.id}`,
                  description: wp.plan.weeklySchedule
                    ? `${wp.plan.weeklySchedule.length} training days per week`
                    : 'Custom workout plan',
                  clientCount: 1,
                  createdAt: wp.plan.createdAt || wp.plan.updatedAt || new Date().toISOString(),
                  rawPlan: wp.plan,
                });
              } else {
                const t = workoutSeen.get(key)!;
                workoutSeen.set(key, { ...t, clientCount: t.clientCount + 1 });
              }
            }

            if (dp.plan && dp.plan.id) {
              const key = String(dp.plan.id);
              if (!mealSeen.has(key)) {
                mealSeen.set(key, {
                  id: dp.plan.id,
                  type: 'meal',
                  name: dp.plan.planName || `Meal Plan #${dp.plan.id}`,
                  description: dp.plan.dailyCalorieTarget
                    ? `${dp.plan.dailyCalorieTarget} kcal/day · ${dp.plan.macronutrients?.protein ?? '--'}g protein`
                    : 'Custom nutrition plan',
                  clientCount: 1,
                  createdAt: dp.plan.createdAt || dp.plan.updatedAt || new Date().toISOString(),
                  rawPlan: dp.plan,
                });
              } else {
                const t = mealSeen.get(key)!;
                mealSeen.set(key, { ...t, clientCount: t.clientCount + 1 });
              }
            }
          } catch { /* skip this client */ }
        })
      );

      setWorkoutPlans(Array.from(workoutSeen.values()));
      setMealPlans(Array.from(mealSeen.values()));
    } catch {
      // keep previous
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadTemplates(); }, [loadTemplates]));

  const onRefresh = () => { setRefreshing(true); loadTemplates(); };

  const filtered = activeTab === 'workout' ? workoutPlans : mealPlans;

  const handleAssign = (template: Template) => {
    Alert.alert(
      'Assign Plan',
      `Assign "${template.name}" to a client?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Go to Client List', onPress: () => navigation.navigate('CoachClientList') },
      ]
    );
  };

  const handleCreate = () => {
    if (activeTab === 'workout') {
      navigation.navigate('CoachWorkoutPlan');
    } else {
      navigation.navigate('CoachMealPlan');
    }
  };

  const handleEdit = (template: Template) => {
    if (activeTab === 'workout') {
      navigation.navigate('CoachWorkoutPlan', { existingPlan: template.rawPlan });
    } else {
      navigation.navigate('CoachMealPlan', { existingPlan: template.rawPlan });
    }
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center justify-between px-4 py-3`, { borderBottomWidth: 1, borderColor: borderColor, backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-1`}>
          <MaterialIcons name="arrow-back" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>Program Templates</Text>
        <TouchableOpacity onPress={handleCreate} style={[tw`flex-row items-center gap-1 px-3 py-1.5 rounded-xl`, { backgroundColor: accent }]}>
          <MaterialIcons name="add" size={16} color="white" />
          <Text style={tw`text-xs text-white font-bold`}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[tw`flex-row px-4 pt-3 gap-2`, { borderBottomWidth: 1, borderColor: borderColor }]}>
        {(['workout', 'meal'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[tw`flex-1 items-center py-2.5 rounded-t-lg`, {
              borderBottomWidth: 2,
              borderColor: activeTab === tab ? accent : 'transparent',
            }]}
          >
            <View style={tw`flex-row items-center gap-1.5`}>
              <MaterialIcons
                name={tab === 'workout' ? 'fitness-center' : 'restaurant-menu'}
                size={16}
                color={activeTab === tab ? accent : subtextColor}
              />
              <Text style={[tw`text-sm font-bold capitalize`, { color: activeTab === tab ? accent : subtextColor }]}>
                {tab === 'workout' ? 'Workout Plans' : 'Meal Plans'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color={accent} />
          <Text style={[tw`text-sm mt-3`, { color: subtextColor }]}>Loading your plans...</Text>
        </View>
      ) : (
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`px-4 py-4 pb-8`}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
        >
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <Text style={[tw`text-xs font-semibold uppercase tracking-wider`, { color: subtextColor }]}>
              {filtered.length} template{filtered.length !== 1 ? 's' : ''}
            </Text>
            <Text style={[tw`text-xs`, { color: subtextColor }]}>Pulled from assigned client plans</Text>
          </View>

          {filtered.map(template => (
            <View key={String(template.id)} style={[tw`p-4 rounded-2xl mb-4`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
              <View style={tw`flex-row items-start gap-3 mb-3`}>
                <View style={[tw`w-10 h-10 rounded-xl items-center justify-center flex-shrink-0`, { backgroundColor: accent + '14' }]}>
                  <MaterialIcons name={template.type === 'workout' ? 'fitness-center' : 'restaurant-menu'} size={20} color={accent} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-base font-bold`, { color: textPrimary }]}>{template.name}</Text>
                  <Text style={[tw`text-xs mt-0.5 leading-relaxed`, { color: subtextColor }]}>{template.description}</Text>
                </View>
              </View>

              <View style={tw`flex-row flex-wrap gap-2 mb-3`}>
                {[
                  { icon: 'group' as const, label: `Assigned to ${template.clientCount} client${template.clientCount !== 1 ? 's' : ''}` },
                  { icon: 'calendar-today' as const, label: new Date(template.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
                ].map(tag => (
                  <View key={tag.label} style={[tw`flex-row items-center gap-1 px-2 py-1 rounded-full`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                    <MaterialIcons name={tag.icon} size={11} color={subtextColor} />
                    <Text style={[tw`text-xs`, { color: subtextColor }]}>{tag.label}</Text>
                  </View>
                ))}
              </View>

              <View style={tw`flex-row gap-2`}>
                <TouchableOpacity
                  onPress={() => handleAssign(template)}
                  style={[tw`flex-1 py-2.5 rounded-xl items-center`, { backgroundColor: accent }]}
                >
                  <Text style={tw`text-xs font-bold text-white`}>Assign to Client</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleEdit(template)}
                  style={[tw`px-4 py-2.5 rounded-xl items-center`, { backgroundColor: accent + '18', borderWidth: 1, borderColor: accent + '30' }]}
                >
                  <MaterialIcons name="edit" size={18} color={accent} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {filtered.length === 0 && (
            <View style={tw`items-center py-16`}>
              <MaterialIcons name="inventory" size={48} color={isDark ? '#334155' : '#cbd5e1'} />
              <Text style={[tw`mt-3 text-base font-bold`, { color: isDark ? '#475569' : '#94a3b8' }]}>No templates yet</Text>
              <Text style={[tw`text-xs text-center mt-1 px-8`, { color: subtextColor }]}>
                Templates are plans you've assigned to clients. Create a new plan and assign it to start building your template library.
              </Text>
              <TouchableOpacity onPress={handleCreate} style={[tw`mt-4 px-6 py-3 rounded-xl`, { backgroundColor: accent }]}>
                <Text style={tw`text-white font-bold`}>
                  {activeTab === 'workout' ? 'Create Workout Plan' : 'Create Meal Plan'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};
