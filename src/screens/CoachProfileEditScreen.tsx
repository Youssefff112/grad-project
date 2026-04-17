import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Alert,
  Image,
  Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { tw } from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import * as coachService from '../services/coachService';
import * as imageUploadService from '../services/imageUploadService';
import { TransformationCarousel } from '../components/TransformationCarousel';
import { CertificationBadge } from '../components/CertificationBadge';

export const CoachProfileEditScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isDark } = useTheme();
  const { userContext } = useUser();
  const [profile, setProfile] = useState<coachService.Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState('0');

  // UI state
  const [showAddTransformationModal, setShowAddTransformationModal] = useState(false);
  const [showAddCertificationModal, setShowAddCertificationModal] = useState(false);
  const [profilePicture, setProfilePicture] = useState<imageUploadService.PickedImage | null>(null);

  // Transformation form
  const [beforeImage, setBeforeImage] = useState<imageUploadService.PickedImage | null>(null);
  const [afterImage, setAfterImage] = useState<imageUploadService.PickedImage | null>(null);
  const [transformDescription, setTransformDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [transformResults, setTransformResults] = useState('');
  const [transformLoading, setTransformLoading] = useState(false);

  // Certification form
  const [certName, setCertName] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certYear, setCertYear] = useState(new Date().getFullYear().toString());
  const [certImage, setCertImage] = useState<imageUploadService.PickedImage | null>(null);
  const [certLoading, setCertLoading] = useState(false);

  const specialtyOptions = ['Strength', 'Cardio', 'Weight Loss', 'Nutrition', 'Flexibility', 'CrossFit', 'HIIT', 'Pilates', 'Yoga'];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await coachService.getMyCoachProfile();
      setProfile(response.profile);
      setBio(response.profile.bio || '');
      setSpecialties(response.profile.specialties || []);
      setExperienceYears((response.profile.experienceYears || 0).toString());
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load profile');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await coachService.updateCoachProfile({
        bio,
        specialties,
        experienceYears: parseInt(experienceYears)
      });
      Alert.alert('Success', 'Profile updated');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadProfilePicture = async () => {
    try {
      const image = await imageUploadService.pickImageFromGallery();
      if (image) {
        setProfilePicture(image);
        const formData = imageUploadService.createFormDataForImage(image, 'image');
        setSaving(true);
        const response = await coachService.uploadProfilePicture(formData);
        setProfile(prev => prev ? { ...prev, profilePicture: response.imageUrl } : null);
        Alert.alert('Success', 'Profile picture uploaded');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to upload image');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTransformation = async () => {
    if (!beforeImage || !afterImage || !transformDescription || !clientName || !transformResults) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      setTransformLoading(true);
      const formData = imageUploadService.createFormDataForTransformation(
        beforeImage,
        afterImage,
        transformDescription,
        clientName,
        transformResults
      );
      const response = await coachService.addTransformation(formData);
      setProfile(response.profile);
      setBeforeImage(null);
      setAfterImage(null);
      setTransformDescription('');
      setClientName('');
      setTransformResults('');
      setShowAddTransformationModal(false);
      Alert.alert('Success', 'Transformation added');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add transformation');
    } finally {
      setTransformLoading(false);
    }
  };

  const handleDeleteTransformation = async (transformId: string) => {
    Alert.alert('Delete Transformation', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await coachService.deleteTransformation(transformId);
            setProfile(prev => prev ? {
              ...prev,
              transformations: (prev.transformations || []).filter(t => t.id !== transformId)
            } : null);
            Alert.alert('Success', 'Transformation deleted');
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete');
          }
        },
        style: 'destructive'
      }
    ]);
  };

  const handleAddCertification = async () => {
    if (!certName || !certIssuer || !certYear) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      setCertLoading(true);
      const formData = imageUploadService.createFormDataForCertification(
        certName,
        certIssuer,
        parseInt(certYear),
        certImage || undefined
      );
      const response = await coachService.addCertification(formData);
      setProfile(response.profile);
      setCertName('');
      setCertIssuer('');
      setCertYear(new Date().getFullYear().toString());
      setCertImage(null);
      setShowAddCertificationModal(false);
      Alert.alert('Success', 'Certification added');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add certification');
    } finally {
      setCertLoading(false);
    }
  };

  const handleDeleteCertification = async (certId: string) => {
    Alert.alert('Delete Certification', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await coachService.deleteCertification(certId);
            setProfile(prev => prev ? {
              ...prev,
              certifications: (prev.certifications || []).filter(c => c.id !== certId)
            } : null);
            Alert.alert('Success', 'Certification deleted');
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete');
          }
        },
        style: 'destructive'
      }
    ]);
  };

  if (loading) {
    return (
      <View style={tw`flex-1 items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <ActivityIndicator
          size="large"
          color={isDark ? '#3b82f6' : '#ff6a00'}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between px-4 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={isDark ? '#ffffff' : '#000000'}
          />
        </TouchableOpacity>
        <Text style={tw`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          My Coach Profile
        </Text>
        <TouchableOpacity
          onPress={handleSaveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator
              size="small"
              color={isDark ? '#3b82f6' : '#ff6a00'}
            />
          ) : (
            <MaterialIcons
              name="check"
              size={24}
              color={isDark ? '#3b82f6' : '#ff6a00'}
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={tw`px-4 pb-8`}>
        {/* Profile Picture */}
        <View style={tw`mt-6 items-center mb-6`}>
          <View style={tw`w-20 h-20 rounded-full bg-gray-300 overflow-hidden mb-4`}>
            {profile?.profilePicture ? (
              <Image
                source={{ uri: profile.profilePicture }}
                style={tw`w-full h-full`}
              />
            ) : (
              <View style={tw`w-full h-full items-center justify-center bg-gray-400`}>
                <MaterialIcons name="person" size={32} color="white" />
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={handleUploadProfilePicture}
            style={tw`px-4 py-2 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-orange-500'}`}
          >
            <Text style={tw`text-white font-semibold`}>Upload Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Bio */}
        <View style={tw`mb-6`}>
          <Text style={tw`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
            Bio
          </Text>
          <TextInput
            style={tw`p-3 rounded-lg ${
              isDark
                ? 'bg-gray-800 text-white border-gray-700'
                : 'bg-gray-100 text-gray-900 border-gray-300'
            } border h-24 text-base`}
            placeholder="Tell clients about yourself..."
            placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
            multiline
            value={bio}
            onChangeText={setBio}
          />
        </View>

        {/* Specialties */}
        <View style={tw`mb-6`}>
          <Text style={tw`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
            Specialties
          </Text>
          <View style={tw`flex-row flex-wrap gap-2`}>
            {specialtyOptions.map(specialty => (
              <TouchableOpacity
                key={specialty}
                onPress={() => setSpecialties(prev =>
                  prev.includes(specialty)
                    ? prev.filter(s => s !== specialty)
                    : [...prev, specialty]
                )}
                style={tw`px-4 py-2 rounded-lg ${
                  specialties.includes(specialty)
                    ? isDark ? 'bg-blue-600' : 'bg-orange-500'
                    : isDark ? 'bg-gray-800' : 'bg-gray-200'
                }`}
              >
                <Text style={tw`text-sm font-semibold ${
                  specialties.includes(specialty) ? 'text-white' : isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  {specialty}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Experience Years */}
        <View style={tw`mb-6`}>
          <Text style={tw`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
            Years of Experience
          </Text>
          <TextInput
            style={tw`p-3 rounded-lg ${
              isDark
                ? 'bg-gray-800 text-white border-gray-700'
                : 'bg-gray-100 text-gray-900 border-gray-300'
            } border text-base`}
            placeholder="0"
            placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
            keyboardType="number-pad"
            value={experienceYears}
            onChangeText={setExperienceYears}
          />
        </View>

        {/* Transformations */}
        <View style={tw`mb-6`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={tw`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Transformations ({profile?.transformations?.length || 0})
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddTransformationModal(true)}
              style={tw`px-3 py-1 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-orange-500'}`}
            >
              <Text style={tw`text-white text-sm font-semibold`}>Add</Text>
            </TouchableOpacity>
          </View>
          {profile?.transformations && profile.transformations.length > 0 && (
            <TransformationCarousel
              transformations={profile.transformations}
              onDelete={handleDeleteTransformation}
              editable
            />
          )}
        </View>

        {/* Certifications */}
        <View style={tw`mb-6`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={tw`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Certifications ({profile?.certifications?.length || 0})
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddCertificationModal(true)}
              style={tw`px-3 py-1 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-orange-500'}`}
            >
              <Text style={tw`text-white text-sm font-semibold`}>Add</Text>
            </TouchableOpacity>
          </View>
          {profile?.certifications && profile.certifications.map(cert => (
            <CertificationBadge
              key={cert.id}
              certification={cert}
              onDelete={handleDeleteCertification}
              editable
            />
          ))}
        </View>
      </ScrollView>

      {/* Add Transformation Modal */}
      <Modal
        visible={showAddTransformationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddTransformationModal(false)}
      >
        <View style={tw`flex-1 justify-end bg-black bg-opacity-50`}>
          <View style={tw`rounded-t-3xl p-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <TouchableOpacity
              onPress={() => setShowAddTransformationModal(false)}
              style={tw`mb-4`}
            >
              <MaterialIcons
                name="close"
                size={24}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
            </TouchableOpacity>

            <Text style={tw`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              Add Transformation
            </Text>

            <ScrollView style={tw`max-h-96`}>
              {/* Before Image */}
              <TouchableOpacity
                onPress={async () => {
                  const image = await imageUploadService.pickImageFromGallery();
                  if (image) setBeforeImage(image);
                }}
                style={tw`p-4 mb-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} items-center`}
              >
                {beforeImage ? (
                  <Image source={{ uri: beforeImage.uri }} style={tw`w-20 h-20 rounded`} />
                ) : (
                  <>
                    <MaterialIcons name="image" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
                    <Text style={tw`text-sm mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Before Image
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* After Image */}
              <TouchableOpacity
                onPress={async () => {
                  const image = await imageUploadService.pickImageFromGallery();
                  if (image) setAfterImage(image);
                }}
                style={tw`p-4 mb-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} items-center`}
              >
                {afterImage ? (
                  <Image source={{ uri: afterImage.uri }} style={tw`w-20 h-20 rounded`} />
                ) : (
                  <>
                    <MaterialIcons name="image" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
                    <Text style={tw`text-sm mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      After Image
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Client Name */}
              <TextInput
                style={tw`p-3 rounded-lg ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-100 text-gray-900'} border mb-3`}
                placeholder="Client First Name"
                placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
                value={clientName}
                onChangeText={setClientName}
              />

              {/* Description */}
              <TextInput
                style={tw`p-3 rounded-lg ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-100 text-gray-900'} border h-20 mb-3`}
                placeholder="Describe the transformation..."
                placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
                multiline
                value={transformDescription}
                onChangeText={setTransformDescription}
              />

              {/* Results */}
              <TextInput
                style={tw`p-3 rounded-lg ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-100 text-gray-900'} border h-16`}
                placeholder="Results achieved..."
                placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
                multiline
                value={transformResults}
                onChangeText={setTransformResults}
              />

              {/* Add Button */}
              <TouchableOpacity
                onPress={handleAddTransformation}
                disabled={transformLoading}
                style={tw`mt-4 py-3 px-4 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-orange-500'}`}
              >
                {transformLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={tw`text-center text-white font-semibold`}>Add Transformation</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Certification Modal */}
      <Modal
        visible={showAddCertificationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddCertificationModal(false)}
      >
        <View style={tw`flex-1 justify-end bg-black bg-opacity-50`}>
          <View style={tw`rounded-t-3xl p-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <TouchableOpacity
              onPress={() => setShowAddCertificationModal(false)}
              style={tw`mb-4`}
            >
              <MaterialIcons
                name="close"
                size={24}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
            </TouchableOpacity>

            <Text style={tw`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              Add Certification
            </Text>

            <ScrollView style={tw`max-h-80`}>
              {/* Name */}
              <TextInput
                style={tw`p-3 rounded-lg ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-100 text-gray-900'} border mb-3`}
                placeholder="Certification Name"
                placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
                value={certName}
                onChangeText={setCertName}
              />

              {/* Issuer */}
              <TextInput
                style={tw`p-3 rounded-lg ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-100 text-gray-900'} border mb-3`}
                placeholder="Issuing Organization"
                placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
                value={certIssuer}
                onChangeText={setCertIssuer}
              />

              {/* Year */}
              <TextInput
                style={tw`p-3 rounded-lg ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-100 text-gray-900'} border mb-3`}
                placeholder="Year"
                placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
                keyboardType="number-pad"
                value={certYear}
                onChangeText={setCertYear}
              />

              {/* Cert Image */}
              <TouchableOpacity
                onPress={async () => {
                  const image = await imageUploadService.pickImageFromGallery();
                  if (image) setCertImage(image);
                }}
                style={tw`p-4 mb-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} items-center`}
              >
                {certImage ? (
                  <Image source={{ uri: certImage.uri }} style={tw`w-20 h-20 rounded`} />
                ) : (
                  <>
                    <MaterialIcons name="image" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
                    <Text style={tw`text-sm mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Certificate Image (Optional)
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Add Button */}
              <TouchableOpacity
                onPress={handleAddCertification}
                disabled={certLoading}
                style={tw`py-3 px-4 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-orange-500'}`}
              >
                {certLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={tw`text-center text-white font-semibold`}>Add Certification</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
