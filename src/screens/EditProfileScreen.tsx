import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { Button } from '../components/Button';

export const EditProfileScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { fullName, email, setFullName, setEmail } = useUser();
  const [name, setName] = useState(fullName);
  const [emailInput, setEmailInput] = useState(email);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const inputBg = isDark ? '#1e293b' : '#ffffff';
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : accent + '18';
  const inputText = isDark ? '#ffffff' : '#1e293b';
  const labelColor = isDark ? '#e2e8f0' : '#1e293b';

  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose a source for your new profile photo',
      [
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Library', onPress: handlePickPhoto },
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      ]
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!emailInput.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    setFullName(name);
    setEmail(emailInput);
    Alert.alert('Success', 'Profile updated successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center p-4 justify-between`, { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-12 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold tracking-tight flex-1 text-center`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>Edit Profile</Text>
        <View style={tw`w-12`} />
      </View>

      <ScrollView style={tw`flex-1 px-6`} keyboardShouldPersistTaps="handled">
        <View style={tw`items-center pt-6 pb-8`}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={tw`w-24 h-24 rounded-full mb-3`} />
          ) : (
            <View style={[tw`w-24 h-24 rounded-full items-center justify-center mb-3`, { backgroundColor: accent + '20', borderWidth: 2, borderColor: accent }]}>
              <MaterialIcons name="person" size={48} color={accent} />
            </View>
          )}
          <TouchableOpacity style={[tw`px-4 py-2 rounded-full gap-2 flex-row items-center`, { backgroundColor: accent + '18' }]} onPress={showPhotoOptions}>
            <MaterialIcons name="camera-alt" size={16} color={accent} />
            <Text style={[tw`text-sm font-bold`, { color: accent }]}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={tw`gap-5`}>
          <View>
            <Text style={[tw`text-sm font-bold uppercase tracking-wider mb-2`, { color: labelColor }]}>Full Name</Text>
            <TextInput style={[tw`w-full h-14 rounded-xl px-4 text-lg`, { backgroundColor: inputBg, borderWidth: 2, borderColor: inputBorder, color: inputText }]} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="#94a3b8" />
          </View>
          <View>
            <Text style={[tw`text-sm font-bold uppercase tracking-wider mb-2`, { color: labelColor }]}>Email</Text>
            <TextInput style={[tw`w-full h-14 rounded-xl px-4 text-lg`, { backgroundColor: inputBg, borderWidth: 2, borderColor: inputBorder, color: inputText }]} value={emailInput} onChangeText={setEmailInput} placeholder="Email" placeholderTextColor="#94a3b8" keyboardType="email-address" autoCapitalize="none" />
          </View>
        </View>
      </ScrollView>

      <View style={[tw`p-6`, { borderTopWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
        <Button title="Save Changes" size="lg" onPress={handleSave} />
      </View>
    </SafeAreaView>
  );
};
