import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/Button';
import type { WorkoutSession } from '../../services/workoutService';
import {
  formatDurationSeconds,
  getDurationSeconds,
  getExerciseName,
  getFormScore,
  getPlanDayLabel,
  getRedoLabel,
  getSessionContextLine,
  getSessionMeta,
  getSessionTitle,
  getTrackAgainButtonLabel,
  getWorkoutFocusLabel,
} from '../../utils/workoutSessionDisplay';

export const WorkoutSessionDetailScreen = ({ navigation, route }: any) => {
  const { isDark, accent } = useTheme();

  const readOnly: boolean = route?.params?.readOnly ?? false;

  const session: WorkoutSession = route?.params?.session ?? {
    id: 0,
    userId: 0,
    date: new Date().toISOString(),
    day: 'monday',
    exercises: [],
    duration: 0,
    calories: null,
    notes: '',
    rating: null,
    status: 'completed',
  };

  const meta = getSessionMeta(session);
  const exerciseList = Array.isArray(session.exercises) ? session.exercises : [];
  const performanceScore = getFormScore(session);
  const durationSeconds = getDurationSeconds(session);
  const redoLabel = getRedoLabel(session);

  const bg = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = '#94a3b8';

  const dateLabel = session.date
    ? new Date(session.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : '--';

  const metrics = [
    {
      icon: 'timer' as const,
      label: 'Duration',
      value: formatDurationSeconds(durationSeconds),
      color: '#3b82f6',
    },
    {
      icon: 'fitness-center' as const,
      label: meta?.isHold ? 'Hold Time' : 'Total Reps',
      value: meta
        ? (meta.isHold ? `${meta.holdSeconds ?? meta.totalReps}s` : String(meta.totalReps))
        : (exerciseList[0]?.reps ?? '--'),
      color: accent,
    },
    {
      icon: 'repeat' as const,
      label: 'Sets Completed',
      value: meta
        ? `${meta.completedSets} / ${meta.targetSets}`
        : exerciseList[0]?.sets != null
          ? String(exerciseList[0].sets)
          : '--',
      color: '#8b5cf6',
    },
    {
      icon: 'star' as const,
      label: 'Rating',
      value: session.rating != null ? `${session.rating} / 5` : '--',
      color: '#f59e0b',
    },
  ];

  const scoreMetrics = meta
    ? [
        { label: 'Performance Score', value: `${meta.performanceScore}%`, highlight: true },
        { label: 'Form Accuracy', value: `${meta.formAccuracy}%` },
        { label: 'Average Form', value: `${meta.avgFormScore}%` },
        { label: 'Peak Form', value: `${meta.peakFormScore}%` },
        ...(meta.isHold
          ? []
          : [
              { label: 'Correct Reps', value: String(meta.correctReps) },
              { label: 'Incorrect Reps', value: String(meta.incorrectReps) },
            ]),
      ]
    : [];

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bg }]}>
      <View
        style={[
          tw`flex-row items-center p-4 justify-between z-10`,
          { backgroundColor: bg, borderBottomWidth: 1, borderColor: cardBorder },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={tw`flex size-12 shrink-0 items-center justify-center`}
        >
          <MaterialIcons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold leading-tight tracking-tight flex-1 text-center`, { color: textPrimary }]}>
          Session Details
        </Text>
        <View style={tw`flex size-12 items-center justify-center`} />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" style={tw`flex-1`} contentContainerStyle={tw`pb-8`}>
        <View
          style={[
            tw`mx-4 mt-6 p-6 rounded-2xl`,
            { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' },
          ]}
        >
          <View style={tw`flex-row items-center justify-between mb-2`}>
            <View style={tw`flex-1 pr-4`}>
              <Text style={[tw`text-2xl font-bold`, { color: textPrimary }]}>
                {getSessionTitle(session)}
              </Text>
              <Text style={[tw`text-sm mt-2`, { color: textSecondary }]}>
                {dateLabel}
              </Text>
              <View style={tw`flex-row flex-wrap gap-2 mt-3`}>
                {getPlanDayLabel(session) !== '—' && (
                  <View style={[tw`px-3 py-1 rounded-full`, { backgroundColor: accent + '25' }]}>
                    <Text style={[tw`text-xs font-bold uppercase`, { color: accent }]}>
                      {getPlanDayLabel(session)}
                    </Text>
                  </View>
                )}
                {getWorkoutFocusLabel(session) && (
                  <View style={[tw`px-3 py-1 rounded-full`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                    <Text style={[tw`text-xs font-bold uppercase`, { color: textSecondary }]}>
                      {getWorkoutFocusLabel(session)}
                    </Text>
                  </View>
                )}
                {redoLabel && (
                  <View style={[tw`px-3 py-1 rounded-full`, { backgroundColor: '#f59e0b20' }]}>
                    <Text style={[tw`text-xs font-bold uppercase`, { color: '#f59e0b' }]}>
                      {redoLabel}
                    </Text>
                  </View>
                )}
                <View style={[tw`px-3 py-1 rounded-full`, { backgroundColor: accent + '25' }]}>
                  <Text style={[tw`text-xs font-bold uppercase`, { color: accent }]}>
                    {session.status === 'completed' ? 'Completed' : session.status ?? '--'}
                  </Text>
                </View>
              </View>
            </View>

            {performanceScore != null && (
              <View style={tw`items-end`}>
                <Text style={[tw`text-4xl font-black`, { color: accent }]}>
                  {performanceScore}%
                </Text>
                <Text style={[tw`text-xs font-bold uppercase mt-1`, { color: accent }]}>
                  Score
                </Text>
              </View>
            )}
          </View>

          <Text style={[tw`text-sm mt-3`, { color: textSecondary }]}>
            Exercise tracked:{' '}
            <Text style={{ color: textPrimary, fontWeight: '700' }}>{getExerciseName(session)}</Text>
          </Text>
          {getSessionContextLine(session) ? (
            <Text style={[tw`text-xs mt-1`, { color: textSecondary }]}>
              {getSessionContextLine(session)}
            </Text>
          ) : null}
        </View>

        <View style={tw`mx-4 mt-6`}>
          <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
            Session Metrics
          </Text>
          <View style={tw`gap-3`}>
            {metrics.map((metric, i) => (
              <View
                key={i}
                style={[
                  tw`flex-row items-center p-4 rounded-xl gap-4`,
                  { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder },
                ]}
              >
                <View style={[tw`w-12 h-12 rounded-lg items-center justify-center`, { backgroundColor: metric.color + '18' }]}>
                  <MaterialIcons name={metric.icon} size={24} color={metric.color} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-xs font-bold uppercase tracking-wider`, { color: textSecondary }]}>
                    {metric.label}
                  </Text>
                  <Text style={[tw`text-lg font-bold mt-1`, { color: textPrimary }]}>
                    {metric.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {scoreMetrics.length > 0 && (
          <View style={tw`mx-4 mt-6`}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
              Form Analysis
            </Text>
            <View style={[tw`rounded-xl p-4 gap-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}>
              {scoreMetrics.map((item, i) => (
                <View key={i} style={tw`flex-row items-center justify-between`}>
                  <Text style={[tw`text-sm`, { color: textSecondary }]}>{item.label}</Text>
                  <Text style={[tw`text-sm font-black`, { color: item.highlight ? accent : textPrimary }]}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {meta?.topMistakes && meta.topMistakes.length > 0 && (
          <View style={tw`mx-4 mt-6`}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
              Top Form Issues
            </Text>
            <View style={tw`gap-2`}>
              {meta.topMistakes.map((mistake, i) => (
                <View
                  key={i}
                  style={[tw`p-4 rounded-xl flex-row gap-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}
                >
                  <Text style={[tw`text-xs font-black mt-0.5`, { color: '#ef4444' }]}>{mistake.count}×</Text>
                  <Text style={[tw`text-sm flex-1 leading-5`, { color: textPrimary }]}>{mistake.msg}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {exerciseList.length > 0 && (
          <View style={tw`mx-4 mt-6 mb-4`}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
              Exercise Logged
            </Text>
            <View style={tw`gap-3`}>
              {exerciseList.map((ex, i) => (
                <View
                  key={i}
                  style={[tw`p-4 rounded-xl`, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}
                >
                  <Text style={[tw`font-bold text-base`, { color: textPrimary }]}>{ex.name}</Text>
                  <Text style={[tw`text-xs mt-1`, { color: textSecondary }]}>
                    {meta?.isHold
                      ? `Hold: ${meta.holdSeconds ?? ex.reps}s · ${ex.sets} set${ex.sets !== 1 ? 's' : ''}`
                      : `${ex.sets} set${ex.sets !== 1 ? 's' : ''} × ${ex.reps} reps`}
                    {ex.restTime ? ` · ${ex.restTime}s rest` : ''}
                  </Text>
                  <Text style={[tw`text-xs mt-1`, { color: textSecondary }]}>
                    {getSessionContextLine(session) || getPlanDayLabel(session)}
                    {redoLabel ? ` · ${redoLabel}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {!readOnly && (
        <View style={[tw`px-4 py-4 border-t`, { backgroundColor: bg, borderColor: cardBorder }]}>
          <Button
            title={getTrackAgainButtonLabel(session)}
            variant="primary"
            onPress={() => {
              const m = getSessionMeta(session);
              navigation.navigate('Calibration', {
                exerciseName: getExerciseName(session),
                workoutPlanId: session.workoutPlanId,
                workoutDay: m?.planDay || session.day,
                workoutFocus: m?.planFocus || getWorkoutFocusLabel(session) || undefined,
              });
            }}
            containerStyle={tw`w-full`}
          />
        </View>
      )}
    </SafeAreaView>
  );
};
