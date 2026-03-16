import React, { useState } from 'react';
import { View, Text, TextInput, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';

export const SafeGuardIntakeScreen = ({ navigation }: any) => {
  const [conditions, setConditions] = useState({
    heart: false,
    hypertension: false,
    diabetes: true,
  });

  return (
    <SafeAreaView style={tw`flex-1 bg-background-light dark:bg-background-dark`}>
      <View style={tw`flex-row items-center p-4 pb-2 justify-between`}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-10 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors`}>
          <MaterialIcons name="arrow-back" size={24} color={tw.color('slate-900')} style={tw`dark:text-slate-100`} />
        </TouchableOpacity>
        <Text style={tw`text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10`}>
          Apex AI Safe-Guard
        </Text>
      </View>

      <ProgressBar progress={50} containerStyle={tw`px-6 pt-4 pb-0`} label="Intake Progress" stepText="Step 3 of 6" />

      <ScrollView style={tw`flex-1`}>
        <View style={tw`px-6 pt-4`}>
          <Text style={tw`text-slate-900 dark:text-white tracking-tight text-2xl font-bold leading-tight`}>
            Medical History
          </Text>
          <Text style={tw`text-slate-600 dark:text-slate-400 text-sm font-normal leading-relaxed mt-2`}>
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
              style={tw`flex-row items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-white/5`}
              onPress={() => setConditions(prev => ({...prev, [item.id]: !prev[item.id as keyof typeof conditions]}))}
            >
              <Text style={tw`text-slate-900 dark:text-slate-200 text-base font-medium`}>{item.label}</Text>
              <MaterialIcons
                name={conditions[item.id as keyof typeof conditions] ? "check-box" : "check-box-outline-blank"}
                size={24}
                color={conditions[item.id as keyof typeof conditions] ? tw.color('primary') : tw.color('slate-400')}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={tw`px-6 mt-8 mb-6`}>
          <Text style={tw`text-slate-900 dark:text-white tracking-tight text-lg font-bold leading-tight`}>
            Allergies
          </Text>
          <Text style={tw`text-slate-600 dark:text-slate-400 text-sm font-normal mb-3`}>
            Multi-select any known allergies.
          </Text>
          <View style={tw`flex-row flex-wrap gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black min-h-[56px] items-center`}>
            <View style={tw`flex-row items-center gap-1 bg-primary/10 px-3 py-1 rounded-full border border-primary/20`}>
              <Text style={tw`text-primary text-sm font-medium`}>Peanuts</Text>
              <MaterialIcons name="close" size={14} color={tw.color('primary')} />
            </View>
            <View style={tw`flex-row items-center gap-1 bg-primary/10 px-3 py-1 rounded-full border border-primary/20`}>
              <Text style={tw`text-primary text-sm font-medium`}>Penicillin</Text>
              <MaterialIcons name="close" size={14} color={tw.color('primary')} />
            </View>
            <TextInput
              style={tw`bg-transparent border-0 text-sm text-slate-400 flex-1 min-w-[80px] p-0 ml-2`}
              placeholder="Add more..."
              placeholderTextColor={tw.color('slate-400')}
            />
          </View>
        </View>
      </ScrollView>

      <View style={tw`p-6 pt-2 bg-background-light dark:bg-background-dark`}>
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
