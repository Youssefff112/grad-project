import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { Button } from '../../components/Button';

export const CoachApplicationRejectedScreen = ({ navigation }: any) => {
  const { isDark } = useTheme();
  const { fullName, logout } = useUser();

  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';

  const handleSignOut = () => {
    Alert.alert('Sign out', 'You will need a new account or admin support to continue.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout().then(() => navigation.reset({ index: 0, routes: [{ name: 'Splash' }] })) },
    ]);
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <ScrollView keyboardShouldPersistTaps="handled" style={tw`flex-1`} contentContainerStyle={tw`px-6 pb-10`}>
        <View style={tw`items-center pt-10 pb-6`}>
          <View style={[tw`w-20 h-20 rounded-2xl items-center justify-center mb-4`, { backgroundColor: '#ef444418' }]}>
            <MaterialIcons name="cancel" size={44} color="#ef4444" />
          </View>
          <Text style={[tw`text-2xl font-black text-center`, { color: textPrimary }]}>Application not approved</Text>
          <Text style={[tw`text-base text-center mt-3 leading-relaxed`, { color: subtextColor }]}>
            {fullName ? `${fullName.split(' ')[0]}, we're ` : "We're "}
            sorry — your coach application was not approved by the platform admin. This account cannot access coach features.
          </Text>
        </View>

        <View style={[tw`p-5 rounded-2xl mb-8`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
          <Text style={[tw`text-sm leading-relaxed`, { color: subtextColor }]}>
            If you believe this is a mistake, contact support with the email you used to register. You can sign out below and use a different account if
            needed.
          </Text>
        </View>

        <Button title="Sign out" variant="outline" onPress={handleSignOut} />
      </ScrollView>
    </SafeAreaView>
  );
};
