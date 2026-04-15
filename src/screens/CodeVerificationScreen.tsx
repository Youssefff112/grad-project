import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FormInput } from '../components/FormInput';
import { apiPost } from '../services/api';

export const CodeVerificationScreen = ({ navigation, route }: any) => {
  const { isDark, accent } = useTheme();
  const { email, resetToken } = route.params || {};
  const [codes, setCodes] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);

  const inputBg = isDark ? '#1e293b' : '#ffffff';
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : accent + '18';
  const inputText = isDark ? '#ffffff' : '#1e293b';
  const labelColor = isDark ? '#e2e8f0' : '#1e293b';
  const subtextColor = isDark ? '#94a3b8' : '#64748b';

  // Timer countdown
  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleCodeChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;
    
    const newCodes = [...codes];
    newCodes[index] = value;
    setCodes(newCodes);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !codes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = codes.join('');

    if (fullCode.length !== 6) {
      Alert.alert('Validation', 'Please enter all 6 digits');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      Alert.alert('Validation', 'New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Validation', 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      if (resetToken) {
        // Use the reset token from the forgot-password response
        await apiPost(`/auth/reset-password/${resetToken}`, {
          password: newPassword,
          confirmPassword: confirmPassword,
        });
      }

      Alert.alert('Success', 'Password reset successfully! Please sign in with your new password.');
      navigation.navigate('SignIn');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to reset password. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = () => {
    if (!canResend) return;

    setTimer(60);
    setCanResend(false);
    setCodes(['', '', '', '', '', '']);
    Alert.alert('Code Sent', 'A new verification code has been sent to ' + email);
    inputRefs.current[0]?.focus();
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
            Verify Code
          </Text>
          <Text style={[tw`text-base leading-relaxed`, { color: subtextColor }]}>
            Enter the 6-digit code we sent to{' '}
            <Text style={[tw`font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              {email}
            </Text>
          </Text>
        </View>

        <View style={tw`flex-col gap-8 mt-8`}>
          {/* Illustration */}
          <View style={[tw`flex items-center justify-center py-8 rounded-2xl`, { backgroundColor: accent + '0a', borderWidth: 1, borderColor: accent + '18' }]}>
            <MaterialIcons name="verified-user" size={64} color={accent} />
          </View>

          {/* Code Input Fields */}
          <View>
            <Text style={[tw`text-sm font-bold uppercase tracking-wider mb-4 text-center`, { color: labelColor }]}>
              Enter Verification Code
            </Text>
            <View style={tw`flex-row gap-3 justify-center`}>
              {codes.map((code, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    if (ref) inputRefs.current[index] = ref;
                  }}
                  style={[
                    tw`h-16 w-14 rounded-xl text-center text-3xl font-bold`,
                    {
                      backgroundColor: inputBg,
                      borderWidth: 2,
                      borderColor: code ? accent : inputBorder,
                      color: inputText,
                    },
                  ]}
                  placeholder="-"
                  placeholderTextColor="#94a3b8"
                  value={code}
                  onChangeText={(value) => handleCodeChange(index, value)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  editable={!isLoading}
                />
              ))}
            </View>
          </View>

          {/* Timer / Resend */}
          <View style={tw`flex-col gap-3 items-center`}>
            {!canResend ? (
              <Text style={[tw`text-sm font-medium`, { color: subtextColor }]}>
                Resend code in{' '}
                <Text style={[tw`font-bold`, { color: accent }]}>
                  {timer}s
                </Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResendCode}>
                <Text style={[tw`text-sm font-bold`, { color: accent }]}>
                  Didn't receive code? Resend
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Info Box */}
          <Card variant="filled" padding="md">
            <View style={tw`flex-row gap-3`}>
              <MaterialIcons name="info" size={18} color={accent} style={tw`mt-0.5`} />
              <Text style={[tw`text-sm flex-1 leading-5`, { color: subtextColor }]}>
                The code expires in 15 minutes. Check your spam folder if you haven't received it.
              </Text>
            </View>
          </Card>

          {/* New Password Fields */}
          <FormInput
            label="New Password"
            placeholder="Min. 8 characters"
            value={newPassword}
            onChangeText={setNewPassword}
            isPassword
            autoCapitalize="none"
            autoComplete="new-password"
            disabled={isLoading}
          />

          <FormInput
            label="Confirm New Password"
            placeholder="Repeat new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            autoCapitalize="none"
            disabled={isLoading}
          />
        </View>
      </ScrollView>

      <View style={[tw`p-6 gap-3`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderTopWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
        <Button
          title={isLoading ? "Verifying..." : "Verify Code"}
          size="lg"
          onPress={handleVerify}
          disabled={isLoading || codes.join('').length !== 6 || !newPassword || newPassword !== confirmPassword}
          icon={!isLoading && <MaterialIcons name="check-circle" size={20} color="white" style={tw`ml-2`} />}
        />
        <TouchableOpacity style={tw`items-center py-2`} onPress={() => navigation.goBack()}>
          <Text style={[tw`text-sm`, { color: subtextColor }]}>
            Wrong email?{' '}
            <Text style={[tw`font-bold`, { color: accent }]}>Go Back</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};