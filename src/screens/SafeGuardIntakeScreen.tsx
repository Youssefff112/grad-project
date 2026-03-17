import React, { useState } from 'react';
import { View, Text, TextInput, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';

export const SafeGuardIntakeScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();

  const [conditions, setConditions] = useState({
    heart: false,
    hypertension: false,
    diabetes: true,
  });

  return (
    <SafeAreaView style={tw`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}>
      <View style={tw`flex-row items-center p-4 pb-2 justify-between`}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={tw`flex size-10 items-center justify-center rounded-full`}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={isDark ? '#f1f5f9' : '#0f172a'}
          />
        </TouchableOpacity>
        <Text style={tw`${isDark ? 'text-slate-100' : 'text-slate-900'} text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10`}>
          Apex AI Safe-Guard
        </Text>
      </View>

      <ProgressBar progress={50} containerStyle={tw`px-6 pt-4 pb-0`} label="Intake Progress" stepText="Step 3 of 6" />

      <ScrollView style={tw`flex-1`}>
        <View style={tw`px-6 pt-4`}>
          <Text style={tw`${isDark ? 'text-white' : 'text-slate-900'} tracking-tight text-2xl font-bold leading-tight`}>
            Medical History
          </Text>
          <Text style={tw`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm font-normal leading-relaxed mt-2`}>
            Identify any existing health conditions for personalized AI monitoring.
          </Text>
        </View>

        <View style={tw`px-6 mt-6 space-y-2 flex-col gap-2`}>
          {[
            { id: 'heart', label: 'Heart Conditions' },
            { id: 'hypertension', label: 'Hypertension' },
            { id: 'diabetes', label: 'Diabetes' },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={tw`flex-row items-center justify-between p-4 rounded-xl border ${isDark ? 'border-slate-800 bg-white/5' : 'border-slate-200 bg-white/50'}`}
              onPress={() => setConditions(prev => ({...prev, [item.id]: !prev[item.id as keyof typeof conditions]}))}
            >
              <Text style={tw`${isDark ? 'text-slate-200' : 'text-slate-900'} text-base font-medium`}>{item.label}</Text>
              <MaterialIcons
                name={conditions[item.id as keyof typeof conditions] ? "check-box" : "check-box-outline-blank"}
                size={24}
                color={conditions[item.id as keyof typeof conditions] ? accent : '#94a3b8'}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={tw`px-6 mt-8 mb-6`}>
          <Text style={tw`${isDark ? 'text-white' : 'text-slate-900'} tracking-tight text-lg font-bold leading-tight`}>
            Allergies
          </Text>
          <Text style={tw`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm font-normal mb-3`}>
            Multi-select any known allergies.
          </Text>
          <View style={tw`flex-row flex-wrap gap-2 p-3 rounded-xl border ${isDark ? 'border-slate-800 bg-black' : 'border-slate-200 bg-white'} min-h-[56px] items-center`}>
            <View style={[tw`flex-row items-center gap-1 px-3 py-1 rounded-full`, { backgroundColor: accent + '1A', borderWidth: 1, borderColor: accent + '33' }]}>
              <Text style={{ color: accent, fontSize: 14, fontWeight: '500' }}>Peanuts</Text>
              <MaterialIcons name="close" size={14} color={accent} />
            </View>
            <View style={[tw`flex-row items-center gap-1 px-3 py-1 rounded-full`, { backgroundColor: accent + '1A', borderWidth: 1, borderColor: accent + '33' }]}>
              <Text style={{ color: accent, fontSize: 14, fontWeight: '500' }}>Penicillin</Text>
              <MaterialIcons name="close" size={14} color={accent} />
            </View>
            <TextInput
              style={tw`bg-transparent border-0 text-sm text-slate-400 flex-1 min-w-[80px] p-0 ml-2`}
              placeholder="Add more..."
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>
      </ScrollView>

      <View style={tw`p-6 pt-2 ${isDark ? 'bg-background-dark' : 'bg-background-light'}`}>
        <Button
          title="Continue"
          size="lg"
          onPress={() => navigation.navigate('Goals')}
          icon={<MaterialIcons name="arrow-forward-ios" size={16} color="white" style={tw`ml-2`} />}
        />
        <Text style={tw`text-center text-slate-500 text-xs mt-4 uppercase font-semibold`}>
          By continuing, you agree to Apex AI Health Terms
        </Text>
      </View>
    </SafeAreaView>
  );
};
