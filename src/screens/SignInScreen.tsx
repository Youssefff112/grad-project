import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import { Card } from '../components/Card';
import * as authService from '../services/auth.service';
import { getClientSubscriptionStatus } from '../services/clientService';
import { resolveCoachGate } from '../utils/coachGate';
import { environment } from '../config/environment';
import { validateLoginEmail, validateLoginPassword } from '../utils/validation';

export const SignInScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { setFullName, setEmail: saveEmail, setSubscriptionPlan, setAuthTokens, setRole, setUserId, setCoachApplicationStatus, hydrateFromAuthUser, syncProfileFromServer } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const subtextColor = isDark ? '#94a3b8' : '#64748b';

  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    const emailErr = validateLoginEmail(email);
    if (emailErr) newErrors.email = emailErr;
    const passErr = validateLoginPassword(password);
    if (passErr) newErrors.password = passErr;
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

        // Persist user ID so the app can identify the logged-in user after restart
        if (user.id) await setUserId(String(user.id));

        // Update user profile info
        setFullName(fullName);
        saveEmail(user.email);
        hydrateFromAuthUser(user);

        // Persist role to context + AsyncStorage
        setRole(user.role as any);

        const coachGate = user.role === 'coach' ? resolveCoachGate((user as any).coachProfile) : null;
        if (user.role === 'coach' && coachGate) {
          await setCoachApplicationStatus(coachGate);
        } else {
          await setCoachApplicationStatus(null);
        }

        // Set a sensible default subscription immediately so the app doesn't block
        if (user.role === 'client') {
          setSubscriptionPlan(((user as any).subscriptionPlan ?? 'Free') as any);
        } else if (user.role === 'coach') {
          if (coachGate === 'pending' || coachGate === 'rejected') {
            setSubscriptionPlan('Free');
          } else {
            setSubscriptionPlan(((user as any).subscriptionPlan as any) ?? 'ProCoach');
          }
        } else {
          setSubscriptionPlan('Free');
        }

        // Navigate immediately — don't wait for background fetches
        if (user.role === 'admin') {
          navigation.navigate('AdminDashboard');
        } else if (user.role === 'coach' && coachGate) {
          if (coachGate === 'pending') navigation.navigate('CoachPendingApproval');
          else if (coachGate === 'rejected') navigation.navigate('CoachApplicationRejected');
          else navigation.navigate('CoachCommandCenter');
        } else {
          navigation.navigate('TraineeCommandCenter');
        }

        // Background: refine subscription plan & sync profile (non-blocking)
        if (user.role === 'client') {
          getClientSubscriptionStatus()
            .then(({ subscription }) => {
              if (subscription?.planName) setSubscriptionPlan(subscription.planName as any);
            })
            .catch(() => {});
        }
        syncProfileFromServer().catch(() => {});
      }
    } catch (error: any) {
      let errorMessage = 'Sign in failed. Please try again.';

      if (error.response?.status === 401) {
        errorMessage = 'The password is incorrect. Please try again.';
        setErrors({ password: errorMessage });
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.message === 'Network Error' || !error.response) {
        errorMessage = `Cannot reach the server at ${environment.API_BASE_URL}.\n\n• Backend running? (npm run dev in /backend)\n• Phone on the same Wi-Fi as this PC\n• Reload Expo after network changes (npx expo start --clear)`;
      }

      Alert.alert('Sign In Error', errorMessage);
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1`}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
            {"Don't have an account? "}
            <Text style={[tw`font-bold`, { color: accent }]}>Create One</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
};