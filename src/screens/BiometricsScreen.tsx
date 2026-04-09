import React, { useState } from 'react';
import { View, Text, TextInput, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';

export const BiometricsScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const [gender, setGender] = useState<'male' | 'female' | ''>('');

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={tw`p-4 flex-row justify-between items-center`}>
        <Text style={[tw`font-bold text-xl tracking-tighter`, { color: accent }]}>VERTEX</Text>
        <Text style={[tw`text-sm font-medium`, { color: '#64748b' }]}>Step 1 of 6</Text>
      </View>

      <ProgressBar progress={16.66} containerStyle={tw`px-4 pt-0`} />

      <ScrollView style={tw`flex-1 px-6`}>
        <View style={tw`py-6`}>
          <Text style={[tw`text-3xl font-bold leading-tight mb-2`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            Core Biometrics
          </Text>
          <Text style={[tw`text-base leading-relaxed`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            Let's get to know you better to personalize your Vertex experience. Accurate data ensures better performance tracking.
          </Text>
        </View>

        <View style={tw`flex-col gap-6`}>
          <View>
            <Text style={[tw`text-sm font-bold uppercase tracking-wider mb-2`, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>Age</Text>
            <View style={tw`relative`}>
              <TextInput
                style={[
                  tw`w-full h-14 border-2 rounded-xl px-4 text-lg`,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    borderColor: accent + '1A',
                    color: isDark ? '#ffffff' : '#1e293b',
                  },
                ]}
                placeholder="Enter age (16+)"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />
              <MaterialIcons name="calendar-month" size={24} color={accent + '66'} style={tw`absolute right-4 top-4`} />
            </View>
          </View>

          <View>
            <Text style={[tw`text-sm font-bold uppercase tracking-wider mb-2`, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>Gender</Text>
            <View style={tw`flex-row gap-3`}>
              {(['male', 'female'] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => setGender(option)}
                  style={[
                    tw`flex-1 h-14 rounded-xl items-center justify-center border-2`,
                    gender === option
                      ? { backgroundColor: accent, borderColor: accent }
                      : {
                          backgroundColor: isDark ? '#1e293b' : '#ffffff',
                          borderColor: accent + '1A',
                        },
                  ]}
                >
                  <Text
                    style={[
                      tw`font-bold capitalize`,
                      gender === option
                        ? { color: '#ffffff' }
                        : { color: isDark ? '#94a3b8' : '#64748b' },
                    ]}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={tw`flex-row gap-4`}>
            <View style={tw`flex-1`}>
              <Text style={[tw`text-sm font-bold uppercase tracking-wider mb-2`, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>Height (cm)</Text>
              <TextInput
                style={[
                  tw`w-full h-14 border-2 rounded-xl px-4 text-lg`,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    borderColor: accent + '1A',
                    color: isDark ? '#ffffff' : '#1e293b',
                  },
                ]}
                placeholder="180"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />
            </View>
            <View style={tw`flex-1`}>
              <Text style={[tw`text-sm font-bold uppercase tracking-wider mb-2`, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>Weight (kg)</Text>
              <TextInput
                style={[
                  tw`w-full h-14 border-2 rounded-xl px-4 text-lg`,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    borderColor: accent + '1A',
                    color: isDark ? '#ffffff' : '#1e293b',
                  },
                ]}
                placeholder="75"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View>
            <Text style={[tw`text-sm font-bold uppercase tracking-wider mb-2`, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>
              Body Fat % <Text style={[tw`font-normal lowercase`, { color: '#94a3b8' }]}>(Optional)</Text>
            </Text>
            <View style={tw`relative`}>
              <TextInput
                style={[
                  tw`w-full h-14 border-2 rounded-xl px-4 text-lg`,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    borderColor: accent + '1A',
                    color: isDark ? '#ffffff' : '#1e293b',
                  },
                ]}
                placeholder="15"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />
              <Text style={[tw`absolute right-4 top-4 font-medium text-lg`, { color: '#94a3b8' }]}>%</Text>
            </View>
            <Text style={[tw`text-xs mt-2`, { color: '#94a3b8' }]}>If unknown, we will estimate based on other metrics.</Text>
          </View>

          <View
            style={[
              tw`mt-4 rounded-xl p-4 border flex-row items-start gap-3`,
              {
                backgroundColor: accent + '0D',
                borderColor: accent + '1A',
              },
            ]}
          >
            <MaterialIcons name="info" size={20} color={accent} />
            <Text style={[tw`text-sm flex-1`, { color: isDark ? '#94a3b8' : '#475569' }]}>
              Your data is encrypted and used only to calculate your metabolic rate and fitness baseline.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          tw`p-6 border-t`,
          {
            backgroundColor: isDark ? '#0a0a12' : '#f8f7f5',
            borderColor: accent + '0D',
          },
        ]}
      >
        <Button
          title="Continue"
          size="lg"
          onPress={() => navigation.navigate('SafeGuardIntake')}
          icon={<MaterialIcons name="arrow-forward" size={20} color="white" style={tw`ml-2`} />}
        />
      </View>
    </SafeAreaView>
  );
};
