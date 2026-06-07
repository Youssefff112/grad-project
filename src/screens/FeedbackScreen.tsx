import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/Button';

export const FeedbackScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const [feedback, setFeedback] = useState('');

  const bg = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

  const handleSend = () => {
    if (!feedback.trim()) return;
    Alert.alert('Feedback Sent', 'Thank you for your feedback! We review every submission.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={tw`flex-1`}>
        <View style={[tw`flex-row items-center p-4 justify-between`, { borderBottomWidth: 1, borderColor }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-12 items-center justify-center`}>
            <MaterialIcons name="arrow-back" size={24} color={accent} />
          </TouchableOpacity>
          <Text style={[tw`text-lg font-bold tracking-tight flex-1 text-center`, { color: textPrimary }]}>Send Feedback</Text>
          <View style={tw`w-12`} />
        </View>
        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-4 pb-12 gap-6`}>
          <View style={[tw`p-5 rounded-2xl items-center gap-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
            <MaterialIcons name="rate-review" size={40} color={accent} />
            <Text style={[tw`text-lg font-bold text-center`, { color: textPrimary }]}>We value your thoughts!</Text>
            <Text style={[tw`text-sm text-center`, { color: textSecondary }]}>
              Found a bug? Have a feature request? Let us know how we can make Vertex better for you.
            </Text>
          </View>

          <View style={tw`gap-2`}>
            <Text style={[tw`text-sm font-bold ml-1`, { color: textPrimary }]}>Your Feedback</Text>
            <TextInput
              style={[
                tw`p-4 rounded-2xl text-base`,
                { backgroundColor: cardBg, borderWidth: 1, borderColor, color: textPrimary, minHeight: 150 },
              ]}
              placeholder="Type your message here..."
              placeholderTextColor={textSecondary}
              multiline
              textAlignVertical="top"
              value={feedback}
              onChangeText={setFeedback}
            />
          </View>

          <Button title="Submit Feedback" onPress={handleSend} disabled={!feedback.trim()} size="lg" style={tw`mt-4`} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
