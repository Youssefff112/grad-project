import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';

export const HelpCenterScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const bg = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

  const faqs = [
    { q: 'How does AI rep counting work?', a: 'We use the front camera and advanced pose estimation to track your joints in 3D space during sets.' },
    { q: 'How do I change my coach?', a: 'Go to Profile -> My Coach, where you can browse and request a new coach.' },
    { q: 'Is my data backed up?', a: 'Yes, your data syncs securely to our cloud so you can access it from any device.' },
  ];

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bg }]}>
      <View style={[tw`flex-row items-center p-4 justify-between`, { borderBottomWidth: 1, borderColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-12 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold tracking-tight flex-1 text-center`, { color: textPrimary }]}>Help Center</Text>
        <View style={tw`w-12`} />
      </View>
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-4 pb-12 gap-6`}>
        <View style={[tw`p-5 rounded-2xl items-center gap-3`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '30' }]}>
          <MaterialIcons name="support-agent" size={40} color={accent} />
          <Text style={[tw`text-lg font-bold text-center`, { color: textPrimary }]}>Need immediate assistance?</Text>
          <Text style={[tw`text-sm text-center px-4`, { color: textSecondary }]}>Our support team typically responds within 24 hours.</Text>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:support@vertex.com')} style={[tw`mt-2 px-6 py-3 rounded-xl flex-row items-center gap-2`, { backgroundColor: accent }]}>
            <MaterialIcons name="email" size={18} color="white" />
            <Text style={tw`text-white font-bold`}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <View>
          <Text style={[tw`text-xs font-bold uppercase tracking-widest mb-3 px-1`, { color: textSecondary }]}>Frequently Asked Questions</Text>
          <View style={tw`gap-3`}>
            {faqs.map((faq, i) => (
              <View key={i} style={[tw`p-4 rounded-xl`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
                <Text style={[tw`font-bold text-sm mb-2`, { color: textPrimary }]}>{faq.q}</Text>
                <Text style={[tw`text-sm leading-5`, { color: textSecondary }]}>{faq.a}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
