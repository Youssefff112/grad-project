import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { Button } from '../components/Button';

export const AccountCreationScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <SafeAreaView style={tw`flex-1 bg-background-light dark:bg-background-dark`}>
      <View style={tw`p-4 flex-row items-center justify-between`}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={tw`flex size-10 items-center justify-center rounded-full`}
        >
          <MaterialIcons name="arrow-back" size={24} color={tw.color('slate-900')} />
        </TouchableOpacity>
        <Text style={tw`text-primary font-bold text-xl tracking-tighter`}>APEX AI</Text>
        <View style={tw`w-10`} />
      </View>

      <ScrollView style={tw`flex-1 px-6`} keyboardShouldPersistTaps="handled">
        <View style={tw`py-6`}>
          <Text style={tw`text-slate-900 dark:text-slate-100 text-3xl font-bold leading-tight mb-2`}>
            Create Account
          </Text>
          <Text style={tw`text-slate-500 dark:text-slate-400 text-base leading-relaxed`}>
            Join Apex AI and start your journey toward elite performance.
          </Text>
        </View>

        <View style={tw`flex-col gap-5`}>
          {/* Full Name */}
          <View>
            <Text style={tw`text-slate-800 dark:text-slate-200 text-sm font-bold uppercase tracking-wider mb-2`}>
              Full Name
            </Text>
            <View style={tw`relative`}>
              <TextInput
                style={tw`w-full h-14 bg-white dark:bg-slate-800 border-2 border-primary/10 rounded-xl px-4 pr-12 text-lg text-slate-900 dark:text-white`}
                placeholder="John Doe"
                placeholderTextColor={tw.color('slate-400')}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
              />
              <MaterialIcons
                name="person"
                size={22}
                color={tw.color('slate-400')}
                style={tw`absolute right-4 top-4`}
              />
            </View>
          </View>

          {/* Email */}
          <View>
            <Text style={tw`text-slate-800 dark:text-slate-200 text-sm font-bold uppercase tracking-wider mb-2`}>
              Email Address
            </Text>
            <View style={tw`relative`}>
              <TextInput
                style={tw`w-full h-14 bg-white dark:bg-slate-800 border-2 border-primary/10 rounded-xl px-4 pr-12 text-lg text-slate-900 dark:text-white`}
                placeholder="you@email.com"
                placeholderTextColor={tw.color('slate-400')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <MaterialIcons
                name="email"
                size={22}
                color={tw.color('slate-400')}
                style={tw`absolute right-4 top-4`}
              />
            </View>
          </View>

          {/* Password */}
          <View>
            <Text style={tw`text-slate-800 dark:text-slate-200 text-sm font-bold uppercase tracking-wider mb-2`}>
              Password
            </Text>
            <View style={tw`relative`}>
              <TextInput
                style={tw`w-full h-14 bg-white dark:bg-slate-800 border-2 border-primary/10 rounded-xl px-4 pr-12 text-lg text-slate-900 dark:text-white`}
                placeholder="Min. 8 characters"
                placeholderTextColor={tw.color('slate-400')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="new-password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={tw`absolute right-4 top-4`}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={22}
                  color={tw.color('slate-400')}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View>
            <Text style={tw`text-slate-800 dark:text-slate-200 text-sm font-bold uppercase tracking-wider mb-2`}>
              Confirm Password
            </Text>
            <View style={tw`relative`}>
              <TextInput
                style={tw`w-full h-14 bg-white dark:bg-slate-800 border-2 border-primary/10 rounded-xl px-4 pr-12 text-lg text-slate-900 dark:text-white`}
                placeholder="Repeat password"
                placeholderTextColor={tw.color('slate-400')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirm(!showConfirm)}
                style={tw`absolute right-4 top-4`}
              >
                <MaterialIcons
                  name={showConfirm ? 'visibility' : 'visibility-off'}
                  size={22}
                  color={tw.color('slate-400')}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={tw`mt-1 rounded-xl bg-primary/5 p-4 border border-primary/10 flex-row items-start gap-3`}>
            <MaterialIcons name="lock" size={18} color={tw.color('primary')} />
            <Text style={tw`text-sm text-slate-600 dark:text-slate-400 flex-1`}>
              Your data is encrypted end-to-end and never shared with third parties.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={tw`p-6 bg-background-light dark:bg-background-dark border-t border-primary/5 gap-3`}>
        <Button
          title="Create Account"
          size="lg"
          onPress={() => navigation.navigate('Biometrics')}
          icon={<MaterialIcons name="arrow-forward" size={24} color="white" style={tw`ml-2`} />}
        />
        <TouchableOpacity style={tw`items-center py-2`} onPress={() => navigation.goBack()}>
          <Text style={tw`text-slate-500 dark:text-slate-400 text-sm`}>
            Already have an account?{' '}
            <Text style={tw`text-primary font-bold`}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
