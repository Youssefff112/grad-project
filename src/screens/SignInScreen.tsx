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
import { MOCK_USERS, MockUser } from '../data/mockUsers';
import * as authService from '../services/auth.service';
import * as subscriptionService from '../services/subscriptionService';
import { getClientSubscriptionStatus } from '../services/clientService';
import { PLAN_FEATURES } from '../constants/plans';
import { resolveCoachGate } from '../utils/coachGate';
import { environment } from '../config/environment';
import { validateEmail, validatePassword } from '../utils/validation';

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
    const emailErr = validateEmail(email);
    if (emailErr) newErrors.email = emailErr;
    const passErr = validatePassword(password);
    if (passErr) newErrors.password = passErr;
    return newErrors;
  };

  // Ensures a demo quick-login user has an active subscription for their plan tier in the DB.
  // Called after successful login/auto-register so AI features work immediately.
  const _bootstrapDemoAccount = async (mockUser: MockUser) => {
    if (mockUser.role === 'client') {
      await authService.updateProfile({
        profile: {
          goal: 'maintenance',
          experienceLevel: 'beginner',
          age: 28,
          height: 175,
          currentWeight: 75,
          gender: 'male',
          waterGoalMl: 2000,
        },
      }).catch(() => {});
    }
    await _ensureDemoQuickLoginSubscription(mockUser);
    await syncProfileFromServer().catch(() => {});
  };

  const _ensureDemoQuickLoginSubscription = async (mockUser: MockUser) => {
    const subRole: 'client' | 'coach' = mockUser.role === 'coach' ? 'coach' : 'client';
    const planName = mockUser.role === 'coach' ? 'ProCoach' : mockUser.subscriptionPlan;

    const { subscription: existing } = await subscriptionService.getActiveSubscription(subRole).catch(() => ({ subscription: null }));
    if (existing?.status === 'active') return; // already active — nothing to do

    const planData = PLAN_FEATURES[planName] ?? PLAN_FEATURES[mockUser.subscriptionPlan];
    const price = planData?.price ?? 0;

    const { subscription } = await subscriptionService.createSubscription({
      role: subRole,
      planName,
      price,
      autoRenew: true,
    });
    await subscriptionService.recordPayment(subscription.id, {
      amount: price,
      provider: 'demo',
      status: 'paid',
    });
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
        errorMessage = 'Invalid email or password';
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
          {/* Demo quick-login — development builds only */}
          {__DEV__ && environment.isDevelopment && (
          <View>
            <Text style={[tw`text-xs font-bold uppercase tracking-wider mb-3`, { color: subtextColor }]}>
              Demo: Quick Login
            </Text>

            {(() => {
              // Colors per role so it's instantly obvious which chip logs you
              // into which kind of account.
              const colorFor = (role: MockUser['role']) => {
                if (role === 'admin') return '#ef4444';
                if (role === 'coach') return '#f59e0b';
                return accent;
              };
              const iconFor = (role: MockUser['role']) => {
                if (role === 'admin') return 'admin-panel-settings';
                if (role === 'coach') return 'sports';
                return 'person';
              };

              const handleQuickLogin = async (user: MockUser) => {
                setEmail(user.email);
                setPassword(user.password);
                setIsLoading(true);
                try {
                  // Try real login first so the device gets a JWT for all protected endpoints
                  const loginResp = await authService.login({ email: user.email, password: user.password }).catch(async (err: any) => {
                    // User doesn't exist in DB yet — auto-register them
                    if (err?.response?.status === 401) {
                      const [first, ...rest] = user.fullName.split(' ');
                      await authService.register({
                        firstName: first,
                        lastName: rest.join(' ') || 'Demo',
                        email: user.email,
                        password: user.password,
                        confirmPassword: user.password,
                        userType: 'onsite',
                        role: user.role,
                      });
                      return authService.login({ email: user.email, password: user.password });
                    }
                    throw err;
                  });

                  if (loginResp?.success && loginResp.data?.user && loginResp.data?.token) {
                    const u = loginResp.data.user;
                    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email.split('@')[0];
                    await setAuthTokens(loginResp.data.token, loginResp.data.refreshToken);
                    if (u.id) await setUserId(String(u.id));
                    setFullName(fullName);
                    saveEmail(u.email);
                    setRole(u.role as any);

                    const coachGate = u.role === 'coach' ? resolveCoachGate((u as any).coachProfile) : null;
                    if (u.role === 'coach' && coachGate) {
                      await setCoachApplicationStatus(coachGate);
                    } else {
                      await setCoachApplicationStatus(null);
                    }

                    hydrateFromAuthUser(u);

                    if (u.role === 'admin') {
                      navigation.navigate('AdminDashboard');
                    } else if (u.role === 'coach' && coachGate) {
                      if (coachGate === 'pending') {
                        setSubscriptionPlan('Free');
                        navigation.navigate('CoachPendingApproval');
                      } else if (coachGate === 'rejected') {
                        setSubscriptionPlan('Free');
                        navigation.navigate('CoachApplicationRejected');
                      } else {
                        await _bootstrapDemoAccount(user);
                        setSubscriptionPlan('ProCoach');
                        navigation.navigate('CoachCommandCenter');
                      }
                    } else {
                      await _bootstrapDemoAccount(user);
                      try {
                        const { subscription } = await getClientSubscriptionStatus();
                        if (subscription?.planName) setSubscriptionPlan(subscription.planName as any);
                        else setSubscriptionPlan(user.subscriptionPlan as any);
                      } catch {
                        setSubscriptionPlan(user.subscriptionPlan as any);
                      }
                      navigation.navigate('TraineeCommandCenter');
                    }
                  }
                } catch (err: any) {
                  const msg =
                    err?.response?.data?.message ||
                    (err?.message === 'Network Error' || !err?.response
                      ? `Cannot reach the server at ${environment.API_BASE_URL}.\n\n• Backend running? (npm run dev in /backend)\n• Phone on the same Wi-Fi as this PC\n• Reload Expo after network changes (npx expo start --clear)`
                      : err?.message || 'Quick login failed. Please try again.');
                  Alert.alert('Quick Login Error', msg);
                  console.error('Quick login error:', err);
                } finally {
                  setIsLoading(false);
                }
              };

              const renderChip = (user: MockUser) => {
                const color = colorFor(user.role);
                // Client chips show the *plan display name* (e.g. "AI Plan").
                // Staff chips show the role itself ("Coach" / "Admin") to
                // make it obvious they're not a client tier.
                const label =
                  user.role === 'admin'
                    ? 'Admin'
                    : user.role === 'coach'
                      ? user.fullName.split(' ')[0] || 'Coach'
                      : PLAN_FEATURES[user.subscriptionPlan].name;

                return (
                  <TouchableOpacity
                    key={user.id}
                    onPress={() => handleQuickLogin(user)}
                    style={[
                      tw`px-4 py-2 rounded-lg border`,
                      { backgroundColor: color + '14', borderColor: color + '55' },
                    ]}
                  >
                    <View style={tw`flex-row items-center gap-2`}>
                      <MaterialIcons name={iconFor(user.role) as any} size={14} color={color} />
                      <View>
                        <Text style={[tw`text-xs font-bold`, { color }]}>{label}</Text>
                        <Text style={[tw`text-xs`, { color: '#94a3b8' }]} numberOfLines={1}>
                          {user.fullName.split(' ')[0]}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              };

              const clientUsers = MOCK_USERS.filter((u) => u.role === 'client');
              const staffUsers = MOCK_USERS.filter((u) => u.role !== 'client');

              return (
                <View style={tw`gap-3`}>
                  <View>
                    <Text style={[tw`text-[10px] font-semibold uppercase tracking-wider mb-2`, { color: subtextColor }]}>
                      Clients
                    </Text>
                    <ScrollView keyboardShouldPersistTaps="handled" horizontal showsHorizontalScrollIndicator={false} style={tw`-mx-6 px-6`}>
                      <View style={tw`flex-row gap-2`}>{clientUsers.map(renderChip)}</View>
                    </ScrollView>
                  </View>

                  <View>
                    <Text style={[tw`text-[10px] font-semibold uppercase tracking-wider mb-2`, { color: subtextColor }]}>
                      Staff (Coach & Admin)
                    </Text>
                    <ScrollView keyboardShouldPersistTaps="handled" horizontal showsHorizontalScrollIndicator={false} style={tw`-mx-6 px-6`}>
                      <View style={tw`flex-row gap-2`}>{staffUsers.map(renderChip)}</View>
                    </ScrollView>
                  </View>
                </View>
              );
            })()}
          </View>
          )}

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