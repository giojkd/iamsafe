import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';
import { MessageCircle, User, Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';

type Conversation = {
  id: string;
  clientId: string;
  clientName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
};

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    clientId: 'client-1',
    clientName: 'Giovanni Ferrari',
    lastMessage: 'Grazie per la conferma!',
    lastMessageTime: '10:30',
    unreadCount: 2,
  },
  {
    id: '2',
    clientId: 'client-2',
    clientName: 'Maria Lombardi',
    lastMessage: 'A che ora ci vediamo domani?',
    lastMessageTime: 'Ieri',
    unreadCount: 0,
  },
  {
    id: '3',
    clientId: 'client-3',
    clientName: 'Alessandra Conti',
    lastMessage: 'Perfetto, ci vediamo lì',
    lastMessageTime: '2 giorni fa',
    unreadCount: 0,
  },
];

export default function ChatsScreen() {
  const router = useRouter();

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => {
        router.push({
          pathname: '/chat/[conversationId]',
          params: {
            conversationId: item.id,
            bodyguardName: item.clientName,
            bodyguardId: item.clientId,
          },
        });
      }}
    >
      <View style={styles.avatar}>
        <User size={28} color={theme.colors.primary} />
      </View>
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={styles.clientName}>{item.clientName}</Text>
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

      {MOCK_CONVERSATIONS.length === 0 ? (
        <View style={styles.emptyState}>
          <MessageCircle size={80} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>Nessuna chat</Text>
          <Text style={styles.emptySubtitle}>
            Le conversazioni con i clienti appariranno qui
          </Text>
        </View>
      ) : (
        <FlatList
          data={MOCK_CONVERSATIONS}
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
  clientName: {
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
