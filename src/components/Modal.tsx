import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ModalProps,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Button } from './Button';

interface ModalDialogProps extends Omit<ModalProps, 'visible'> {
  visible: boolean;
  title?: string;
  message?: string;
  children?: React.ReactNode;
  onClose: () => void;
  primaryAction?: {
    label: string;
    onPress: () => void;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  type?: 'default' | 'confirmation' | 'alert' | 'success';
}

export const ModalDialog: React.FC<ModalDialogProps> = ({
  visible,
  title,
  message,
  children,
  onClose,
  primaryAction,
  secondaryAction,
  type = 'default',
  ...props
}) => {
  const { isDark, accent } = useTheme();

  const bgColor = isDark ? '#0a0a12' : '#f8f7f5';
  const modalBg = isDark ? '#111128' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const subtextColor = isDark ? '#94a3b8' : '#64748b';

  const getIcon = () => {
    switch (type) {
      case 'confirmation':
        return { name: 'help', color: accent };
      case 'alert':
        return { name: 'warning', color: '#facc15' };
      case 'success':
        return { name: 'check-circle', color: '#4ade80' };
      default:
        return null;
    }
  };

  const icon = getIcon();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      {...props}
    >
      <View
        style={[
          tw`flex-1 items-center justify-center px-6`,
          { backgroundColor: 'rgba(0,0,0,0.5)' },
        ]}
      >
        <View
          style={[
            tw`w-full rounded-2xl overflow-hidden`,
            {
              backgroundColor: modalBg,
              maxWidth: 500,
            },
          ]}
        >
          {/* Header with close button */}
          <View
            style={[
              tw`flex-row items-center justify-between p-4 border-b`,
              { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
            ]}
          >
            <Text
              style={[
                tw`text-lg font-bold flex-1`,
                { color: textColor },
              ]}
            >
              {title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={tw`ml-2 p-2`}
            >
              <MaterialIcons name="close" size={24} color={subtextColor} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={tw`max-h-80`}
            contentContainerStyle={tw`p-6`}
          >
            {/* Icon if type-based */}
            {icon && (
              <View style={tw`items-center mb-4`}>
                <MaterialIcons
                  name={icon.name as any}
                  size={48}
                  color={icon.color}
                />
              </View>
            )}

            {/* Message */}
            {message && (
              <Text
                style={[
                  tw`text-base leading-relaxed mb-4 text-center`,
                  { color: subtextColor },
                ]}
              >
                {message}
              </Text>
            )}

            {/* Custom children */}
            {children}
          </ScrollView>

          {/* Actions */}
          {(primaryAction || secondaryAction) && (
            <View
              style={[
                tw`flex-row gap-3 p-4 border-t`,
                { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
              ]}
            >
              {secondaryAction && (
                <TouchableOpacity
                  onPress={secondaryAction.onPress}
                  style={tw`flex-1`}
                >
                  <Button
                    title={secondaryAction.label}
                    variant="secondary"
                    size="md"
                  />
                </TouchableOpacity>
              )}
              {primaryAction && (
                <TouchableOpacity
                  onPress={primaryAction.onPress}
                  disabled={primaryAction.loading}
                  style={tw`flex-1`}
                >
                  <Button
                    title={primaryAction.loading ? 'Loading...' : primaryAction.label}
                    size="md"
                    disabled={primaryAction.loading}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};
