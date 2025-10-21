import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { MessageCircle, Shield, Lock } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { chatService } from '../../lib/chat-service';
import { supabase } from '../../lib/supabase';

type Conversation = {
  id: string;
  bodyguardId: string;
  bodyguardName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
};

export default function ChatsScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      const { data, error } = await chatService.getConversations(user.id);

      if (error) {
        console.error('Error loading conversations:', error);
      } else if (data) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', [...new Set(data.map(c => c.client_id === user.id ? c.bodyguard_id : c.client_id))]);

        const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

        const formattedConversations: Conversation[] = data.map(conv => {
          const otherUserId = conv.client_id === user.id ? conv.bodyguard_id : conv.client_id;
          return {
            id: conv.id,
            bodyguardId: otherUserId,
            bodyguardName: profileMap.get(otherUserId) || 'Bodyguard',
            lastMessage: conv.last_message || 'Nessun messaggio',
            lastMessageTime: conv.last_message_at
              ? formatTime(new Date(conv.last_message_at))
              : '',
            unreadCount: 0,
          };
        });

        setConversations(formattedConversations);
      }
    } catch (error) {
      console.error('Unexpected error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    } else if (hours < 48) {
      return 'Ieri';
    } else {
      return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => {
        router.push({
          pathname: '/chat/[conversationId]',
          params: {
            conversationId: item.id,
            bodyguardName: item.bodyguardName,
            bodyguardId: item.bodyguardId,
          },
        });
      }}
    >
      <View style={styles.avatar}>
        <Shield size={28} color={theme.colors.primary} />
      </View>
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={styles.bodyguardName}>{item.bodyguardName}</Text>
          <Text style={styles.timeText}>{item.lastMessageTime}</Text>
        </View>
        <View style={styles.conversationFooter}>
          <View style={styles.lastMessageContainer}>
            <Lock size={12} color={theme.colors.textSecondary} />
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage}
            </Text>
          </View>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat</Text>
        <View style={styles.encryptionBadge}>
          <Lock size={14} color={theme.colors.success} />
          <Text style={styles.encryptionText}>Crittografate</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <MessageCircle size={80} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>Nessuna chat</Text>
          <Text style={styles.emptySubtitle}>
            Le conversazioni con i bodyguard appariranno qui
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  encryptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.colors.success + '20',
    borderRadius: 12,
  },
  encryptionText: {
    fontSize: 11,
    color: theme.colors.success,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  list: {
    paddingVertical: 8,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 24,
    gap: 12,
    backgroundColor: theme.colors.background,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationInfo: {
    flex: 1,
    gap: 6,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bodyguardName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  timeText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  lastMessageContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.background,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 92,
  },
});
