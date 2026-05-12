import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import * as aiVisionService from '../../services/aiVisionService';
import * as workoutService from '../../services/workoutService';

// Aim for ~2.5 fps of analysis. Faster than the previous 800ms loop so the
// rep detector actually sees both ends of a movement.
const ANALYSIS_INTERVAL_MS = 450;
const SCAN_LOST_GRACE_MS = 1500;

type SessionState = 'running' | 'paused' | 'stopped';
type CameraFacing = 'front' | 'back';

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
  const smootherRef = useRef<aiVisionService.AngleSmoother>(new aiVisionService.AngleSmoother(0.45));

  useEffect(() => {
    repDetectorRef.current = new aiVisionService.RepDetector(profile);
    smootherRef.current = new aiVisionService.AngleSmoother(0.45);
  }, [profile]);

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('front');
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

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

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

  const analyzeOneFrame = useCallback(async () => {
    if (sessionState !== 'running' || !cameraReady || !cameraRef.current) return;
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
        shutterSound: false,
        exif: false,
      });
      if (!photo?.base64) return;

      const result = await aiVisionService.analyzeFrame(photo.base64, rawExerciseName);
      if (result.poseDetected) {
        const smoothed = smootherRef.current.update(result.angles);
        setAngles(smoothed);
        setPoseDetected(true);
        lastPoseAtRef.current = Date.now();
        setFormScore(aiVisionService.computeFormScore(smoothed, result.targets));
        setAnalysisError(null);

        if (isHold) {
          setHolding(aiVisionService.isHoldingForm(profile, smoothed));
        } else {
          const counted = repDetectorRef.current.update(smoothed);
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
        // Pose lost — clear holding and decay score after a short grace.
        setHolding(false);
        if (Date.now() - lastPoseAtRef.current > SCAN_LOST_GRACE_MS) {
          setPoseDetected(false);
          setFormScore(null);
          smootherRef.current.reset();
        }
      }
    } catch (err: any) {
      const msg = err?.message || 'Analysis failed';
      setAnalysisError(msg);
    } finally {
      inFlightRef.current = false;
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

  // Hold timer — ticks only while in form
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
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
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
              // ignore — keep UX smooth even if logging fails
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

  const prettyJoint = (k: string) =>
    k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // ── Permission gating ────────────────────────────────────────────────────
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
      {/* Camera fills the entire screen */}
      <CameraView
        ref={cameraRef}
        style={tw`absolute inset-0`}
        facing={cameraFacing}
        onCameraReady={() => setCameraReady(true)}
      />

      {/* Subtle gradient scrims for legibility (much thinner than before) */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 60, backgroundColor: 'rgba(0,0,0,0.35)' }} />
      <View pointerEvents="none" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 170, backgroundColor: 'rgba(0,0,0,0.55)' }} />

      {/* ───── Top bar — close · status pill · flip / AI ───── */}
      <SafeAreaView style={tw`absolute inset-0`} edges={['top']} pointerEvents="box-none">
        <View style={tw`flex-row items-center justify-between px-4`}>
          <TouchableOpacity onPress={handleStop} style={tw`w-10 h-10 rounded-full bg-black/45 items-center justify-center border border-white/15`}>
            <MaterialIcons name="close" size={20} color="white" />
          </TouchableOpacity>

          <View style={tw`flex-row items-center gap-2 px-3 py-1.5 rounded-full bg-black/45 border border-white/15`}>
            <View
              style={[
                tw`w-2 h-2 rounded-full`,
                { backgroundColor: sessionState === 'running' ? (poseDetected ? '#22c55e' : '#ef4444') : '#94a3b8' },
              ]}
            />
            <Text style={tw`text-white text-[11px] font-bold uppercase tracking-wider`}>
              {sessionState === 'paused' ? 'Paused' : poseDetected ? 'Tracking' : 'Scanning…'}
            </Text>
          </View>

          <View style={tw`flex-row gap-2`}>
            <TouchableOpacity
              onPress={() => setCameraFacing((f) => (f === 'front' ? 'back' : 'front'))}
              style={tw`w-10 h-10 rounded-full bg-black/45 items-center justify-center border border-white/15`}
            >
              <MaterialIcons name="flip-camera-ios" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* ───── Floating chips: timer + form score + AI status ───── */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: insets.top + 56,
          left: 12,
          right: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
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
          <Text style={[tw`font-black`, { color: formColor(formScore), fontSize: 22, lineHeight: 26 }]}>
            {formScore !== null ? `${formScore}` : '--'}
          </Text>
        </View>

        {/* AI status */}
        <View
          style={[
            tw`px-3 py-2 rounded-2xl items-center min-w-[88px] border`,
            {
              backgroundColor: 'rgba(0,0,0,0.55)',
              borderColor:
                aiBackendOk === true ? 'rgba(34,197,94,0.5)' :
                aiBackendOk === false ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.15)',
            },
          ]}
        >
          <Text style={tw`text-white/60 text-[9px] font-bold uppercase tracking-widest`}>AI</Text>
          <View style={tw`flex-row items-center gap-1`}>
            <MaterialIcons
              name={aiBackendOk === false ? 'cloud-off' : 'cloud-done'}
              size={14}
              color={aiBackendOk === true ? '#22c55e' : aiBackendOk === false ? '#ef4444' : '#94a3b8'}
            />
            <Text
              style={[
                tw`text-[11px] font-black uppercase`,
                { color: aiBackendOk === true ? '#22c55e' : aiBackendOk === false ? '#ef4444' : '#94a3b8' },
              ]}
            >
              {aiBackendOk === true ? 'On' : aiBackendOk === false ? 'Off' : '…'}
            </Text>
          </View>
        </View>
      </View>

      {/* Exercise name floating pill (centered above bottom panel) */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 190, alignItems: 'center' }}>
        <View style={tw`bg-black/55 px-3 py-1 rounded-full border border-white/15`}>
          <Text style={tw`text-white text-xs font-bold uppercase tracking-wider`}>{exerciseDisplay}</Text>
        </View>
      </View>

      {/* ───── Scanning overlay ───── */}
      {showScanOverlay && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 24,
            right: 24,
            top: '40%',
            alignItems: 'center',
          }}
        >
          <View style={tw`px-5 py-3 rounded-2xl bg-black/65 border border-white/15 items-center gap-1.5`}>
            <ActivityIndicator color="#22c55e" />
            <Text style={tw`text-white text-sm font-bold`}>Looking for you…</Text>
            <Text style={tw`text-white/70 text-[11px] text-center`}>
              Step back so your whole body fits in frame
            </Text>
          </View>
        </View>
      )}

      {/* ───── Bottom panel (compact: ~170px tall) ───── */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 14,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom + 8, 16),
        }}
      >
        {/* Single-row joint chips (max 3) */}
        {Object.keys(angles).length > 0 && (
          <View style={tw`flex-row gap-1.5 mb-2`}>
            {Object.entries(angles)
              .filter(([k, v]) => typeof v === 'number' && k.endsWith('_avg'))
              .slice(0, 3)
              .map(([k, v]) => (
                <View key={k} style={tw`px-2 py-0.5 rounded-full bg-white/15 flex-row gap-1`}>
                  <Text style={tw`text-white/70 text-[10px] font-bold uppercase`}>{prettyJoint(k.replace('_avg', ''))}</Text>
                  <Text style={tw`text-white text-[10px] font-black`}>{Math.round(v as number)}°</Text>
                </View>
              ))}
          </View>
        )}

        {/* Reps/hold + sets — compact single row */}
        <View style={tw`flex-row gap-2 mb-2`}>
          {isHold ? (
            <View
              style={[
                tw`flex-1 rounded-xl px-3 py-2`,
                {
                  backgroundColor: holding ? 'rgba(34,197,94,0.22)' : 'rgba(255,255,255,0.1)',
                  borderWidth: 1,
                  borderColor: holding ? 'rgba(34,197,94,0.55)' : 'rgba(255,255,255,0.15)',
                },
              ]}
            >
              <View style={tw`flex-row items-center justify-between`}>
                <Text style={tw`text-white/70 text-[9px] font-bold uppercase tracking-widest`}>
                  Hold {holding ? '· Holding' : '· Off form'}
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
                <Text style={tw`text-white/70 text-[9px] font-bold uppercase tracking-widest`}>
                  Reps · auto
                </Text>
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
            <Text style={tw`text-red-300 text-[11px] flex-1`}>
              AI server unreachable — timer still works.
            </Text>
          </View>
        )}

        {/* Pause + Stop */}
        <View style={tw`flex-row gap-2`}>
          <TouchableOpacity
            onPress={togglePause}
            style={[
              tw`flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-xl`,
              {
                backgroundColor: sessionState === 'paused' ? '#22c55e' : 'rgba(255,255,255,0.15)',
                borderWidth: 1,
                borderColor: sessionState === 'paused' ? '#22c55e' : 'rgba(255,255,255,0.2)',
              },
            ]}
          >
            <MaterialIcons name={sessionState === 'paused' ? 'play-arrow' : 'pause'} size={18} color="white" />
            <Text style={tw`text-white text-sm font-black uppercase tracking-wider`}>
              {sessionState === 'paused' ? 'Resume' : 'Pause'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleStop}
            style={tw`flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-xl bg-red-500`}
          >
            <MaterialIcons name="stop" size={18} color="white" />
            <Text style={tw`text-white text-sm font-black uppercase tracking-wider`}>Stop</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
