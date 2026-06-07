import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';

export const TermsScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center p-4 justify-between`, { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-12 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold tracking-tight flex-1 text-center`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>Terms of Service</Text>
        <View style={tw`w-12`} />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" style={tw`flex-1`} contentContainerStyle={tw`p-6 pb-12 gap-4`}>
        <Text style={[tw`text-base leading-6`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          These Terms of Service ("Terms") govern your access to and use of Vertex's website, products, and services. By using Vertex, you agree to be bound by these Terms.
        </Text>
        <Text style={[tw`text-base font-bold mt-2`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>1. Use of the App</Text>
        <Text style={[tw`text-base leading-6`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          You must follow any policies made available to you within the Services. Do not misuse our Services or try to access them using a method other than the interface and the instructions that we provide.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};
