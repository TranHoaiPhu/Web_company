import httpPython from "../httpPython";

export interface ChatMessage {
    id: string;
    conversation_id: string;
    content: string;
    role: "user" | "assistant";
    created_at: string;
    metadata?: any;
    token_count?: number;
}

export interface Conversation {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
    updated_at: string;
    is_archived: boolean;
}

export const chatService = {
    getAdminConversation: async (token: string): Promise<Conversation> => {
        const response = await httpPython.get(`/chat/admin-conversation?token=${token}`);
        return response.data;
    },

    getMessages: async (conversationId: string): Promise<ChatMessage[]> => {
        try {
            const response = await httpPython.get(`/conversations/${conversationId}/messages`);
            return response.data.messages;
        } catch (error) {
            console.error("Error fetching messages:", error);
            return [];
        }
    }
};
