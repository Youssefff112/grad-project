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
import { useUser } from '../context/UserContext';
import { Button } from '../components/Button';

export const AccountCreationScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { setFullName, setEmail: saveEmail } = useUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const inputBg = isDark ? '#1e293b' : '#ffffff';
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : accent + '18';
  const inputText = isDark ? '#ffffff' : '#1e293b';
  const labelColor = isDark ? '#e2e8f0' : '#1e293b';
  const subtextColor = isDark ? '#94a3b8' : '#64748b';

  const validateForm = (): string | null => {
    if (!name.trim()) {
      return 'Please enter your full name';
    }
    if (!email.trim()) {
      return 'Please enter your email address';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    if (!password) {
      return 'Please enter a password';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!confirmPassword) {
      return 'Please confirm your password';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleCreateAccount = () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setIsLoading(true);
    try {
      setFullName(name);
      saveEmail(email);
      navigation.navigate('SubscriptionSelection');
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
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
          {/* Full Name */}
          <View>
            <Text style={[tw`text-sm font-bold uppercase tracking-wider mb-2`, { color: labelColor }]}>
              Full Name
            </Text>
            <View style={tw`relative`}>
              <TextInput
                style={[tw`w-full h-14 rounded-xl px-4 pr-12 text-lg`, { backgroundColor: inputBg, borderWidth: 2, borderColor: inputBorder, color: inputText }]}
                placeholder="John Doe"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
              />
              <MaterialIcons name="person" size={22} color="#94a3b8" style={tw`absolute right-4 top-4`} />
            </View>
          </View>

          {/* Email */}
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
              />
              <MaterialIcons name="email" size={22} color="#94a3b8" style={tw`absolute right-4 top-4`} />
            </View>
          </View>

          {/* Password */}
          <View>
            <Text style={[tw`text-sm font-bold uppercase tracking-wider mb-2`, { color: labelColor }]}>
              Password
            </Text>
            <View style={tw`relative`}>
              <TextInput
                style={[tw`w-full h-14 rounded-xl px-4 pr-12 text-lg`, { backgroundColor: inputBg, borderWidth: 2, borderColor: inputBorder, color: inputText }]}
                placeholder="Min. 8 characters"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="new-password"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={tw`absolute right-4 top-4`}>
                <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View>
            <Text style={[tw`text-sm font-bold uppercase tracking-wider mb-2`, { color: labelColor }]}>
              Confirm Password
            </Text>
            <View style={tw`relative`}>
              <TextInput
                style={[tw`w-full h-14 rounded-xl px-4 pr-12 text-lg`, { backgroundColor: inputBg, borderWidth: 2, borderColor: inputBorder, color: inputText }]}
                placeholder="Repeat password"
                placeholderTextColor="#94a3b8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={tw`absolute right-4 top-4`}>
                <MaterialIcons name={showConfirm ? 'visibility' : 'visibility-off'} size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[tw`mt-1 rounded-xl p-4 flex-row items-start gap-3`, { backgroundColor: accent + '0a', borderWidth: 1, borderColor: accent + '18' }]}>
            <MaterialIcons name="lock" size={18} color={accent} />
            <Text style={[tw`text-sm flex-1`, { color: subtextColor }]}>
              Your data is encrypted end-to-end and never shared with third parties.
            </Text>
          </View>
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
