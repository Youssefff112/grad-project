import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import * as aiVisionService from '../../services/aiVisionService';
import * as workoutService from '../../services/workoutService';

const ANALYSIS_INTERVAL_MS = 800;
const SCAN_LOST_GRACE_MS = 2500;

type SessionState = 'running' | 'paused' | 'stopped';

interface RouteParams {
  exerciseName?: string;
  workoutName?: string;
  targetReps?: number;
  targetSets?: number;
  targetHoldSeconds?: number;
}

export const ActiveSetScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const params: RouteParams = route?.params || {};
  const rawExerciseName: string = params.exerciseName || params.workoutName || 'Squat';
  const profile = useMemo(() => aiVisionService.getExerciseProfile(rawExerciseName), [rawExerciseName]);
  const isHold = profile.type === 'hold';
  const exerciseDisplay = profile.display;

  const targetReps = params.targetReps ?? 12;
  const targetSets = params.targetSets ?? 4;
  const targetHoldSeconds = params.targetHoldSeconds ?? 60;

  const cameraRef = useRef<CameraView | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);
  const lastPoseAtRef = useRef<number>(0);
  const repDetectorRef = useRef<aiVisionService.RepDetector>(new aiVisionService.RepDetector(profile));

  // Reset detector when exercise changes
  useEffect(() => {
    repDetectorRef.current = new aiVisionService.RepDetector(profile);
  }, [profile]);

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [aiBackendOk, setAiBackendOk] = useState<boolean | null>(null);

  // Session state
  const [sessionState, setSessionState] = useState<SessionState>('running');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [reps, setReps] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [holdSeconds, setHoldSeconds] = useState(0);
  const [holding, setHolding] = useState(false);

  // Live AI analysis
  const [formScore, setFormScore] = useState<number | null>(null);
  const [angles, setAngles] = useState<aiVisionService.FrameAngles>({});
  const [poseDetected, setPoseDetected] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Camera permission auto-prompt
  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  // AI backend health
  useEffect(() => {
    let mounted = true;
    aiVisionService.checkAIBackendHealth().then((ok) => {
      if (mounted) setAiBackendOk(ok);
    });
    return () => { mounted = false; };
  }, []);

  // Session timer (always-on while running)
  useEffect(() => {
    if (sessionState !== 'running') return;
    const t = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [sessionState]);

  // Periodic frame analysis
  const analyzeOneFrame = useCallback(async () => {
    if (sessionState !== 'running' || !cameraReady || !cameraRef.current) return;
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setAnalyzing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.35,
        base64: true,
        skipProcessing: true,
        shutterSound: false,
      });
      if (!photo?.base64) return;

      const result = await aiVisionService.analyzeFrame(photo.base64, rawExerciseName);
      setAngles(result.angles);
      setPoseDetected(result.poseDetected);
      if (result.poseDetected) {
        lastPoseAtRef.current = Date.now();
        setFormScore(aiVisionService.computeFormScore(result.angles, result.targets));
        setAnalysisError(null);

        if (isHold) {
          setHolding(aiVisionService.isHoldingForm(profile, result.angles));
        } else {
          // Rep detection
          const counted = repDetectorRef.current.update(result.angles);
          if (counted > 0) {
            setReps((r) => {
              const next = r + counted;
              if (next >= targetReps && currentSet < targetSets) {
                setCurrentSet((s) => s + 1);
                return 0;
              }
              return next;
            });
          }
        }
      } else {
        setHolding(false);
        // Keep last score for a moment; clear after grace period
        if (Date.now() - lastPoseAtRef.current > SCAN_LOST_GRACE_MS) {
          setFormScore(null);
        }
      }
    } catch (err: any) {
      const msg = err?.message || 'Analysis failed';
      setAnalysisError(msg);
    } finally {
      inFlightRef.current = false;
      setAnalyzing(false);
    }
  }, [sessionState, cameraReady, rawExerciseName, profile, isHold, targetReps, targetSets, currentSet]);

  // Drive the analysis loop
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

  // Hold timer — only ticks while user is in form
  useEffect(() => {
    if (!isHold || sessionState !== 'running' || !holding) return;
    const t = setInterval(() => {
      setHoldSeconds((s) => {
        const next = s + 1;
        if (next >= targetHoldSeconds && currentSet < targetSets) {
          setCurrentSet((cs) => cs + 1);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isHold, sessionState, holding, targetHoldSeconds, currentSet, targetSets]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const togglePause = () => {
    setSessionState((prev) => (prev === 'paused' ? 'running' : 'paused'));
  };

  const handleStop = () => {
    Alert.alert(
      'End session?',
      'Your progress will be saved to your workout history.',
      [
        { text: 'Keep going', style: 'cancel' },
        {
          text: 'End session',
          style: 'destructive',
          onPress: async () => {
            setSessionState('stopped');
            try {
              await workoutService.logWorkout({
                day: exerciseDisplay,
                duration: Math.max(1, Math.round(elapsedSeconds / 60)),
                notes: isHold
                  ? `Hold: ${holdSeconds}s · Sets ${currentSet}/${targetSets} · Form ${formScore ?? 'n/a'}%`
                  : `Reps: ${reps} · Sets ${currentSet}/${targetSets} · Form ${formScore ?? 'n/a'}%`,
                rating: formScore ? Math.min(5, Math.max(1, Math.round(formScore / 20))) : 3,
              });
            } catch {
              // Silent — keep UX smooth even if API fails
            }
            navigation.goBack();
          },
        },
      ],
    );
  };

  const resetCurrent = () => {
    if (isHold) setHoldSeconds(0);
    else { setReps(0); repDetectorRef.current.reset(); }
  };

  const formColor = (score: number | null) => {
    if (score === null) return '#94a3b8';
    if (score >= 85) return '#22c55e';
    if (score >= 65) return '#eab308';
    return '#ef4444';
  };

  const formLabel = (score: number | null) => {
    if (score === null) return '—';
    if (score >= 85) return 'Excellent';
    if (score >= 65) return 'Good';
    if (score >= 40) return 'Adjust';
    return 'Poor';
  };

  const prettyJoint = (k: string) =>
    k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // ── Permission gating ───────────────────────────────────────────────────────
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
        <Text style={tw`text-white text-lg font-bold mt-4 text-center`}>
          Camera permission required
        </Text>
        <Text style={tw`text-slate-400 text-sm mt-2 text-center`}>
          Vertex Vision uses your camera to analyze your form in real time.
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

  return (
    <View style={tw`flex-1 bg-black`}>
      {/* Camera feed */}
      <CameraView
        ref={cameraRef}
        style={tw`absolute inset-0`}
        facing="front"
        onCameraReady={() => setCameraReady(true)}
      />

      {/* Scrims for legibility */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 130, backgroundColor: 'rgba(0,0,0,0.45)' }} />
      <View pointerEvents="none" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 310, backgroundColor: 'rgba(0,0,0,0.65)' }} />

      {/* ───── Top bar ───── */}
      <SafeAreaView style={tw`absolute inset-0`} edges={['top']} pointerEvents="box-none">
        <View style={tw`flex-row items-center justify-between px-5 pt-2`}>
          <TouchableOpacity onPress={handleStop} style={tw`w-11 h-11 rounded-full bg-white/15 items-center justify-center`}>
            <MaterialIcons name="close" size={22} color="white" />
          </TouchableOpacity>

          <View style={tw`flex-row items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-white/10`}>
            <View
              style={[
                tw`w-2 h-2 rounded-full`,
                { backgroundColor: sessionState === 'running' ? (poseDetected ? '#22c55e' : '#ef4444') : '#94a3b8' },
              ]}
            />
            <Text style={tw`text-white text-xs font-bold tracking-wider uppercase`}>
              {sessionState === 'paused' ? 'Paused' : poseDetected ? 'Detected' : 'Scanning…'}
            </Text>
          </View>

          <View
            style={[
              tw`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full`,
              {
                backgroundColor:
                  aiBackendOk === true ? 'rgba(34,197,94,0.18)' :
                  aiBackendOk === false ? 'rgba(239,68,68,0.18)' :
                  'rgba(255,255,255,0.1)',
              },
            ]}
          >
            <MaterialIcons
              name={aiBackendOk === false ? 'cloud-off' : 'cloud-done'}
              size={14}
              color={aiBackendOk === true ? '#22c55e' : aiBackendOk === false ? '#ef4444' : '#94a3b8'}
            />
            <Text
              style={[
                tw`text-[10px] font-bold uppercase`,
                { color: aiBackendOk === true ? '#22c55e' : aiBackendOk === false ? '#ef4444' : '#94a3b8' },
              ]}
            >
              {aiBackendOk === true ? 'AI On' : aiBackendOk === false ? 'AI Off' : '...'}
            </Text>
          </View>
        </View>

        {/* Big timer + exercise name */}
        <View style={tw`items-center mt-5`}>
          <Text style={tw`text-white/70 text-xs font-bold uppercase tracking-widest`}>Session</Text>
          <Text
            style={[
              tw`text-white font-black tracking-tight`,
              { fontSize: 56, lineHeight: 60, fontVariant: ['tabular-nums'] },
            ]}
          >
            {formatTime(elapsedSeconds)}
          </Text>
          <View style={tw`mt-1 px-3 py-1 rounded-full bg-white/10`}>
            <Text style={tw`text-white text-sm font-bold capitalize`}>{exerciseDisplay}</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* ───── Side panel: live form score ───── */}
      <View style={[tw`absolute right-4`, { top: insets.top + 200 }]}>
        <View style={tw`items-center gap-1.5 bg-black/55 px-3 py-3 rounded-2xl border border-white/10`}>
          <Text style={tw`text-white/60 text-[10px] font-bold uppercase tracking-widest`}>Form</Text>
          <Text style={[tw`font-black`, { color: formColor(formScore), fontSize: 32, lineHeight: 36 }]}>
            {formScore !== null ? `${formScore}` : '--'}
          </Text>
          <Text style={[tw`text-[10px] font-bold uppercase tracking-wider`, { color: formColor(formScore) }]}>
            {formLabel(formScore)}
          </Text>
          {analyzing && <ActivityIndicator size="small" color="#94a3b8" style={tw`mt-0.5`} />}
        </View>
      </View>

      {/* ───── Scanning overlay ───── */}
      {showScanOverlay && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: insets.top + 200,
            bottom: 320,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={tw`px-6 py-4 rounded-2xl bg-black/60 border border-white/15 items-center gap-2 mx-8`}>
            <ActivityIndicator color="#22c55e" />
            <Text style={tw`text-white text-base font-bold`}>Looking for you…</Text>
            <Text style={tw`text-white/70 text-xs text-center`}>
              Step back so your whole body fits inside the frame
            </Text>
          </View>
        </View>
      )}

      {/* ───── Bottom panel ───── */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom + 12, 24),
        }}
      >
        {/* Joint angle chips (live data) */}
        {Object.keys(angles).length > 0 && (
          <View style={tw`flex-row flex-wrap gap-2 mb-3`}>
            {Object.entries(angles)
              .filter(([k, v]) => typeof v === 'number' && k !== 'targets')
              .slice(0, 4)
              .map(([k, v]) => (
                <View key={k} style={tw`px-2.5 py-1 rounded-full bg-white/10 border border-white/10 flex-row gap-1.5`}>
                  <Text style={tw`text-white/70 text-[10px] font-bold uppercase`}>{prettyJoint(k)}</Text>
                  <Text style={tw`text-white text-[10px] font-black`}>{Math.round(v as number)}°</Text>
                </View>
              ))}
          </View>
        )}

        {/* Primary stat cards (reps or hold) + set counter */}
        <View style={tw`flex-row gap-3 mb-4`}>
          {isHold ? (
            <View
              style={[
                tw`flex-1 rounded-2xl px-4 py-3`,
                {
                  backgroundColor: holding ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.1)',
                  borderWidth: 1,
                  borderColor: holding ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.15)',
                },
              ]}
            >
              <View style={tw`flex-row items-center justify-between`}>
                <Text style={tw`text-white/70 text-[10px] font-bold uppercase tracking-widest`}>
                  Hold {holding ? '· Holding' : '· Off form'}
                </Text>
                <TouchableOpacity onPress={resetCurrent} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="refresh" size={14} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              </View>
              <View style={tw`flex-row items-baseline gap-1.5 mt-1`}>
                <Text style={tw`text-white text-3xl font-black`}>{holdSeconds}s</Text>
                <Text style={tw`text-white/50 text-sm font-bold`}>/ {targetHoldSeconds}s</Text>
              </View>
            </View>
          ) : (
            <View style={tw`flex-1 bg-white/10 border border-white/15 rounded-2xl px-4 py-3`}>
              <View style={tw`flex-row items-center justify-between`}>
                <Text style={tw`text-white/70 text-[10px] font-bold uppercase tracking-widest`}>
                  Reps · auto
                </Text>
                <TouchableOpacity onPress={resetCurrent} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="refresh" size={14} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              </View>
              <View style={tw`flex-row items-baseline gap-1.5 mt-1`}>
                <Text style={tw`text-white text-3xl font-black`}>{reps}</Text>
                <Text style={tw`text-white/50 text-sm font-bold`}>/ {targetReps}</Text>
              </View>
            </View>
          )}

          <View style={tw`flex-1 bg-white/10 border border-white/15 rounded-2xl px-4 py-3`}>
            <Text style={tw`text-white/70 text-[10px] font-bold uppercase tracking-widest`}>Set</Text>
            <View style={tw`flex-row items-baseline gap-1.5 mt-1`}>
              <Text style={tw`text-white text-3xl font-black`}>{currentSet}</Text>
              <Text style={tw`text-white/50 text-sm font-bold`}>/ {targetSets}</Text>
            </View>
          </View>
        </View>

        {/* AI offline banner */}
        {analysisError && aiBackendOk === false && (
          <View style={tw`bg-red-500/15 border border-red-500/30 rounded-xl px-3 py-2 mb-3 flex-row items-center gap-2`}>
            <MaterialIcons name="error-outline" size={16} color="#ef4444" />
            <Text style={tw`text-red-300 text-xs flex-1`}>
              AI server unreachable — your timer still works.
            </Text>
          </View>
        )}

        {/* Pause + Stop */}
        <View style={tw`flex-row gap-3`}>
          <TouchableOpacity
            onPress={togglePause}
            style={[
              tw`flex-1 flex-row items-center justify-center gap-2 py-4 rounded-2xl`,
              {
                backgroundColor: sessionState === 'paused' ? '#22c55e' : 'rgba(255,255,255,0.15)',
                borderWidth: 1,
                borderColor: sessionState === 'paused' ? '#22c55e' : 'rgba(255,255,255,0.2)',
              },
            ]}
          >
            <MaterialIcons name={sessionState === 'paused' ? 'play-arrow' : 'pause'} size={22} color="white" />
            <Text style={tw`text-white text-base font-black uppercase tracking-wider`}>
              {sessionState === 'paused' ? 'Resume' : 'Pause'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleStop}
            style={tw`flex-1 flex-row items-center justify-center gap-2 py-4 rounded-2xl bg-red-500`}
          >
            <MaterialIcons name="stop" size={22} color="white" />
            <Text style={tw`text-white text-base font-black uppercase tracking-wider`}>Stop</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
