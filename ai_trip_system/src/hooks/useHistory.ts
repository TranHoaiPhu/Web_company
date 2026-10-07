"use client";

import { useState, useEffect, useCallback } from 'react';
import { ChatHistoryItem, ChatMessage, TripPlanData } from '@/types/tripHistory';
import authService from '@/services/auth/auth.service';

const CHAT_HISTORY_KEY_PREFIX = 'ai_trip_chat_history';
const TRIP_HISTORY_KEY_PREFIX = 'ai_trip_trip_history';

// Helper function to get user-specific storage key
const getUserStorageKey = (prefix: string): string => {
  if (typeof window !== 'undefined') {
    const user = authService.getStoredUser();
    if (user && user.user_id) {
      return `${prefix}_${user.user_id}`;
    }
    // Fallback to email if user_id not available
    if (user && user.email) {
      return `${prefix}_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
  }
  // Fallback for guest/anonymous users
  return `${prefix}_guest`;
};

// Helper function to get current user ID
const getCurrentUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    const user = authService.getStoredUser();
    return user?.user_id || user?.email || null;
  }
  return null;
};

export function useChatHistory() {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Load history from localStorage when user changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userId = getCurrentUserId();
      setCurrentUserId(userId);
      
      try {
        const storageKey = getUserStorageKey(CHAT_HISTORY_KEY_PREFIX);
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Convert date strings back to Date objects
          const history = parsed.map((item: ChatHistoryItem) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
            messages: item.messages?.map((msg: ChatMessage) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }));
          setChatHistory(history);
        } else {
          // Clear history if no stored data for this user
          setChatHistory([]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        setChatHistory([]);
      }
      setIsLoaded(true);
    }
  }, []);

  // Re-load history when auth state changes
  useEffect(() => {
    const handleAuthChange = () => {
      const userId = getCurrentUserId();
      if (userId !== currentUserId) {
        setCurrentUserId(userId);
        setIsLoaded(false);
        
        try {
          const storageKey = getUserStorageKey(CHAT_HISTORY_KEY_PREFIX);
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            const history = parsed.map((item: ChatHistoryItem) => ({
              ...item,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
              messages: item.messages?.map((msg: ChatMessage) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              }))
            }));
            setChatHistory(history);
          } else {
            setChatHistory([]);
          }
        } catch (error) {
          console.error('Error reloading chat history:', error);
          setChatHistory([]);
        }
        
        setCurrentChatId(null);
        setIsLoaded(true);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('authStateChanged', handleAuthChange);
      window.addEventListener('storage', handleAuthChange);
      
      return () => {
        window.removeEventListener('authStateChanged', handleAuthChange);
        window.removeEventListener('storage', handleAuthChange);
      };
    }
  }, [currentUserId]);

  // Save history to localStorage with user-specific key
  const saveHistory = useCallback((history: ChatHistoryItem[]) => {
    if (typeof window !== 'undefined') {
      try {
        const storageKey = getUserStorageKey(CHAT_HISTORY_KEY_PREFIX);
        localStorage.setItem(storageKey, JSON.stringify(history));
      } catch (error) {
        console.error('Error saving chat history:', error);
      }
    }
  }, []);

  // Create new chat session
  const createChatSession = useCallback((messages: ChatMessage[] = []) => {
    const newSession: ChatHistoryItem = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'chat',
      title: 'Cuộc trò chuyện mới',
      preview: messages.length > 0 ? messages[0].content.slice(0, 50) + '...' : 'Bắt đầu trò chuyện...',
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: messages
    };

    setChatHistory(prev => {
      const updated = [newSession, ...prev].slice(0, 50); // Keep max 50 items
      saveHistory(updated);
      return updated;
    });
    setCurrentChatId(newSession.id);
    
    return newSession;
  }, [saveHistory]);

  // Update chat session with new messages
  const updateChatSession = useCallback((
    sessionId: string,
    messages: ChatMessage[],
    title?: string
  ) => {
    setChatHistory(prev => {
      const updated = prev.map(item => {
        if (item.id === sessionId) {
          const firstUserMessage = messages.find(m => m.role === 'user');
          return {
            ...item,
            title: title || (firstUserMessage ? firstUserMessage.content.slice(0, 30) + '...' : item.title),
            preview: messages.length > 0 ? messages[messages.length - 1].content.slice(0, 50) + '...' : item.preview,
            updatedAt: new Date(),
            messages: messages
          };
        }
        return item;
      });
      saveHistory(updated);
      return updated;
    });
  }, [saveHistory]);

  // Delete chat session
  const deleteChatSession = useCallback((sessionId: string) => {
    setChatHistory(prev => {
      const updated = prev.filter(item => item.id !== sessionId);
      saveHistory(updated);
      return updated;
    });
    if (currentChatId === sessionId) {
      setCurrentChatId(null);
    }
  }, [currentChatId, saveHistory]);

  // Get current chat session
  const getCurrentChat = useCallback(() => {
    return chatHistory.find(item => item.id === currentChatId);
  }, [chatHistory, currentChatId]);

  // Select chat session
  const selectChatSession = useCallback((sessionId: string) => {
    setCurrentChatId(sessionId);
  }, []);

  return {
    chatHistory,
    currentChatId,
    isLoaded,
    createChatSession,
    updateChatSession,
    deleteChatSession,
    getCurrentChat,
    selectChatSession,
    setCurrentChatId
  };
}

export function useTripHistory() {
  const [tripHistory, setTripHistory] = useState<ChatHistoryItem[]>([]);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Load history from localStorage when user changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userId = getCurrentUserId();
      setCurrentUserId(userId);
      
      try {
        const storageKey = getUserStorageKey(TRIP_HISTORY_KEY_PREFIX);
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          const history = parsed.map((item: ChatHistoryItem) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          }));
          setTripHistory(history);
        } else {
          // Clear history if no stored data for this user
          setTripHistory([]);
        }
      } catch (error) {
        console.error('Error loading trip history:', error);
        setTripHistory([]);
      }
      setIsLoaded(true);
    }
  }, []);

  // Re-load history when auth state changes
  useEffect(() => {
    const handleAuthChange = () => {
      const userId = getCurrentUserId();
      if (userId !== currentUserId) {
        setCurrentUserId(userId);
        setIsLoaded(false);
        
        try {
          const storageKey = getUserStorageKey(TRIP_HISTORY_KEY_PREFIX);
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            const history = parsed.map((item: ChatHistoryItem) => ({
              ...item,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
            }));
            setTripHistory(history);
          } else {
            setTripHistory([]);
          }
        } catch (error) {
          console.error('Error reloading trip history:', error);
          setTripHistory([]);
        }
        
        setCurrentTripId(null);
        setIsLoaded(true);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('authStateChanged', handleAuthChange);
      window.addEventListener('storage', handleAuthChange);
      
      return () => {
        window.removeEventListener('authStateChanged', handleAuthChange);
        window.removeEventListener('storage', handleAuthChange);
      };
    }
  }, [currentUserId]);

  // Save history to localStorage with user-specific key
  const saveHistory = useCallback((history: ChatHistoryItem[]) => {
    if (typeof window !== 'undefined') {
      try {
        const storageKey = getUserStorageKey(TRIP_HISTORY_KEY_PREFIX);
        localStorage.setItem(storageKey, JSON.stringify(history));
      } catch (error) {
        console.error('Error saving trip history:', error);
      }
    }
  }, []);

  // Create new trip session
  const createTripSession = useCallback((tripData: TripPlanData) => {
    const newSession: ChatHistoryItem = {
      id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'trip',
      title: `${tripData.departure} → ${tripData.destination}`,
      preview: `${tripData.startDate} - ${tripData.endDate}, ${tripData.travelers} người`,
      createdAt: new Date(),
      updatedAt: new Date(),
      tripData: tripData
    };

    setTripHistory(prev => {
      const updated = [newSession, ...prev].slice(0, 50);
      saveHistory(updated);
      return updated;
    });
    setCurrentTripId(newSession.id);
    
    return newSession;
  }, [saveHistory]);

  // Update trip session
  const updateTripSession = useCallback((
    sessionId: string,
    tripData: TripPlanData
  ) => {
    setTripHistory(prev => {
      const updated = prev.map(item => {
        if (item.id === sessionId) {
          return {
            ...item,
            title: `${tripData.departure} → ${tripData.destination}`,
            preview: `${tripData.startDate} - ${tripData.endDate}, ${tripData.travelers} người`,
            updatedAt: new Date(),
            tripData: tripData
          };
        }
        return item;
      });
      saveHistory(updated);
      return updated;
    });
  }, [saveHistory]);

  // Delete trip session
  const deleteTripSession = useCallback((sessionId: string) => {
    setTripHistory(prev => {
      const updated = prev.filter(item => item.id !== sessionId);
      saveHistory(updated);
      return updated;
    });
    if (currentTripId === sessionId) {
      setCurrentTripId(null);
    }
  }, [currentTripId, saveHistory]);

  // Get current trip session
  const getCurrentTrip = useCallback(() => {
    return tripHistory.find(item => item.id === currentTripId);
  }, [tripHistory, currentTripId]);

  // Select trip session
  const selectTripSession = useCallback((sessionId: string) => {
    setCurrentTripId(sessionId);
  }, []);

  return {
    tripHistory,
    currentTripId,
    isLoaded,
    createTripSession,
    updateTripSession,
    deleteTripSession,
    getCurrentTrip,
    selectTripSession,
    setCurrentTripId
  };
}
