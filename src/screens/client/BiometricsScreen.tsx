import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { Button } from '../../components/Button';
import { ProgressBar } from '../../components/ProgressBar';
import { FormInput } from '../../components/FormInput';
import { Card } from '../../components/Card';
import * as authService from '../../services/auth.service';
import * as progressService from '../../services/progressService';
import {
  validateAge,
  validateBodyFat,
  validateHeightCm,
  validateWeightKg,
} from '../../utils/validation';

export const BiometricsScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { setWeight: setUserWeight } = useUser();
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [saving, setSaving] = useState(false);

  const subtextColor = isDark ? '#94a3b8' : '#64748b';

  const handleContinue = async () => {
    const ageErr = age ? validateAge(age) : 'Please enter your age';
    const heightErr = height ? validateHeightCm(height) : 'Please enter your height';
    const weightErr = weight ? validateWeightKg(weight) : 'Please enter your weight';
    if (!gender) {
      Alert.alert('Validation', 'Please select your gender');
      return;
    }
    if (ageErr || heightErr || weightErr) {
      Alert.alert('Validation', ageErr || heightErr || weightErr || 'Invalid input');
      return;
    }
    if (bodyFat) {
      const bfErr = validateBodyFat(bodyFat);
      if (bfErr) {
        Alert.alert('Validation', bfErr);
        return;
      }
    }

    setSaving(true);
    try {
      const profileData: Record<string, any> = {
        gender,
        age: parseInt(age, 10),
        height: parseFloat(height),
        currentWeight: parseFloat(weight),
      };
      if (bodyFat) profileData.bodyFat = parseFloat(bodyFat);

      if (Object.keys(profileData).length > 0) {
        await authService.updateProfile({ profile: profileData } as any);
        if (weight) setUserWeight(parseFloat(weight));
      }

      if (weight || bodyFat) {
        await progressService.addMeasurement({
          ...(weight ? { weight: parseFloat(weight) } : {}),
          ...(bodyFat ? { bodyFat: parseFloat(bodyFat) } : {}),
        });
      }
    } catch {
      // Non-blocking: navigate regardless
    } finally {
      setSaving(false);
      navigation.navigate('SafeGuardIntake');
    }
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={tw`p-4 flex-row justify-between items-center`}>
        <Text style={[tw`font-bold text-xl tracking-tighter`, { color: accent }]}>VERTEX</Text>
        <Text style={[tw`text-sm font-medium`, { color: '#64748b' }]}>Step 1 of 6</Text>
      </View>

      <ProgressBar progress={16.66} containerStyle={tw`px-4 pt-0`} />

      <ScrollView keyboardShouldPersistTaps="handled" style={tw`flex-1 px-6`}>
        <View style={tw`py-6`}>
          <Text style={[tw`text-3xl font-bold leading-tight mb-2`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            Core Biometrics
          </Text>
          <Text style={[tw`text-base leading-relaxed`, { color: subtextColor }]}>
            {"Let's get to know you better to personalize your Vertex experience. Accurate data ensures better performance tracking."}
          </Text>
        </View>

        <View style={tw`flex-col gap-6`}>
          <FormInput
            label="Age"
            placeholder="16–80"
            value={age}
            onChangeText={setAge}
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
                placeholder="80–250"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
              />
            </View>
            <View style={tw`flex-1`}>
              <FormInput
                label="Weight (kg)"
                placeholder="40–200"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
              />
            </View>
          </View>

          <FormInput
            label="Body Fat %"
            placeholder="10–45"
            value={bodyFat}
            onChangeText={setBodyFat}
            helperText="Typical adult range is 10–45%. Leave blank if unknown."
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
          title={saving ? 'Saving...' : 'Continue'}
          size="lg"
          disabled={saving}
          onPress={handleContinue}
          icon={!saving && <MaterialIcons name="arrow-forward" size={20} color="white" style={tw`ml-2`} />}
        />
      </View>
    </SafeAreaView>
  );
};

