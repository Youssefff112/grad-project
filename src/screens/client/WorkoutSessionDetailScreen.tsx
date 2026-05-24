import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/Button';
import type { WorkoutSession } from '../../services/workoutService';

/** Parse a form-score percentage out of the notes string (e.g. "… Form: 87%") */
const parseFormScore = (notes?: string): string | null => {
  if (!notes) return null;
  const m = notes.match(/Form:\s*(\d+(?:\.\d+)?)%/i);
  return m ? `${Math.round(Number(m[1]))}%` : null;
};

/** Convert raw minutes → "Xh Ym" or "Ym" */
const formatDuration = (mins?: number | null): string => {
  if (!mins) return '--';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

/** Capitalise first letter of every word */
const titleCase = (s: string) =>
  s.replace(/\b\w/g, (c) => c.toUpperCase());

export const WorkoutSessionDetailScreen = ({ navigation, route }: any) => {
  const { isDark, accent } = useTheme();

  const readOnly: boolean = route?.params?.readOnly ?? false;

  // Real WorkoutSession from the API, or a safe mock for development previews
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

  const formScore = parseFormScore(session.notes);
  const exerciseList = Array.isArray(session.exercises) ? session.exercises : [];
  const exerciseCount = exerciseList.length;

  // Best display name: first exercise name, otherwise prettify the weekday
  const sessionTitle =
    exerciseList[0]?.name ||
    (session.day ? titleCase(session.day) : 'Workout');

  const dateLabel = session.date
    ? new Date(session.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : '--';

  const bg = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = '#94a3b8';

  const metrics = [
    {
      icon: 'timer' as const,
      label: 'Duration',
      value: formatDuration(session.duration),
      color: '#3b82f6',
    },
    {
      icon: 'fitness-center' as const,
      label: 'Exercises',
      value: exerciseCount > 0 ? String(exerciseCount) : '--',
      color: accent,
    },
    {
      icon: 'local-fire-department' as const,
      label: 'Calories Burned',
      value: session.calories != null ? `${session.calories} kcal` : '--',
      color: '#f97316',
    },
    {
      icon: 'star' as const,
      label: 'Rating',
      value: session.rating != null ? `${session.rating} / 5` : '--',
      color: '#f59e0b',
    },
  ];

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bg }]}>
      {/* Header */}
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
        <Text
          style={[
            tw`text-lg font-bold leading-tight tracking-tight flex-1 text-center`,
            { color: textPrimary },
          ]}
        >
          Session Details
        </Text>
        <View style={tw`flex size-12 items-center justify-center`} />
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-8`}>
        {/* Session Header Card */}
        <View
          style={[
            tw`mx-4 mt-6 p-6 rounded-2xl`,
            { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' },
          ]}
        >
          <View style={tw`flex-row items-center justify-between mb-2`}>
            <View style={tw`flex-1 pr-4`}>
              <Text style={[tw`text-2xl font-bold`, { color: textPrimary }]}>
                {sessionTitle}
              </Text>
              <Text style={[tw`text-sm mt-2`, { color: textSecondary }]}>
                {dateLabel}
              </Text>
              <View
                style={[
                  tw`mt-2 self-start px-3 py-1 rounded-full`,
                  { backgroundColor: accent + '25' },
                ]}
              >
                <Text style={[tw`text-xs font-bold uppercase`, { color: accent }]}>
                  {session.status === 'completed' ? 'Completed' : session.status ?? '--'}
                </Text>
              </View>
            </View>

            {formScore && (
              <View style={tw`items-end`}>
                <Text style={[tw`text-4xl font-black`, { color: accent }]}>
                  {formScore}
                </Text>
                <Text
                  style={[tw`text-xs font-bold uppercase mt-1`, { color: accent }]}
                >
                  Form Score
                </Text>
              </View>
            )}
          </View>

          {session.notes ? (
            <Text style={[tw`text-sm mt-3 leading-5`, { color: textSecondary }]}>
              {session.notes}
            </Text>
          ) : null}
        </View>

        {/* Key Metrics */}
        <View style={tw`mx-4 mt-6`}>
          <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
            Workout Metrics
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
                <View
                  style={[
                    tw`w-12 h-12 rounded-lg items-center justify-center`,
                    { backgroundColor: metric.color + '18' },
                  ]}
                >
                  <MaterialIcons name={metric.icon} size={24} color={metric.color} />
                </View>
                <View style={tw`flex-1`}>
                  <Text
                    style={[
                      tw`text-xs font-bold uppercase tracking-wider`,
                      { color: textSecondary },
                    ]}
                  >
                    {metric.label}
                  </Text>
                  <Text
                    style={[tw`text-lg font-bold mt-1`, { color: textPrimary }]}
                  >
                    {metric.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Exercise Breakdown */}
        {exerciseList.length > 0 && (
          <View style={tw`mx-4 mt-6 mb-4`}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
              Exercises Completed
            </Text>
            <View style={tw`gap-3`}>
              {exerciseList.map((ex, i) => (
                <View
                  key={i}
                  style={[
                    tw`p-4 rounded-xl`,
                    { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder },
                  ]}
                >
                  <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-1`}>
                      <Text style={[tw`font-bold text-base`, { color: textPrimary }]}>
                        {ex.name}
                      </Text>
                      <Text style={[tw`text-xs mt-1`, { color: textSecondary }]}>
                        {ex.sets != null ? `${ex.sets} set${ex.sets !== 1 ? 's' : ''}` : ''}
                        {ex.reps ? ` × ${ex.reps} reps` : ''}
                        {ex.restTime ? ` · ${ex.restTime}s rest` : ''}
                      </Text>
                    </View>
                    <View
                      style={[
                        tw`w-10 h-10 rounded-full items-center justify-center`,
                        { backgroundColor: accent + '18' },
                      ]}
                    >
                      <MaterialIcons name="check" size={18} color={accent} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer — only shown for clients, not coaches viewing a client's session */}
      {!readOnly && (
        <View
          style={[
            tw`px-4 py-4 border-t`,
            { backgroundColor: bg, borderColor: cardBorder },
          ]}
        >
          <Button
            title="Track a Similar Workout"
            variant="primary"
            onPress={() =>
              navigation.navigate('Calibration', {
                exerciseName: exerciseList[0]?.name,
              })
            }
            containerStyle={tw`w-full`}
          />
        </View>
      )}
    </SafeAreaView>
  );
};
