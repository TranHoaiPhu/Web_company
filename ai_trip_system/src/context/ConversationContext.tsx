"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { useConversations } from "@/hooks/useConversations";

interface Conversation {
  id: string;
  title: string;
  // Add other properties as needed
}

interface ConversationContextType {
  currentConversationId: string | undefined;
  setCurrentConversationId: (id: string | undefined) => void;
  handleConversationSelect: (conversationId: string) => void;
  handleNewConversation: () => void;
  handleConversationCreate: (conversationId: string) => void;
  // Expose conversations data and methods
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  createConversation: (title?: string) => Promise<Conversation | null>;
  deleteConversation: (conversationId: string) => Promise<boolean>;
  updateConversationTitle: (
    conversationId: string,
    title: string
  ) => Promise<boolean>;
}

const ConversationContext = createContext<ConversationContextType>({
  currentConversationId: undefined,
  setCurrentConversationId: () => {},
  handleConversationSelect: () => {},
  handleNewConversation: () => {},
  handleConversationCreate: () => {},
  conversations: [],
  isLoading: false,
  error: null,
  createConversation: async () => ({
    id: "",
    title: "",
  }),
  deleteConversation: async () => false,
  updateConversationTitle: async () => false,
});

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [currentConversationId, setCurrentConversationId] = useState<
    string | undefined
  >();

  // Use the conversations hook
  const {
    conversations,
    isLoading,
    error,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    mutate,
  } = useConversations();

  const handleConversationSelect = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  const handleNewConversation = () => {
    setCurrentConversationId(undefined);
  };

  const handleConversationCreate = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    // Refresh conversations list
    mutate();
  };

  return (
    <ConversationContext.Provider
      value={{
        currentConversationId,
        setCurrentConversationId,
        handleConversationSelect,
        handleNewConversation,
        handleConversationCreate,
        conversations,
        isLoading,
        error,
        createConversation,
        deleteConversation,
        updateConversationTitle,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  return useContext(ConversationContext);
}
