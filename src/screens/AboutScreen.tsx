import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';

export const AboutScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();

  const bg = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bg }]}>
      <View style={[tw`flex-row items-center p-4 justify-between`, { borderBottomWidth: 1, borderColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-12 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold tracking-tight flex-1 text-center`, { color: textPrimary }]}>About Vertex</Text>
        <View style={tw`w-12`} />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" style={tw`flex-1`} contentContainerStyle={tw`p-6 pb-12 items-center gap-6`}>
        <View style={[tw`w-24 h-24 rounded-3xl items-center justify-center mb-2`, { backgroundColor: accent + '14' }]}>
           <MaterialIcons name="fitness-center" size={48} color={accent} />
        </View>
        <View style={tw`items-center`}>
          <Text style={[tw`text-3xl font-black tracking-tight mb-1`, { color: textPrimary }]}>Vertex</Text>
          <Text style={[tw`text-base font-bold`, { color: accent }]}>Version 1.0.0</Text>
        </View>
        
        <View style={[tw`w-full p-5 rounded-2xl gap-3 mt-4`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
          <Text style={[tw`text-sm leading-6 text-center`, { color: textSecondary }]}>
            Vertex is the ultimate platform for peak performance coaching. Powered by cutting-edge AI and real-time computer vision, it provides unparalleled insight into your form and progress.
          </Text>
        </View>

        <View style={tw`w-full gap-2 mt-4`}>
          <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')} style={[tw`p-4 rounded-xl flex-row items-center justify-between`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
            <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>Terms of Service</Text>
            <MaterialIcons name="chevron-right" size={20} color={textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')} style={[tw`p-4 rounded-xl flex-row items-center justify-between`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
            <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>Privacy Policy</Text>
            <MaterialIcons name="chevron-right" size={20} color={textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={[tw`text-xs mt-8`, { color: textSecondary }]}>© 2026 Vertex. All rights reserved.</Text>
      </ScrollView>
    </SafeAreaView>
  );
};
