import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';

interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
  stepText?: string;
  containerStyle?: ViewStyle | Record<string, any>[];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  stepText,
  containerStyle,
}) => {
  const { accent } = useTheme();

  return (
    <View style={[tw`flex flex-col gap-3 p-6 pt-2`, containerStyle]}>
      {(label || stepText) && (
        <View style={tw`flex-row gap-6 justify-between items-end`}>
          {label && (
            <View style={tw`flex-col`}>
              <Text style={[tw`text-xs font-bold uppercase tracking-widest`, { color: accent }]}>
                Apex AI
              </Text>
              <Text style={tw`text-slate-900 dark:text-slate-100 text-base font-medium leading-normal`}>
                {label}
              </Text>
            </View>
          )}
          {stepText && (
            <Text style={tw`text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal`}>
              {stepText}
            </Text>
          )}
        </View>
      )}
      <View style={tw`rounded-full bg-slate-100 dark:bg-slate-800 h-2 w-full overflow-hidden`}>
        <View
          style={[
            tw`h-full rounded-full`,
            {
              width: `${Math.max(0, Math.min(100, progress))}%`,
              backgroundColor: accent,
              shadowColor: accent,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
            },
          ]}
        />
      </View>
    </View>
  );
};
