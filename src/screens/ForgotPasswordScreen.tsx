import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/Button';

export const ForgotPasswordScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const inputBg = isDark ? '#1e293b' : '#ffffff';
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : accent + '18';
  const inputText = isDark ? '#ffffff' : '#1e293b';
  const labelColor = isDark ? '#e2e8f0' : '#1e293b';
  const subtextColor = isDark ? '#94a3b8' : '#64748b';

  const handleSendCode = () => {
    if (!email.trim()) {
      Alert.alert('Validation', 'Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Validation', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Pass email to verification screen
      navigation.navigate('CodeVerification', { email });
    }, 1500);
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={tw`p-4 flex-row items-center justify-between`}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={tw`flex size-10 items-center justify-center rounded-full`}
        >
          <MaterialIcons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>
        <Text style={[tw`font-bold text-xl tracking-tighter`, { color: accent }]}>VERTEX</Text>
        <View style={tw`w-10`} />
      </View>

      <ScrollView style={tw`flex-1 px-6`} keyboardShouldPersistTaps="handled">
        <View style={tw`py-6`}>
          <Text style={[tw`text-3xl font-bold leading-tight mb-2`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            Reset Password
          </Text>
          <Text style={[tw`text-base leading-relaxed`, { color: subtextColor }]}>
            Enter your email address and we'll send you a verification code to reset your password.
          </Text>
        </View>

        <View style={tw`flex-col gap-5 mt-8`}>
          {/* Illustration */}
          <View style={[tw`flex items-center justify-center py-8 rounded-2xl`, { backgroundColor: accent + '0a', borderWidth: 1, borderColor: accent + '18' }]}>
            <MaterialIcons name="mail-outline" size={64} color={accent} />
          </View>

          {/* Email Input */}
          <View>
            <Text style={[tw`text-sm font-bold uppercase tracking-wider mb-2`, { color: labelColor }]}>
              Email Address
            </Text>
            <View style={tw`relative`}>
              <TextInput
                style={[tw`w-full h-14 rounded-xl px-4 pr-12 text-lg`, { backgroundColor: inputBg, borderWidth: 2, borderColor: inputBorder, color: inputText }]}
                placeholder="you@email.com"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
              />
              <MaterialIcons name="email" size={22} color="#94a3b8" style={tw`absolute right-4 top-4`} />
            </View>
            <Text style={[tw`text-xs mt-2`, { color: subtextColor }]}>
              We'll send a verification code to this email address.
            </Text>
          </View>

          {/* Info Box */}
          <View style={[tw`rounded-xl p-4 flex-row items-start gap-3`, { backgroundColor: accent + '0a', borderWidth: 1, borderColor: accent + '18' }]}>
            <MaterialIcons name="info" size={18} color={accent} style={tw`mt-0.5`} />
            <Text style={[tw`text-sm flex-1`, { color: subtextColor }]}>
              Check your email (including spam folder) for the verification code.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[tw`p-6 gap-3`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderTopWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
        <Button
          title={isLoading ? "Sending Code..." : "Send Verification Code"}
          size="lg"
          onPress={handleSendCode}
          disabled={isLoading}
          icon={!isLoading && <MaterialIcons name="send" size={20} color="white" style={tw`ml-2`} />}
        />
        <TouchableOpacity style={tw`items-center py-2`} onPress={() => navigation.goBack()}>
          <Text style={[tw`text-sm`, { color: subtextColor }]}>
            Remember your password?{' '}
            <Text style={[tw`font-bold`, { color: accent }]}>Back to Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
