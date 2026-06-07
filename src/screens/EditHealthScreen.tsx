import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/Button';
import authService from '../services/auth.service';
import { MEDICAL_CONDITION_OPTIONS, type MedicalConditionId } from '../constants/healthProfile';
import { validateAllergy } from '../utils/validation';

type ConditionsState = Record<MedicalConditionId, boolean>;

const emptyConditions = (): ConditionsState =>
  Object.fromEntries(MEDICAL_CONDITION_OPTIONS.map((o) => [o.id, false])) as ConditionsState;

export const EditHealthScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [conditions, setConditions] = useState<ConditionsState>(emptyConditions);
  const [otherNotes, setOtherNotes] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');

  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';

  const loadHealthProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authService.getProfile();
      const profile = res.data?.user?.profile || {};
      const savedConditions = Array.isArray(profile.medicalConditions)
        ? (profile.medicalConditions as string[])
        : [];
      const next = emptyConditions();
      for (const id of savedConditions) {
        if (id in next) next[id as MedicalConditionId] = true;
      }
      setConditions(next);
      setOtherNotes(typeof profile.otherMedicalNotes === 'string' ? profile.otherMedicalNotes : '');
      setAllergies(Array.isArray(profile.allergies) ? profile.allergies.filter(Boolean) : []);
    } catch {
      Alert.alert('Could not load', 'Your saved health info could not be loaded. You can still edit and save.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHealthProfile();
    }, [loadHealthProfile]),
  );

  const addAllergy = () => {
    const trimmed = allergyInput.trim();
    const err = validateAllergy(trimmed);
    if (err) {
      Alert.alert('Invalid allergy', err);
      return;
    }
    const normalized = trimmed.toLowerCase();
    if (!allergies.some((a) => a.toLowerCase() === normalized)) {
      setAllergies([...allergies, trimmed]);
    }
    setAllergyInput('');
  };

  const removeAllergy = (item: string) => {
    setAllergies(allergies.filter((a) => a !== item));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const activeConditions = Object.entries(conditions)
        .filter(([, checked]) => checked)
        .map(([id]) => id);

      await authService.updateProfile({
        profile: {
          medicalConditions: activeConditions,
          otherMedicalNotes: otherNotes.trim() || undefined,
          allergies,
        },
      });

      Alert.alert('Saved', 'Your health profile was updated. Future meal plans will respect your allergies.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.message === 'Network Error'
          ? 'Cannot reach the server. Check your connection.'
          : err.message || 'Failed to save health profile.');
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={tw`flex-1`} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
        <View style={[tw`flex-row items-center p-4 justify-between`, { borderBottomWidth: 1, borderColor }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-12 items-center justify-center`}>
            <MaterialIcons name="arrow-back" size={24} color={accent} />
          </TouchableOpacity>
          <Text style={[tw`text-lg font-bold flex-1 text-center`, { color: textPrimary }]}>Health & Allergies</Text>
          <View style={tw`w-12`} />
        </View>

        {loading ? (
          <View style={tw`flex-1 items-center justify-center`}>
            <ActivityIndicator color={accent} />
          </View>
        ) : (
          <>
            <ScrollView keyboardShouldPersistTaps="handled" style={tw`flex-1`} contentContainerStyle={tw`px-5 py-4 pb-8`}>
              <Text style={[tw`text-sm leading-relaxed mb-6`, { color: subtextColor }]}>
                Update illnesses or conditions and food allergies. This is stored on your account and used when generating meal plans.
              </Text>

              <Text style={[tw`text-base font-bold mb-3`, { color: textPrimary }]}>Medical conditions</Text>
              <View style={tw`gap-2 mb-6`}>
                {MEDICAL_CONDITION_OPTIONS.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setConditions((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                    style={[tw`flex-row items-center justify-between p-4 rounded-xl border`, { backgroundColor: cardBg, borderColor }]}
                  >
                    <Text style={[tw`text-sm font-medium flex-1 pr-3`, { color: textPrimary }]}>{item.label}</Text>
                    <MaterialIcons
                      name={conditions[item.id] ? 'check-box' : 'check-box-outline-blank'}
                      size={24}
                      color={conditions[item.id] ? accent : subtextColor}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[tw`text-sm font-semibold mb-2`, { color: textPrimary }]}>Additional notes</Text>
              <TextInput
                value={otherNotes}
                onChangeText={setOtherNotes}
                placeholder="e.g. knee injury, pregnancy, medications…"
                placeholderTextColor={subtextColor}
                multiline
                style={[
                  tw`min-h-[88px] p-4 rounded-xl border text-sm mb-6`,
                  { backgroundColor: cardBg, borderColor, color: textPrimary, textAlignVertical: 'top' },
                ]}
              />

              <Text style={[tw`text-base font-bold mb-1`, { color: textPrimary }]}>Food allergies</Text>
              <Text style={[tw`text-sm mb-3`, { color: subtextColor }]}>
                These are excluded from AI and built-in meal generation.
              </Text>
              <View
                style={[
                  tw`flex-row flex-wrap gap-2 p-3 rounded-xl border min-h-[56px] items-center mb-2`,
                  { backgroundColor: cardBg, borderColor },
                ]}
              >
                {allergies.map((a) => (
                  <TouchableOpacity
                    key={a}
                    onPress={() => removeAllergy(a)}
                    style={[tw`flex-row items-center gap-1 px-3 py-1 rounded-full`, { backgroundColor: accent + '1A', borderWidth: 1, borderColor: accent + '33' }]}
                  >
                    <Text style={{ color: accent, fontSize: 14, fontWeight: '500' }}>{a}</Text>
                    <MaterialIcons name="close" size={14} color={accent} />
                  </TouchableOpacity>
                ))}
                <TextInput
                  style={[tw`flex-1 min-w-[100px] text-sm p-0 ml-1`, { color: textPrimary }]}
                  placeholder="Add allergy…"
                  placeholderTextColor={subtextColor}
                  value={allergyInput}
                  onChangeText={setAllergyInput}
                  onSubmitEditing={addAllergy}
                  returnKeyType="done"
                />
              </View>
              <TouchableOpacity onPress={addAllergy} style={tw`self-start mb-4`}>
                <Text style={[tw`text-sm font-bold`, { color: accent }]}>+ Add allergy</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={[tw`p-5`, { borderTopWidth: 1, borderColor, backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
              <Button
                title={saving ? 'Saving…' : 'Save Health Profile'}
                size="lg"
                disabled={saving}
                onPress={handleSave}
                icon={saving ? <ActivityIndicator size="small" color="white" style={tw`ml-2`} /> : <MaterialIcons name="save" size={20} color="white" style={tw`ml-2`} />}
              />
            </View>
          </>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};
