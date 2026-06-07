import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';

// ── Exercise instruction database ─────────────────────────────────────────────
interface ExerciseInstruction {
  cameraIcon: React.ComponentProps<typeof MaterialIcons>['name'];
  cameraPosition: string;
  bodyPosition: string;
  movement: string;
  tips: string[];
}

function getExerciseInstructions(name: string): ExerciseInstruction {
  const n = (name ?? '').toLowerCase().replace(/-/g, ' ');

  // ── Cardio / Full-body ────────────────────────────────────────────────────
  if (n.includes('jumping jack') || n.includes('star jump')) {
    return {
      cameraIcon: 'videocam',
      cameraPosition: 'Place phone 2–3 m away, at chest height, facing you',
      bodyPosition: 'Stand facing the camera with your full body visible — head to toe',
      movement: 'Jump feet wide while raising both arms overhead, then return. Each overhead position = 1 rep.',
      tips: ['Arms must reach above shoulder height to count', 'Land with soft knees each jump', 'Keep a steady rhythm'],
    };
  }
  if (n.includes('high knee')) {
    return {
      cameraIcon: 'videocam',
      cameraPosition: 'Place phone 2–3 m away, at waist height, facing you',
      bodyPosition: 'Stand facing the camera, feet hip-width apart, full body visible',
      movement: 'Drive alternating knees up above hip height. Each knee drive = 1 rep.',
      tips: ['Lift knee to at least hip height to count', 'Pump arms with each knee', 'Stay on the balls of your feet'],
    };
  }
  if (n.includes('burpee')) {
    return {
      cameraIcon: 'stay-current-portrait',
      cameraPosition: 'Place phone 2–3 m away at knee height on the floor, slightly angled up',
      bodyPosition: 'Start standing, facing the camera with full body visible',
      movement: 'Drop into push-up position → do push-up → jump feet to hands → jump up with arms overhead = 1 rep.',
      tips: ['Make sure the squat-down is deep enough', 'Full extension at the top jump is important', 'Keep core tight throughout'],
    };
  }
  if (n.includes('mountain climber')) {
    return {
      cameraIcon: 'stay-current-landscape',
      cameraPosition: 'Place phone on the floor, 1.5 m to your side',
      bodyPosition: 'Start in push-up/plank position sideways to the camera',
      movement: 'Drive alternating knees toward your chest quickly. Each knee drive = 1 rep.',
      tips: ['Keep hips level — do not raise them', 'Drive knee all the way toward chest to count', 'Maintain wrists under shoulders'],
    };
  }
  if (n.includes('box jump') || n.includes('jump squat') || n.includes('squat jump')) {
    return {
      cameraIcon: 'videocam',
      cameraPosition: 'Place phone 2–3 m to your SIDE, at hip height',
      bodyPosition: 'Stand sideways to the camera, full body visible from head to feet',
      movement: 'Squat down then explode upward. Land softly and reset. Each landing = 1 rep.',
      tips: ['Face sideways for best angle detection', 'Squat to at least 90° knee bend', 'Soft landing — bend knees on contact'],
    };
  }
  if (n.includes('skater')) {
    return {
      cameraIcon: 'videocam',
      cameraPosition: 'Place phone 2–3 m away, at chest height, facing you',
      bodyPosition: 'Stand facing the camera with room to move side to side',
      movement: 'Leap sideways onto one leg, bring other leg behind. Each side = 1 rep.',
      tips: ['Show the full sideways leap', 'Single-leg landing counts', 'Keep a low athletic position'],
    };
  }
  if (n.includes('bear crawl') || n.includes('inchworm')) {
    return {
      cameraIcon: 'stay-current-landscape',
      cameraPosition: 'Place phone on the floor, 2 m to your SIDE',
      bodyPosition: 'Get into position sideways to the camera on hands and feet',
      movement: 'Crawl forward keeping hips low. Every full crawl cycle = 1 rep.',
      tips: ['Hips should stay at the same height as shoulders', 'Keep back flat, core engaged', 'Slow and controlled wins'],
    };
  }

  // ── Squats / Legs ─────────────────────────────────────────────────────────
  if (n.includes('squat') || n.includes('goblet') || n.includes('hack squat')) {
    return {
      cameraIcon: 'stay-current-portrait',
      cameraPosition: 'Place phone 2–3 m to your SIDE, at hip height',
      bodyPosition: 'Stand sideways to the camera — your side profile should be fully visible',
      movement: 'Lower until knees are at ~90°, then drive back up. Each stand = 1 rep.',
      tips: ['Turn your body 90° — stand sideways, not facing the camera', 'Full body from head to ankles must be visible', 'Feet shoulder-width apart'],
    };
  }
  if (n.includes('lunge') || n.includes('split squat') || n.includes('bulgarian') || n.includes('step up')) {
    return {
      cameraIcon: 'stay-current-portrait',
      cameraPosition: 'Place phone 2–3 m to your SIDE, at hip height',
      bodyPosition: 'Stand sideways to the camera, lunge forward or back',
      movement: 'Lower back knee toward floor, then drive back up. Each return = 1 rep.',
      tips: ['Sideways view is essential for knee angle detection', 'Front knee should not pass your toes', 'Keep torso upright'],
    };
  }
  if (n.includes('glute bridge') || n.includes('hip thrust')) {
    return {
      cameraIcon: 'stay-current-landscape',
      cameraPosition: 'Place phone 1.5 m to your SIDE on the floor, pointing toward you',
      bodyPosition: 'Lie on your back sideways to the camera, knees bent, feet flat',
      movement: 'Push hips up until body is a straight line, lower back down. Each lift = 1 rep.',
      tips: ['Lie parallel to the camera so it can see the hip movement', 'Squeeze glutes at the top', 'Do not arch your lower back'],
    };
  }
  if (n.includes('deadlift') || n.includes('rdl') || n.includes('romanian')) {
    return {
      cameraIcon: 'stay-current-portrait',
      cameraPosition: 'Place phone 2–3 m to your SIDE, at hip height',
      bodyPosition: 'Stand sideways to the camera, feet hip-width apart',
      movement: 'Hinge at hips and lower the weight, then drive hips forward to stand. Each stand = 1 rep.',
      tips: ['Sideways view is critical to see the hip hinge', 'Slight knee bend throughout', 'Neutral spine — no rounding'],
    };
  }
  if (n.includes('calf raise')) {
    return {
      cameraIcon: 'stay-current-portrait',
      cameraPosition: 'Place phone 2–3 m to your SIDE, at ankle height',
      bodyPosition: 'Stand sideways, feet together or hip-width apart',
      movement: 'Rise onto your toes, then lower heels. Each lower = 1 rep.',
      tips: ['Camera must be low (ankle level) to see the heel movement', 'Full range: heels below platform, then full toe rise', 'Slow and controlled'],
    };
  }

  // ── Push / Chest ──────────────────────────────────────────────────────────
  if (n.includes('push') || n.includes('bench press') || n.includes('chest') || n.includes('floor press')) {
    return {
      cameraIcon: 'stay-current-landscape',
      cameraPosition: 'Place phone on the floor, 1.5 m to your SIDE, pointing toward you',
      bodyPosition: 'Get into push-up or bench position sideways to the camera',
      movement: 'Lower chest toward floor/bar, then push back up. Each full extension = 1 rep.',
      tips: ['Sideways view is critical — camera on the floor beside you', 'Your entire body (shoulders to feet) must be visible', 'Keep core tight, no sagging hips'],
    };
  }
  if (n.includes('dip') || n.includes('chair dip') || n.includes('bench dip')) {
    return {
      cameraIcon: 'stay-current-portrait',
      cameraPosition: 'Place phone 2 m to your SIDE, at chair/bench height',
      bodyPosition: 'Sit sideways to the camera, hands on chair/bench behind you',
      movement: 'Lower body by bending elbows, then push back up. Each push = 1 rep.',
      tips: ['Side view is needed to see elbow angle', 'Lower until elbows reach 90°', 'Keep hips close to the bench'],
    };
  }

  // ── Pull / Back ───────────────────────────────────────────────────────────
  if (n.includes('pull up') || n.includes('pullup') || n.includes('chin up') || n.includes('lat pulldown')) {
    return {
      cameraIcon: 'stay-current-portrait',
      cameraPosition: 'Place phone 2–3 m in FRONT of you, at chest height',
      bodyPosition: 'Face the camera on the bar or machine',
      movement: 'Pull up until chin clears bar, lower fully. Each full lower = 1 rep.',
      tips: ['Hang at dead hang between reps to count properly', 'Chin must clearly pass the bar', 'Keep core engaged — no kipping'],
    };
  }
  if (n.includes('row') || n.includes('inverted row')) {
    return {
      cameraIcon: 'stay-current-portrait',
      cameraPosition: 'Place phone 2 m to your SIDE, at hip height',
      bodyPosition: 'Position sideways to camera — bent-over row or seated row',
      movement: 'Pull elbows back past your torso, then extend fully. Each extension = 1 rep.',
      tips: ['Side view shows elbow travel clearly', 'Pull all the way back for a full rep', 'Control the return — do not drop weight'],
    };
  }

  // ── Shoulders ─────────────────────────────────────────────────────────────
  if (n.includes('shoulder press') || n.includes('overhead press') || n.includes('ohp') || n.includes('military press')) {
    return {
      cameraIcon: 'stay-current-portrait',
      cameraPosition: 'Place phone 2–3 m to your SIDE, at chest height',
      bodyPosition: 'Stand or sit sideways to the camera',
      movement: 'Press weight from shoulders to full arm extension overhead. Each lockout = 1 rep.',
      tips: ['Side view shows arm extension above head', 'Full lockout at top counts', 'Brace your core — do not lean back'],
    };
  }
  if (n.includes('lateral raise') || n.includes('front raise') || n.includes('side raise') || n.includes('rear delt')) {
    return {
      cameraIcon: 'videocam',
      cameraPosition: 'Place phone 2–3 m in FRONT of you, at chest height',
      bodyPosition: 'Stand facing the camera, feet shoulder-width apart',
      movement: 'Raise arms out to the side to shoulder height, then lower. Each lower = 1 rep.',
      tips: ['Facing camera lets AI see arm width', 'Arms must reach shoulder height to count', 'Slight bend in elbows throughout'],
    };
  }

  // ── Arms ──────────────────────────────────────────────────────────────────
  if (n.includes('curl') || n.includes('bicep')) {
    return {
      cameraIcon: 'stay-current-portrait',
      cameraPosition: 'Place phone 2–3 m to your SIDE, at waist height',
      bodyPosition: 'Stand sideways to the camera, arms hanging at sides',
      movement: 'Curl weight up toward shoulder, lower fully. Each full lower = 1 rep.',
      tips: ['Side view shows the elbow angle clearly', 'Lower all the way down for a complete rep', 'Keep elbows pinned at your sides'],
    };
  }
  if (n.includes('tricep') || n.includes('skull crusher') || n.includes('pushdown') || n.includes('extension')) {
    return {
      cameraIcon: 'stay-current-portrait',
      cameraPosition: 'Place phone 2 m to your SIDE, at waist height',
      bodyPosition: 'Stand or sit sideways to the camera',
      movement: 'Extend arm(s) fully, then bend back to starting position. Each extension = 1 rep.',
      tips: ['Side view is best for elbow angle', 'Full extension at the bottom counts', 'Keep upper arm stationary'],
    };
  }

  // ── Core / Plank ──────────────────────────────────────────────────────────
  if (n.includes('plank') || n.includes('hollow hold') || n.includes('dead bug')) {
    return {
      cameraIcon: 'stay-current-landscape',
      cameraPosition: 'Place phone on the floor, 1.5 m to your SIDE',
      bodyPosition: 'Get into plank position sideways to the camera, full body visible',
      movement: 'Hold the position — time counts while your body is straight.',
      tips: ['Side view shows body alignment', 'Hips must stay level — not too high, not sagging', 'Breathe steadily throughout the hold'],
    };
  }

  // ── Default fallback ──────────────────────────────────────────────────────
  return {
    cameraIcon: 'videocam',
    cameraPosition: 'Place phone 2–3 m away so your full body is visible',
    bodyPosition: 'Stand sideways to the camera for best angle detection',
    movement: 'Perform the movement fully and return to starting position. Each full cycle = 1 rep.',
    tips: ['Full body (head to feet) must be in frame', 'Sideways view usually works best', 'Move at a controlled, steady pace'],
  };
}

