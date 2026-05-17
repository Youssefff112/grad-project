/**
 * Image Upload Service
 * Handles image picking and uploading to backend
 */

import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export interface PickedImage {
  uri: string;
  type: string;
  name: string;
}

/**
 * Request camera and gallery permissions
 */
export const requestPermissions = async () => {
  if (Platform.OS !== 'web') {
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus.status !== 'granted' || galleryStatus.status !== 'granted') {
      return false;
    }
  }
  return true;
};

/**
 * Pick image from gallery
 */
export const pickImageFromGallery = async (): Promise<PickedImage | null> => {
  try {
    const hasPermission = await requestPermissions();
    if (!hasPermission && Platform.OS !== 'web') {
      throw new Error('Camera/Gallery permission denied');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const name = asset.fileName || `image-${Date.now()}.jpg`;
      return {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name,
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
    const hasPermission = await requestPermissions();
    if (!hasPermission && Platform.OS !== 'web') {
      throw new Error('Camera permission denied');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const name = asset.fileName || `camera-${Date.now()}.jpg`;
      return {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name,
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
