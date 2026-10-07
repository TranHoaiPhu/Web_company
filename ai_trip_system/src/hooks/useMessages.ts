import { useState, useCallback } from "react";
import useSWR from "swr";
import { messageApi, chatUtils } from "@/lib/api/conversations";
import { Message as ApiMessage } from "@/types/conversation";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface UseMessagesProps {
  conversationId?: string;
  userId?: string;
}

export function useMessages({ conversationId, userId }: UseMessagesProps) {
  const [error, setError] = useState<string | null>(null);

  // SWR fetcher for messages
  const messagesFetcher = async () => {
    if (!conversationId || !userId) return [];

    try {
      const response = await messageApi.getMessages(conversationId, {
        userId: userId,
        page: 1,
        limit: 100,
      });

      // Convert API messages to local message format
      const convertedMessages: Message[] = response.messages.map(
        (msg: ApiMessage) => ({
          id: msg.id,
          text: msg.content,
          isUser: msg.role === "user",
          timestamp: new Date(msg.created_at),
          metadata: msg.metadata,
        })
      );

      return convertedMessages;
    } catch {
      throw new Error("Failed to load messages");
    }
  };

  // Use SWR for messages
  const {
    data: messages,
    error: swrError,
    isLoading,
    mutate,
  } = useSWR(
    conversationId && userId ? `messages-${conversationId}-${userId}` : null,
    messagesFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  // Create new conversation with first message
  const startConversation = useCallback(
    async (
      title: string,
      firstMessage: string
    ): Promise<{ conversationId: string; messageId: string } | null> => {
      if (!userId) {
        setError("User ID is required");
        return null;
      }

      try {
        const response = await chatUtils.startConversation(
          userId,
          title,
          firstMessage,
          "user"
        );

        // Revalidate conversations list
        mutate();

        return {
          conversationId: response.conversation.id,
          messageId: response.message.id,
        };
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to start conversation"
        );
        console.error("Error starting conversation:", err);
        return null;
      }
    },
    [userId, mutate]
  );

  // Add message to existing conversation
  const addMessage = useCallback(
    async (
      content: string,
      role: "user" | "assistant",
      metadata?: Record<string, unknown>
    ): Promise<string | null> => {
      if (!conversationId || !userId) {
        console.log("C", conversationId);
        console.log("U", userId);
        setError("Conversation ID and User ID are required");
        return null;
      }

      try {
        const response = await messageApi.createMessageDirect({
          userId: userId,
          conversationId: conversationId,
          content: content,
          role: role,
          metadata: metadata,
          token_count: 0,
        });

        // Revalidate messages
        mutate();

        return response.id;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add message");
        console.error("Error adding message:", err);
        return null;
      }
    },
    [conversationId, userId, mutate]
  );

  // Get welcome message
  const getWelcomeMessage = (): Message => ({
    id: "welcome",
    text: "🌟 Xin chào! Tôi là trợ lý du lịch AI của bạn! ✈️\n\n🗺️ Tôi có thể giúp bạn:\n• **Lên kế hoạch chuyến đi** hoàn hảo\n• **Tìm kiếm địa điểm** thú vị\n• **Gợi ý hoạt động** phù hợp\n• **Tư vấn lịch trình** chi tiết\n\n🎒 Hãy chia sẻ với tôi - bạn muốn khám phá điểm đến nào?",
    isUser: false,
    timestamp: new Date(),
  });

  return {
    messages: messages || [],
    isLoading,
    error: error || swrError?.message,
    startConversation,
    addMessage,
    getWelcomeMessage,
    mutate,
    clearError: () => setError(null),
  };
}

export type { Message };
