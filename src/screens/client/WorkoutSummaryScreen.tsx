/**
 * WorkoutSummaryScreen
 * Full AI post-workout analysis screen shown after every ActiveSet session.
 */
import React, { useMemo, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Types ─────────────────────────────────────────────────────────────────────
interface SummaryData {
  exerciseName: string;
  totalReps: number;
  correctReps: number;
  incorrectReps: number;
  formAccuracy: number;
  durationSeconds: number;
  completedSets: number;
  peakFormScore: number;
  avgFormScore: number;
  topMistakes: Array<{ msg: string; count: number }>;
  performanceScore: number;
  tips: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
};

const scoreGrade = (score: number): { label: string; color: string; emoji: string } => {
  if (score >= 90) return { label: 'Elite', color: '#22c55e', emoji: '🏆' };
  if (score >= 80) return { label: 'Great', color: '#84cc16', emoji: '⭐' };
  if (score >= 70) return { label: 'Good', color: '#eab308', emoji: '👍' };
  if (score >= 55) return { label: 'Fair', color: '#f97316', emoji: '💪' };
  return { label: 'Needs Work', color: '#ef4444', emoji: '🔧' };
};

const ScoreRing = ({ score, size = 96, dark = true }: { score: number; size?: number; dark?: boolean }) => {
  const animValue = useRef(new Animated.Value(0)).current;
  const grade = scoreGrade(score);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: score,
      duration: 900,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [score, animValue]);

  const strokeDashoffset = animValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={grade.color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={{ color: grade.color, fontSize: size * 0.28, fontWeight: '900', lineHeight: size * 0.32 }}>
        {score}
      </Text>
      <Text style={{ color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)', fontSize: size * 0.11, fontWeight: '700', letterSpacing: 1 }}>
        / 100
      </Text>
    </View>
  );
};

const StatCard = ({ label, value, sub, accent, isDark }: {
  label: string; value: string; sub?: string; accent?: string; isDark: boolean;
}) => (
  <View style={[tw`flex-1 rounded-2xl px-2 py-4 items-center justify-center`, {
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)',
  }]}>
    <Text style={[tw`text-xl font-black text-center`, { color: accent ?? (isDark ? 'white' : '#1e293b') }]}>{value}</Text>
    {sub && <Text style={[tw`text-[10px] font-semibold mt-0.5 text-center`, { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}>{sub}</Text>}
    <Text style={[tw`text-[10px] font-bold uppercase tracking-wider mt-1 text-center`, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }]}>{label}</Text>
  </View>
);

const Section = ({ title, children, isDark }: { title: string; children: React.ReactNode; isDark: boolean }) => (
  <View style={tw`mt-5`}>
    <Text style={[tw`text-xs font-bold uppercase tracking-widest mb-3 px-1`, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }]}>{title}</Text>
    {children}
  </View>
);

