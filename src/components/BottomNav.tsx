import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';

interface NavItem {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}

interface BottomNavProps {
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  containerStyle?: ViewStyle | Record<string, any>[];
}

export const BottomNav: React.FC<BottomNavProps> = ({
  items,
  activeId,
  onSelect,
  containerStyle,
}) => {
  const { isDark, accent } = useTheme();

  return (
    <View style={[tw`flex-row items-center justify-around px-2 py-3 ${isDark ? 'bg-background-dark border-slate-800' : 'bg-white border-slate-200'} border-t absolute bottom-0 left-0 right-0 z-20`, containerStyle]}>
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onSelect(item.id)}
            style={tw`flex flex-col items-center gap-1`}
          >
            <MaterialIcons
              name={item.icon}
              size={24}
              color={isActive ? accent : '#94a3b8'}
            />
            <Text
              style={[
                tw`text-[10px] font-bold uppercase tracking-tight`,
                { color: isActive ? accent : '#94a3b8' },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
