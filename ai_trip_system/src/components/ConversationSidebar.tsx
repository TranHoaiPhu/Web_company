"use client";

import { useState, useEffect } from "react";
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/context/AuthContext";

interface Conversation {
  id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  messageCount?: number;
  lastMessage?: string;
  lastMessageAt?: string;
}

interface ConversationSidebarProps {
  currentConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: () => void;
  className?: string;
}

export default function ConversationSidebar({
  currentConversationId,
  onConversationSelect,
  onNewConversation,
  className = "",
}: ConversationSidebarProps) {
  const { isLoggedIn } = useAuth();
  const {
    conversations,
    isLoading,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    loadConversations,
  } = useConversations();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-fetch conversations when user logs in
  useEffect(() => {
    if (isLoggedIn) {
      loadConversations();
    }
  }, [isLoggedIn, loadConversations]);

  const handleNewConversation = async () => {
    try {
      const newConversation = await createConversation("New Conversation");
      if (newConversation) {
        onNewConversation();
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const handleDeleteConversation = async (
    conversationId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    if (!confirm("Bạn có chắc muốn xóa cuộc trò chuyện này?")) return;

    try {
      const success = await deleteConversation(conversationId);
      if (success && conversationId === currentConversationId) {
        onNewConversation();
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const handleEditTitle = async (conversationId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    try {
      const success = await updateConversationTitle(
        conversationId,
        newTitle.trim()
      );
      if (success) {
        setEditingId(null);
      }
    } catch (error) {
      console.error("Error updating conversation title:", error);
    }
  };

  const startEditing = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  // Sort conversations by most recent first
  const sortConversationsByRecent = (conversations: Conversation[]) => {
    return [...conversations].sort((a, b) => {
      const dateA = new Date(
        a.updatedAt || a.updated_at || a.createdAt || a.created_at || new Date()
      ).getTime();
      const dateB = new Date(
        b.updatedAt || b.updated_at || b.createdAt || b.created_at || new Date()
      ).getTime();
      return dateB - dateA; // Most recent first
    });
  };

  const sortedConversations = sortConversationsByRecent(conversations);

  if (isCollapsed) {
    return (
      <div
        className={`w-16 bg-gradient-to-b from-amber-50 to-orange-100 text-gray-700 flex flex-col border-r border-amber-200 ${className}`}
      >
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-4 hover:bg-amber-100 transition-colors rounded-lg m-2"
          title="Mở rộng sidebar"
        >
          <ChevronRightIcon className="h-5 w-5 text-amber-600" />
        </button>

        <button
          onClick={handleNewConversation}
          className="p-4 hover:bg-amber-100 transition-colors rounded-lg m-2"
          title="✈️ Chuyến đi mới"
        >
          <PlusIcon className="h-5 w-5 text-amber-600" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`w-64 bg-gradient-to-b from-amber-50 to-orange-100 text-gray-700 flex flex-col border-r border-amber-200 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-amber-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-amber-800">
            🗺️ Chuyến đi của tôi
          </h2>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 hover:bg-amber-100 rounded transition-colors"
            title="Thu gọn sidebar"
          >
            <ChevronDownIcon className="h-4 w-4 text-amber-600" />
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-blue-200 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-amber-600">
            <div className="text-4xl mb-3">🧳</div>
            <p className="font-medium">Chưa có chuyến đi nào</p>
            <p className="text-sm mt-1 text-amber-500">
              Bắt đầu lên kế hoạch chuyến đi đầu tiên của bạn!
            </p>
          </div>
        ) : (
          <div className="p-2">
            {/* New Chat Button */}
            <button
              onClick={handleNewConversation}
              className="w-full flex items-center gap-3 p-3 mb-3 bg-gradient-to-r from-amber-200 to-yellow-200 hover:from-amber-300 hover:to-yellow-300 rounded-lg transition-colors text-amber-800 shadow-sm"
            >
              <PlusIcon className="h-5 w-5" />
              <span>✈️ Lên kế hoạch mới</span>
            </button>

            <div className="space-y-1">
              {sortedConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation.id)}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                    conversation.id === currentConversationId
                      ? "bg-gradient-to-r from-amber-200 to-yellow-200 border border-amber-300 shadow-sm"
                      : "hover:bg-amber-100"
                  }`}
                >
                  {editingId === conversation.id ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => handleEditTitle(conversation.id, editTitle)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleEditTitle(conversation.id, editTitle);
                        } else if (e.key === "Escape") {
                          setEditingId(null);
                        }
                      }}
                      className="w-full bg-white border border-blue-300 text-gray-700 px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-medium truncate pr-2 flex-1 text-amber-800">
                          🌍 {conversation.title}
                        </h4>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => startEditing(conversation, e)}
                            className="p-1 hover:bg-amber-200 rounded text-amber-600"
                            title="Đổi tên chuyến đi"
                          >
                            <PencilIcon className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) =>
                              handleDeleteConversation(conversation.id, e)
                            }
                            className="p-1 hover:bg-red-100 rounded text-red-500"
                            title="Xóa chuyến đi"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {conversation.lastMessage && (
                        <p className="text-xs text-amber-600 mt-1 truncate">
                          💬 {conversation.lastMessage}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2 text-xs text-amber-500">
                        <span>📝 {conversation.messageCount} tin nhắn</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
