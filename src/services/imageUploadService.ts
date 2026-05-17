/**
 * Image Upload Service
 * Handles image picking and uploading to backend
 */

import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';

export interface PickedImage {
  uri: string;
  type: string;
  name: string;
}

const hasMediaLibraryAccess = (
  status: ImagePicker.MediaLibraryPermissionResponse,
) => status.granted || status.accessPrivileges === 'limited';

const promptOpenSettings = (title: string, message: string) => {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Open Settings', onPress: () => Linking.openSettings() },
  ]);
};

/** Request photo-library access only (for picking from gallery). */
export const requestGalleryPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return true;

  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (hasMediaLibraryAccess(current)) return true;

  const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return hasMediaLibraryAccess(result);
};

/** Request camera access only (for taking a photo). */
export const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return true;

  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) return true;

  const result = await ImagePicker.requestCameraPermissionsAsync();
  return result.granted;
};

/** Request both camera and gallery (legacy helper). */
export const requestPermissions = async () => {
  const [camera, gallery] = await Promise.all([
    requestCameraPermission(),
    requestGalleryPermission(),
  ]);
  return camera && gallery;
};

/**
 * Pick image from gallery
 */
export const pickImageFromGallery = async (): Promise<PickedImage | null> => {
  try {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      promptOpenSettings(
        'Photos access required',
        'Allow photo library access to choose an image.',
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        type: 'image/jpeg',
        name: `image-${Date.now()}.jpg`,
      };
    }

    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};

/**
 * Take photo with camera
 */
export const takePhotoWithCamera = async (): Promise<PickedImage | null> => {
  try {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      promptOpenSettings(
        'Camera access required',
        'Allow camera access to take a photo.',
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        type: 'image/jpeg',
        name: `camera-${Date.now()}.jpg`,
      };
    }

    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
};

/**
 * Show an Alert asking the user to choose Camera or Gallery,
 * then return the picked image (or null if cancelled).
 */
export const pickImageWithChoice = (): Promise<PickedImage | null> => {
  return new Promise((resolve) => {
    Alert.alert(
      'Change Photo',
      'Choose a source',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            try { resolve(await takePhotoWithCamera()); }
            catch { resolve(null); }
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            try { resolve(await pickImageFromGallery()); }
            catch { resolve(null); }
          },
        },
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
      ],
    );
  });
};

/**
 * Create FormData from picked image
 */
export const createFormDataForImage = (image: PickedImage, fieldName: string = 'image'): FormData => {
  const formData = new FormData();

  formData.append(fieldName, {
    uri: image.uri,
    type: image.type,
    name: image.name,
  } as any);

  return formData;
};

/**
 * Create FormData for before/after images
 */
export const createFormDataForTransformation = (
  beforeImage: PickedImage,
  afterImage: PickedImage,
  description: string,
  clientName: string,
  results: string
): FormData => {
  const formData = new FormData();

  formData.append('beforeImage', {
    uri: beforeImage.uri,
    type: beforeImage.type,
    name: beforeImage.name,
  } as any);

  formData.append('afterImage', {
    uri: afterImage.uri,
    type: afterImage.type,
    name: afterImage.name,
  } as any);

  formData.append('description', description);
  formData.append('clientName', clientName);
  formData.append('results', results);

  return formData;
};

/**
 * Create FormData for certification
 */
export const createFormDataForCertification = (
  name: string,
  issuer: string,
  year: number,
  image?: PickedImage
): FormData => {
  const formData = new FormData();

  formData.append('name', name);
  formData.append('issuer', issuer);
  formData.append('year', year.toString());

  if (image) {
    formData.append('image', {
      uri: image.uri,
      type: image.type,
      name: image.name,
    } as any);
  }

  return formData;
};
