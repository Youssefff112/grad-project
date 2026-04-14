import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: string;
  delivered?: boolean;
  read?: boolean;
}

const MOCK_MESSAGES: Message[] = [
  { id: '1', text: "Good morning! Ready for today's session?", sender: 'other', timestamp: '9:00 AM', read: true },
  { id: '2', text: "Yes! What's the plan?", sender: 'user', timestamp: '9:01 AM', delivered: true, read: true },
  {
    id: '3',
    text: "Today is Push Day - Bench Press, OHP, and accessories. Based on your last session, I've increased your working weight by 2.5kg.",
    sender: 'other',
    timestamp: '9:01 AM',
    read: true,
  },
  { id: '4', text: 'Sounds good! Let me get warmed up.', sender: 'user', timestamp: '9:05 AM', delivered: true, read: true },
  { id: '5', text: 'Perfect! Remember to focus on form over weight today.', sender: 'other', timestamp: '9:05 AM', read: true },
];
    id: '4',
    text: "Sounds good, let's go",
    sent: true,
    timestamp: '9:02 AM',
    delivered: true,
    read: true,
  },
  {
    id: '5',
    text: 'Remember to focus on controlled eccentric phase. Your tempo was slightly fast last session.',
    sent: false,
    timestamp: '9:02 AM',
    read: true,
  },
];

const QUICK_REPLIES = ['Got it! 💪', 'Thanks for the tip', 'Ready to go', "I'll focus on form", 'What about nutrition?'];

