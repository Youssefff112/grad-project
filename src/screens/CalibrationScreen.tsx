import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ImageBackground, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Svg, Circle, Line, Path } from 'react-native-svg';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';

export const CalibrationScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();

  return (
    <SafeAreaView style={tw`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}>
      {/* Top App Bar */}
      <View style={tw`flex-row items-center p-4 justify-between z-10 ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-12 shrink-0 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={isDark ? '#f1f5f9' : '#1e293b'} />
        </TouchableOpacity>
        <Text style={tw`${isDark ? 'text-slate-100' : 'text-slate-900'} text-lg font-bold leading-tight tracking-tight flex-1 text-center`}>
          Apex Vision
        </Text>
        <View style={tw`flex w-12 items-center justify-end`}>
          <TouchableOpacity style={tw`flex items-center justify-center p-2`} onPress={() => Alert.alert('Apex Vision Help', 'Position yourself in the orange skeleton overlay. Make sure your full body is visible and well-lit for optimal form analysis.')}>
            <MaterialIcons name="help-outline" size={24} color={isDark ? '#f1f5f9' : '#1e293b'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Viewport Area (Simulated Camera Feed) */}
      <View style={tw`relative flex-1 flex-col items-center justify-center p-4`}>
        {/* Simulated Camera Container */}
        <View style={tw`relative w-full h-full max-w-md ${isDark ? 'bg-slate-800' : 'bg-slate-200'} rounded-xl overflow-hidden shadow-inner flex items-center justify-center`}>

          {/* Background Image Placeholder (Camera Feed) */}
          <ImageBackground
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkEZUaYvynNddTNOB2t8lMpiir8r8PJYXfb5f-fPyHivCI2VOszvAm2KbQdigd6h9039p9aKnv9yWlAazw49d5s6qw8Wkm5VWWk9D_U7vfpeMNK6XJ6xIwjwk15TWSr-48AYEBaH8lYt4C3FQpIq8ByavDcfV_QM9GJdqULljqNKM9JPujuwTj_VyIc4gOQ-Zp-9YIyADOMrCCdsZOmKHGihGuJ8ESnRqVCcrH6wQXr7MgJVurA2hn5SxA4_Rfgzqab4_oiQCm8GI' }}
            style={tw`absolute inset-0 w-full h-full justify-center items-center`}
            imageStyle={tw`opacity-60`}
          >
            <View style={tw`absolute inset-0 bg-black/40`} />

            {/* Calibration Overlay (Skeletal Template) */}
            <View style={tw`relative z-10 w-full h-full flex items-center justify-center`}>
              <Svg viewBox="0 0 100 200" style={[tw`w-2/3 h-3/4`, { color: accent }]}>
                {/* Head */}
                <Circle cx="50" cy="25" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
                {/* Spine */}
                <Line x1="50" y1="33" x2="50" y2="90" stroke="currentColor" strokeWidth="2" />
                {/* Shoulders */}
                <Line x1="30" y1="45" x2="70" y2="45" stroke="currentColor" strokeWidth="2" />
                {/* Hips */}
                <Line x1="35" y1="90" x2="65" y2="90" stroke="currentColor" strokeWidth="2" />
                {/* Arms */}
                <Path d="M30 45 L20 75 L15 105" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                <Path d="M70 45 L80 75 L85 105" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                {/* Legs */}
                <Path d="M35 90 L30 140 L25 190" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                <Path d="M65 90 L70 140 L75 190" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />

                {/* Joint Points (Glowing Indicators) */}
                <Circle cx="30" cy="45" r="2" fill="currentColor" />
                <Circle cx="70" cy="45" r="2" fill="currentColor" />
                <Circle cx="35" cy="90" r="2" fill="currentColor" />
                <Circle cx="65" cy="90" r="2" fill="currentColor" />
                <Circle cx="50" cy="33" r="1.5" fill="currentColor" />
              </Svg>
            </View>

            {/* Guidance indicators */}
            <View style={[tw`absolute inset-0 border-4 border-dashed m-4 rounded-xl`, { borderColor: accent + '4D' }]} pointerEvents="none" />
          </ImageBackground>
        </View>

        {/* Interaction Buttons */}
        <View style={tw`flex-row items-center justify-center gap-6 p-6 w-full max-w-md absolute bottom-0`}>
          <TouchableOpacity style={[tw`flex shrink-0 items-center justify-center rounded-full h-12 w-12 bg-black/40 border`, { borderColor: accent + '33' }]} onPress={() => Alert.alert('Gallery', 'Upload a reference photo for better calibration (feature coming soon)')}>
            <MaterialIcons name="image" size={24} color={accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[tw`flex shrink-0 items-center justify-center rounded-full h-20 w-20 shadow-lg border-4`, { backgroundColor: accent, shadowColor: accent, borderColor: accent + '33' }]}
            onPress={() => navigation.navigate('ActiveSet')}
          >
            <MaterialIcons name="photo-camera" size={36} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={[tw`flex shrink-0 items-center justify-center rounded-full h-12 w-12 bg-black/40 border`, { borderColor: accent + '33' }]} onPress={() => Alert.alert('Sync', 'Recalibrating AI engine and syncing with latest form data...')}>
            <MaterialIcons name="sync" size={24} color={accent} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Controls & Status */}
      <View style={tw`${isDark ? 'bg-background-dark' : 'bg-background-light'} p-6 rounded-t-3xl shadow-2xl space-y-4 flex-col gap-4`}>
        <View style={tw`items-center`}>
          <Text style={tw`${isDark ? 'text-slate-100' : 'text-slate-900'} tracking-tight text-2xl font-bold leading-tight`}>
            Align Your Joints
          </Text>
          <Text style={tw`${isDark ? 'text-slate-400' : 'text-slate-600'} text-base font-normal leading-normal mt-1`}>
            Position yourself within the orange template
          </Text>
        </View>

        <View style={tw`flex-col gap-3 p-2`}>
          <View style={tw`flex-row gap-6 justify-between items-center`}>
            <View style={tw`flex-row items-center gap-2`}>
              <MaterialIcons name="precision-manufacturing" size={20} color={accent} />
              <Text style={tw`${isDark ? 'text-slate-100' : 'text-slate-900'} text-sm font-semibold uppercase tracking-wider`}>
                Calibration Progress
              </Text>
            </View>
            <Text style={[tw`text-lg font-bold`, { color: accent }]}>65%</Text>
          </View>
          <View style={[tw`h-3 rounded-full w-full overflow-hidden`, { backgroundColor: accent + '1A' }]}>
            <View style={[tw`h-full rounded-full shadow-lg w-[65%]`, { backgroundColor: accent, shadowColor: accent }]} />
          </View>
        </View>

        <View style={tw`flex-row justify-center pt-2`}>
          <View style={tw`flex-row items-center gap-2 px-4 py-2 ${isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-full`}>
            <View style={tw`h-2 w-2 bg-green-500 rounded-full`} />
            <Text style={tw`text-xs font-medium text-slate-500 uppercase tracking-widest`}>AI Engine Active</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};
