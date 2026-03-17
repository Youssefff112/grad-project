import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';

const GOALS = [
  {
    id: 'hypertrophy',
    label: 'Hypertrophy',
    description: 'Build muscle size & raw strength',
    icon: 'fitness-center' as const,
    lightColors: ['#fff3ea', '#ffe5cc'] as const,
    darkColors: ['#1a0f00', '#2a1800'] as const,
  },
  {
    id: 'fatloss',
    label: 'Fat Loss',
    description: 'Burn fat & reveal definition',
    icon: 'local-fire-department' as const,
    lightColors: ['#fff3ea', '#ffe5cc'] as const,
    darkColors: ['#1a0f00', '#2a1800'] as const,
  },
  {
    id: 'athletic',
    label: 'Athletic Performance',
    description: 'Speed, power & agility',
    icon: 'speed' as const,
    lightColors: ['#fff3ea', '#ffe5cc'] as const,
    darkColors: ['#1a0f00', '#2a1800'] as const,
  },
  {
    id: 'longevity',
    label: 'Longevity',
    description: 'Long-term health & vitality',
    icon: 'favorite' as const,
    lightColors: ['#fff3ea', '#ffe5cc'] as const,
    darkColors: ['#1a0f00', '#2a1800'] as const,
  },
];

export const GoalsScreen = ({ navigation }: any) => {
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const { isDark, accent } = useTheme();

  return (
    <SafeAreaView style={tw`flex-1 bg-background-light dark:bg-background-dark`}>
      <View style={tw`flex-row items-center p-4 pb-2 justify-between`}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={tw`flex size-12 items-center justify-center`}
        >
          <MaterialIcons name="arrow-back" size={24} color={tw.color('slate-900')} />
        </TouchableOpacity>
        <Text style={tw`text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-12`}>
          Goal Definition
        </Text>
      </View>

      <ProgressBar progress={83.33} label="Your Progress" stepText="Step 5 of 6" containerStyle={tw`px-4`} />

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-6`}>
        <View style={tw`px-4 pb-4 pt-2`}>
          <Text style={tw`text-slate-900 dark:text-slate-100 tracking-tight text-3xl font-bold leading-tight text-center`}>
            What is your primary goal?
          </Text>
          <Text style={tw`text-slate-500 dark:text-slate-400 text-center mt-2 text-sm`}>
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
                  style={[
                    tw`rounded-2xl overflow-hidden`,
                    {
                      borderWidth: 2,
                      borderColor: isSelected ? accent : isDark ? '#ffffff18' : '#00000014',
                    },
                  ]}
                >
                  <LinearGradient
                    colors={isDark ? goal.darkColors : goal.lightColors}
                    style={tw`p-5 h-44 justify-between`}
                  >
                    <View style={tw`flex-row justify-between items-start`}>
                      <View
                        style={[
                          tw`w-12 h-12 rounded-xl items-center justify-center`,
                          {
                          backgroundColor: isSelected ? accent : isDark ? '#ffffff18' : accent + '18',
                          },
                        ]}
                      >
                        <MaterialIcons
                          name={goal.icon}
                          size={24}
                          color={isSelected ? '#ffffff' : accent}
                        />
                      </View>
                      {isSelected && (
                        <View style={tw`w-6 h-6 rounded-full bg-primary items-center justify-center`}>
                          <MaterialIcons name="check" size={14} color="white" />
                        </View>
                      )}
                    </View>

                    <View>
                      <Text
                        style={[
                          tw`text-base font-black uppercase tracking-wide`,
                          { color: isSelected ? accent : isDark ? '#e2e8f0' : '#1e293b' },
                        ]}
                      >
                        {goal.label}
                      </Text>
                      <Text style={tw`text-slate-500 dark:text-slate-400 text-xs mt-1 leading-relaxed`}>
                        {goal.description}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={tw`p-4 bg-background-light dark:bg-background-dark border-t border-primary/5`}>
        <Button
          title="Continue"
          size="lg"
          onPress={() => navigation.navigate('TraineeCommandCenter')}
          icon={<MaterialIcons name="arrow-forward" size={20} color="white" style={tw`ml-2`} />}
        />
      </View>
    </SafeAreaView>
  );
};
