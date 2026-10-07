import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import useSWR from "swr";
import { conversationApi, messageApi } from "@/lib/api/conversations";
import { Message as ApiMessage } from "@/types/conversation";

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage?: string;
  lastMessageAt?: string;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Convert API message to local message format
const convertApiMessageToLocal = (apiMessage: ApiMessage): Message => ({
  id: apiMessage.id,
  text: apiMessage.content,
  isUser: apiMessage.role === "user",
  timestamp: new Date(apiMessage.created_at),
  metadata: apiMessage.metadata,
});

export function useConversations() {
  const { isLoggedIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get userId from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("current_user_id");
      setUserId(storedUserId);
    }
  }, [isLoggedIn]);

  // Custom fetcher sử dụng API backend
  const conversationFetcher = async () => {
    if (!userId) return [];

    try {
      const response = await conversationApi.getConversations({
        userId: userId,
        page: 1,
        limit: 10, // Only fetch 10 most recent conversations
      });
      return response.conversations || [];
    } catch (error) {
      console.error("Failed to load conversations:", error);
      // Return empty array instead of throwing to prevent blocking UI
      return [];
    }
  };

  // Use SWR for data fetching
  const {
    data: conversations,
    error: swrError,
    isLoading,
    mutate,
  } = useSWR(userId ? `conversations-${userId}` : null, conversationFetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 30000, // 30 seconds
    onError: (err) => {
      setError(err.message || "Failed to load conversations");
      console.error("Error loading conversations:", err);
    },
  });

  const loadConversations = useCallback(async () => {
    await mutate(); // Trigger revalidation
  }, [mutate]);

  const createConversation = useCallback(
    async (title?: string) => {
      if (!userId) return null;

      try {
        // First, get the latest conversations to check count
        const response = await conversationApi.getConversations({
          userId: userId,
          page: 1,
          limit: 50, // Get more to check total count
        });
        const currentConversations = response.conversations || [];

        // Check if we need to delete old conversations (keep only 9, so we can add 1 new = 10 total)
        console.log(
          `📊 Current conversations count: ${currentConversations.length}`
        );
        if (currentConversations.length >= 10) {
          // Sort by date and get the oldest ones to delete
          const sortedByDate = [...currentConversations].sort((a, b) => {
            const dateA = new Date(a.updated_at || a.created_at).getTime();
            const dateB = new Date(b.updated_at || b.created_at).getTime();
            return dateA - dateB; // Oldest first
          });

          // Delete the oldest conversations to make room (keep 9, so we can add 1 new)
          const conversationsToDelete = sortedByDate.slice(
            0,
            currentConversations.length - 9
          );
          console.log(
            `🗑️ Auto-deleting ${conversationsToDelete.length} old conversations to maintain limit of 10`
          );
          console.log(
            "Conversations to delete:",
            conversationsToDelete.map((c) => ({ id: c.id, title: c.title }))
          );

          for (const conv of conversationsToDelete) {
            try {
              console.log(
                `🗑️ Attempting to delete conversation: ${conv.id} - ${conv.title}`
              );
              await conversationApi.archiveConversation(conv.id);
              console.log(
                `✅ Successfully auto-deleted old conversation: ${conv.title}`
              );
            } catch (deleteErr) {
              console.error("❌ Failed to delete old conversation:", deleteErr);
              console.error("Conversation details:", conv);
            }
          }
        } else {
          console.log(
            `✅ No need to delete conversations. Current count: ${currentConversations.length}/10`
          );
        }

        console.log(
          `🆕 Creating new conversation with title: ${
            title || "New Conversation"
          }`
        );
        const newConversation = await conversationApi.createConversation({
          user_id: userId,
          title: title || "New Conversation",
        });
        console.log(
          `✅ Successfully created new conversation:`,
          newConversation
        );

        await mutate(); // Revalidate SWR cache
        console.log(`🔄 SWR cache revalidated`);
        return newConversation;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error creating conversation:", err);
        return null;
      }
    },
    [userId, mutate]
  );

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      if (!userId) return false;

      try {
        await conversationApi.archiveConversation(conversationId);
        await mutate(); // Revalidate SWR cache
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error deleting conversation:", err);
        return false;
      }
    },
    [userId, mutate]
  );

  const updateConversationTitle = useCallback(
    async (conversationId: string, newTitle: string) => {
      if (!userId) return false;

      try {
        await conversationApi.updateConversation(conversationId, {
          userId: userId,
          title: newTitle,
        });

        await mutate(); // Revalidate SWR cache
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error updating conversation title:", err);
        return false;
      }
    },
    [userId, mutate]
  );

  const loadConversationMessages = useCallback(
    async (conversationId: string): Promise<Message[]> => {
      if (!userId) return [];

      try {
        const response = await messageApi.getMessages(conversationId, {
          userId: userId,
          page: 1,
          limit: 100,
        });
        return (response.messages || []).map(convertApiMessageToLocal);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error loading conversation messages:", err);
        return [];
      }
    },
    [userId]
  );

  const addMessageToConversation = useCallback(
    async (
      conversationId: string,
      content: string,
      role: "user" | "assistant",
      metadata?: Record<string, unknown>
    ) => {
      if (!userId) return null;

      try {
        const result = await messageApi.createMessageDirect({
          userId: userId,
          conversationId,
          content,
          role,
          metadata,
          token_count: 0,
        });

        // Refresh conversations to update last message
        await loadConversations();
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error adding message:", err);
        return null;
      }
    },
    [userId, loadConversations]
  );

  return {
    conversations: conversations || [],
    isLoading,
    error: error || swrError?.message,
    loadConversations,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    loadConversationMessages,
    addMessageToConversation,
    clearError: () => setError(null),
    mutate, // Expose mutate for manual revalidation
  };
}

export type { Conversation, Message };