// ── Screen ────────────────────────────────────────────────────────────────────
export const WorkoutSummaryScreen = ({ navigation, route }: any) => {
  const { isDark, accent } = useTheme();
  const { summary, exerciseName } = route.params;
  const grade = useMemo(() => scoreGrade(summary.performanceScore), [summary.performanceScore]);

  // Theme-aware colors
  const bg        = isDark ? '#0a0a14'           : '#f8f7f5';
  const cardBg    = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textPrimary   = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
  const divider   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const closeIconColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)';
  const closeBg   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1, duration: 600, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true,
    }).start();
  }, [headerAnim]);

  const handleDone = () => navigation.replace('TraineeCommandCenter');
  const handleDoAgain = () => navigation.goBack();

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ───────────────────────────────────────────────────── */}
          <Animated.View style={{
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
          }}>
            {/* Top row: close button */}
            <View style={tw`flex-row justify-end pt-2 pb-1`}>
              <TouchableOpacity
                onPress={handleDone}
                style={[tw`w-9 h-9 rounded-full items-center justify-center`, { backgroundColor: closeBg }]}
              >
                <MaterialIcons name="close" size={18} color={closeIconColor} />
              </TouchableOpacity>
            </View>

            {/* Title area */}
            <View style={tw`items-center pt-2 pb-6`}>
              <Text style={{ fontSize: 36, marginBottom: 4 }}>{grade.emoji}</Text>
              <Text style={[tw`text-2xl font-black text-center`, { color: textPrimary }]}>Workout Complete!</Text>
              <Text style={[tw`text-sm mt-1 text-center`, { color: textSecondary }]}>{exerciseName}</Text>
            </View>

            {/* Performance score ring */}
            <View style={tw`items-center pb-4`}>
              <ScoreRing score={summary.performanceScore} size={108} dark={isDark} />
              <Text style={[tw`text-base font-black mt-3 uppercase tracking-widest`, { color: grade.color }]}>
                Performance: {grade.label}
              </Text>
            </View>
          </Animated.View>

          {/* ── Key stats row ─────────────────────────────────────────────── */}
          <Section title="Session stats" isDark={isDark}>
            <View style={tw`flex-row gap-2`}>
              <StatCard label="Duration" value={formatDuration(summary.durationSeconds)} isDark={isDark} />
              <StatCard label="Sets" value={`${summary.completedSets}`} isDark={isDark} />
              <StatCard label="Total Reps" value={`${summary.totalReps}`} accent="#60a5fa" isDark={isDark} />
            </View>
          </Section>

          {/* ── Rep quality ───────────────────────────────────────────────── */}
          <Section title="Rep quality" isDark={isDark}>
            <View style={tw`flex-row gap-2`}>
              <StatCard
                label="Correct Reps"
                value={`${summary.correctReps}`}
                sub="≥ 70% form"
                accent="#22c55e"
                isDark={isDark}
              />
              <StatCard
                label="Incorrect Reps"
                value={`${summary.incorrectReps}`}
                sub="< 70% form"
                accent={summary.incorrectReps > 0 ? '#ef4444' : '#22c55e'}
                isDark={isDark}
              />
              <StatCard
                label="Form Accuracy"
                value={`${summary.formAccuracy}%`}
                accent={summary.formAccuracy >= 80 ? '#22c55e' : summary.formAccuracy >= 60 ? '#eab308' : '#ef4444'}
                isDark={isDark}
              />
            </View>
          </Section>

          {/* ── Form scores ───────────────────────────────────────────────── */}
          <Section title="Form quality" isDark={isDark}>
            <View style={[tw`rounded-2xl p-4`, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}>
              <View style={tw`flex-row justify-between mb-4`}>
                <View style={tw`items-center flex-1`}>
                  <Text style={[tw`text-[10px] font-bold uppercase tracking-widest mb-1`, { color: textSecondary }]}>
                    Average Form
                  </Text>
                  <Text style={[tw`text-3xl font-black`, {
                    color: summary.avgFormScore >= 80 ? '#22c55e' : summary.avgFormScore >= 60 ? '#eab308' : '#ef4444',
                  }]}>
                    {summary.avgFormScore}%
                  </Text>
                </View>
                <View style={{ width: 1, backgroundColor: divider }} />
                <View style={tw`items-center flex-1`}>
                  <Text style={[tw`text-[10px] font-bold uppercase tracking-widest mb-1`, { color: textSecondary }]}>
                    Peak Form
                  </Text>
                  <Text style={[tw`text-3xl font-black`, {
                    color: summary.peakFormScore >= 85 ? '#22c55e' : '#eab308',
                  }]}>
                    {summary.peakFormScore}%
                  </Text>
                </View>
              </View>

              {/* Form bar */}
              <View>
                <View style={tw`flex-row justify-between mb-1`}>
                  <Text style={[tw`text-[10px]`, { color: textSecondary }]}>Form accuracy</Text>
                  <Text style={[tw`text-[10px] font-bold`, { color: textSecondary }]}>{summary.formAccuracy}%</Text>
                </View>
                <View style={[tw`rounded-full overflow-hidden`, { height: 8, backgroundColor: divider }]}>
                  <View style={[{
                    height: 8,
                    width: `${summary.formAccuracy}%`,
                    borderRadius: 4,
                    backgroundColor:
                      summary.formAccuracy >= 80 ? '#22c55e' :
                      summary.formAccuracy >= 60 ? '#eab308' : '#ef4444',
                  }]} />
                </View>
              </View>
            </View>
          </Section>

          {/* ── Detected mistakes ─────────────────────────────────────────── */}
          {summary.topMistakes.length > 0 && (
            <Section title="Form issues detected" isDark={isDark}>
              <View style={[tw`rounded-2xl overflow-hidden`, { borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' }]}>
                {summary.topMistakes.map(({ msg, count }: { msg: string; count: number }, i: number) => (
                  <View
                    key={i}
                    style={[
                      tw`flex-row items-start px-4 py-3 gap-3`,
                      {
                        backgroundColor: i % 2 === 0 ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.03)',
                        borderTopWidth: i > 0 ? 1 : 0,
                        borderTopColor: 'rgba(239,68,68,0.12)',
                      },
                    ]}
                  >
                    <View style={[tw`rounded-full px-2 py-0.5 mt-0.5`, { backgroundColor: 'rgba(239,68,68,0.25)' }]}>
                      <Text style={tw`text-red-300 text-[10px] font-black`}>×{count}</Text>
                    </View>
                    <Text style={[tw`text-sm flex-1 leading-5`, { color: textPrimary }]}>{msg}</Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          {/* ── AI coach tips ─────────────────────────────────────────────── */}
          <Section title="AI coach recommendations" isDark={isDark}>
            <View style={[tw`rounded-2xl overflow-hidden`, { borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)' }]}>
              {summary.tips.map((tip: string, i: number) => (
                <View
                  key={i}
                  style={[
                    tw`flex-row items-start px-4 py-3 gap-3`,
                    {
                      backgroundColor: i % 2 === 0 ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.03)',
                      borderTopWidth: i > 0 ? 1 : 0,
                      borderTopColor: 'rgba(99,102,241,0.12)',
                    },
                  ]}
                >
                  <MaterialIcons name="lightbulb" size={16} color="#818cf8" style={{ marginTop: 2 }} />
                  <Text style={[tw`text-sm flex-1 leading-5`, { color: textPrimary }]}>{tip}</Text>
                </View>
              ))}
            </View>
          </Section>

          {/* ── Exercise quality badge ────────────────────────────────────── */}
          <Section title="Exercise quality analysis" isDark={isDark}>
            <View style={[tw`rounded-2xl p-4`, { backgroundColor: cardBg, borderWidth: 1, borderColor: `${grade.color}30` }]}>
              <View style={tw`flex-row items-center gap-3 mb-3`}>
                <View style={[tw`w-10 h-10 rounded-full items-center justify-center`, { backgroundColor: `${grade.color}20` }]}>
                  <Text style={{ fontSize: 20 }}>{grade.emoji}</Text>
                </View>
                <View>
                  <Text style={[tw`text-base font-black`, { color: grade.color }]}>Level: {grade.label}</Text>
                  <Text style={[tw`text-xs`, { color: textSecondary }]}>Performance score: {summary.performanceScore}/100</Text>
                </View>
              </View>

              {/* Quality breakdown bars */}
              {[
                { label: 'Form Quality', value: summary.avgFormScore },
                { label: 'Rep Consistency', value: summary.correctReps > 0 ? Math.round((summary.correctReps / Math.max(1, summary.totalReps)) * 100) : 0 },
                { label: 'Session Completion', value: Math.min(100, Math.round((summary.totalReps / Math.max(1, summary.totalReps)) * 100)) },
              ].map(({ label, value }) => (
                <View key={label} style={tw`mb-2`}>
                  <View style={tw`flex-row justify-between mb-1`}>
                    <Text style={[tw`text-[11px]`, { color: textSecondary }]}>{label}</Text>
                    <Text style={[tw`text-[11px] font-bold`, { color: textSecondary }]}>{value}%</Text>
                  </View>
                  <View style={[tw`rounded-full overflow-hidden`, { height: 5, backgroundColor: divider }]}>
                    <View style={{ height: 5, width: `${value}%`, borderRadius: 3, backgroundColor: grade.color, opacity: 0.8 }} />
                  </View>
                </View>
              ))}
            </View>
          </Section>

          {/* ── CTA buttons ───────────────────────────────────────────────── */}
          <View style={tw`gap-3 mt-8`}>
            <TouchableOpacity
              onPress={handleDone}
              style={[tw`w-full py-4 rounded-2xl items-center justify-center flex-row gap-2`, { backgroundColor: accent }]}
            >
              <MaterialIcons name="check" size={20} color="white" />
              <Text style={tw`text-white text-base font-black`}>Done</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDoAgain}
              style={[tw`w-full py-4 rounded-2xl items-center flex-row justify-center gap-2`, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}
            >
              <MaterialIcons name="replay" size={20} color={textPrimary} />
              <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>Do again</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
