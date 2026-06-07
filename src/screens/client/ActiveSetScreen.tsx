import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import * as aiVisionService from '../../services/aiVisionService';
import * as workoutService from '../../services/workoutService';
import type { RepRecord, SessionSummaryData } from '../../services/aiVisionService';

// ~2.5 fps of analysis (fast enough to catch both ends of a movement)
const ANALYSIS_INTERVAL_MS = 450;
const SCAN_LOST_GRACE_MS = 1500;
// How long a feedback message stays visible before cycling
const FEEDBACK_DISPLAY_MS = 2800;

type SessionState = 'running' | 'paused' | 'stopped';
type CameraFacing = 'front' | 'back';

interface RouteParams {
  exerciseName?: string;
  workoutName?: string;
  targetReps?: number;
  targetSets?: number;
  targetHoldSeconds?: number;
  /** ID of the WorkoutPlan this session belongs to — used to record completion */
  workoutPlanId?: number;
  /** Weekday name for this session's plan day (e.g. 'monday') */
  workoutDay?: string;
  /** Plan split label (e.g. 'Day 1', 'Push') — stored separately from exercise name */
  workoutFocus?: string;
}

// ─────────────────────────────────────────────────────────────────────────────

export const ActiveSetScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const params: RouteParams = route?.params ?? {};
  const rawExerciseName: string = params.exerciseName ?? params.workoutName ?? 'Squat';
  const profile = useMemo(() => aiVisionService.getExerciseProfile(rawExerciseName), [rawExerciseName]);
  const isHold = profile.type === 'hold';
  const exerciseDisplay = profile.display;

  const targetReps = params.targetReps ?? 12;
  const targetSets = params.targetSets ?? 4;
  const targetHoldSeconds = params.targetHoldSeconds ?? 60;
  const workoutPlanId: number | undefined = params.workoutPlanId;
  const workoutDay: string | undefined = params.workoutDay;
  const workoutFocus: string | undefined = params.workoutFocus ?? params.workoutName;

  // Camera refs
  const cameraRef = useRef<CameraView | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);
  const lastPoseAtRef = useRef<number>(0);

  // Tracking helpers — alpha=0.65 gives ~3-frame EMA settling at 2.5 fps,
  // fast enough to track normal workout tempo without excessive noise.
  const repDetectorRef = useRef(new aiVisionService.RepDetector(profile, 350));
  const smootherRef = useRef(new aiVisionService.AngleSmoother(0.65));

  useEffect(() => {
    repDetectorRef.current = new aiVisionService.RepDetector(profile, 350);
    smootherRef.current = new aiVisionService.AngleSmoother(0.65);
  }, [profile]);

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('front');
  const [aiBackendOk, setAiBackendOk] = useState<boolean | null>(null);

  // ── Core session state ───────────────────────────────────────────────────
  const [sessionState, setSessionState] = useState<SessionState>('running');
  const [saving, setSaving] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [reps, setReps] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [holdSeconds, setHoldSeconds] = useState(0);
  const [holding, setHolding] = useState(false);

  // ── Live AI analysis state ────────────────────────────────────────────────
  const [formScore, setFormScore] = useState<number | null>(null);
  // Only display form score once the user has actually started the exercise
  const [hasStartedMoving, setHasStartedMoving] = useState(false);
  const [angles, setAngles] = useState<aiVisionService.FrameAngles>({});
  const [poseDetected, setPoseDetected] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const consecutiveErrorsRef = useRef(0);
  const CONSECUTIVE_ERROR_THRESHOLD = 5;

  // ── Live feedback (rotating display) ─────────────────────────────────────
  const [feedbackMessages, setFeedbackMessages] = useState<string[]>([]);
  const [activeFeedbackIndex, setActiveFeedbackIndex] = useState(0);
  const feedbackFadeAnim = useRef(new Animated.Value(1)).current;
  const feedbackRotateRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Session data collection for summary ──────────────────────────────────
  const repRecordsRef = useRef<RepRecord[]>([]);
  const allFeedbackRef = useRef<string[]>([]);
  const currentRepMistakesRef = useRef<string[]>([]);
  const currentRepScoresRef = useRef<number[]>([]);
  const peakFormScoreRef = useRef(0);
  const totalRepsRef = useRef(0);
  const totalSetsRef = useRef(1);

  // ── AI health check on mount ──────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    aiVisionService.checkAIBackendHealth().then((ok) => {
      if (mounted) setAiBackendOk(ok);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  // ── Session timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionState !== 'running') return;
    const t = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [sessionState]);

  // ── Feedback rotation ─────────────────────────────────────────────────────
  useEffect(() => {
    if (feedbackRotateRef.current) clearInterval(feedbackRotateRef.current);
    if (feedbackMessages.length <= 1) return;

    feedbackRotateRef.current = setInterval(() => {
      // Fade out → update index → fade in
      Animated.timing(feedbackFadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setActiveFeedbackIndex((i) => (i + 1) % feedbackMessages.length);
        Animated.timing(feedbackFadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      });
    }, FEEDBACK_DISPLAY_MS);

    return () => {
      if (feedbackRotateRef.current) clearInterval(feedbackRotateRef.current);
    };
  }, [feedbackMessages, feedbackFadeAnim]);

  // ── One analysis frame ────────────────────────────────────────────────────
  const analyzeOneFrame = useCallback(async () => {
    if (sessionState !== 'running' || !cameraReady || !cameraRef.current) return;
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    try {
      let photo;
      try {
        photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true,
          shutterSound: false,
          exif: false,
        });
      } catch {
        return; // camera not ready yet — skip silently
      }
      if (!photo?.base64) return;

      const result = await aiVisionService.analyzeFrame(photo.base64, rawExerciseName);
      consecutiveErrorsRef.current = 0;

      if (result.poseDetected) {
        const smoothed = smootherRef.current.update(result.angles);
        setAngles(smoothed);
        setPoseDetected(true);
        lastPoseAtRef.current = Date.now();

        // Form score — prefer backend score, fall back to computed
        const backendScore = result.feedback.score;
        const score = backendScore > 0
          ? backendScore
          : aiVisionService.computeFormScore(smoothed, result.targets);
        setFormScore(score);
        setAnalysisError(null);

        // Track peak score
        if (score > peakFormScoreRef.current) peakFormScoreRef.current = score;

        // Accumulate per-rep data
        currentRepScoresRef.current.push(score);

        // Live feedback messages from backend
        const fb = result.feedback;
        const allMsgs = [
          ...fb.messages.filter((m) => m.length > 0),
          ...fb.toFix.filter((m) => m.length > 0),
        ];
        if (allMsgs.length > 0) {
          setFeedbackMessages(allMsgs);
          setActiveFeedbackIndex(0);
          // Accumulate unique mistakes for session summary
          for (const m of fb.toFix) {
            currentRepMistakesRef.current.push(m);
            if (!allFeedbackRef.current.includes(m)) allFeedbackRef.current.push(m);
          }
        }

        if (isHold) {
          const nowHolding = aiVisionService.isHoldingForm(profile, smoothed);
          setHolding(nowHolding);
          if (nowHolding) setHasStartedMoving(true);
        } else {
          const counted = repDetectorRef.current.update(smoothed);

          // ── Debug logging (dev builds only) ─────────────────────────────
          if (__DEV__) {
            const repKey = profile.rep?.angleKey ?? '';
            const raw  = result.angles[repKey];
            const sm   = smoothed[repKey];
            const phase = repDetectorRef.current.getPhase();
            console.log(
              `[CV] ${rawExerciseName} | key=${repKey}` +
              ` raw=${raw != null ? raw.toFixed(1) : 'n/a'}°` +
              ` smooth=${sm != null ? sm.toFixed(1) : 'n/a'}°` +
              ` phase=${phase}` +
              (counted ? ' ✓ REP' : '')
            );
          }
          // ────────────────────────────────────────────────────────────────

          // Mark as started once the detector enters any phase (i.e. user moved)
          if (!hasStartedMoving && repDetectorRef.current.isActive()) {
            setHasStartedMoving(true);
          }
          if (counted > 0) {
            setHasStartedMoving(true);
            // Save rep record
            const repScores = currentRepScoresRef.current;
            const avgRepScore = repScores.length > 0
              ? Math.round(repScores.reduce((a, b) => a + b, 0) / repScores.length)
              : score;

            repRecordsRef.current.push({
              repNumber: totalRepsRef.current + 1,
              formScore: avgRepScore,
              mistakes: [...currentRepMistakesRef.current],
            });
            currentRepMistakesRef.current = [];
            currentRepScoresRef.current = [];
            totalRepsRef.current += 1;

            setReps((r) => {
              const next = r + counted;
              if (next >= targetReps && currentSet < targetSets) {
                totalSetsRef.current = currentSet + 1;
                setCurrentSet((s) => s + 1);
                return 0;
              }
              return next;
            });
          }
        }
      } else {
        setHolding(false);
        if (Date.now() - lastPoseAtRef.current > SCAN_LOST_GRACE_MS) {
          setPoseDetected(false);
          setFormScore(null);
          smootherRef.current.reset();
          setFeedbackMessages(['Step back so your whole body is visible in frame']);
        }
      }
    } catch (err: any) {
      consecutiveErrorsRef.current += 1;
      if (consecutiveErrorsRef.current >= CONSECUTIVE_ERROR_THRESHOLD) {
        setAnalysisError(err?.message ?? 'Analysis failed');
        setAiBackendOk(false);
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [sessionState, cameraReady, rawExerciseName, profile, isHold, targetReps, targetSets, currentSet, hasStartedMoving]);

  // ── Analysis loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionState !== 'running' || !cameraReady) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    analyzeOneFrame();
    intervalRef.current = setInterval(analyzeOneFrame, ANALYSIS_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [sessionState, cameraReady, analyzeOneFrame]);

  // ── Hold timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isHold || sessionState !== 'running' || !holding) return;
    const t = setInterval(() => {
      setHoldSeconds((s) => {
        const next = s + 1;
        if (next >= targetHoldSeconds && currentSet < targetSets) {
          totalSetsRef.current = currentSet + 1;
          setCurrentSet((cs) => cs + 1);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isHold, sessionState, holding, targetHoldSeconds, currentSet, targetSets]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formColor = (score: number | null) => {
    if (score === null) return '#94a3b8';
    if (score >= 85) return '#22c55e';
    if (score >= 65) return '#eab308';
    return '#ef4444';
  };

  const prettyJoint = (k: string) =>
    k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const togglePause = () => {
    consecutiveErrorsRef.current = 0;
    setSessionState((prev) => (prev === 'paused' ? 'running' : 'paused'));
  };

  const resetCurrent = () => {
    if (isHold) setHoldSeconds(0);
    else { setReps(0); repDetectorRef.current.reset(); }
  };

  // ── End session & navigate to summary ─────────────────────────────────────
  const finishSession = useCallback(async () => {
    setSessionState('stopped');

    // Compute avg form score across all samples
    const allScores = repRecordsRef.current.map((r) => r.formScore);
    const avgFormScore = allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : formScore ?? 0;

    const summaryInput: SessionSummaryData = {
      exerciseName: exerciseDisplay,
      targetReps,
      targetSets,
      totalReps: isHold ? holdSeconds : totalRepsRef.current,
      completedSets: totalSetsRef.current,
      durationSeconds: elapsedSeconds,
      repRecords: repRecordsRef.current,
      allFeedback: allFeedbackRef.current,
      peakFormScore: peakFormScoreRef.current,
      avgFormScore,
    };

    const summary = aiVisionService.buildSessionSummary(summaryInput);

    // ── Save session to history (awaited so it's always written before navigating)
    const todayWeekday = new Date()
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase() as workoutService.LogWorkoutRequest['day'];
    const planDay = (workoutDay as workoutService.LogWorkoutRequest['day']) || todayWeekday;
    const actualReps = isHold ? holdSeconds : totalRepsRef.current;

    setSaving(true);
    try {
      await workoutService.logWorkout({
        day: planDay,
        duration: Math.max(1, Math.round(elapsedSeconds / 60)),
        exercises: [{
          name: rawExerciseName,
          sets: currentSet,
          reps: String(actualReps),
          restTime: 60,
        }],
        notes: isHold
          ? `${exerciseDisplay} · ${planDay} · Hold: ${holdSeconds}s · Sets: ${currentSet}/${targetSets} · Form: ${summary.performanceScore}%`
          : `${exerciseDisplay} · ${planDay} · Reps: ${totalRepsRef.current} · Sets: ${currentSet}/${targetSets} · Form: ${summary.performanceScore}% · Correct: ${summary.correctReps} · Incorrect: ${summary.incorrectReps}`,
        rating: Math.min(5, Math.max(1, Math.round(summary.performanceScore / 20))),
        formScore: summary.performanceScore,
        totalReps: actualReps,
        workoutPlanId,
        sessionMeta: {
          exerciseName: rawExerciseName,
          planDay,
          planFocus: workoutFocus && workoutFocus !== rawExerciseName ? workoutFocus : undefined,
          redoNumber: 0,
          isRedo: false,
          formScore: avgFormScore,
          avgFormScore: summary.avgFormScore,
          peakFormScore: summary.peakFormScore,
          performanceScore: summary.performanceScore,
          formAccuracy: summary.formAccuracy,
          totalReps: actualReps,
          correctReps: summary.correctReps,
          incorrectReps: summary.incorrectReps,
          completedSets: totalSetsRef.current,
          targetSets,
          targetReps,
          durationSeconds: elapsedSeconds,
          isHold,
          holdSeconds: isHold ? holdSeconds : undefined,
          topMistakes: summary.topMistakes,
          tips: summary.tips,
        },
      });
    } catch {
      // Network failure — summary screen still shows; log will be retried by sync queue
    } finally {
      setSaving(false);
    }

    navigation.replace('WorkoutSummary', { summary, exerciseName: exerciseDisplay });
  }, [
    elapsedSeconds, formScore, holdSeconds, isHold,
    currentSet, targetSets, targetReps, exerciseDisplay, rawExerciseName,
    workoutDay, workoutFocus, workoutPlanId, navigation,
  ]);

  const handleStop = useCallback(() => {
    Alert.alert(
      'End session?',
      'Your progress will be saved and you will see a full AI analysis.',
      [
        { text: 'Keep going', style: 'cancel' },
        { text: 'End session', style: 'destructive', onPress: finishSession },
      ],
    );
  }, [finishSession]);

  // ── Permission gating ─────────────────────────────────────────────────────
  if (!permission) {
    return (
      <SafeAreaView style={tw`flex-1 bg-black items-center justify-center`}>
        <ActivityIndicator color="white" />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={tw`flex-1 bg-black items-center justify-center px-8`}>
        <MaterialIcons name="camera-alt" size={56} color="#94a3b8" />
        <Text style={tw`text-white text-lg font-bold mt-4 text-center`}>Camera permission required</Text>
        <Text style={tw`text-slate-400 text-sm mt-2 text-center`}>
          Vertex Vision uses your camera to analyze form in real time.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={tw`mt-6 px-6 py-3 rounded-xl bg-blue-500`}>
          <Text style={tw`text-white font-bold`}>Enable Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`mt-3`}>
          <Text style={tw`text-slate-400 text-sm`}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const showScanOverlay = sessionState === 'running' && cameraReady && !poseDetected;
  const activeFeedback = feedbackMessages[activeFeedbackIndex] ?? '';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={tw`flex-1 bg-black`}>
      {/* Camera fills the entire screen */}
      <CameraView
        ref={cameraRef}
        style={tw`absolute inset-0`}
        facing={cameraFacing}
        onCameraReady={() => setCameraReady(true)}
      />

      {/* Gradient scrims for legibility */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 60, backgroundColor: 'rgba(0,0,0,0.40)' }} />
      <View pointerEvents="none" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 230, backgroundColor: 'rgba(0,0,0,0.60)' }} />

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <SafeAreaView style={tw`absolute inset-0`} edges={['top']} pointerEvents="box-none">
        <View style={tw`flex-row items-center justify-between px-4`}>
          <TouchableOpacity
            onPress={handleStop}
            style={tw`w-10 h-10 rounded-full bg-black/45 items-center justify-center border border-white/15`}
          >
            <MaterialIcons name="close" size={20} color="white" />
          </TouchableOpacity>

          {/* Status pill */}
          <View style={tw`flex-row items-center gap-2 px-3 py-1.5 rounded-full bg-black/45 border border-white/15`}>
            <View style={[tw`w-2 h-2 rounded-full`, {
              backgroundColor: sessionState === 'running'
                ? (poseDetected ? '#22c55e' : '#ef4444')
                : '#94a3b8',
            }]} />
            <Text style={tw`text-white text-[11px] font-bold uppercase tracking-wider`}>
              {sessionState === 'paused' ? 'Paused' : poseDetected ? 'Tracking' : 'Scanning…'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setCameraFacing((f) => (f === 'front' ? 'back' : 'front'))}
            style={tw`w-10 h-10 rounded-full bg-black/45 items-center justify-center border border-white/15`}
          >
            <MaterialIcons name="flip-camera-ios" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── Floating stats chips ──────────────────────────────────────────── */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: insets.top + 56, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' }}
      >
        {/* Timer */}
        <View style={tw`bg-black/55 px-3 py-2 rounded-2xl border border-white/15 items-center min-w-[88px]`}>
          <Text style={tw`text-white/60 text-[9px] font-bold uppercase tracking-widest`}>Time</Text>
          <Text style={[tw`text-white font-black`, { fontSize: 22, lineHeight: 26, fontVariant: ['tabular-nums'] }]}>
            {formatTime(elapsedSeconds)}
          </Text>
        </View>

        {/* Form score */}
        <View style={tw`bg-black/55 px-3 py-2 rounded-2xl border border-white/15 items-center min-w-[88px]`}>
          <Text style={tw`text-white/60 text-[9px] font-bold uppercase tracking-widest`}>Form</Text>
          {hasStartedMoving && formScore !== null ? (
            <Text style={[tw`font-black`, { color: formColor(formScore), fontSize: 22, lineHeight: 26 }]}>
              {Math.round(formScore)}
            </Text>
          ) : (
            <Text style={[tw`font-bold`, { color: '#94a3b8', fontSize: 13, lineHeight: 26 }]}>
              {poseDetected ? 'Go!' : '--'}
            </Text>
          )}
        </View>

        {/* AI status */}
        <View style={[tw`px-3 py-2 rounded-2xl items-center min-w-[88px] border`, {
          backgroundColor: 'rgba(0,0,0,0.55)',
          borderColor: aiBackendOk === true ? 'rgba(34,197,94,0.5)' : aiBackendOk === false ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.15)',
        }]}>
          <Text style={tw`text-white/60 text-[9px] font-bold uppercase tracking-widest`}>AI</Text>
          <View style={tw`flex-row items-center gap-1`}>
            <MaterialIcons
              name={aiBackendOk === false ? 'cloud-off' : 'cloud-done'}
              size={14}
              color={aiBackendOk === true ? '#22c55e' : aiBackendOk === false ? '#ef4444' : '#94a3b8'}
            />
            <Text style={[tw`text-[11px] font-black uppercase`, {
              color: aiBackendOk === true ? '#22c55e' : aiBackendOk === false ? '#ef4444' : '#94a3b8',
            }]}>
              {aiBackendOk === true ? 'On' : aiBackendOk === false ? 'Off' : '…'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Live AI Feedback banner ───────────────────────────────────────── */}
      {poseDetected && activeFeedback.length > 0 && (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 16, right: 16, top: insets.top + 130 }}
        >
          <Animated.View
            style={[
              {
                opacity: feedbackFadeAnim,
                backgroundColor: formScore !== null && formScore < 65
                  ? 'rgba(239,68,68,0.82)'
                  : formScore !== null && formScore < 85
                    ? 'rgba(234,179,8,0.82)'
                    : 'rgba(34,197,94,0.82)',
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              },
            ]}
          >
            <MaterialIcons
              name={formScore !== null && formScore < 65 ? 'warning' : formScore !== null && formScore < 85 ? 'info' : 'check-circle'}
              size={18}
              color="white"
            />
            <Text style={{ color: 'white', fontSize: 13, fontWeight: '700', flex: 1, lineHeight: 18 }}>
              {activeFeedback}
            </Text>
            {feedbackMessages.length > 1 && (
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600' }}>
                {activeFeedbackIndex + 1}/{feedbackMessages.length}
              </Text>
            )}
          </Animated.View>
        </View>
      )}

      {/* Exercise name pill */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 250, alignItems: 'center' }}>
        <View style={tw`bg-black/55 px-3 py-1 rounded-full border border-white/15`}>
          <Text style={tw`text-white text-xs font-bold uppercase tracking-wider`}>{exerciseDisplay}</Text>
        </View>
      </View>

      {/* ── Scanning overlay ──────────────────────────────────────────────── */}
      {showScanOverlay && (
        <View pointerEvents="none" style={{ position: 'absolute', left: 24, right: 24, top: '42%', alignItems: 'center' }}>
          <View style={tw`px-5 py-3 rounded-2xl bg-black/65 border border-white/15 items-center gap-1.5`}>
            <ActivityIndicator color="#22c55e" />
            <Text style={tw`text-white text-sm font-bold`}>Looking for you…</Text>
            <Text style={tw`text-white/70 text-[11px] text-center`}>
              Step back so your whole body fits in frame
            </Text>
          </View>
        </View>
      )}

      {/* ── Bottom panel ─────────────────────────────────────────────────── */}
      <View style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        paddingHorizontal: 14, paddingTop: 10,
        paddingBottom: Math.max(insets.bottom + 8, 16),
      }}>
        {/* Joint angle chips */}
        {Object.keys(angles).length > 0 && (
          <View style={tw`flex-row gap-1.5 mb-2`}>
            {Object.entries(angles)
              .filter(([k, v]) => typeof v === 'number' && k.endsWith('_avg'))
              .slice(0, 3)
              .map(([k, v]) => (
                <View key={k} style={tw`px-2 py-0.5 rounded-full bg-white/15 flex-row gap-1`}>
                  <Text style={tw`text-white/70 text-[10px] font-bold uppercase`}>
                    {prettyJoint(k.replace('_avg', ''))}
                  </Text>
                  <Text style={tw`text-white text-[10px] font-black`}>{Math.round(v as number)}°</Text>
                </View>
              ))}
          </View>
        )}

        {/* Reps / hold + sets */}
        <View style={tw`flex-row gap-2 mb-2`}>
          {isHold ? (
            <View style={[tw`flex-1 rounded-xl px-3 py-2`, {
              backgroundColor: holding ? 'rgba(34,197,94,0.22)' : 'rgba(255,255,255,0.1)',
              borderWidth: 1,
              borderColor: holding ? 'rgba(34,197,94,0.55)' : 'rgba(255,255,255,0.15)',
            }]}>
              <View style={tw`flex-row items-center justify-between`}>
                <Text style={tw`text-white/70 text-[9px] font-bold uppercase tracking-widest`}>
                  Hold {holding ? '· Holding ✓' : '· Off form'}
                </Text>
                <TouchableOpacity onPress={resetCurrent} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="refresh" size={12} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              </View>
              <View style={tw`flex-row items-baseline gap-1`}>
                <Text style={tw`text-white text-2xl font-black`}>{holdSeconds}s</Text>
                <Text style={tw`text-white/50 text-xs font-bold`}>/ {targetHoldSeconds}s</Text>
              </View>
            </View>
          ) : (
            <View style={tw`flex-1 bg-white/10 border border-white/15 rounded-xl px-3 py-2`}>
              <View style={tw`flex-row items-center justify-between`}>
                <Text style={tw`text-white/70 text-[9px] font-bold uppercase tracking-widest`}>Reps · auto</Text>
                <TouchableOpacity onPress={resetCurrent} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="refresh" size={12} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              </View>
              <View style={tw`flex-row items-baseline gap-1`}>
                <Text style={tw`text-white text-2xl font-black`}>{reps}</Text>
                <Text style={tw`text-white/50 text-xs font-bold`}>/ {targetReps}</Text>
              </View>
            </View>
          )}

          <View style={tw`flex-1 bg-white/10 border border-white/15 rounded-xl px-3 py-2`}>
            <Text style={tw`text-white/70 text-[9px] font-bold uppercase tracking-widest`}>Set</Text>
            <View style={tw`flex-row items-baseline gap-1`}>
              <Text style={tw`text-white text-2xl font-black`}>{currentSet}</Text>
              <Text style={tw`text-white/50 text-xs font-bold`}>/ {targetSets}</Text>
            </View>
          </View>
        </View>

        {/* AI offline banner */}
        {analysisError && aiBackendOk === false && (
          <View style={tw`bg-red-500/15 border border-red-500/30 rounded-lg px-2.5 py-1.5 mb-2 flex-row items-center gap-1.5`}>
            <MaterialIcons name="error-outline" size={14} color="#ef4444" />
            <Text style={tw`text-red-300 text-[11px] flex-1`}>AI server unreachable — timer still works.</Text>
          </View>
        )}

        {/* Pause + Stop */}
        <View style={tw`flex-row gap-2`}>
          <TouchableOpacity
            onPress={togglePause}
            disabled={saving}
            style={[tw`flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-xl`, {
              backgroundColor: sessionState === 'paused' ? '#22c55e' : 'rgba(255,255,255,0.15)',
              borderWidth: 1,
              borderColor: sessionState === 'paused' ? '#22c55e' : 'rgba(255,255,255,0.2)',
              opacity: saving ? 0.5 : 1,
            }]}
          >
            <MaterialIcons name={sessionState === 'paused' ? 'play-arrow' : 'pause'} size={18} color="white" />
            <Text style={tw`text-white text-sm font-black uppercase tracking-wider`}>
              {sessionState === 'paused' ? 'Resume' : 'Pause'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleStop}
            disabled={saving}
            style={[tw`flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-xl`, {
              backgroundColor: saving ? '#64748b' : '#ef4444',
            }]}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Text style={tw`text-white text-sm font-black uppercase tracking-wider`}>Saving…</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="stop" size={18} color="white" />
                <Text style={tw`text-white text-sm font-black uppercase tracking-wider`}>End</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