export const ChatScreen = ({ navigation, route }: any) => {
  const { conversationName = 'Chat' } = route.params || {};
  const { isDark, accent } = useTheme();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

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
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      delivered: true,
      read: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    // Simulate AI response
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        text: "That's great! Keep up the excellent work. Your consistency will pay off.",
        sender: 'other',
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        read: false,
      };
      setMessages((prev) => [...prev, response]);
    }, 1500);
  };

  const handleQuickReply = (reply: string) => {
    setInputText(reply);
    setTimeout(() => handleSend(), 300);
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
    const isSent = message.sender === 'user';

    return (
      <TouchableOpacity
        key={message.id}
        delayLongPress={300}
        style={[
          tw`mb-3 flex-row max-w-[85%]`,
          isSent ? tw`self-end` : tw`self-start`,
          isSent && tw`flex-row-reverse`,
        ]}
      >
        <View
          style={[
            tw`px-4 py-3 rounded-2xl`,
            {
              backgroundColor: isSent ? accent : receivedBubble,
              borderWidth: isSent ? 0 : 1,
              borderColor: isSent ? 'transparent' : borderColor,
            },
            isSent ? tw`rounded-br-none` : tw`rounded-bl-none`,
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
          <View style={[tw`flex-row items-center gap-1 mt-1 justify-end`]}>
            <Text style={{ color: isSent ? 'rgba(255,255,255,0.7)' : secondaryText, fontSize: 11 }}>
              {message.timestamp}
            </Text>
            {isSent && (
              <MaterialIcons
                name={message.read ? 'done-all' : 'done'}
                size={14}
                color={message.read ? '#4ade80' : 'rgba(255,255,255,0.7)'}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View
        style={[
          tw`flex-row items-center px-4 py-3 justify-between`,
          {
            backgroundColor: bgColor,
            borderBottomWidth: 1,
            borderColor: borderColor,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={primaryText} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold flex-1 ml-4`, { color: primaryText }]}>
          {conversationName}
        </Text>
        <TouchableOpacity onPress={showChatOptions}>
          <MaterialIcons name="more-vert" size={24} color={primaryText} />
        </TouchableOpacity>
      </View>
        <View style={tw`flex-row items-center gap-3 flex-1`}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={accent} />
          </TouchableOpacity>

          <View style={tw`flex-1 flex-row items-center gap-2`}>
            <View
              style={[
                tw`h-10 w-10 rounded-full items-center justify-center`,
                { backgroundColor: accent + '20' },
              ]}
            >
              <MaterialIcons name={isAI ? 'smart-toy' : 'person'} size={22} color={accent} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={{ color: primaryText, fontSize: 16, fontWeight: '700' }}>
                {chatName}
              </Text>
              <Text style={{ color: secondaryText, fontSize: 11 }}>
                {isAI ? 'Online' : 'Active now'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={() => showChatOptions()} style={tw`p-2`}>
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
          contentContainerStyle={tw`px-4 py-4 pb-2`}
          showsVerticalScrollIndicator={false}
        >
          {/* Date separator */}
          <View style={tw`items-center mb-4`}>
            <View
              style={[
                tw`px-3 py-1.5 rounded-full`,
                { backgroundColor: isDark ? '#1a1a2e' : '#e2e8f0' },
              ]}
            >
              <Text style={{ color: secondaryText, fontSize: 11, fontWeight: '600' }}>
                Today
              </Text>
            </View>
          </View>

          {messages.map(renderMessage)}

          {/* Typing indicator */}
          {isTyping && (
            <View style={[tw`flex-row items-center gap-1 mb-3`, tw`self-start`]}>
              <View
                style={[
                  tw`px-4 py-3 rounded-2xl rounded-bl-none flex-row items-center gap-1`,
                  { backgroundColor: receivedBubble, borderWidth: 1, borderColor: borderColor },
                ]}
              >
                <View
                  style={[
                    tw`h-2 w-2 rounded-full`,
                    { backgroundColor: secondaryText },
                  ]}
                />
                <View
                  style={[
                    tw`h-2 w-2 rounded-full ml-1`,
                    { backgroundColor: secondaryText },
                  ]}
                />
                <View
                  style={[
                    tw`h-2 w-2 rounded-full ml-1`,
                    { backgroundColor: secondaryText },
                  ]}
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Replies */}
        {!isTyping && inputText === '' && (
          <View style={[tw`px-4 py-2`, { borderTopWidth: 1, borderColor: borderColor }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-2`}>
              {QUICK_REPLIES.map((reply, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleQuickReply(reply)}
                  style={[
                    tw`px-3 py-2 rounded-full`,
                    { backgroundColor: accent + '20' },
                  ]}
                >
                  <Text style={[tw`text-sm font-bold`, { color: accent }]}>{reply}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Bar */}
        <View
          style={[
            tw`flex-row items-end px-3 py-3 gap-2`,
            {
              backgroundColor: bgColor,
              borderTopWidth: 1,
              borderColor: borderColor,
            },
          ]}
        >
          <TouchableOpacity
            style={tw`h-10 w-10 rounded-full items-center justify-center`}
            onPress={() => Alert.alert('Attachments', 'Photo, Video, File options coming soon')}
          >
            <MaterialIcons name="add-circle-outline" size={24} color={accent} />
          </TouchableOpacity>

          <View
            style={[
              tw`flex-1 flex-row items-center rounded-full px-4 py-2`,
              {
                backgroundColor: inputBg,
                borderWidth: 1,
                borderColor: borderColor,
                minHeight: 40,
                maxHeight: 100,
              },
            ]}
          >
            <TextInput
              style={[
                tw`flex-1 text-sm`,
                {
                  color: primaryText,
                  paddingVertical: 8,
                },
              ]}
              placeholder="Type a message..."
              placeholderTextColor={secondaryText}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
          </View>

          <TouchableOpacity
            onPress={handleSend}
            style={[
              tw`h-10 w-10 rounded-full items-center justify-center`,
              {
                backgroundColor: inputText.trim() ? accent : isDark ? '#1a1a2e' : '#e2e8f0',
              },
            ]}
            disabled={!inputText.trim()}
          >
            <MaterialIcons
              name={inputText.trim() ? 'send' : 'mic'}
              size={20}
              color={inputText.trim() ? '#ffffff' : secondaryText}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
