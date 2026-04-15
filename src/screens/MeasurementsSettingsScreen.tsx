import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';

export const MeasurementsSettingsScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>('km');

  const RadioGroup = ({ label, options, value, onChange }: { label: string; options: { id: string; label: string }[]; value: string; onChange: (v: any) => void }) => (
    <View style={tw`mb-6`}>
      <Text style={[tw`text-sm font-bold uppercase tracking-wider mb-3 px-1`, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>{label}</Text>
      <View style={tw`flex-row gap-3`}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            onPress={() => onChange(opt.id)}
            style={[tw`flex-1 py-4 rounded-xl items-center justify-center`, {
              backgroundColor: value === opt.id ? accent : isDark ? '#111128' : '#ffffff',
              borderWidth: 1,
              borderColor: value === opt.id ? accent : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
          >
            <Text style={[tw`text-base font-bold`, { color: value === opt.id ? '#ffffff' : isDark ? '#f1f5f9' : '#1e293b' }]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center p-4 justify-between`, { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-12 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold tracking-tight flex-1 text-center`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>Units & Measurements</Text>
        <View style={tw`w-12`} />
      </View>

      <ScrollView style={tw`flex-1 px-4 pt-6`} contentContainerStyle={tw`pb-8`}>
        {/* Info Banner */}
        <View style={[tw`p-4 rounded-2xl mb-8 flex-row items-center gap-3`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}>
          <MaterialIcons name="straighten" size={24} color={accent} />
          <View style={tw`flex-1`}>
            <Text style={[tw`font-bold text-sm`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              Unit Preferences
            </Text>
            <Text style={[tw`text-xs mt-1`, { color: '#94a3b8' }]}>
              Set your preferred units for weights, measurements, and distances
            </Text>
          </View>
        </View>

        <RadioGroup label="Weight" options={[{ id: 'kg', label: 'Kilograms (kg)' }, { id: 'lbs', label: 'Pounds (lbs)' }]} value={weightUnit} onChange={setWeightUnit} />
        <RadioGroup label="Height" options={[{ id: 'cm', label: 'Centimeters (cm)' }, { id: 'ft', label: 'Feet & Inches' }]} value={heightUnit} onChange={setHeightUnit} />
        <RadioGroup label="Distance" options={[{ id: 'km', label: 'Kilometers (km)' }, { id: 'mi', label: 'Miles (mi)' }]} value={distanceUnit} onChange={setDistanceUnit} />

        {/* Conversion Reference */}
        <View style={[tw`mt-8 p-4 rounded-2xl`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
          <Text style={[tw`font-bold text-sm mb-3`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            Quick Reference
          </Text>
          <View style={tw`gap-2`}>
            <Text style={[tw`text-xs`, { color: '#94a3b8' }]}>• 1 kg = 2.2 lbs</Text>
            <Text style={[tw`text-xs`, { color: '#94a3b8' }]}>• 1 inch = 2.54 cm</Text>
            <Text style={[tw`text-xs`, { color: '#94a3b8' }]}>• 1 km = 0.62 miles</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
