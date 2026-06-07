import React, { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { buildImageUrl, normalizeProfilePicturePath } from '../utils/imageUrl';

type ProfileAvatarProps = {
  profilePicture?: string | null | undefined;
  /** Alias for profilePicture — kept for older call sites */
  url?: string | null | undefined;
  localUri?: string | null;
  size?: number;
  accent?: string;
  isDark?: boolean;
  uploading?: boolean;
  style?: ViewStyle;
};

/**
 * Shows local preview while uploading, then server path via buildImageUrl.
 * Falls back to the person icon when missing, invalid, or the image fails to load.
 */
export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  profilePicture,
  url,
  localUri,
  size = 96,
  accent,
  isDark,
  uploading = false,
  style,
}) => {
  const { accent: themeAccent, isDark: themeIsDark } = useTheme();
  const accentColor = accent ?? themeAccent;
  const darkMode = isDark ?? themeIsDark;
  const storedPath = normalizeProfilePicturePath(profilePicture ?? url);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [storedPath, localUri]);

  const uri = !imageFailed && (localUri || buildImageUrl(storedPath));
  const iconSize = Math.round(size * 0.5);

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: uri ? 'transparent' : accentColor + '20',
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <MaterialIcons name="person" size={iconSize} color={accentColor} />
      )}
      {uploading && (
        <View
          style={[
            tw`absolute inset-0 items-center justify-center`,
            { backgroundColor: darkMode ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.65)' },
          ]}
        >
          <ActivityIndicator color={accentColor} />
        </View>
      )}
    </View>
  );
};
