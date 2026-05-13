import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import * as coachService from '../../services/coachService';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
}

const EXERCISE_SUGGESTIONS = [
  { id: '1', name: 'Barbell Back Squat', category: 'Legs' },
  { id: '2', name: 'Bench Press', category: 'Chest' },
  { id: '3', name: 'Deadlift', category: 'Back' },
  { id: '4', name: 'Pull-Ups', category: 'Back' },
  { id: '5', name: 'Overhead Press', category: 'Shoulders' },
  { id: '6', name: 'Romanian Deadlift', category: 'Legs' },
  { id: '7', name: 'Dumbbell Row', category: 'Back' },
  { id: '8', name: 'Leg Press', category: 'Legs' },
  { id: '9', name: 'Dumbbell Curl', category: 'Arms' },
  { id: '10', name: 'Tricep Pushdown', category: 'Arms' },
  { id: '11', name: 'Lateral Raise', category: 'Shoulders' },
  { id: '12', name: 'Lunges', category: 'Legs' },
  { id: '13', name: 'Cable Fly', category: 'Chest' },
  { id: '14', name: 'Lat Pulldown', category: 'Back' },
];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Map full-name days from backend → short labels used in the UI
function mapScheduleToUI(weeklySchedule: any[]): Record<string, Exercise[]> {
  const result: Record<string, Exercise[]> = {};
  weeklySchedule.forEach((dayEntry: any) => {
    const idx = DAY_FULL_NAMES.indexOf((dayEntry.day || '').toLowerCase());
    if (idx === -1) return;
    const label = DAY_LABELS[idx];
    result[label] = (dayEntry.exercises || []).map((ex: any, i: number) => ({
      id: `${label}-${i}-${Date.now()}`,
      name: ex.name || ex.exercise || '',
      sets: ex.sets || 3,
      reps: ex.reps || '10',
      rest: ex.restSeconds ? `${ex.restSeconds}s` : ex.rest || '60s',
      notes: ex.notes || ex.muscle_group || '',
    }));
  });
  return result;
}

