import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { Button } from '../../components/Button';
import * as coachService from '../../services/coachService';
import { resolveCoachGate } from '../../utils/coachGate';

export const CoachPendingApprovalScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { setCoachApplicationStatus, fullName, logout } = useUser();
  const [refreshing, setRefreshing] = useState(false);

  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';

  const checkStatus = useCallback(async () => {
    try {
      const { profile } = await coachService.getMyCoachProfile();
      const gate = resolveCoachGate({
        isApproved: profile?.isApproved,
        applicationStatus: profile?.applicationStatus as any,
      });
      await setCoachApplicationStatus(gate);
      if (gate === 'approved') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'CoachSubscription', params: { justApproved: true } }],
        });
      } else if (gate === 'rejected') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'CoachApplicationRejected' }],
        });
      }
    } catch {
      /* offline */
    }
  }, [navigation, setCoachApplicationStatus]);

  useFocusEffect(
    useCallback(() => {
      checkStatus();
    }, [checkStatus])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await checkStatus();
    setRefreshing(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'You can sign in again after an admin approves your account.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout().then(() => navigation.reset({ index: 0, routes: [{ name: 'Splash' }] })) },
    ]);
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-6 pb-10`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
      >
        <View style={tw`items-center pt-10 pb-6`}>
          <View style={[tw`w-20 h-20 rounded-2xl items-center justify-center mb-4`, { backgroundColor: '#f59e0b18' }]}>
            <MaterialIcons name="hourglass-empty" size={44} color="#f59e0b" />
          </View>
          <Text style={[tw`text-2xl font-black text-center`, { color: textPrimary }]}>Awaiting admin approval</Text>
          <Text style={[tw`text-base text-center mt-3 leading-relaxed`, { color: subtextColor }]}>
            Hi{fullName ? `, ${fullName.split(' ')[0]}` : ''}. Your coach account is registered, but a platform admin must verify it before you can use
            the coach dashboard.
          </Text>
        </View>

        <View style={[tw`p-5 rounded-2xl mb-6`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
          <Text style={[tw`text-sm font-bold mb-2`, { color: textPrimary }]}>What happens next?</Text>
          <Text style={[tw`text-sm leading-relaxed`, { color: subtextColor }]}>
            • An admin reviews your application{'\n'}• You will get access automatically when approved{'\n'}• Pull down to refresh this screen and check
            your status
          </Text>
        </View>

        <Button title="Check status now" onPress={onRefresh} loading={refreshing} />

        <TouchableOpacity onPress={handleSignOut} style={tw`mt-8 items-center py-3`}>
          <Text style={[tw`text-sm font-bold`, { color: subtextColor }]}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};
