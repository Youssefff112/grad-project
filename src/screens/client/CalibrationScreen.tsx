import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';

export const CalibrationScreen = ({ navigation, route }: any) => {
  const { isDark, accent } = useTheme();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);

  const exerciseName: string | undefined = route?.params?.exerciseName;
  const workoutName: string | undefined = route?.params?.workoutName;

  const handleCameraPress = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera Required', 'Please enable camera permissions to use this feature.');
        return;
      }
    }

    // Forward exercise context to the live tracking screen so it can render
    // the right exercise name and use the right CV target ranges.
    navigation.navigate('ActiveSet', {
      exerciseName: exerciseName ?? workoutName,
      workoutName,
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
            {exerciseName || workoutName || 'Get Ready'}
          </Text>
        </View>
        <View style={tw`flex w-12 items-center justify-end`}>
          <TouchableOpacity style={tw`flex items-center justify-center p-2`} onPress={() => Alert.alert('Vertex Vision', 'Step back so your whole body is in the frame. Tap Start when you\'re ready — Vertex Vision will analyze your form in real time.')}>
            <MaterialIcons name="help-outline" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Camera View */}
      <View style={tw`relative flex-1`}>
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

      {/* Bottom Controls */}
      <View style={[tw`px-6 pt-4 pb-6 gap-3`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <Text style={[tw`text-xs text-center`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          {cameraReady
            ? 'Step back so your whole body fits in the frame'
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
    </SafeAreaView>
  );
};

