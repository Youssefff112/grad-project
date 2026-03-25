import React, { useRef, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';

export const CalibrationScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);

  const handleCameraPress = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera Required', 'Please enable camera permissions to use this feature.');
        return;
      }
    }

    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        // Photo captured, proceed to ActiveSet for form analysis
        navigation.navigate('ActiveSet');
      } catch (error) {
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
      }
    }
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      {/* Top App Bar */}
      <View style={[tw`flex-row items-center p-4 justify-between z-10`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-12 shrink-0 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold leading-tight tracking-tight flex-1 text-center`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
          Vertex Vision
        </Text>
        <View style={tw`flex w-12 items-center justify-end`}>
          <TouchableOpacity style={tw`flex items-center justify-center p-2`} onPress={() => Alert.alert('Vertex Vision', 'Position your body clearly in the camera frame. The AI will analyze your form in real-time.')}>
            <MaterialIcons name="help-outline" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Camera View */}
      <View style={tw`relative flex-1`}>
        {permission?.granted ? (
          <CameraView
            ref={cameraRef}
            style={tw`flex-1`}
            onCameraReady={() => setCameraReady(true)}
            facing="front"
          >
            {/* Camera Ready Indicator */}
            {cameraReady && (
              <View style={tw`absolute top-4 right-4 flex-row items-center gap-2 px-3 py-1.5 rounded-full`, { backgroundColor: 'rgba(0,0,0,0.6)' }}>
                <View style={tw`h-2 w-2 bg-green-500 rounded-full`} />
                <Text style={tw`text-xs font-bold text-white uppercase`}>Ready</Text>
              </View>
            )}

            {/* Crosshair Overlay */}
            <View style={tw`absolute inset-0 items-center justify-center`}>
              <View style={tw`w-32 h-32 border-2 border-dashed rounded-2xl`, { borderColor: accent + '80' }} />
            </View>
          </CameraView>
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
      <View style={[tw`p-6 flex-row items-center justify-between`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        {/* Close Button */}
        <TouchableOpacity
          style={[tw`h-12 w-12 rounded-full items-center justify-center`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="close" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
        </TouchableOpacity>

        {/* Capture Button */}
        <TouchableOpacity
          style={[
            tw`h-16 w-16 rounded-full items-center justify-center shadow-lg border-4`,
            {
              backgroundColor: accent,
              borderColor: accent + '50',
              shadowColor: accent,
              shadowOpacity: 0.4,
              shadowRadius: 12,
            },
          ]}
          onPress={handleCameraPress}
          disabled={!cameraReady}
        >
          <MaterialIcons name="camera" size={32} color="white" />
        </TouchableOpacity>

        {/* Info Button */}
        <TouchableOpacity
          style={[tw`h-12 w-12 rounded-full items-center justify-center`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}
          onPress={() => Alert.alert('Capture Photo', 'Take a clear photo of your form for AI analysis. Make sure you\'re in good lighting.')}
        >
          <MaterialIcons name="info-outline" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
