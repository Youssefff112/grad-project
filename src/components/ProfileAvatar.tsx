import React from 'react';
import { View, Image, ActivityIndicator, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { buildImageUrl } from '../utils/imageUrl';

type ProfileAvatarProps = {
  profilePicture: string | null | undefined;
  localUri?: string | null;
  size?: number;
  accent: string;
  isDark?: boolean;
  uploading?: boolean;
  style?: ViewStyle;
};

/**
 * Shows local preview while uploading, then server path via buildImageUrl.
 */
export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  profilePicture,
  localUri,
  size = 96,
  accent,
  isDark = true,
  uploading = false,
  style,
}) => {
  const uri = localUri || buildImageUrl(profilePicture);
  const iconSize = Math.round(size * 0.5);

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: accent,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: accent + '20',
        },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <MaterialIcons name="person" size={iconSize} color={accent} />
      )}
      {uploading && (
        <View
          style={[
            tw`absolute inset-0 items-center justify-center`,
            { backgroundColor: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.65)' },
          ]}
        >
          <ActivityIndicator color={accent} />
        </View>
      )}
    </View>
  );
};
