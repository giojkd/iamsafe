import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../../theme';
import { ArrowLeft, Send, Shield, Lock } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { encryptMessage, decryptMessage, generateEncryptionKey } from '../../lib/encryption';
import { chatService } from '../../lib/chat-service';
import { supabase } from '../../lib/supabase';

type Message = {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
};

type Conversation = {
  id: string;
  bookingId?: string;
  clientId: string;
  bodyguardId: string;
  bodyguardName: string;
  encryptionKey: string;
};

export default function ChatScreen() {
  const router = useRouter();
  const { conversationId, bodyguardName, bodyguardId, bookingId } = useLocalSearchParams<{
    conversationId: string;
    bodyguardName: string;
    bodyguardId: string;
    bookingId?: string;
  }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      initializeConversation();
    }
  }, [conversationId, currentUserId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const initializeConversation = async () => {
    setLoading(true);
    try {
      const { data: convData, error: convError } = await chatService.getOrCreateConversation(
        currentUserId,
        bodyguardId || '',
        bookingId
      );

      if (convError || !convData) {
        console.error('Error initializing conversation:', convError);
        setLoading(false);
        return;
      }

      const encryptionKey = await generateEncryptionKey();
      setConversation({
        id: convData.id,
        bookingId: convData.booking_id || undefined,
        clientId: convData.client_id,
        bodyguardId: convData.bodyguard_id,
        bodyguardName: bodyguardName || 'Bodyguard',
        encryptionKey,
      });

      const { data: messagesData, error: messagesError } = await chatService.getMessages(convData.id);

      if (messagesError) {
        console.error('Error loading messages:', messagesError);
      } else if (messagesData) {
        const formattedMessages: Message[] = messagesData.map(msg => ({
          id: msg.id,
          senderId: msg.sender_id,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          isRead: msg.read,
        }));
        setMessages(formattedMessages);
      }

      const subscription = chatService.subscribeToMessages(convData.id, (newMessage) => {
        const formattedMessage: Message = {
          id: newMessage.id,
          senderId: newMessage.sender_id,
          content: newMessage.content,
          timestamp: new Date(newMessage.created_at),
          isRead: newMessage.read,
        };
        setMessages(prev => [...prev, formattedMessage]);
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Unexpected error in initializeConversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !conversation) return;

    const messageContent = inputText.trim();
    setInputText('');

    try {
      const { data, error } = await chatService.sendMessage(
        conversation.id,
        currentUserId,
        messageContent
      );

      if (error) {
        console.error('Error sending message:', error);
        setInputText(messageContent);
        return;
      }

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Unexpected error sending message:', error);
      setInputText(messageContent);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === currentUserId;

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownText : styles.otherText,
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.timestamp,
            isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp,
          ]}>
            {item.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Shield size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{bodyguardName}</Text>
            <View style={styles.encryptionBadge}>
              <Lock size={10} color={theme.colors.success} />
              <Text style={styles.encryptionText}>Crittografata end-to-end</Text>
            </View>
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Scrivi un messaggio..."
          placeholderTextColor={theme.colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Send size={20} color={inputText.trim() ? theme.colors.background : theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  encryptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  encryptionText: {
    fontSize: 11,
    color: theme.colors.success,
    fontWeight: '600',
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    gap: 4,
  },
  ownBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownText: {
    color: theme.colors.background,
  },
  otherText: {
    color: theme.colors.text,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '500',
  },
  ownTimestamp: {
    color: theme.colors.background + 'CC',
    textAlign: 'right',
  },
  otherTimestamp: {
    color: theme.colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.surfaceLight,
  },
});