export const CalibrationScreen = ({ navigation, route }: any) => {
  const { isDark, accent } = useTheme();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const exerciseName: string | undefined = route?.params?.exerciseName;
  const workoutName: string | undefined = route?.params?.workoutName;
  const workoutPlanId: number | undefined = route?.params?.workoutPlanId;
  const workoutDay: string | undefined = route?.params?.workoutDay;
  const workoutFocus: string | undefined = route?.params?.workoutFocus;
  const displayName = exerciseName || workoutName || 'Exercise';
  const instructions = getExerciseInstructions(displayName);

  const handleCameraPress = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera Required', 'Please enable camera permissions to use this feature.');
        return;
      }
    }

    // Forward exercise context (including plan linkage) to the live tracking screen.
    navigation.navigate('ActiveSet', {
      exerciseName: exerciseName ?? workoutName,
      workoutName: workoutFocus || workoutName,
      workoutFocus: workoutFocus || workoutName,
      workoutPlanId,
      workoutDay,
    });
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      {/* Top App Bar */}
      <View style={[tw`flex-row items-center p-4 justify-between z-10`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-12 shrink-0 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
        </TouchableOpacity>
        <View style={tw`flex-1 items-center`}>
          <Text style={[tw`text-xs font-bold tracking-widest uppercase`, { color: accent }]}>
            Vertex Vision
          </Text>
          <Text style={[tw`text-base font-bold capitalize mt-0.5`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            {displayName}
          </Text>
        </View>
        <View style={tw`flex w-12 items-center justify-end`}>
          <TouchableOpacity style={tw`flex items-center justify-center p-2`} onPress={() => Alert.alert('Vertex Vision', 'Step back so your whole body is in the frame. Tap Start when you\'re ready — Vertex Vision will analyze your form in real time.')}>
            <MaterialIcons name="help-outline" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Camera preview — fixed share of screen so instructions stay visible */}
      <View style={[tw`relative`, { height: '38%', minHeight: 200 }]}>
        {permission?.granted ? (
          <>
            {/* CameraView must have no children — overlays go on the sibling View */}
            <CameraView
              ref={cameraRef}
              style={tw`flex-1`}
              onCameraReady={() => setCameraReady(true)}
              facing="front"
            />

            {/* Overlays using absolute positioning outside CameraView */}
            <View style={tw`absolute inset-0`} pointerEvents="none">
              {/* Crosshair */}
              <View style={tw`flex-1 items-center justify-center`}>
                <View style={[tw`w-32 h-32 border-2 border-dashed rounded-2xl`, { borderColor: accent + '80' }]} />
              </View>

              {/* Camera Ready Indicator */}
              {cameraReady && (
                <View style={[tw`absolute top-4 right-4 flex-row items-center gap-2 px-3 py-1.5 rounded-full`, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                  <View style={tw`h-2 w-2 bg-green-500 rounded-full`} />
                  <Text style={tw`text-xs font-bold text-white uppercase`}>Ready</Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <View style={tw`flex-1 items-center justify-center`}>
            <MaterialIcons name="camera-alt" size={48} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[tw`text-base font-semibold mt-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              Camera Permission Required
            </Text>
            <TouchableOpacity
              style={[tw`mt-6 px-6 py-3 rounded-xl`, { backgroundColor: accent }]}
              onPress={requestPermission}
            >
              <Text style={tw`text-white font-bold`}>Enable Camera</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Bottom: Instructions + Start */}
      <View style={[{ flex: 1, backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>

        {/* Toggle button */}
        <TouchableOpacity
          onPress={() => setShowInstructions((v) => !v)}
          style={[tw`flex-row items-center justify-between px-5 py-3`, { borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}
        >
          <View style={tw`flex-row items-center gap-2`}>
            <MaterialIcons name="info-outline" size={18} color={accent} />
            <Text style={[tw`text-sm font-bold`, { color: accent }]}>
              How to position yourself
            </Text>
          </View>
          <MaterialIcons
            name={showInstructions ? 'keyboard-arrow-down' : 'keyboard-arrow-up'}
            size={20}
            color={isDark ? '#94a3b8' : '#64748b'}
          />
        </TouchableOpacity>

        {/* Instruction cards */}
        {showInstructions && (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={tw`px-4 pt-3 pb-2 gap-2`}
            showsVerticalScrollIndicator
          >
            {/* Camera position */}
            <View style={[tw`flex-row items-start gap-3 p-3 rounded-xl`, { backgroundColor: isDark ? '#111128' : '#f1f5f9' }]}>
              <View style={[tw`w-8 h-8 rounded-lg items-center justify-center shrink-0`, { backgroundColor: accent + '20' }]}>
                <MaterialIcons name={instructions.cameraIcon} size={18} color={accent} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`text-[11px] font-black uppercase tracking-wider mb-0.5`, { color: accent }]}>
                  Camera Position
                </Text>
                <Text style={[tw`text-xs leading-relaxed`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  {instructions.cameraPosition}
                </Text>
              </View>
            </View>

            {/* Body position */}
            <View style={[tw`flex-row items-start gap-3 p-3 rounded-xl`, { backgroundColor: isDark ? '#111128' : '#f1f5f9' }]}>
              <View style={[tw`w-8 h-8 rounded-lg items-center justify-center shrink-0`, { backgroundColor: '#22c55e20' }]}>
                <MaterialIcons name="accessibility-new" size={18} color="#22c55e" />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`text-[11px] font-black uppercase tracking-wider mb-0.5`, { color: '#22c55e' }]}>
                  Body Position
                </Text>
                <Text style={[tw`text-xs leading-relaxed`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  {instructions.bodyPosition}
                </Text>
              </View>
            </View>

            {/* Movement */}
            <View style={[tw`flex-row items-start gap-3 p-3 rounded-xl`, { backgroundColor: isDark ? '#111128' : '#f1f5f9' }]}>
              <View style={[tw`w-8 h-8 rounded-lg items-center justify-center shrink-0`, { backgroundColor: '#f59e0b20' }]}>
                <MaterialIcons name="replay" size={18} color="#f59e0b" />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`text-[11px] font-black uppercase tracking-wider mb-0.5`, { color: '#f59e0b' }]}>
                  What Counts as a Rep
                </Text>
                <Text style={[tw`text-xs leading-relaxed`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  {instructions.movement}
                </Text>
              </View>
            </View>

            {/* Quick tips */}
            <View style={[tw`p-3 rounded-xl`, { backgroundColor: isDark ? '#111128' : '#f1f5f9' }]}>
              <Text style={[tw`text-[11px] font-black uppercase tracking-wider mb-2`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                Quick Tips
              </Text>
              {instructions.tips.map((tip, i) => (
                <View key={i} style={tw`flex-row items-start gap-2 mb-1`}>
                  <View style={[tw`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0`, { backgroundColor: accent }]} />
                  <Text style={[tw`text-xs flex-1 leading-relaxed`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Camera status + start button */}
        <View style={tw`px-5 pt-3 pb-5 gap-2`}>
          <Text style={[tw`text-xs text-center`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            {cameraReady
              ? 'Position yourself, then tap Start'
              : 'Waiting for camera…'}
          </Text>
          <TouchableOpacity
            style={[
              tw`flex-row items-center justify-center gap-2 py-4 rounded-2xl`,
              {
                backgroundColor: cameraReady ? accent : (isDark ? '#1e293b' : '#e2e8f0'),
                opacity: cameraReady ? 1 : 0.6,
              },
            ]}
            onPress={handleCameraPress}
            disabled={!cameraReady}
          >
            <MaterialIcons name="play-arrow" size={22} color="white" />
            <Text style={tw`text-white font-black text-base uppercase tracking-widest`}>
              Start Session
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

