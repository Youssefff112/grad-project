import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/Button';
import { ProgressBar } from '../../components/ProgressBar';

const GOALS = [
  { id: 'hypertrophy', label: 'Hypertrophy', description: 'Build muscle size & raw strength', icon: 'fitness-center' as const, lightColors: ['#fff3ea', '#ffe5cc'] as const, darkColors: ['#1a0f00', '#2a1800'] as const },
  { id: 'fatloss', label: 'Fat Loss', description: 'Burn fat & reveal definition', icon: 'local-fire-department' as const, lightColors: ['#fff3ea', '#ffe5cc'] as const, darkColors: ['#1a0f00', '#2a1800'] as const },
  { id: 'athletic', label: 'Athletic Performance', description: 'Speed, power & agility', icon: 'speed' as const, lightColors: ['#fff3ea', '#ffe5cc'] as const, darkColors: ['#1a0f00', '#2a1800'] as const },
  { id: 'longevity', label: 'Longevity', description: 'Long-term health & vitality', icon: 'favorite' as const, lightColors: ['#fff3ea', '#ffe5cc'] as const, darkColors: ['#1a0f00', '#2a1800'] as const },
];

export const GoalsScreen = ({ navigation, route }: any) => {
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const { isDark, accent } = useTheme();
  const fromSettings = route?.params?.fromSettings === true;

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={tw`flex-row items-center p-4 pb-2 justify-between`}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-12 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-12`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
          Goal Definition
        </Text>
      </View>

      {!fromSettings && (
        <ProgressBar progress={83.33} label="Your Progress" stepText="Step 5 of 6" containerStyle={tw`px-4`} />
      )}

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-6`}>
        <View style={tw`px-4 pb-4 pt-2`}>
          <Text style={[tw`tracking-tight text-3xl font-bold leading-tight text-center`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            What is your primary goal?
          </Text>
          <Text style={[tw`text-center mt-2 text-sm`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            Select the objective that matches your vision.
          </Text>
        </View>

        <View style={tw`flex-row flex-wrap px-3 gap-y-3`}>
          {GOALS.map((goal) => {
            const isSelected = selectedGoal === goal.id;
            return (
              <View key={goal.id} style={tw`w-1/2 px-1.5`}>
                <TouchableOpacity
                  onPress={() => setSelectedGoal(goal.id)}
                  activeOpacity={0.85}
                  style={[tw`rounded-2xl overflow-hidden`, { borderWidth: 2, borderColor: isSelected ? accent : isDark ? '#ffffff18' : '#00000014' }]}
                >
                  <LinearGradient colors={isDark ? goal.darkColors : goal.lightColors} style={tw`p-5 h-44 justify-between`}>
                    <View style={tw`flex-row justify-between items-start`}>
                      <View style={[tw`w-12 h-12 rounded-xl items-center justify-center`, { backgroundColor: isSelected ? accent : isDark ? '#ffffff18' : accent + '18' }]}>
                        <MaterialIcons name={goal.icon} size={24} color={isSelected ? '#ffffff' : accent} />
                      </View>
                      {isSelected && (
                        <View style={[tw`w-6 h-6 rounded-full items-center justify-center`, { backgroundColor: accent }]}>
                          <MaterialIcons name="check" size={14} color="white" />
                        </View>
                      )}
                    </View>
                    <View>
                      <Text style={[tw`text-base font-black uppercase tracking-wide`, { color: isSelected ? accent : isDark ? '#e2e8f0' : '#1e293b' }]}>{goal.label}</Text>
                      <Text style={[tw`text-xs mt-1 leading-relaxed`, { color: isDark ? '#94a3b8' : '#64748b' }]}>{goal.description}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={[tw`p-4`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderTopWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
        <Button
          title={fromSettings ? "Save" : "Continue"}
          size="lg"
          onPress={() => fromSettings ? navigation.goBack() : navigation.navigate('TraineeCommandCenter')}
          icon={<MaterialIcons name={fromSettings ? "check" : "arrow-forward"} size={20} color="white" style={tw`ml-2`} />}
        />
      </View>
    </SafeAreaView>
  );
};

