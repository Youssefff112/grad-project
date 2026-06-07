import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Switch } from '../components/Switch';

export const PrivacySecurityScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const [dataSharing, setDataSharing] = useState(false);
  const [analytics, setAnalytics] = useState(true);

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
        <Text style={[tw`text-lg font-bold tracking-tight flex-1 text-center`, { color: textPrimary }]}>Privacy & Security</Text>
        <View style={tw`w-12`} />
      </View>
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-4 pb-12 gap-6`}>
        <View style={[tw`p-5 rounded-2xl gap-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
          <MaterialIcons name="security" size={32} color={accent} />
          <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>End-to-End Encryption</Text>
          <Text style={[tw`text-sm leading-5`, { color: textSecondary }]}>
            Your personal data, health metrics, and workout logs are encrypted on your device. We use state-of-the-art security to ensure nobody else can access your information.
          </Text>
        </View>

        <View>
          <Text style={[tw`text-xs font-bold uppercase tracking-widest mb-3 px-1`, { color: textSecondary }]}>Data Preferences</Text>
          <View style={[tw`rounded-2xl overflow-hidden`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
            <View style={[tw`flex-row items-center justify-between p-4`, { borderBottomWidth: 1, borderColor }]}>
              <View style={tw`flex-1 mr-4`}>
                <Text style={[tw`font-bold text-base`, { color: textPrimary }]}>Analytics Tracking</Text>
                <Text style={[tw`text-xs mt-1`, { color: textSecondary }]}>Help us improve the app by sharing anonymous usage data.</Text>
              </View>
              <Switch value={analytics} onValueChange={setAnalytics} />
            </View>
            <View style={tw`flex-row items-center justify-between p-4`}>
              <View style={tw`flex-1 mr-4`}>
                <Text style={[tw`font-bold text-base`, { color: textPrimary }]}>Personalized Ads</Text>
                <Text style={[tw`text-xs mt-1`, { color: textSecondary }]}>Allow us to use your data to show you relevant offers.</Text>
              </View>
              <Switch value={dataSharing} onValueChange={setDataSharing} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
