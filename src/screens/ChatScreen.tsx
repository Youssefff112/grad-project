import React, { useState, useRef, useEffect, useCallback } from 'react';

import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { io, Socket } from 'socket.io-client';
import { environment } from '../config/environment';
import { getMessages, sendMessage, ChatMessage, normalizeChatMessage } from '../services/messaging.service';
import tokenManager from '../utils/tokenManager';

const QUICK_REPLIES = ['Got it! 💪', 'Thanks for the tip', 'Ready to go', "I'll focus on form", 'What about nutrition?'];

export const ChatScreen = ({ navigation, route }: any) => {
  const { conversationName = 'Chat', conversationId: routeConvId = null, receiverId: routeReceiverId = null } =
    route.params || {};
  const conversationIdFromRoute =
    routeConvId && routeConvId !== 'null' && routeConvId !== 'undefined' ? String(routeConvId) : null;
  const receiverId =
    routeReceiverId != null && routeReceiverId !== '' && !Number.isNaN(Number(routeReceiverId))
      ? Number(routeReceiverId)
      : null;
  const { isDark, accent } = useTheme();
  const { userId } = useUser();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(conversationIdFromRoute);
  const scrollViewRef = useRef<ScrollView>(null);
  const socketRef = useRef<Socket | null>(null);
  const activeConversationIdRef = useRef<string | null>(conversationIdFromRoute);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  // Opening a thread from Inbox updates params — keep local conversation id in sync
  useEffect(() => {
    if (conversationIdFromRoute) {
      setActiveConversationId(conversationIdFromRoute);
      activeConversationIdRef.current = conversationIdFromRoute;
    }
  }, [conversationIdFromRoute]);

  const reloadMessages = useCallback(async (convId: string): Promise<boolean> => {
    if (!convId || convId === 'undefined' || convId === 'null') return false;
    try {
      const res = await getMessages(convId);
      setMessages(res.messages || []);
      return true;
    } catch (e) {
      console.log('Chat: failed to load messages', e);
      return false;
    }
  }, []);

  // Refetch whenever this screen is focused and we have a thread id (fixes stale UI after backgrounding)
  useFocusEffect(
    useCallback(() => {
      const id = activeConversationIdRef.current;
      if (!id || id === 'undefined' || id === 'null') return;
      reloadMessages(id);
    }, [reloadMessages])
  );

  // Socket joins the user's room when auth context is ready (not only on first mount)
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const connect = async () => {
      const token = await tokenManager.getAccessToken();
      if (!token || cancelled) return;

      socketRef.current?.disconnect();
      const socket = io(environment.BACKEND_URL, {
        auth: { token },
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join_room', userId);
      });

      socket.on('new_message', (raw: unknown) => {
        const msg = normalizeChatMessage(raw);
        const currentConv = activeConversationIdRef.current;
        if (!msg.conversationId || !currentConv || msg.conversationId !== currentConv) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      });
    };

    connect();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

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

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const textPayload = inputText.trim();
    if (!activeConversationId && (!receiverId || receiverId <= 0)) {
      Alert.alert(
        'Cannot send',
        'This conversation is not linked to a client or coach. Use Message from a client profile, your coach card, or start a new thread from Messages.'
      );
      return;
    }

    setInputText('');

    try {
      const msg = await sendMessage(activeConversationId, receiverId, textPayload);
      const convId = String(msg.conversationId);
      setActiveConversationId(convId);
      activeConversationIdRef.current = convId;
      const loaded = await reloadMessages(convId);
      if (!loaded) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      }
    } catch (error: any) {
      setInputText(textPayload);
      const serverMsg = error?.response?.data?.message || error?.message || 'Failed to send message.';
      console.error('Failed to send message:', error);
      Alert.alert('Cannot send message', serverMsg);
    }
  };

  const handleQuickReply = (reply: string) => {
    setInputText(reply);
    setTimeout(() => handleSend(), 300);
  };

  const showMessageOptions = (message: ChatMessage) => {
    const options = [
      { text: 'Copy', onPress: () => handleCopy(message.text) },
      ...(currentUserIdRef.current === String(message.senderId) ? [{ text: 'Edit', onPress: () => handleEdit(message) }] : []),
      ...(currentUserIdRef.current === String(message.senderId) ? [{ text: 'Delete', onPress: () => handleDelete(message.id) }] : []),
      { text: 'Reply', onPress: () => handleReply(message) },
      { text: 'Cancel', onPress: () => {}, style: 'cancel' as const },
    ];

    Alert.alert('Message Options', '', options);
  };

  const handleCopy = (text: string) => {
    Alert.alert('Copied', 'Message copied to clipboard');
  };

  const handleEdit = (message: ChatMessage) => {
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

  const handleReply = (message: ChatMessage) => {
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

  const currentUserIdRef = useRef<string | null>(userId);

  useEffect(() => {
    currentUserIdRef.current = userId;
  }, [userId]);

  const renderMessage = (message: ChatMessage) => {
    const isSent = currentUserIdRef.current === String(message.senderId);

    // Format timestamp nicely
    const dateObj = new Date(message.createdAt || new Date());
    const displayTime = dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

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
              {displayTime}
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