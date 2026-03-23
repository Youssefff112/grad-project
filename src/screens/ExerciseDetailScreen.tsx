import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/Button';

export const ExerciseDetailScreen = ({ navigation, route }: any) => {
  const { isDark, accent } = useTheme();
  const [currentSet, setCurrentSet] = useState(1);
  
  const exerciseName = route?.params?.name || 'Barbell Squats';
  const exerciseSets = route?.params?.sets || '4 sets x 10 reps';

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      {/* Header */}
      <View style={[tw`flex-row items-center p-4 justify-between z-10`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-12 shrink-0 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={isDark ? '#f1f5f9' : '#1e293b'} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold leading-tight tracking-tight flex-1 text-center`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
          Exercise Details
        </Text>
        <View style={tw`flex size-12 items-center justify-center`} />
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-8`}>
        {/* Exercise Header Card */}
        <View style={[tw`mx-4 mt-6 p-6 rounded-2xl`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}>
          <View style={tw`flex-row items-center gap-3 mb-4`}>
            <View style={[tw`w-14 h-14 rounded-xl items-center justify-center`, { backgroundColor: accent }]}>
              <MaterialIcons name="fitness-center" size={28} color="white" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={[tw`text-2xl font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                {exerciseName}
              </Text>
              <Text style={[tw`text-sm mt-1`, { color: '#94a3b8' }]}>
                {exerciseSets}
              </Text>
            </View>
          </View>
        </View>

        {/* Exercise Information */}
        <View style={tw`mx-4 mt-6`}>
          <Text style={[tw`text-lg font-bold mb-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            Exercise Overview
          </Text>
          
          <View style={[tw`p-4 rounded-xl mb-3`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <View style={tw`flex-row items-center gap-3 mb-3`}>
              <MaterialIcons name="info" size={24} color={accent} />
              <Text style={[tw`font-bold text-base`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                Description
              </Text>
            </View>
            <Text style={[tw`text-sm leading-relaxed`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
              {exerciseName === 'Barbell Squats'
                ? 'A compound movement targeting the quadriceps, hamstrings, and glutes. Stand with feet shoulder-width apart, lower your hips back and down while keeping your chest up, then drive through your heels to return to standing.'
                : 'This exercise targets the quadriceps muscles. Execute with controlled movements focusing on proper form and range of motion.'}
            </Text>
          </View>

          {/* Form Tips */}
          <View style={[tw`p-4 rounded-xl mb-3`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <View style={tw`flex-row items-center gap-3 mb-3`}>
              <MaterialIcons name="check-circle" size={24} color="#4ade80" />
              <Text style={[tw`font-bold text-base`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                Form Tips
              </Text>
            </View>
            <View style={tw`gap-2`}>
              {[
                'Keep chest upright throughout the movement',
                'Maintain neutral spine alignment',
                'Drive through entire foot',
                'Control the descent - no bouncing',
              ].map((tip, i) => (
                <View key={i} style={tw`flex-row items-start gap-2`}>
                  <View style={[tw`w-2 h-2 rounded-full mt-2`, { backgroundColor: accent }]} />
                  <Text style={[tw`text-sm flex-1`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Muscle Groups */}
          <View style={[tw`p-4 rounded-xl mb-3`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <View style={tw`flex-row items-center gap-3 mb-3`}>
              <MaterialIcons name="fitness-center" size={24} color={accent} />
              <Text style={[tw`font-bold text-base`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                Primary Muscles
              </Text>
            </View>
            <View style={tw`flex-row flex-wrap gap-2`}>
              {['Quadriceps', 'Glutes', 'Hamstrings', 'Core'].map((muscle) => (
                <View key={muscle} style={[tw`px-3 py-1.5 rounded-full`, { backgroundColor: accent + '20', borderWidth: 1, borderColor: accent + '40' }]}>
                  <Text style={[tw`text-xs font-bold`, { color: accent }]}>
                    {muscle}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Difficulty */}
          <View style={[tw`p-4 rounded-xl`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <Text style={[tw`font-bold text-base mb-2`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              Difficulty Level
            </Text>
            <View style={tw`flex-row items-center gap-2`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <MaterialIcons key={star} name="star" size={20} color={star <= 4 ? accent : isDark ? '#1e293b' : '#e2e8f0'} />
              ))}
              <Text style={[tw`text-sm ml-2`, { color: '#94a3b8' }]}>Intermediate</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={[tw`px-4 py-4 border-t`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <Button
          title="Start Exercise"
          variant="primary"
          onPress={() => navigation.navigate('Calibration')}
          containerStyle={tw`w-full`}
        />
      </View>
    </SafeAreaView>
  );
};
