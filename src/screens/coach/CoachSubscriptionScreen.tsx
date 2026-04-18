import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { Button } from '../../components/Button';

const COACH_FEATURES = [
  { icon: 'group' as const, label: 'Client Management', desc: 'Manage up to 50 active clients' },
  { icon: 'restaurant-menu' as const, label: 'Meal Plan Builder', desc: 'Create custom meal plans per client' },
  { icon: 'fitness-center' as const, label: 'Workout Program Builder', desc: 'Design and assign workout programs' },
  { icon: 'trending-up' as const, label: 'Client Progress Tracking', desc: 'Track weight, body fat, and performance' },
  { icon: 'chat-bubble' as const, label: 'Direct Client Messaging', desc: 'Real-time chat with all your clients' },
  { icon: 'calendar-today' as const, label: 'Schedule & Availability', desc: 'Manage sessions and availability slots' },
  { icon: 'attach-money' as const, label: 'Earnings Dashboard', desc: 'Track revenue, payments and stats' },
  { icon: 'inventory' as const, label: 'Program Templates', desc: 'Reusable workout and meal plan templates' },
  { icon: 'star' as const, label: 'Review Management', desc: 'View and manage client reviews' },
];

export const CoachSubscriptionScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { setSubscriptionPlan, fullName } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const handleActivate = async () => {
    setIsLoading(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      setSubscriptionPlan('ProCoach');
      navigation.navigate('CoachProfileEdit');
    } catch {
      Alert.alert('Error', 'Failed to activate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center p-4 pb-2 justify-between`, { borderBottomWidth: 1, borderColor: borderColor, backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-10 items-center justify-center rounded-full`}>
          <MaterialIcons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>
        <Text style={[tw`font-bold text-xl tracking-tighter`, { color: accent }]}>VERTEX Pro</Text>
        <View style={tw`w-10`} />
      </View>

      <ScrollView style={tw`flex-1 px-6`} contentContainerStyle={tw`pb-8`}>
        {/* Hero */}
        <View style={tw`items-center pt-8 pb-6`}>
          <View style={[tw`w-20 h-20 rounded-2xl items-center justify-center mb-4`, { backgroundColor: accent + '18' }]}>
            <MaterialIcons name="workspace-premium" size={40} color={accent} />
          </View>
          <Text style={[tw`text-3xl font-bold text-center mb-2`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            Pro Coach Plan
          </Text>
          <Text style={[tw`text-base text-center leading-relaxed`, { color: subtextColor }]}>
            Everything you need to grow your coaching business and deliver exceptional results.
          </Text>
        </View>

        {/* Price Card */}
        <View style={[tw`p-6 rounded-2xl mb-6 items-center`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}>
          <Text style={[tw`text-5xl font-black`, { color: accent }]}>$49.99</Text>
          <Text style={[tw`text-sm mt-1`, { color: subtextColor }]}>per month · cancel anytime</Text>
          <View style={tw`flex-row items-center gap-1.5 mt-3`}>
            <MaterialIcons name="check-circle" size={16} color={accent} />
            <Text style={[tw`text-sm font-semibold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>14-day free trial included</Text>
          </View>
        </View>

        {/* Features */}
        <Text style={[tw`text-xs font-bold uppercase tracking-wider mb-3`, { color: subtextColor }]}>What's included</Text>
        <View style={[tw`rounded-2xl overflow-hidden mb-6`, { borderWidth: 1, borderColor: borderColor }]}>
          {COACH_FEATURES.map((f, i) => (
            <View
              key={f.label}
              style={[tw`flex-row items-center gap-4 p-4`, {
                backgroundColor: cardBg,
                borderBottomWidth: i < COACH_FEATURES.length - 1 ? 1 : 0,
                borderColor: borderColor,
              }]}
            >
              <View style={[tw`w-9 h-9 rounded-xl items-center justify-center flex-shrink-0`, { backgroundColor: accent + '14' }]}>
                <MaterialIcons name={f.icon} size={18} color={accent} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`text-sm font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>{f.label}</Text>
                <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>{f.desc}</Text>
              </View>
              <MaterialIcons name="check" size={18} color={accent} />
            </View>
          ))}
        </View>

        {/* Trust badges */}
        <View style={tw`flex-row gap-3 mb-6`}>
          {[
            { icon: 'lock' as const, label: 'Secure Payment' },
            { icon: 'refresh' as const, label: 'Cancel Anytime' },
            { icon: 'support-agent' as const, label: '24/7 Support' },
          ].map(b => (
            <View key={b.label} style={[tw`flex-1 items-center p-3 rounded-xl`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
              <MaterialIcons name={b.icon} size={18} color={subtextColor} />
              <Text style={[tw`text-xs text-center mt-1 font-semibold`, { color: subtextColor }]}>{b.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[tw`p-6 gap-3`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderTopWidth: 1, borderColor: borderColor }]}>
        <Button
          title={isLoading ? 'Activating...' : 'Start Free Trial'}
          size="lg"
          onPress={handleActivate}
          disabled={isLoading}
          icon={!isLoading && <MaterialIcons name="arrow-forward" size={20} color="white" style={tw`ml-2`} />}
        />
        <Text style={[tw`text-xs text-center`, { color: subtextColor }]}>
          By continuing you agree to our Terms of Service. You won't be charged until your trial ends.
        </Text>
      </View>
    </SafeAreaView>
  );
};
