// API client functions for conversations and messages

import {
  Conversation,
  Message,
  ConversationCreateRequest,
  ConversationUpdateRequest,
  MessageCreateRequest,
  ConversationListParams,
  MessageListParams,
  ConversationListResponse,
  MessageListResponse,
} from "@/types/conversation";
import { getCookie } from "cookies-next";
import { API_BASE_URL } from "@/config/api";

// Sử dụng API backend đã deploy trên Render
const API_BASE = API_BASE_URL;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = getCookie("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Conversation API functions
export const conversationApi = {
  // Get conversations list - SỬ DỤNG ĐÚNG ENDPOINT
  async getConversations(
    params: ConversationListParams
  ): Promise<ConversationListResponse> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());
    if (params.includeArchived) searchParams.append("include_archived", "true");
    if (params.search) searchParams.append("search", params.search);

    // Sử dụng endpoint đúng: GET /users/{user_id}/conversations
    const response = await fetch(
      `${API_BASE}/users/${params.userId}/conversations?${searchParams}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      // For any error (404, 500, etc.), return empty conversations
      // This is graceful handling for when backend has no data
      console.warn(`Conversations API returned ${response.status}, using empty data`);
      return {
        conversations: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    }
    return response.json();
  },

  // Get single conversation - SỬ DỤNG ĐÚNG ENDPOINT
  async getConversation(id: string): Promise<Conversation> {
    const response = await fetch(`${API_BASE}/conversations/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch conversation: ${response.statusText}`);
    }
    return response.json();
  },

  // Create new conversation
  async createConversation(
    data: ConversationCreateRequest
  ): Promise<Conversation> {
    const response = await fetch(`${API_BASE}/conversations/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to create conversation: ${response.statusText}`);
    }
    return response.json();
  },

  // Update conversation
  async updateConversation(
    id: string,
    data: ConversationUpdateRequest
  ): Promise<Conversation> {
    const response = await fetch(`${API_BASE}/conversations/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to update conversation: ${response.statusText}`);
    }
    return response.json();
  },

  // Archive conversation (soft delete)
  async archiveConversation(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/conversations/${id}/archive`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to archive conversation: ${response.statusText}`);
    }
    return response.json();
  },
};

// Message API functions
export const messageApi = {
  // Get messages for a conversation - SỬ DỤNG ĐÚNG ENDPOINT
  async getMessages(
    conversationId: string,
    params: MessageListParams
  ): Promise<MessageListResponse> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());

    // Sử dụng endpoint đúng: GET /conversations/{id}/messages
    const response = await fetch(
      `${API_BASE}/conversations/${conversationId}/messages?${searchParams}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.statusText}`);
    }
    return response.json();
  },

  // Create new message in conversation
  async createMessage(
    conversationId: string,
    data: MessageCreateRequest
  ): Promise<Message> {
    const messageData = {
      conversation_id: conversationId,
      content: data.content,
      role: data.role,
      metadata: data.metadata,
      token_count: data.token_count || 0,
    };

    const response = await fetch(`${API_BASE}/messages/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(messageData),
    });
    if (!response.ok) {
      throw new Error(`Failed to create message: ${response.statusText}`);
    }
    return response.json();
  },

  // Create message directly
  async createMessageDirect(data: MessageCreateRequest): Promise<Message> {
    const messageData = {
      conversation_id: data.conversationId,
      content: data.content,
      role: data.role,
      metadata: data.metadata,
      token_count: data.token_count || 0,
    };

    const response = await fetch(`${API_BASE}/messages/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(messageData),
    });
    if (!response.ok) {
      throw new Error(`Failed to create message: ${response.statusText}`);
    }
    return response.json();
  },

  // Get single message - không có endpoint này trong backend, bỏ qua
  async getMessage(): Promise<Message> {
    throw new Error("Get single message endpoint not available in backend API");
  },
};

// Utility functions
export const chatUtils = {
  // Create a new conversation with first message - BACKEND CHƯA CÓ ENDPOINT NÀY
  async startConversation(
    userId: string,
    title: string,
    firstMessage: string,
    role: "user" | "assistant" = "user"
  ): Promise<{ conversation: Conversation; message: Message }> {
    // Backend không có endpoint /messages/start-conversation
    // Phải tạo conversation trước, rồi tạo message sau

    // 1. Tạo conversation trước
    const conversation = await conversationApi.createConversation({
      user_id: userId,
      title: title,
    });

    // 2. Tạo message đầu tiên
    const message = await messageApi.createMessage(conversation.id, {
      userId: userId,
      conversationId: conversation.id,
      content: firstMessage,
      role: role,
      metadata: {},
      token_count: 0,
    });

    return { conversation, message };
  },

  // Generate conversation title from first message
  generateTitle(firstMessage: string, maxLength: number = 50): string {
    const cleaned = firstMessage.trim().replace(/\s+/g, " ");
    if (cleaned.length <= maxLength) {
      return cleaned;
    }
    return cleaned.substring(0, maxLength - 3) + "...";
  },
};
