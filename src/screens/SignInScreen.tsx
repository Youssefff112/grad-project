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
import { useUser } from '../context/UserContext';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import { Card } from '../components/Card';
import { validateMockUser, MOCK_USERS } from '../data/mockUsers';
import * as authService from '../services/auth.service';

export const SignInScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { setFullName, setEmail: saveEmail, setSubscriptionPlan, setAuthTokens, setRole } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const subtextColor = isDark ? '#94a3b8' : '#64748b';

  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (!email.includes('@')) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Please enter your password';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    return newErrors;
  };

  const handleSignIn = async () => {
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      Alert.alert('Validation Error', Object.values(formErrors)[0]);
      return;
    }

    setIsLoading(true);
    try {
      // Try backend login first
      const response = await authService.login({ email, password });

      if (response.success && response.data?.user && response.data?.token) {
        const user = response.data.user;
        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim() || user.email.split('@')[0];

        // Save tokens to context (which also handles AsyncStorage)
        await setAuthTokens(response.data.token, response.data.refreshToken);

        // Update user profile info
        setFullName(fullName);
        saveEmail(user.email);

        // TODO: Fetch actual subscription plan from backend profile
        setSubscriptionPlan('Free'); // Default for now, should come from backend

        // Persist role to context + AsyncStorage
        setRole(user.role as any);

        // Navigate based on role
        if (user.role === 'admin') {
          navigation.navigate('AdminDashboard');
        } else if (user.role === 'coach') {
          setSubscriptionPlan('ProCoach');
          navigation.navigate('CoachCommandCenter');
        } else {
          navigation.navigate('TraineeCommandCenter');
        }
      }
    } catch (error: any) {
      let errorMessage = 'Sign in failed. Please try again.';

      if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.message === 'Network Error' || !error.response) {
        // Fallback to mock user for demo/offline mode
        console.log('Backend unavailable, trying mock user...');
        const mockUser = validateMockUser(email, password);
        if (mockUser) {
          setFullName(mockUser.fullName);
          saveEmail(mockUser.email);
          setSubscriptionPlan(mockUser.subscriptionPlan);
          if (mockUser.subscriptionPlan === 'ProCoach') {
            navigation.navigate('CoachCommandCenter');
          } else {
            navigation.navigate('TraineeCommandCenter');
          }
          return;
        }
        errorMessage = 'Backend is unavailable. Please check your connection.';
      }

      Alert.alert('Sign In Error', errorMessage);
      console.error('Sign in error:', error);
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
            Sign In
          </Text>
          <Text style={[tw`text-base leading-relaxed`, { color: subtextColor }]}>
            Welcome back to Vertex. Your peak performance awaits.
          </Text>
        </View>

        <View style={tw`flex-col gap-5`}>
          {/* Quick Mock User Login Section */}
          <View>
            <Text style={[tw`text-xs font-bold uppercase tracking-wider mb-3`, { color: subtextColor }]}>
              Demo: Quick Login
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`-mx-6 px-6`}>
              <View style={tw`flex-row gap-2`}>
                {MOCK_USERS.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    onPress={() => {
                      setEmail(user.email);
                      setPassword(user.password);
                      // Auto-login
                        setTimeout(() => {
                          setFullName(user.fullName);
                          saveEmail(user.email);
                          setSubscriptionPlan(user.subscriptionPlan);
                          if (user.subscriptionPlan === 'ProCoach') {
                            navigation.navigate('CoachCommandCenter');
                          } else {
                            navigation.navigate('TraineeCommandCenter');
                          }
                        }, 100);
                    }}
                    style={[tw`px-4 py-2 rounded-lg border`, {
                      backgroundColor: accent + '0a',
                      borderColor: accent + '40'
                    }]}
                  >
                    <View style={tw`flex-row items-center gap-1`}>
                      <MaterialIcons name="person" size={14} color={accent} />
                      <View>
                        <Text style={[tw`text-xs font-bold`, { color: accent }]}>{user.subscriptionPlan}</Text>
                        <Text style={[tw`text-xs`, { color: '#94a3b8' }]} numberOfLines={1}>{user.fullName.split(' ')[0]}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

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
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: '' });
            }}
            error={!!errors.password}
            helperText={errors.password}
            isPassword
            autoCapitalize="none"
            autoComplete="password"
          />

          {/* Forgot Password */}
          <TouchableOpacity
            style={tw`items-end py-1`}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={[tw`text-sm font-semibold`, { color: accent }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <Card variant="filled" padding="md">
            <View style={tw`flex-row gap-3`}>
              <MaterialIcons name="lock" size={18} color={accent} />
              <Text style={[tw`text-sm flex-1 leading-5`, { color: subtextColor }]}>
                Your credentials are encrypted and secured with industry-standard encryption.
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      <View style={[tw`p-6 gap-3`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderTopWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
        <Button
          title={isLoading ? 'Signing In...' : 'Sign In'}
          size="lg"
          onPress={handleSignIn}
          disabled={isLoading}
          icon={!isLoading && <MaterialIcons name="arrow-forward" size={20} color="white" style={tw`ml-2`} />}
        />
        <TouchableOpacity style={tw`items-center py-2`} onPress={() => navigation.navigate('AccountCreation')} disabled={isLoading}>
          <Text style={[tw`text-sm`, { color: subtextColor }]}>
            Don't have an account?{' '}
            <Text style={[tw`font-bold`, { color: accent }]}>Create One</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};