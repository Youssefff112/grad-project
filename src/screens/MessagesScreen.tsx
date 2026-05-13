import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useUser } from '../context/UserContext';
import { TraineeBottomNav } from '../components/TraineeBottomNav';
import { CoachBottomNav } from '../components/coach/CoachBottomNav';
import {
  getConversations,
  sendMessage,
  getCoachClients,
  CoachClient,
  Conversation as ApiConversation,
} from '../services/messaging.service';

// We map the backend schema to this UI schema on load
interface UIConversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  isAI: boolean;
  category: 'coaches' | 'people' | 'groups' | 'ai';
  otherUserId: number | null;
}

export const MessagesScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { totalUnread } = useNotifications();
  const { userId, userMode, isCoach, coachId, coachName } = useUser();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<UIConversation[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'ai' | 'people'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<CoachClient | null>(null);
  const [coachClients, setCoachClients] = useState<CoachClient[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [sending, setSending] = useState(false);

  const bgColor = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  useFocusEffect(
    useCallback(() => {
      const fetchConversations = async () => {
        setIsLoading(true);
        try {
          // If using mock mode or not authenticated, just return some mock data
          const apiConvs = await getConversations().catch(e => {
             console.log('Conversations API not available or 401, using empty state');
             return [];
          });
          
          let mapped: UIConversation[] = apiConvs.map(conv => {
            // Determine if the *other* party in this conversation is a coach or client
            const isMeCoach = String(userId) === String(conv.coachId);
            const otherParty = isMeCoach ? conv.client : conv.coach;
            const otherUserId = isMeCoach ? conv.clientId : conv.coachId;
            
            const otherName = otherParty ? `${otherParty.firstName} ${otherParty.lastName}`.trim() : 'Unknown User';
            
            // Format time correctly
            let timeStr = '';
            if (conv.lastMessageAt) {
              const d = new Date(conv.lastMessageAt);
              timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            const lastMsg = (conv.messages && conv.messages.length > 0) 
              ? conv.messages[0].text 
              : 'New conversation started';

            // Determine read status if checking backend counts, defaulting to 0 for now as we haven't implemented unread counters on the backend
            const unreadCount = 0; 

            return {
              id: conv.id,
              name: otherName,
              avatar: isMeCoach ? 'person' : 'fitness-center', // icon logic
              lastMessage: lastMsg,
              time: timeStr,
              unread: unreadCount,
              isAI: false,
              category: 'coaches',
              otherUserId: otherUserId != null ? Number(otherUserId) : null,
            };
          });

          setConversations(mapped);
        } catch (error) {
          console.log('Error fetching conversations gracefully caught:', error);
          setConversations([]);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchConversations();
    }, [userId])
  );

  // Filter conversations
  const filteredConversations = useMemo(() => {
    let result = conversations;

    // Apply category filter
    if (filter === 'unread') {
      result = result.filter((c) => c.unread > 0);
    } else if (filter === 'ai') {
      result = result.filter((c) => c.isAI);
    } else if (filter === 'people') {
      result = result.filter((c) => !c.isAI);
    }

    // Apply search filter
    if (searchText.trim()) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchText.toLowerCase()) ||
          c.lastMessage.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return result;
  }, [conversations, filter, searchText]);

  const handleOpenChat = (conversation: UIConversation) => {
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      conversationName: conversation.name,
      ...(conversation.otherUserId != null ? { receiverId: conversation.otherUserId } : {}),
    });
  };

  const closeNewMessage = () => {
    setShowNewMessage(false);
    setNewMessageText('');
    setSelectedRecipient(null);
  };

  const openNewMessage = async () => {
    setShowNewMessage(true);
    setNewMessageText('');
    setSelectedRecipient(null);

    if (isCoach) {
      setLoadingClients(true);
      try {
        const clients = await getCoachClients();
        setCoachClients(clients);
      } catch {
        setCoachClients([]);
      } finally {
        setLoadingClients(false);
      }
    } else {
      // Client: pre-select their coach
      if (coachId && coachName) {
        setSelectedRecipient({ id: Number(coachId), firstName: coachName.split(' ')[0], lastName: coachName.split(' ').slice(1).join(' '), email: '' });
      }
    }
  };

  const handleNewMessage = async () => {
    if (!newMessageText.trim() || !selectedRecipient) return;
    setSending(true);
    try {
      const msg = await sendMessage(null, selectedRecipient.id, newMessageText.trim());
      closeNewMessage();
      const recipientName = `${selectedRecipient.firstName} ${selectedRecipient.lastName}`.trim();
      navigation.navigate('Chat', {
        conversationId: msg.conversationId,
        conversationName: recipientName,
        receiverId: selectedRecipient.id,
      });
    } catch (e: any) {
      Alert.alert('Failed to send', e?.message || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]}>
      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-24`} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={tw`px-5 pt-5 pb-4`}>
          <View style={tw`flex-row items-center justify-between`}>
            <View>
              <Text style={[tw`text-sm font-semibold`, { color: accent }]}>Messages</Text>
              <Text style={[tw`text-2xl font-black mt-1`, { color: textPrimary }]}>Inbox</Text>
            </View>
            <View style={tw`flex-row items-center gap-3`}>
              <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                <View
                  style={[
                    tw`w-12 h-12 rounded-full items-center justify-center relative`,
                    { backgroundColor: accent + '20', borderWidth: 1, borderColor: accent + '40' },
                  ]}
                >
                  <MaterialIcons name="notifications" size={20} color={accent} />
                  {!!totalUnread && (
                    <View
                      style={[
                        tw`absolute -top-1 -right-1 w-5 h-5 rounded-full items-center justify-center`,
                        { backgroundColor: accent },
                      ]}
                    >
                      <Text style={tw`text-white text-xs font-bold`}>
                        {totalUnread > 99 ? '99+' : totalUnread}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={openNewMessage}>
                <View
                  style={[
                    tw`w-12 h-12 rounded-full items-center justify-center`,
                    { backgroundColor: accent + '20', borderWidth: 1, borderColor: accent + '40' },
                  ]}
                >
                  <MaterialIcons name="edit" size={20} color={accent} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={tw`px-5 mb-4`}>
          <View
            style={[
              tw`flex-row items-center px-4 py-3 rounded-xl gap-2`,
              { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder },
            ]}
          >
            <MaterialIcons name="search" size={20} color={textMuted} />
            <TextInput
              style={[tw`flex-1 text-base`, { color: textPrimary }]}
              placeholder="Search conversations..."
              placeholderTextColor={textMuted}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={tw`px-5 mb-5 flex-row gap-2`}>
          {['all', 'unread', 'ai', 'people'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setFilter(tab as any)}
              style={[
                tw`px-4 py-2 rounded-full`,
                {
                  backgroundColor: filter === tab ? accent : isDark ? '#1e293b' : '#f1f5f9' },
              ]}
            >
              <Text
                style={[
                  tw`text-xs font-bold capitalize`,
                  { color: filter === tab ? '#ffffff' : textSecondary },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Conversations List */}
        <View style={tw`px-5`}>
          {isLoading ? (
            <View style={tw`py-10 items-center justify-center`}>
              <Text style={[tw`text-sm font-semibold`, { color: textMuted }]}>Loading conversations...</Text>
            </View>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conversation, index) => (
              <TouchableOpacity
                key={conversation.id}
                onPress={() => handleOpenChat(conversation)}
                style={[
                  tw`flex-row items-center gap-3 py-4`,
                  index < filteredConversations.length - 1 && {
                    borderBottomWidth: 1,
                    borderColor: dividerColor },
                ]}
              >
                {/* Avatar */}
                <View
                  style={[
                    tw`w-14 h-14 rounded-full items-center justify-center flex-shrink-0`,
                    { backgroundColor: accent + '18', borderWidth: 2, borderColor: accent + '28' },
                  ]}
                >
                  <MaterialIcons name={conversation.avatar as any} size={24} color={accent} />
                </View>

                {/* Content */}
                <View style={tw`flex-1`}>
                  <View style={tw`flex-row items-center justify-between mb-1`}>
                    <Text style={[tw`font-bold text-base`, { color: textPrimary }]}>{conversation.name}</Text>
                    <Text style={[tw`text-xs`, { color: textMuted }]}>{conversation.time}</Text>
                  </View>
                  <Text
                    style={[tw`text-sm`, { color: textSecondary }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {conversation.lastMessage}
                  </Text>
                </View>

                {/* Unread Badge */}
                {conversation.unread > 0 && (
                  <View
                    style={[
                      tw`w-6 h-6 rounded-full items-center justify-center flex-shrink-0`,
                      { backgroundColor: accent },
                    ]}
                  >
                    <Text style={tw`text-white text-xs font-bold`}>
                      {conversation.unread > 99 ? '99+' : conversation.unread}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={tw`items-center justify-center py-12`}>
              <MaterialIcons name="mail-outline" size={48} color={textMuted} />
              <Text style={[tw`text-base font-semibold mt-4`, { color: textPrimary }]}>No conversations</Text>
              <Text style={[tw`text-sm mt-2`, { color: textMuted }]}>Try searching or creating a new message</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* New Message Bottom Sheet */}
      <Modal
        visible={showNewMessage}
        transparent
        animationType="slide"
        onRequestClose={closeNewMessage}
      >
        <KeyboardAvoidingView
          style={tw`flex-1`}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={[tw`flex-1`, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            activeOpacity={1}
            onPress={closeNewMessage}
          />
          <View
            style={[
              tw`rounded-t-3xl px-5 pt-4`,
              { backgroundColor: cardBg, borderTopWidth: 1, borderColor: cardBorder, paddingBottom: insets.bottom + 16 },
            ]}
          >
            {/* Handle */}
            <View style={[tw`w-10 h-1 rounded-full self-center mb-5`, { backgroundColor: isDark ? '#334155' : '#cbd5e1' }]} />

            {/* Header */}
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <View>
                <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>New Message</Text>
                <Text style={[tw`text-xs mt-0.5`, { color: textSecondary }]}>
                  {isCoach ? 'Select a client to message' : 'Send a message to your coach'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeNewMessage}
                style={[tw`w-9 h-9 rounded-full items-center justify-center`, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
              >
                <MaterialIcons name="close" size={18} color={textSecondary} />
              </TouchableOpacity>
            </View>

            {/* To: recipient row */}
            <View style={[tw`rounded-xl px-4 py-3 mb-3 flex-row items-center gap-3`, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderWidth: 1, borderColor: cardBorder }]}>
              <Text style={[tw`text-sm font-semibold`, { color: textMuted, minWidth: 28 }]}>To:</Text>

              {isCoach ? (
                loadingClients ? (
                  <ActivityIndicator size="small" color={accent} />
                ) : selectedRecipient ? (
                  <TouchableOpacity
                    onPress={() => setSelectedRecipient(null)}
                    style={[tw`flex-row items-center gap-1.5 px-3 py-1 rounded-full`, { backgroundColor: accent + '20' }]}
                  >
                    <Text style={[tw`text-sm font-bold`, { color: accent }]}>
                      {selectedRecipient.firstName} {selectedRecipient.lastName}
                    </Text>
                    <MaterialIcons name="close" size={14} color={accent} />
                  </TouchableOpacity>
                ) : (
                  <Text style={[tw`text-sm`, { color: textMuted }]}>Tap a client below</Text>
                )
              ) : selectedRecipient ? (
                <View style={[tw`flex-row items-center gap-2 px-3 py-1 rounded-full`, { backgroundColor: accent + '20' }]}>
                  <MaterialIcons name="fitness-center" size={14} color={accent} />
                  <Text style={[tw`text-sm font-bold`, { color: accent }]}>
                    {selectedRecipient.firstName} {selectedRecipient.lastName}
                  </Text>
                </View>
              ) : (
                <Text style={[tw`text-sm`, { color: '#ef4444' }]}>No coach assigned</Text>
              )}
            </View>

            {/* Client picker (coach only) */}
            {isCoach && !selectedRecipient && (
              <View style={[tw`rounded-xl mb-3 overflow-hidden`, { borderWidth: 1, borderColor: cardBorder, maxHeight: 160 }]}>
                {coachClients.length === 0 ? (
                  <View style={tw`py-4 items-center`}>
                    <Text style={[tw`text-sm`, { color: textMuted }]}>No clients found</Text>
                  </View>
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {coachClients.map((client, i) => (
                      <TouchableOpacity
                        key={client.id}
                        onPress={() => setSelectedRecipient(client)}
                        style={[
                          tw`flex-row items-center gap-3 px-4 py-3`,
                          i > 0 && { borderTopWidth: 1, borderColor: cardBorder },
                          { backgroundColor: cardBg },
                        ]}
                      >
                        <View style={[tw`w-8 h-8 rounded-full items-center justify-center`, { backgroundColor: accent + '18' }]}>
                          <Text style={[tw`text-xs font-black`, { color: accent }]}>
                            {client.firstName[0]}{client.lastName[0]}
                          </Text>
                        </View>
                        <View style={tw`flex-1`}>
                          <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>
                            {client.firstName} {client.lastName}
                          </Text>
                          <Text style={[tw`text-xs`, { color: textMuted }]}>{client.email}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={18} color={textMuted} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {/* Message input */}
            <TextInput
              style={[
                tw`rounded-xl px-4 py-3 text-sm mb-1`,
                { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: textPrimary, borderWidth: 1, borderColor: cardBorder, minHeight: 100, textAlignVertical: 'top' },
              ]}
              placeholder="Write your message…"
              placeholderTextColor={textMuted}
              value={newMessageText}
              onChangeText={(t) => setNewMessageText(t.slice(0, 500))}
              multiline
              autoFocus={!isCoach}
            />
            <Text style={[tw`text-xs text-right mb-4`, { color: textMuted }]}>{newMessageText.length}/500</Text>

            {/* Actions */}
            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                style={[tw`flex-1 py-3.5 rounded-xl items-center justify-center`, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderWidth: 1, borderColor: cardBorder }]}
                onPress={closeNewMessage}
              >
                <Text style={[tw`text-sm font-bold`, { color: textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  tw`flex-1 py-3.5 rounded-xl items-center justify-center flex-row gap-2`,
                  { backgroundColor: (newMessageText.trim() && selectedRecipient && !sending) ? accent : (isDark ? '#1e293b' : '#e2e8f0') },
                ]}
                onPress={handleNewMessage}
                disabled={!newMessageText.trim() || !selectedRecipient || sending}
              >
                {sending
                  ? <ActivityIndicator size="small" color="#ffffff" />
                  : <>
                      <MaterialIcons name="send" size={16} color={(newMessageText.trim() && selectedRecipient) ? '#ffffff' : textMuted} />
                      <Text style={[tw`text-sm font-bold`, { color: (newMessageText.trim() && selectedRecipient) ? '#ffffff' : textMuted }]}>Send</Text>
                    </>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bottom Navigation */}
      {isCoach
        ? <CoachBottomNav activeId="messages" navigation={navigation} totalUnread={totalUnread} />
        : <TraineeBottomNav activeId="messages" navigation={navigation} totalUnread={totalUnread} />
      }
    </SafeAreaView>
  );
};
