import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { FormInput } from '../components/FormInput';
import { Card } from '../components/Card';

export const BiometricsScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');

  const subtextColor = isDark ? '#94a3b8' : '#64748b';

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
          <Text style={[tw`text-base leading-relaxed`, { color: subtextColor }]}>
            Let's get to know you better to personalize your Vertex experience. Accurate data ensures better performance tracking.
          </Text>
        </View>

        <View style={tw`flex-col gap-6`}>
          <FormInput
            label="Age"
            placeholder="Enter age (16+)"
            value={age}
            onChangeText={setAge}
            icon={<MaterialIcons name="calendar-month" size={20} color={accent} />}
            keyboardType="numeric"
          />

          <View>
            <Text style={[tw`text-sm font-bold uppercase tracking-wider mb-3`, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>
              Gender
            </Text>
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
                          borderColor: accent + '1A' },
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

          {/* Measurements Row */}
          <View style={tw`flex-row gap-4`}>
            <View style={tw`flex-1`}>
              <FormInput
                label="Height (cm)"
                placeholder="180"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
              />
            </View>
            <View style={tw`flex-1`}>
              <FormInput
                label="Weight (kg)"
                placeholder="75"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
              />
            </View>
          </View>

          <FormInput
            label="Body Fat %"
            placeholder="15"
            value={bodyFat}
            onChangeText={setBodyFat}
            helperText="If unknown, we will estimate based on other metrics."
            keyboardType="numeric"
          />

          <Card variant="filled" padding="md">
            <View style={tw`flex-row gap-3`}>
              <MaterialIcons name="info" size={18} color={accent} />
              <Text style={[tw`text-sm flex-1 leading-5`, { color: subtextColor }]}>
                Your data is encrypted and used only to calculate your metabolic rate and fitness baseline.
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      <View
        style={[
          tw`p-6 border-t`,
          {
            backgroundColor: isDark ? '#0a0a12' : '#f8f7f5',
            borderColor: accent + '0D' },
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
