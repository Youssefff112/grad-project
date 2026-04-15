import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import { Card } from '../components/Card';
import { apiPost } from '../services/api';

export const ForgotPasswordScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const subtextColor = isDark ? '#94a3b8' : '#64748b';

  const validateEmail = (): string => {
    if (!email.trim()) {
      return 'Please enter your email address';
    }
    if (!email.includes('@')) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const handleSendCode = async () => {
    const validationError = validateEmail();
    if (validationError) {
      setError(validationError);
      Alert.alert('Validation Error', validationError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiPost('/auth/forgot-password', { email });
      // Pass email and resetToken (if returned in dev mode) to verification screen
      navigation.navigate('CodeVerification', { 
        email,
        resetToken: response?.data?.resetToken || null,
      });
    } catch (error: any) {
      if (error.message === 'Network Error' || !error.response) {
        Alert.alert('Error', 'Unable to connect to the server. Please check your connection.');
      } else {
        // Always show success message for security (don't reveal if email exists)
        navigation.navigate('CodeVerification', { email, resetToken: null });
      }
    } finally {
      setIsLoading(false);
    }
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

          <FormInput
            label="Email Address"
            placeholder="you@email.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError('');
            }}
            error={!!error}
            helperText={error || 'We\'ll send a verification code to this email address.'}
            icon={<MaterialIcons name="email" size={20} color={accent} />}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            disabled={isLoading}
          />

          {/* Info Box */}
          <Card variant="filled" padding="md">
            <View style={tw`flex-row gap-3`}>
              <MaterialIcons name="info" size={18} color={accent} style={tw`mt-0.5`} />
              <Text style={[tw`text-sm flex-1 leading-5`, { color: subtextColor }]}>
                Check your email (including spam folder) for the verification code.
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      <View style={[tw`p-6 gap-3`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderTopWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
        <Button
          title={isLoading ? 'Sending Code...' : 'Send Verification Code'}
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