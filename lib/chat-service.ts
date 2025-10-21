import { supabase } from './supabase';

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
};

export type Conversation = {
  id: string;
  booking_id: string | null;
  client_id: string;
  bodyguard_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

export const chatService = {
  async getOrCreateConversation(
    clientId: string,
    bodyguardId: string,
    bookingId?: string
  ): Promise<{ data: Conversation | null; error: any }> {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('client_id', clientId)
        .eq('bodyguard_id', bodyguardId)
        .eq('booking_id', bookingId || null)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching conversation:', fetchError);
        return { data: null, error: fetchError };
      }

      if (existing) {
        return { data: existing, error: null };
      }

      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          client_id: clientId,
          bodyguard_id: bodyguardId,
          booking_id: bookingId || null,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating conversation:', createError);
        return { data: null, error: createError };
      }

      return { data: newConversation, error: null };
    } catch (error) {
      console.error('Unexpected error in getOrCreateConversation:', error);
      return { data: null, error };
    }
  },

  async getConversations(
    userId: string
  ): Promise<{ data: Conversation[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`client_id.eq.${userId},bodyguard_id.eq.${userId}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Unexpected error in getConversations:', error);
      return { data: null, error };
    }
  },

  async getMessages(
    conversationId: string
  ): Promise<{ data: Message[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Unexpected error in getMessages:', error);
      return { data: null, error };
    }
  },

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string
  ): Promise<{ data: Message | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error in sendMessage:', error);
      return { data: null, error };
    }
  },

  async markMessagesAsRead(
    conversationId: string,
    userId: string
  ): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error marking messages as read:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected error in markMessagesAsRead:', error);
      return { error };
    }
  },

  subscribeToMessages(
    conversationId: string,
    callback: (message: Message) => void
  ) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();
  },
};
