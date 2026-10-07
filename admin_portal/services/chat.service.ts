import httpPython from "./http-python";

export interface ChatMessage {
    id: string;
    conversation_id: string;
    content: string;
    role: "user" | "assistant";
    created_at: string;
}

export interface SupportConversation {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
    updated_at: string;
    is_archived: boolean;
    status?: "open" | "closed";
    user?: {
        name: string;
        avatar: string;
        email: string;
    };
}

export const chatService = {
    getConversations: async (): Promise<SupportConversation[]> => {
        const response = await httpPython.get("/chat/conversations");
        return response.data;
    },

    getMessages: async (conversationId: string): Promise<ChatMessage[]> => {
        const response = await httpPython.get(`/chat/messages/${conversationId}`);
        return response.data;
    },

    getSuggestions: async (conversationId: string): Promise<{ suggestions: { label: string, content: string }[] }> => {
        const response = await httpPython.get(`/chat/suggestions/${conversationId}`);
        return response.data;
    },

    chatWithAssistant: async (query: string, historyContext?: string): Promise<{ response: string, suggestions?: { label: string, content: string }[] }> => {
        const response = await httpPython.post("/chat/assistant-chat", { query, history_context: historyContext });
        return response.data;
    },

    getOrCreateByEmail: async (email: string): Promise<SupportConversation> => {
        const response = await httpPython.post("/chat/get-or-create-by-email", { email });
        return response.data;
    }
};
