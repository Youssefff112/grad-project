import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';

interface DismissKeyboardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Layout shell only — do not wrap the app in TouchableWithoutFeedback here.
 * That pattern steals the touch responder and intermittently freezes ScrollViews.
 * Screens dismiss the keyboard via keyboardDismissMode="on-drag" on scrollables.
 */
export const DismissKeyboard: React.FC<DismissKeyboardProps> = ({ children, style }) => (
  <View style={[{ flex: 1 }, style]} collapsable={false}>
    {children}
  </View>
);
