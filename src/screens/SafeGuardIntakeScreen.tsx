import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { Card } from '../components/Card';

export const SafeGuardIntakeScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const subtextColor = isDark ? '#94a3b8' : '#64748b';

  const [conditions, setConditions] = useState({
    heart: false,
    hypertension: false,
    diabetes: true });

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={tw`flex-row items-center p-4 pb-2 justify-between`}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={tw`flex size-10 items-center justify-center rounded-full`}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={isDark ? '#94a3b8' : '#64748b'}
          />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
          Vertex Safe-Guard
        </Text>
      </View>

      <ProgressBar progress={50} containerStyle={tw`px-6 pt-4 pb-0`} label="Intake Progress" stepText="Step 3 of 6" />

      <ScrollView style={tw`flex-1`}>
        <View style={tw`px-6 pt-4`}>
          <Text style={[tw`tracking-tight text-2xl font-bold leading-tight`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            Medical History
          </Text>
          <Text style={[tw`text-sm font-normal leading-relaxed mt-2`, { color: subtextColor }]}>
            Identify any existing health conditions for personalized AI monitoring.
          </Text>
        </View>

        <View style={tw`px-6 mt-6 flex-col gap-2`}>
          {[
            { id: 'heart', label: 'Heart Conditions' },
            { id: 'hypertension', label: 'Hypertension' },
            { id: 'diabetes', label: 'Diabetes' },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[tw`flex-row items-center justify-between p-4 rounded-xl border`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
              onPress={() => setConditions(prev => ({...prev, [item.id]: !prev[item.id as keyof typeof conditions]}))}
            >
              <Text style={[tw`text-base font-medium`, { color: isDark ? '#e2e8f0' : '#1e293b' }]}>{item.label}</Text>
              <MaterialIcons
                name={conditions[item.id as keyof typeof conditions] ? "check-box" : "check-box-outline-blank"}
                size={24}
                color={conditions[item.id as keyof typeof conditions] ? accent : '#94a3b8'}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={tw`px-6 mt-8 mb-6`}>
          <Text style={[tw`tracking-tight text-lg font-bold leading-tight mb-1`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            Allergies
          </Text>
          <Text style={[tw`text-sm font-normal mb-3`, { color: subtextColor }]}>
            Multi-select any known allergies.
          </Text>
          <View style={[tw`flex-row flex-wrap gap-2 p-3 rounded-xl border min-h-[56px] items-center`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <View style={[tw`flex-row items-center gap-1 px-3 py-1 rounded-full`, { backgroundColor: accent + '1A', borderWidth: 1, borderColor: accent + '33' }]}>
              <Text style={{ color: accent, fontSize: 14, fontWeight: '500' }}>Peanuts</Text>
              <MaterialIcons name="close" size={14} color={accent} />
            </View>
            <View style={[tw`flex-row items-center gap-1 px-3 py-1 rounded-full`, { backgroundColor: accent + '1A', borderWidth: 1, borderColor: accent + '33' }]}>
              <Text style={{ color: accent, fontSize: 14, fontWeight: '500' }}>Penicillin</Text>
              <MaterialIcons name="close" size={14} color={accent} />
            </View>
            <TextInput
              style={[tw`bg-transparent border-0 text-sm flex-1 min-w-[80px] p-0 ml-2`, { color: '#94a3b8' }]}
              placeholder="Add more..."
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>
      </ScrollView>

      <View style={[tw`p-6 pt-2`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderTopWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
        <Button
          title="Continue"
          size="lg"
          onPress={() => navigation.navigate('Goals')}
          icon={<MaterialIcons name="arrow-forward" size={20} color="white" style={tw`ml-2`} />}
        />
        <Text style={tw`text-center text-slate-500 text-xs mt-4 uppercase font-semibold`}>
          By continuing, you agree to Vertex Health Terms
        </Text>
      </View>
    </SafeAreaView>
  );
};