export const CoachWorkoutPlanScreen = ({ navigation, route }: any) => {
  const { clientId, clientName, existingPlan, autoGenerate } = route?.params ?? {};
  const { isDark, accent } = useTheme();

  const [planName, setPlanName] = useState('');
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [dayExercises, setDayExercises] = useState<Record<string, Exercise[]>>({});
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const editingPlanId: number | null = existingPlan?.id ?? null;

  useEffect(() => {
    if (existingPlan) {
      setPlanName(existingPlan.planName || `${existingPlan.goal || 'Workout'} Plan`);
      const mapped = mapScheduleToUI(existingPlan.weeklySchedule || []);
      setDayExercises(mapped);
    }
  }, []);

  useEffect(() => {
    if (autoGenerate && clientId && !existingPlan) {
      handleGenerateWithAI();
    }
  }, []);

  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';

  const getDayExercises = (day: string): Exercise[] => dayExercises[day] || [];

  const addExercise = (ex: { id: string; name: string; category: string }) => {
    const newEx: Exercise = { id: ex.id + Date.now(), name: ex.name, sets: 3, reps: '10', rest: '60s' };
    setDayExercises(prev => ({ ...prev, [selectedDay]: [...(prev[selectedDay] || []), newEx] }));
    setShowExercisePicker(false);
  };

  const removeExercise = (day: string, exId: string) => {
    setDayExercises(prev => ({ ...prev, [day]: (prev[day] || []).filter(e => e.id !== exId) }));
  };

  const updateExercise = (day: string, exId: string, field: keyof Exercise, value: any) => {
    setDayExercises(prev => ({
      ...prev,
      [day]: (prev[day] || []).map(e => e.id === exId ? { ...e, [field]: value } : e),
    }));
  };

  const handleGenerateWithAI = async () => {
    if (!clientId) {
      Alert.alert('No Client', 'Select a client first to generate a plan.');
      return;
    }
    setIsGenerating(true);
    try {
      const { plan } = await coachService.generateWorkoutForClient(Number(clientId));
      if (plan) {
        setPlanName(plan.planName || `${plan.goal || 'Workout'} Plan`);
        setDayExercises(mapScheduleToUI(plan.weeklySchedule || []));
        Alert.alert('Plan Generated', 'The AI plan has been loaded. You can review and edit it before saving.');
      }
    } catch (err: any) {
      Alert.alert('Generation Failed', err?.message || 'Could not generate a plan. Make sure the client has completed their profile.');
    } finally {
      setIsGenerating(false);
    }
  };

  const buildWeeklySchedule = () =>
    DAY_LABELS.map((label, i) => {
      const exs = dayExercises[label] || [];
      return {
        day: DAY_FULL_NAMES[i],
        isRestDay: exs.length === 0,
        exercises: exs.map(e => ({
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          restSeconds: parseInt(e.rest, 10) || 60,
          notes: e.notes,
        })),
      };
    });

  const handleSave = async () => {
    if (!planName.trim()) {
      Alert.alert('Missing Info', 'Please enter a plan name.');
      return;
    }
    setIsSaving(true);
    try {
      const weeklySchedule = buildWeeklySchedule();

      if (editingPlanId) {
        // Edit existing plan
        await coachService.updateClientWorkoutPlan(editingPlanId, { weeklySchedule, planName });
        Alert.alert('Plan Updated', `Workout plan "${planName}" has been updated.`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else if (clientId) {
        // Assign new plan manually
        await coachService.assignWorkoutToClient(Number(clientId), { planName, days: buildWeeklySchedule() });
        Alert.alert('Plan Assigned', `Workout plan "${planName}" has been assigned to ${clientName}.`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Plan Saved', `Workout plan "${planName}" has been saved as a template.`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch {
      Alert.alert('Error', 'Failed to save the plan. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center justify-between px-4 py-3`, { borderBottomWidth: 1, borderColor, backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-1`}>
          <MaterialIcons name="arrow-back" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
        </TouchableOpacity>
        <View style={tw`items-center`}>
          <Text style={[tw`text-base font-bold`, { color: textPrimary }]}>
            {editingPlanId ? 'Edit Workout Plan' : 'Workout Plan Builder'}
          </Text>
          {clientName && <Text style={[tw`text-xs`, { color: subtextColor }]}>for {clientName}</Text>}
        </View>
        <TouchableOpacity onPress={handleSave} disabled={isSaving} style={[tw`px-4 py-2 rounded-xl`, { backgroundColor: isSaving ? accent + '80' : accent }]}>
          <Text style={tw`text-sm text-white font-bold`}>{isSaving ? '...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-4 pb-8`}>
        {/* AI Generate banner */}
        {clientId && (
          <TouchableOpacity
            onPress={handleGenerateWithAI}
            disabled={isGenerating}
            style={[tw`flex-row items-center justify-center gap-2 p-3.5 rounded-2xl mb-4`, {
              backgroundColor: isDark ? '#1e1b4b' : '#ede9fe',
              borderWidth: 1,
              borderColor: isDark ? '#4f46e5' : '#a5b4fc',
            }]}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <MaterialIcons name="auto-awesome" size={18} color="#6366f1" />
            )}
            <Text style={[tw`text-sm font-bold`, { color: '#6366f1' }]}>
              {isGenerating ? 'Generating plan…' : editingPlanId ? 'Regenerate with AI' : 'Generate with AI'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Plan name */}
        <View style={[tw`p-4 rounded-2xl mb-4`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
          <TextInput
            style={[tw`text-lg font-bold`, { color: textPrimary }]}
            placeholder="Plan name (e.g. Hypertrophy Phase 1)..."
            placeholderTextColor={subtextColor}
            value={planName}
            onChangeText={setPlanName}
          />
        </View>

        {/* Day selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`-mx-4 mb-4`} contentContainerStyle={tw`px-4 gap-2`}>
          {DAY_LABELS.map(day => {
            const count = getDayExercises(day).length;
            const isActive = selectedDay === day;
            return (
              <TouchableOpacity
                key={day}
                onPress={() => setSelectedDay(day)}
                style={[tw`items-center px-3 py-2.5 rounded-xl min-w-14`, {
                  backgroundColor: isActive ? accent : cardBg,
                  borderWidth: 1,
                  borderColor: isActive ? accent : borderColor,
                }]}
              >
                <Text style={[tw`text-xs font-bold`, { color: isActive ? '#fff' : textPrimary }]}>{day}</Text>
                <Text style={[tw`text-xs mt-0.5`, { color: isActive ? 'rgba(255,255,255,0.7)' : subtextColor }]}>
                  {count > 0 ? `${count} ex.` : 'Rest'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Exercises for selected day */}
        <Text style={[tw`text-sm font-bold mb-3`, { color: textPrimary }]}>{selectedDay} — Exercises</Text>

        {getDayExercises(selectedDay).length === 0 && (
          <View style={[tw`p-6 rounded-xl items-center mb-4`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
            <MaterialIcons name="fitness-center" size={32} color={subtextColor} />
            <Text style={[tw`text-sm mt-2`, { color: subtextColor }]}>No exercises yet. Add rest day or exercises below.</Text>
          </View>
        )}

        {getDayExercises(selectedDay).map((ex) => (
          <View key={ex.id} style={[tw`p-4 rounded-xl mb-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <Text style={[tw`text-sm font-bold flex-1`, { color: textPrimary }]}>{ex.name}</Text>
              <TouchableOpacity onPress={() => removeExercise(selectedDay, ex.id)}>
                <MaterialIcons name="close" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
            {ex.notes ? (
              <Text style={[tw`text-xs mb-2`, { color: subtextColor }]}>{ex.notes}</Text>
            ) : null}
            <View style={tw`flex-row gap-3`}>
              {[
                { label: 'Sets', field: 'sets' as const, value: String(ex.sets), keyType: 'number-pad' as const },
                { label: 'Reps', field: 'reps' as const, value: ex.reps, keyType: 'default' as const },
                { label: 'Rest', field: 'rest' as const, value: ex.rest, keyType: 'default' as const },
              ].map(f => (
                <View key={f.label} style={[tw`flex-1 rounded-lg p-2`, { backgroundColor: isDark ? '#0d0d1a' : '#f1f5f9' }]}>
                  <Text style={[tw`text-xs`, { color: subtextColor }]}>{f.label}</Text>
                  <TextInput
                    style={[tw`text-sm font-bold mt-0.5`, { color: textPrimary }]}
                    value={f.value}
                    onChangeText={v => updateExercise(selectedDay, ex.id, f.field, f.field === 'sets' ? parseInt(v) || 0 : v)}
                    keyboardType={f.keyType}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          onPress={() => setShowExercisePicker(!showExercisePicker)}
          style={[tw`flex-row items-center justify-center gap-2 p-3 rounded-xl mb-4`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}
        >
          <MaterialIcons name="add" size={20} color={accent} />
          <Text style={[tw`text-sm font-bold`, { color: accent }]}>Add Exercise</Text>
        </TouchableOpacity>

        {showExercisePicker && (
          <View style={[tw`rounded-2xl overflow-hidden mb-4`, { borderWidth: 1, borderColor }]}>
            {EXERCISE_SUGGESTIONS.map(ex => (
              <TouchableOpacity
                key={ex.id}
                onPress={() => addExercise(ex)}
                style={[tw`flex-row items-center p-4`, { backgroundColor: cardBg, borderBottomWidth: 1, borderColor }]}
              >
                <View style={[tw`w-8 h-8 rounded-lg items-center justify-center mr-3`, { backgroundColor: accent + '14' }]}>
                  <MaterialIcons name="fitness-center" size={16} color={accent} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{ex.name}</Text>
                  <Text style={[tw`text-xs`, { color: subtextColor }]}>{ex.category}</Text>
                </View>
                <MaterialIcons name="add-circle" size={22} color={accent} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
