// Types for Conversation and Message entities

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  role: "user" | "assistant";
  created_at: string;
  metadata?: Record<string, unknown>;
  token_count: number;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

// API Request/Response types
export interface ConversationCreateRequest {
  user_id: string;
  title: string;
}

export interface ConversationUpdateRequest {
  userId: string;
  title?: string;
  is_archived?: boolean;
}

export interface MessageCreateRequest {
  userId: string;
  conversationId?: string; // Optional for direct message creation
  content: string;
  role: "user" | "assistant";
  metadata?: Record<string, unknown>;
  token_count?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ConversationListParams extends PaginationParams {
  userId: string;
  includeArchived?: boolean;
  search?: string;
}

export interface MessageListParams extends PaginationParams {
  userId: string;
}

// API Response types
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  pagination: PaginationInfo;
}

export interface MessageListResponse {
  messages: Message[];
  pagination: PaginationInfo;
}

// Error response type
export interface ApiError {
  error: string;
  details?: string;
}

// Utility types for frontend
export interface ConversationState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
  isLoading?: boolean;
}
