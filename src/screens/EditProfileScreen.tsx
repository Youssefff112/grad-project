import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import { apiPatch, apiPost } from '../services/api';

type Section = 'profile' | 'password';

export const EditProfileScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { fullName, email, setFullName, setEmail } = useUser();

  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [name, setName] = useState(fullName ?? '');
  const [emailInput, setEmailInput] = useState(email ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const inputBg = isDark ? '#1e293b' : '#ffffff';
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : accent + '18';
  const inputText = isDark ? '#ffffff' : '#1e293b';
  const labelColor = isDark ? '#e2e8f0' : '#1e293b';
  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const showPhotoOptions = () => {
    Alert.alert('Change Profile Photo', 'Choose a source', [
      { text: 'Take Photo', onPress: handleTakePhoto },
      { text: 'Choose from Library', onPress: handlePickPhoto },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter your full name');
      return;
    }
    if (!emailInput.trim() || !emailInput.includes('@')) {
      Alert.alert('Validation', 'Please enter a valid email address');
      return;
    }

    setIsSaving(true);
    try {
      const [firstName, ...rest] = name.trim().split(' ');
      const lastName = rest.join(' ');
      await apiPatch('/user/profile', {
        firstName,
        lastName: lastName || undefined,
        email: emailInput.trim(),
      });
      setFullName(name.trim());
      setEmail(emailInput.trim());
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message === 'Network Error'
          ? 'Cannot reach the server. Check your connection.'
          : 'Failed to save profile. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert('Validation', 'Please enter your current password');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Validation', 'New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation', 'New passwords do not match');
      return;
    }

    setIsSaving(true);
    try {
      await apiPost('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password changed successfully!');
    } catch (err: any) {
      const status = err.response?.status;
      const msg =
        status === 401
          ? 'Current password is incorrect.'
          : err.response?.data?.message || 'Failed to change password.';
      Alert.alert('Error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1`}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
        {/* Header */}
        <View
          style={[
            tw`flex-row items-center p-4 justify-between`,
            { borderBottomWidth: 1, borderColor },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={tw`flex size-12 items-center justify-center`}
          >
            <MaterialIcons name="arrow-back" size={24} color={accent} />
          </TouchableOpacity>
          <Text
            style={[
              tw`text-lg font-bold tracking-tight flex-1 text-center`,
              { color: isDark ? '#f1f5f9' : '#1e293b' },
            ]}
          >
            Edit Profile
          </Text>
          <View style={tw`w-12`} />
        </View>

        {/* Section Tabs */}
        <View
          style={[
            tw`flex-row mx-5 my-3 rounded-xl overflow-hidden`,
            { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' },
          ]}
        >
          {(['profile', 'password'] as Section[]).map(section => (
            <TouchableOpacity
              key={section}
              onPress={() => setActiveSection(section)}
              style={[
                tw`flex-1 py-2.5 items-center rounded-xl`,
                { backgroundColor: activeSection === section ? accent : 'transparent' },
              ]}
            >
              <Text
                style={[
                  tw`text-sm font-bold capitalize`,
                  { color: activeSection === section ? '#fff' : subtextColor },
                ]}
              >
                {section === 'profile' ? 'Profile Info' : 'Password'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={tw`flex-1 px-5`}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {activeSection === 'profile' ? (
            <>
              {/* Avatar */}
              <View style={tw`items-center pt-4 pb-6`}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={tw`w-24 h-24 rounded-full mb-3`} />
                ) : (
                  <View
                    style={[
                      tw`w-24 h-24 rounded-full items-center justify-center mb-3`,
                      { backgroundColor: accent + '20', borderWidth: 2, borderColor: accent },
                    ]}
                  >
                    <MaterialIcons name="person" size={48} color={accent} />
                  </View>
                )}
                <TouchableOpacity
                  style={[
                    tw`px-4 py-2 rounded-full gap-2 flex-row items-center`,
                    { backgroundColor: accent + '18' },
                  ]}
                  onPress={showPhotoOptions}
                >
                  <MaterialIcons name="camera-alt" size={16} color={accent} />
                  <Text style={[tw`text-sm font-bold`, { color: accent }]}>Change Photo</Text>
                </TouchableOpacity>
              </View>

              {/* Name */}
              <View style={tw`gap-5 mb-6`}>
                <View>
                  <Text
                    style={[
                      tw`text-xs font-bold uppercase tracking-wider mb-2`,
                      { color: labelColor },
                    ]}
                  >
                    Full Name
                  </Text>
                  <TextInput
                    style={[
                      tw`w-full h-14 rounded-xl px-4 text-base`,
                      {
                        backgroundColor: inputBg,
                        borderWidth: 2,
                        borderColor: inputBorder,
                        color: inputText,
                      },
                    ]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Your full name"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="words"
                  />
                </View>

                <View>
                  <Text
                    style={[
                      tw`text-xs font-bold uppercase tracking-wider mb-2`,
                      { color: labelColor },
                    ]}
                  >
                    Email Address
                  </Text>
                  <TextInput
                    style={[
                      tw`w-full h-14 rounded-xl px-4 text-base`,
                      {
                        backgroundColor: inputBg,
                        borderWidth: 2,
                        borderColor: inputBorder,
                        color: inputText,
                      },
                    ]}
                    value={emailInput}
                    onChangeText={setEmailInput}
                    placeholder="you@email.com"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              </View>
            </>
          ) : (
            <View style={tw`gap-5 py-4 mb-6`}>
              <View
                style={[
                  tw`flex-row gap-3 p-3 rounded-xl`,
                  { backgroundColor: accent + '10', borderWidth: 1, borderColor: accent + '20' },
                ]}
              >
                <MaterialIcons name="info" size={18} color={accent} style={tw`mt-0.5`} />
                <Text style={[tw`text-xs flex-1 leading-5`, { color: subtextColor }]}>
                  Choose a strong password of at least 8 characters.
                </Text>
              </View>

              <FormInput
                label="Current Password"
                placeholder="Enter current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                isPassword
                autoCapitalize="none"
                disabled={isSaving}
              />
              <FormInput
                label="New Password"
                placeholder="Min. 8 characters"
                value={newPassword}
                onChangeText={setNewPassword}
                isPassword
                autoCapitalize="none"
                disabled={isSaving}
              />
              <FormInput
                label="Confirm New Password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
                autoCapitalize="none"
                disabled={isSaving}
              />
            </View>
          )}
        </ScrollView>

        {/* Save Button */}
        <View
          style={[
            tw`p-5`,
            {
              borderTopWidth: 1,
              borderColor,
              backgroundColor: isDark ? '#0a0a12' : '#f8f7f5',
            },
          ]}
        >
          <Button
            title={
              isSaving
                ? 'Saving...'
                : activeSection === 'profile'
                ? 'Save Changes'
                : 'Update Password'
            }
            size="lg"
            onPress={activeSection === 'profile' ? handleSaveProfile : handleChangePassword}
            disabled={isSaving}
            icon={
              isSaving ? (
                <ActivityIndicator size="small" color="white" style={tw`ml-2`} />
              ) : (
                <MaterialIcons
                  name={activeSection === 'profile' ? 'save' : 'lock'}
                  size={20}
                  color="white"
                  style={tw`ml-2`}
                />
              )
            }
          />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};
