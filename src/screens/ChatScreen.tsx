import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';

interface Message {
  id: string;
  text: string;
  sent: boolean;
  timestamp: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: "Good morning! Ready for today's session?",
    sent: false,
    timestamp: '9:00 AM',
  },
  {
    id: '2',
    text: "Yes! What's the plan?",
    sent: true,
    timestamp: '9:01 AM',
  },
  {
    id: '3',
    text: "Today is Push Day - Bench Press, OHP, and accessories. Based on your last session, I've increased your working weight by 2.5kg.",
    sent: false,
    timestamp: '9:01 AM',
  },
  {
    id: '4',
    text: "Sounds good, let's go",
    sent: true,
    timestamp: '9:02 AM',
  },
  {
    id: '5',
    text: 'Remember to focus on controlled eccentric phase. Your tempo was slightly fast last session.',
    sent: false,
    timestamp: '9:02 AM',
  },
];

export const ChatScreen = ({ navigation, route }: any) => {
  const { chatName, isAI } = route.params as { chatName: string; isAI: boolean };
  const { isDark, accent } = useTheme();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const bgColor = isDark ? '#0a0a12' : '#f8f7f5';
  const receivedBubble = isDark ? '#111128' : '#ffffff';
  const primaryText = isDark ? '#f1f5f9' : '#1e293b';
  const secondaryText = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const inputBg = isDark ? '#111128' : '#ffffff';

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sent: true,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const showMessageOptions = (message: Message) => {
    const options = [
      { text: 'Copy', onPress: () => handleCopy(message.text) },
      ...(message.sent ? [{ text: 'Edit', onPress: () => handleEdit(message) }] : []),
      ...(message.sent ? [{ text: 'Delete', onPress: () => handleDelete(message.id) }] : []),
      { text: 'Reply', onPress: () => handleReply(message) },
      { text: 'Cancel', onPress: () => {}, style: 'cancel' as const },
    ];

    Alert.alert('Message Options', '', options);
  };

  const handleCopy = (text: string) => {
    Alert.alert('Copied', 'Message copied to clipboard');
  };

  const handleEdit = (message: Message) => {
    setInputText(message.text);
    setMessages((prev) => prev.filter((m) => m.id !== message.id));
    Alert.alert('Edit Mode', 'Editing message. Update and send when ready.');
  };

  const handleDelete = (messageId: string) => {
    Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: () => {
          setMessages((prev) => prev.filter((m) => m.id !== messageId));
        },
        style: 'destructive',
      },
    ]);
  };

  const handleReply = (message: Message) => {
    setInputText(`> ${message.text}\n\n`);
  };

  const showChatOptions = () => {
    Alert.alert('Chat Options', '', [
      { text: 'Clear Chat', onPress: () => handleClearChat(), style: 'destructive' },
      { text: 'Report Conversation', onPress: () => Alert.alert('Reported', 'Conversation reported for review.') },
      { text: 'Mute Notifications', onPress: () => Alert.alert('Muted', 'You will no longer receive notifications from this chat.') },
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
    ]);
  };

  const handleClearChat = () => {
    Alert.alert('Clear Chat', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Clear',
        onPress: () => {
          setMessages([]);
          Alert.alert('Success', 'Chat cleared.');
        },
        style: 'destructive',
      },
    ]);
  };

  const renderMessage = (message: Message) => {
    const isSent = message.sent;

    return (
      <TouchableOpacity
        key={message.id}
        onLongPress={() => showMessageOptions(message)}
        delayLongPress={300}
        style={[
          tw`mb-3 max-w-[80%]`,
          isSent ? tw`self-end` : tw`self-start`,
        ]}
      >
        {/* AI badge for received messages in AI chats */}
        {!isSent && isAI && (
          <View style={tw`flex-row items-center gap-1 mb-1`}>
            <MaterialIcons name="smart-toy" size={12} color={accent} />
            <Text style={{ color: accent, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
              AI COACH
            </Text>
          </View>
        )}

        <View
          style={[
            tw`px-4 py-3 rounded-2xl`,
            {
              backgroundColor: isSent ? accent : receivedBubble,
              borderWidth: isSent ? 0 : 1,
              borderColor: isSent ? 'transparent' : borderColor,
            },
            isSent
              ? tw`rounded-br-sm`
              : tw`rounded-bl-sm`,
          ]}
        >
          <Text
            style={{
              color: isSent ? '#ffffff' : primaryText,
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            {message.text}
          </Text>
        </View>

        <Text
          style={[
            tw`mt-1 text-xs`,
            { color: secondaryText },
            isSent ? tw`text-right` : tw`text-left`,
          ]}
        >
          {message.timestamp}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View
        style={[
          tw`flex-row items-center px-4 py-3`,
          {
            backgroundColor: bgColor,
            borderBottomWidth: 1,
            borderColor: borderColor,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`mr-3`}>
          <MaterialIcons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>

        <View style={tw`flex-1 flex-row items-center gap-2`}>
          <View
            style={[
              tw`h-10 w-10 rounded-full items-center justify-center`,
              { backgroundColor: accent + '20' },
            ]}
          >
            <MaterialIcons
              name={isAI ? 'smart-toy' : 'person'}
              size={22}
              color={accent}
            />
          </View>
          <View>
            <Text style={{ color: primaryText, fontSize: 16, fontWeight: '700' }}>
              {chatName}
            </Text>
            {isAI && (
              <View style={tw`flex-row items-center gap-1 mt-0.5`}>
                <View
                  style={[
                    tw`px-2 py-0.5 rounded-full`,
                    { backgroundColor: accent + '20' },
                  ]}
                >
                  <Text style={{ color: accent, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
                    AI
                  </Text>
                </View>
                <Text style={{ color: secondaryText, fontSize: 11 }}>Always available</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity onPress={() => showChatOptions()}>
          <MaterialIcons name="more-vert" size={24} color={secondaryText} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={tw`flex-1`}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={tw`flex-1`}
          contentContainerStyle={tw`px-4 py-4`}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {/* Date separator */}
          <View style={tw`items-center mb-4`}>
            <View
              style={[
                tw`px-3 py-1 rounded-full`,
                { backgroundColor: isDark ? '#1a1a2e' : '#e2e8f0' },
              ]}
            >
              <Text style={{ color: secondaryText, fontSize: 11, fontWeight: '600' }}>
                Today
              </Text>
            </View>
          </View>

          {messages.map(renderMessage)}
        </ScrollView>

        {/* Input Bar */}
        <View
          style={[
            tw`flex-row items-end px-4 py-3 gap-2`,
            {
              backgroundColor: bgColor,
              borderTopWidth: 1,
              borderColor: borderColor,
            },
          ]}
        >
          <View
            style={[
              tw`flex-1 flex-row items-end rounded-2xl px-4 py-2`,
              {
                backgroundColor: inputBg,
                borderWidth: 1,
                borderColor: borderColor,
                minHeight: 44,
                maxHeight: 120,
              },
            ]}
          >
            <TextInput
              style={[
                tw`flex-1 text-sm`,
                {
                  color: primaryText,
                  paddingTop: Platform.OS === 'ios' ? 8 : 4,
                  paddingBottom: Platform.OS === 'ios' ? 8 : 4,
                },
              ]}
              placeholder="Type a message..."
              placeholderTextColor={secondaryText}
              value={inputText}
              onChangeText={setInputText}
              multiline
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
          </View>

          <TouchableOpacity
            onPress={handleSend}
            style={[
              tw`h-11 w-11 rounded-full items-center justify-center`,
              {
                backgroundColor: inputText.trim() ? accent : isDark ? '#1a1a2e' : '#e2e8f0',
              },
            ]}
            disabled={!inputText.trim()}
          >
            <MaterialIcons
              name="send"
              size={20}
              color={inputText.trim() ? '#ffffff' : secondaryText}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
