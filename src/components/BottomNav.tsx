import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';

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
  return (
    <View style={[tw`flex-row items-center justify-around px-2 py-3 bg-white dark:bg-background-dark border-t border-slate-200 dark:border-slate-800 absolute bottom-0 left-0 right-0 z-20`, containerStyle]}>
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onSelect(item.id)}
            style={tw`flex flex-col items-center gap-1 group transition-colors`}
          >
            <MaterialIcons
              name={item.icon}
              size={24}
              color={isActive ? tw.color('primary') : tw.color('slate-400')}
              style={tw`group-hover:text-primary transition-colors`}
            />
            <Text
              style={tw`text-[10px] font-bold uppercase tracking-tight ${
                isActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary'
              }`}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
