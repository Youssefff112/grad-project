import React from 'react';
import { View, Text, TextInput, SafeAreaView, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';

export const BiometricsScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={tw`flex-1 bg-background-light dark:bg-background-dark`}>
      <View style={tw`p-4 flex-row justify-between items-center`}>
        <Text style={tw`text-primary font-bold text-xl tracking-tighter`}>APEX AI</Text>
        <Text style={tw`text-slate-500 text-sm font-medium`}>Step 1 of 6</Text>
      </View>

      <ProgressBar progress={16.66} containerStyle={tw`px-4 pt-0`} />

      <ScrollView style={tw`flex-1 px-6`}>
        <View style={tw`py-6`}>
          <Text style={tw`text-slate-900 dark:text-slate-100 text-3xl font-bold leading-tight mb-2`}>
            Core Biometrics
          </Text>
          <Text style={tw`text-slate-500 dark:text-slate-400 text-base leading-relaxed`}>
            Let's get to know you better to personalize your Apex AI experience. Accurate data ensures better performance tracking.
          </Text>
        </View>

        <View style={tw`space-y-6 flex-col gap-6`}>
          <View>
            <Text style={tw`text-slate-800 dark:text-slate-200 text-sm font-bold uppercase tracking-wider mb-2`}>Age</Text>
            <View style={tw`relative`}>
              <TextInput
                style={tw`w-full h-14 bg-white dark:bg-slate-800 border-2 border-primary/10 rounded-xl px-4 text-lg text-slate-900 dark:text-white`}
                placeholder="Enter age (16+)"
                placeholderTextColor={tw.color('slate-400')}
                keyboardType="numeric"
              />
              <MaterialIcons name="calendar-month" size={24} color={tw.color('primary/40')} style={tw`absolute right-4 top-4`} />
            </View>
          </View>

          <View>
            <Text style={tw`text-slate-800 dark:text-slate-200 text-sm font-bold uppercase tracking-wider mb-2`}>Gender</Text>
            <View style={tw`w-full h-14 bg-white dark:bg-slate-800 border-2 border-primary/10 rounded-xl px-4 justify-center`}>
              <Text style={tw`text-slate-400 text-lg`}>Select gender (Mock)</Text>
            </View>
          </View>

          <View style={tw`flex-row gap-4`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-slate-800 dark:text-slate-200 text-sm font-bold uppercase tracking-wider mb-2`}>Height (cm)</Text>
              <TextInput
                style={tw`w-full h-14 bg-white dark:bg-slate-800 border-2 border-primary/10 rounded-xl px-4 text-lg text-slate-900 dark:text-white`}
                placeholder="180"
                placeholderTextColor={tw.color('slate-400')}
                keyboardType="numeric"
              />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-slate-800 dark:text-slate-200 text-sm font-bold uppercase tracking-wider mb-2`}>Weight (kg)</Text>
              <TextInput
                style={tw`w-full h-14 bg-white dark:bg-slate-800 border-2 border-primary/10 rounded-xl px-4 text-lg text-slate-900 dark:text-white`}
                placeholder="75"
                placeholderTextColor={tw.color('slate-400')}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View>
            <Text style={tw`text-slate-800 dark:text-slate-200 text-sm font-bold uppercase tracking-wider mb-2`}>
              Body Fat % <Text style={tw`text-slate-400 font-normal lowercase`}>(Optional)</Text>
            </Text>
            <View style={tw`relative`}>
              <TextInput
                style={tw`w-full h-14 bg-white dark:bg-slate-800 border-2 border-primary/10 rounded-xl px-4 text-lg text-slate-900 dark:text-white`}
                placeholder="15"
                placeholderTextColor={tw.color('slate-400')}
                keyboardType="numeric"
              />
              <Text style={tw`absolute right-4 top-4 text-slate-400 font-medium text-lg`}>%</Text>
            </View>
            <Text style={tw`text-xs text-slate-400 mt-2`}>If unknown, we will estimate based on other metrics.</Text>
          </View>

          <View style={tw`mt-4 rounded-xl bg-primary/5 p-4 border border-primary/10 flex-row items-start gap-3`}>
            <MaterialIcons name="info" size={20} color={tw.color('primary')} />
            <Text style={tw`text-sm text-slate-600 dark:text-slate-400 flex-1`}>
              Your data is encrypted and used only to calculate your metabolic rate and fitness baseline.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={tw`p-6 bg-background-light dark:bg-background-dark border-t border-primary/5`}>
        <Button
          title="Continue"
          size="lg"
          onPress={() => navigation.navigate('SafeGuardIntake')}
          icon={<MaterialIcons name="arrow-forward" size={24} color="white" style={tw`ml-2`} />}
        />
      </View>
    </SafeAreaView>
  );
};
