import React, { useState } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import { Card } from '../components/Card';
import * as authService from '../services/auth.service';

export const AccountCreationScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { setFullName, setEmail: saveEmail, setAuthTokens } = useUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const subtextColor = isDark ? '#94a3b8' : '#64748b';

  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Please enter your full name';
    }
    if (!email.trim()) {
      newErrors.email = 'Please enter your email address';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }
    if (!password) {
      newErrors.password = 'Please enter a password';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleCreateAccount = async () => {
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      Alert.alert('Validation Error', Object.values(formErrors)[0]);
      return;
    }

    setIsLoading(true);
    try {
      // Split full name into firstName and lastName for the backend
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || firstName;

      // Call backend registration API
      const response = await authService.register({
        firstName,
        lastName,
        email,
        password,
        userType: 'offline',
        role: 'client',
      });

      if (response.success && response.data?.token) {
        // Save auth tokens
        await setAuthTokens(response.data.token, response.data.refreshToken);

        // Save user info locally
        setFullName(name);
        saveEmail(email);

        navigation.navigate('SubscriptionSelection');
      }
    } catch (error: any) {
      let errorMessage = 'Failed to create account. Please try again.';

      if (error.response?.status === 400) {
        const msg = error.response?.data?.message;
        errorMessage = msg || 'Invalid registration data. Please check your inputs.';
      } else if (error.message === 'Network Error' || !error.response) {
        // Fallback: allow local-only account creation when backend is unavailable
        console.log('Backend unavailable, creating local-only account...');
        setFullName(name);
        saveEmail(email);
        navigation.navigate('SubscriptionSelection');
        return;
      }

      Alert.alert('Registration Error', errorMessage);
      console.error('Account creation error:', error);
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
            Create Account
          </Text>
          <Text style={[tw`text-base leading-relaxed`, { color: subtextColor }]}>
            Join Vertex and start your journey toward peak performance.
          </Text>
        </View>

        <View style={tw`flex-col gap-5`}>
          <FormInput
            label="Full Name"
            placeholder="John Doe"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            error={!!errors.name}
            helperText={errors.name}
            icon={<MaterialIcons name="person" size={20} color={accent} />}
            autoCapitalize="words"
            autoComplete="name"
          />

          <FormInput
            label="Email Address"
            placeholder="you@email.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            error={!!errors.email}
            helperText={errors.email}
            icon={<MaterialIcons name="email" size={20} color={accent} />}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <FormInput
            label="Password"
            placeholder="Min. 8 characters"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: '' });
            }}
            error={!!errors.password}
            helperText={errors.password}
            isPassword
            autoCapitalize="none"
            autoComplete="new-password"
          />

          <FormInput
            label="Confirm Password"
            placeholder="Repeat password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
            }}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            isPassword
            autoCapitalize="none"
          />

          <Card variant="filled" padding="md">
            <View style={tw`flex-row gap-3`}>
              <MaterialIcons name="lock" size={18} color={accent} />
              <Text style={[tw`text-sm flex-1 leading-5`, { color: subtextColor }]}>
                Your data is encrypted end-to-end and never shared with third parties.
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      <View style={[tw`p-6 gap-3`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderTopWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
        <Button
          title={isLoading ? 'Creating Account...' : 'Create Account'}
          size="lg"
          onPress={handleCreateAccount}
          disabled={isLoading}
          icon={!isLoading && <MaterialIcons name="arrow-forward" size={20} color="white" style={tw`ml-2`} />}
        />
        <TouchableOpacity style={tw`items-center py-2`} onPress={() => navigation.goBack()} disabled={isLoading}>
          <Text style={[tw`text-sm`, { color: subtextColor }]}>
            Already have an account?{' '}
            <Text style={[tw`font-bold`, { color: accent }]}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
