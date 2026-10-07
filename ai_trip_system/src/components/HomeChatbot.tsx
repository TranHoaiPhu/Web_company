"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import { useMessages, Message } from "@/hooks/useMessages";

interface ChatResponse {
  success: boolean;
  response?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

// Function to render markdown-like text with formatting
const renderMessageText = (text: string, isUser: boolean = false) => {
  const lines = text.split("\n");

  return lines.map((line, lineIndex) => {
    // Handle headers
    if (line.startsWith('### ')) {
      return (
        <h3 key={lineIndex} className="text-base font-bold text-blue-700 mt-3 mb-1">
          {renderInlineMarkdown(line.slice(4), isUser)}
        </h3>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={lineIndex} className="text-lg font-bold text-blue-700 mt-3 mb-1">
          {renderInlineMarkdown(line.slice(3), isUser)}
        </h2>
      );
    }
    if (line.startsWith('# ')) {
      return (
        <h1 key={lineIndex} className="text-xl font-bold text-blue-700 mt-3 mb-1">
          {renderInlineMarkdown(line.slice(2), isUser)}
        </h1>
      );
    }
    
    // Handle bullet points
    if (line.match(/^\s*\*\s+/)) {
      const indent = line.match(/^(\s*)/)?.[1]?.length || 0;
      const paddingClass = indent >= 4 ? 'pl-6' : 'pl-3';
      const content = line.replace(/^\s*\*\s+/, '');
      return (
        <div key={lineIndex} className={`flex items-start ${paddingClass} my-0.5`}>
          <span className="mr-2 text-blue-500">•</span>
          <span>{renderInlineMarkdown(content, isUser)}</span>
        </div>
      );
    }
    
    // Handle numbered lists
    if (line.match(/^\s*\d+\.\s+/)) {
      const match = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (match) {
        const indent = match[1]?.length || 0;
        const paddingClass = indent >= 4 ? 'pl-6' : 'pl-3';
        const number = match[2];
        const content = match[3];
        return (
          <div key={lineIndex} className={`flex items-start ${paddingClass} my-0.5`}>
            <span className="mr-2 text-blue-500 font-medium">{number}.</span>
            <span>{renderInlineMarkdown(content, isUser)}</span>
          </div>
        );
      }
    }
    
    // Empty lines
    if (line.trim() === '') {
      return <div key={lineIndex} className="h-2" />;
    }
    
    // Regular lines
    return (
      <span key={lineIndex}>
        {renderInlineMarkdown(line, isUser)}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    );
  });
};

// Helper function to render inline markdown (bold, italic)
const renderInlineMarkdown = (text: string, isUser: boolean = false) => {
  const parts: (string | React.ReactElement)[] = [];
  let remaining = text;
  let keyIndex = 0;
  
  while (remaining.length > 0) {
    // Bold text **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Italic text *text* (single asterisk, not double)
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+?)\*(?!\*)/);
    
    const boldIndex = boldMatch ? remaining.indexOf(boldMatch[0]) : -1;
    const italicIndex = italicMatch ? remaining.indexOf(italicMatch[0]) : -1;
    
    let earliestIndex = -1;
    let earliestMatch: RegExpMatchArray | null = null;
    let matchType: 'bold' | 'italic' | null = null;
    
    if (boldIndex !== -1 && (italicIndex === -1 || boldIndex <= italicIndex)) {
      earliestIndex = boldIndex;
      earliestMatch = boldMatch;
      matchType = 'bold';
    } else if (italicIndex !== -1) {
      earliestIndex = italicIndex;
      earliestMatch = italicMatch;
      matchType = 'italic';
    }
    
    if (earliestMatch && earliestIndex !== -1) {
      if (earliestIndex > 0) {
        parts.push(remaining.slice(0, earliestIndex));
      }
      
      if (matchType === 'bold') {
        parts.push(
          <strong key={keyIndex++} className={`font-bold ${isUser ? "text-yellow-100" : "text-amber-700"}`}>
            {earliestMatch[1]}
          </strong>
        );
      } else if (matchType === 'italic') {
        parts.push(
          <em key={keyIndex++} className={`italic ${isUser ? "text-blue-100" : "text-gray-600"}`}>
            {earliestMatch[1]}
          </em>
        );
      }
      
      remaining = remaining.slice(earliestIndex + earliestMatch[0].length);
    } else {
      parts.push(remaining);
      break;
    }
  }
  
  return parts.length > 0 ? parts : text;
};

// Interface for location items extracted from AI responses
export interface LocationItem {
  name: string;
  lat: number;
  lon: number;
  description?: string;
}

interface HomeChatbotProps {
  conversationId?: string;
  onConversationCreate?: (conversationId: string) => void;
  onLocationsUpdate?: (locations: LocationItem[]) => void;
  onAddLocations?: (locations: LocationItem[]) => void;
  onClearLocations?: () => void;
}

// Database of popular Vietnam locations for mapping
const VIETNAM_LOCATIONS: Record<string, { lat: number; lon: number }> = {
  // Hanoi locations
  "hồ hoàn kiếm": { lat: 21.0285, lon: 105.8542 },
  "hồ gươm": { lat: 21.0285, lon: 105.8542 },
  "đền ngọc sơn": { lat: 21.0309, lon: 105.8528 },
  "văn miếu": { lat: 21.0276, lon: 105.8356 },
  "văn miếu quốc tử giám": { lat: 21.0276, lon: 105.8356 },
  "quốc tử giám": { lat: 21.0276, lon: 105.8356 },
  "lăng bác": { lat: 21.0369, lon: 105.8344 },
  "lăng chủ tịch hồ chí minh": { lat: 21.0369, lon: 105.8344 },
  "phố đường tàu": { lat: 21.0291, lon: 105.8464 },
  "train street": { lat: 21.0291, lon: 105.8464 },
  "nhà thờ lớn hà nội": { lat: 21.0285, lon: 105.8490 },
  "nhà thờ lớn": { lat: 21.0285, lon: 105.8490 },
  "bảo tàng phụ nữ việt nam": { lat: 21.0249, lon: 105.8517 },
  "chợ đồng xuân": { lat: 21.0381, lon: 105.8497 },
  "phố cổ hà nội": { lat: 21.0341, lon: 105.8500 },
  "tạ hiện": { lat: 21.0332, lon: 105.8527 },
  "cà phê giảng": { lat: 21.0344, lon: 105.8525 },
  "phở thìn": { lat: 21.0115, lon: 105.8591 },
  "bún chả hương liên": { lat: 21.0124, lon: 105.8489 },
  "hoàng thành thăng long": { lat: 21.0355, lon: 105.8400 },
  "hà nội": { lat: 21.0285, lon: 105.8542 },
  
  // Ho Chi Minh City
  "dinh độc lập": { lat: 10.7769, lon: 106.6955 },
  "nhà thờ đức bà": { lat: 10.7798, lon: 106.6990 },
  "bưu điện trung tâm": { lat: 10.7798, lon: 106.7004 },
  "chợ bến thành": { lat: 10.7725, lon: 106.6980 },
  "phố đi bộ nguyễn huệ": { lat: 10.7731, lon: 106.7027 },
  "sài gòn": { lat: 10.7769, lon: 106.7009 },
  "hồ chí minh": { lat: 10.7769, lon: 106.7009 },
  "tp hcm": { lat: 10.7769, lon: 106.7009 },
  
  // Da Nang
  "đà nẵng": { lat: 16.0544, lon: 108.2022 },
  "bà nà hills": { lat: 15.9977, lon: 107.9875 },
  "cầu rồng": { lat: 16.0610, lon: 108.2270 },
  "cầu vàng": { lat: 15.9932, lon: 107.9853 },
  "bãi biển mỹ khê": { lat: 16.0598, lon: 108.2477 },
  "ngũ hành sơn": { lat: 16.0027, lon: 108.2627 },
  
  // Hoi An
  "hội an": { lat: 15.8801, lon: 108.3380 },
  "phố cổ hội an": { lat: 15.8801, lon: 108.3380 },
  "chùa cầu": { lat: 15.8775, lon: 108.3264 },
  
  // Hue
  "huế": { lat: 16.4637, lon: 107.5909 },
  "đại nội huế": { lat: 16.4699, lon: 107.5783 },
  "kinh thành huế": { lat: 16.4699, lon: 107.5783 },
  "lăng tự đức": { lat: 16.4574, lon: 107.5432 },
  "chùa thiên mụ": { lat: 16.4539, lon: 107.5512 },
  
  // Da Lat
  "đà lạt": { lat: 11.9404, lon: 108.4583 },
  "hồ xuân hương": { lat: 11.9383, lon: 108.4386 },
  "thung lũng tình yêu": { lat: 11.9598, lon: 108.4283 },
  "langbiang": { lat: 12.0508, lon: 108.4380 },
  
  // Nha Trang
  "nha trang": { lat: 12.2388, lon: 109.1967 },
  "tháp bà ponagar": { lat: 12.2656, lon: 109.1958 },
  "vinpearl nha trang": { lat: 12.2156, lon: 109.2344 },
  
  // Phu Quoc
  "phú quốc": { lat: 10.2899, lon: 103.9840 },
  "bãi sao": { lat: 10.1577, lon: 104.0178 },
  "dinh cậu": { lat: 10.2168, lon: 103.9593 },
  
  // Ha Long
  "hạ long": { lat: 20.9101, lon: 107.1839 },
  "vịnh hạ long": { lat: 20.9101, lon: 107.1839 },
  
  // Sapa
  "sapa": { lat: 22.3364, lon: 103.8438 },
  "sa pa": { lat: 22.3364, lon: 103.8438 },
  "fansipan": { lat: 22.3033, lon: 103.7750 },
  
  // Ninh Binh
  "ninh bình": { lat: 20.2539, lon: 105.9750 },
  "tràng an": { lat: 20.2508, lon: 105.9363 },
  "tam cốc": { lat: 20.2148, lon: 105.9298 },
};

// Helper function to extract locations from AI response
const extractLocationsFromResponse = (
  response: string,
  metadata?: Record<string, unknown>
): LocationItem[] => {
  const locations: LocationItem[] = [];

  // First, try to extract from metadata if available
  if (metadata?.locations && Array.isArray(metadata.locations)) {
    for (const loc of metadata.locations) {
      if (loc && typeof loc === 'object' && 'lat' in loc && 'lon' in loc && 'name' in loc) {
        locations.push({
          name: String(loc.name),
          lat: Number(loc.lat),
          lon: Number(loc.lon),
          description: loc.description ? String(loc.description) : undefined,
        });
      }
    }
  }

  // If no locations from metadata, try to find known locations in the response text
  if (locations.length === 0) {
    const responseLower = response.toLowerCase();
    
    // Sort location names by length (longer first) to match more specific names first
    const sortedLocations = Object.entries(VIETNAM_LOCATIONS).sort(
      (a, b) => b[0].length - a[0].length
    );
    
    // Search for known locations in the response
    for (const [locationName, coords] of sortedLocations) {
      if (responseLower.includes(locationName)) {
        // Avoid duplicates by name (not coordinates, to allow nearby locations)
        const displayName = locationName.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        // Check if already added by name
        if (!locations.some(loc => loc.name.toLowerCase() === displayName.toLowerCase())) {
          locations.push({
            name: displayName,
            lat: coords.lat,
            lon: coords.lon,
          });
        }
      }
    }
  }

  // Also try to match explicit coordinates in text
  const coordPattern = /([\w\s]+?)\s*[:\-]?\s*(?:tọa độ|coordinates?|vị trí)?\s*[:\-]?\s*[\[\(]?\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*[\]\)]?/gi;
  
  let match;
  while ((match = coordPattern.exec(response)) !== null) {
    const name = match[1].trim();
    const lat = parseFloat(match[2]);
    const lon = parseFloat(match[3]);
    
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      if (!locations.some(loc => loc.lat === lat && loc.lon === lon)) {
        locations.push({ name, lat, lon });
      }
    }
  }

  // Limit to 10 locations max
  return locations.slice(0, 10);
};

export default function HomeChatbot({
  conversationId,
  onConversationCreate,
  onAddLocations,
}: HomeChatbotProps) {
  const { isLoggedIn } = useAuth();
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | undefined
  >(conversationId);
  const [userId, setUserId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const CHATBOT_SERVICE_URL =
    process.env.NEXT_PUBLIC_CHATBOT_SERVICE_URL || "https://travel-chatbot-40205731279.us-central1.run.app";

  // Use messages hook for API data
  const {
    messages: apiMessages,
    startConversation,
    addMessage,
    getWelcomeMessage,
    mutate: mutateMessages,
  } = useMessages({
    conversationId: currentConversationId,
    userId: userId || undefined,
  });

  // Use API messages when available, fallback to local for new conversations
  const messages =
    currentConversationId && apiMessages.length > 0
      ? apiMessages
      : localMessages;

  // Check if we should show welcome message (no real messages yet)
  const shouldShowWelcome = messages.length === 0;

  // Get userId from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("current_user_id");
      setUserId(storedUserId);
    }
  }, [isLoggedIn]);

  const scrollToBottom = () => {
    // Scroll within the chat container only, not the entire page
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Add a small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => clearTimeout(timer);
  }, [messages]);

  const pingAndCheckHealth = useCallback(async () => {
    try {
      console.log("🚀 Testing chatbot connection...");
      setIsConnected(false);

      const response = await fetch(`${CHATBOT_SERVICE_URL}/api/health`);
      console.log("📡 Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("📊 Health data:", data);

        // Simple check - if we get valid response, server is ready
        if (data && data.status === "ok") {
          console.log("✅ Chatbot ready!");
          setIsConnected(true);
        } else {
          console.log("⚠️ Invalid response format");
          setIsConnected(false);
        }
      } else {
        console.log("❌ Health check failed:", response.status);
        setIsConnected(false);
      }
    } catch (error: unknown) {
      console.error("❌ Connection error:", error);
      setIsConnected(false);
    }
  }, [CHATBOT_SERVICE_URL]);

  useEffect(() => {
    // Ping server first to wake it up, then check health
    pingAndCheckHealth();
  }, [pingAndCheckHealth]);

  useEffect(() => {
    setCurrentConversationId(conversationId);
  }, [conversationId]);

  // const checkChatbotHealth = async () => {
  //   // This function is now simplified since pingAndCheckHealth handles the main logic
  //   console.log('🔄 Retry health check...');
  //   pingAndCheckHealth();
  // };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const messageText = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      // Conversation API integration (only for logged in users)
      let conversationIdToUse = currentConversationId;

      if (userId) {
        // Create conversation if this is the first message
        if (!conversationIdToUse) {
          // Create conversation with first user message as title
          const result = await startConversation(
            messageText, // Use first user message as title
            messageText // Start with user message (no welcome message in API)
          );

          if (result) {
            conversationIdToUse = result.conversationId;
            setCurrentConversationId(conversationIdToUse);

            onConversationCreate?.(conversationIdToUse);
          }
        } else {
          // Add user message to existing conversation
          await addMessage(messageText, "user");
        }
      }

      // Get AI response
      const recentHistory = messages.slice(-6); // Last 3 exchanges (6 messages)

      let response;
      let data: ChatResponse | null = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          response = await fetch("/api/chatbot", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: messageText,
              history: recentHistory,
              conversationId: conversationIdToUse,
              userId: userId || "anonymous",
            }),
          });

          data = await response.json();

          if (data?.success) {
            break;
          }

          if (response.ok) {
            break;
          }

          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * retryCount)
            );
          }
        } catch (fetchError) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw fetchError;
          }
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount)
          );
        }
      }

      // Extract locations from AI response and update parent
      if (data?.success && data.response) {
        const extractedLocations = extractLocationsFromResponse(
          data.response,
          data.metadata
        );
        
        if (extractedLocations.length > 0) {
          // Add new locations to the map
          onAddLocations?.(extractedLocations);
        }
      }

      // Save assistant response to API (only for logged in users)
      if (userId && conversationIdToUse) {
        if (data?.success && data.response) {
          await addMessage(data.response, "assistant", data.metadata);
        } else {
          await addMessage(
            "Xin lỗi, tôi không thể trả lời câu hỏi này.",
            "assistant"
          );
        }
        // Refresh messages from API
        mutateMessages();
      } else {
        // For non-logged in users, add to local messages
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text:
            data?.success && data.response
              ? data.response
              : "Xin lỗi, tôi không thể trả lời câu hỏi này.",
          isUser: false,
          timestamp: new Date(),
          metadata: data?.metadata,
        };

        const userMessage: Message = {
          id: Date.now().toString(),
          text: messageText,
          isUser: true,
          timestamp: new Date(),
        };

        setLocalMessages((prev) => [...prev, userMessage, botMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Show error message locally (won't be saved to API)
      // You could implement a local error state here if needed
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full bg-gradient-to-b shadow-md overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Trợ lý Du lịch Tourmate
            </h2>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
              <span className="text-xs text-gray-500">
                {isConnected ? "Sẵn sàng hỗ trợ" : "Mất kết nối"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto">
        {/* Welcome Message - Always show when no real messages */}
        {shouldShowWelcome && (
          <div className="w-full py-6 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4">
              <div className="flex justify-start">
                <div className="max-w-2xl bg-amber-50 border border-amber-200 px-6 py-4 rounded-2xl shadow-sm">
                  <div className="text-amber-800 leading-relaxed">
                    <div className="whitespace-pre-wrap">
                      {renderMessageText(getWelcomeMessage().text)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Regular Messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`w-full py-4 ${message.isUser ? "bg-white" : "bg-gray-50"
              }`}
          >
            <div className="max-w-4xl mx-auto px-4">
              {message.isUser ? (
                // User message - right aligned with background
                <div className="flex justify-end">
                  <div className="max-w-2xl bg-blue-600 text-white px-4 py-3 rounded-2xl shadow-sm">
                    <div className="whitespace-pre-wrap">
                      {renderMessageText(message.text, message.isUser)}
                    </div>
                    <div className="text-xs mt-1 opacity-70">
                      {message.timestamp instanceof Date
                        ? message.timestamp.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Ho_Chi_Minh",
                        })
                        : new Date(message.timestamp).toLocaleTimeString(
                          "vi-VN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Ho_Chi_Minh",
                          }
                        )}
                    </div>
                  </div>
                </div>
              ) : (
                // Bot message - full width, no background
                <div className="w-full">
                  <div className="text-gray-800 leading-relaxed">
                    <div className="whitespace-pre-wrap">
                      {renderMessageText(message.text, message.isUser)}
                    </div>
                    <div className="text-xs mt-2 text-gray-500">
                      {message.timestamp instanceof Date
                        ? message.timestamp.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Ho_Chi_Minh",
                        })
                        : new Date(message.timestamp).toLocaleTimeString(
                          "vi-VN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Ho_Chi_Minh",
                          }
                        )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="w-full py-4 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4">
              <div className="w-full">
                <div className="text-gray-600 leading-relaxed">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">
                      🔍 Đang tìm kiếm thông tin...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nhập câu hỏi về du lịch..."
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={!isConnected || isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading || !isConnected}
              className="bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!isConnected && (
          <div className="mt-3 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2">
              <div className="animate-spin w-3 h-3 border border-amber-400 border-t-transparent rounded-full"></div>
              <span>🚀 Đang đánh thức server... (có thể mất 1-2 phút)</span>
            </div>
            <div className="text-xs text-amber-500 mt-2 flex items-center justify-between">
              <span>💡 Server đang cold start, vui lòng đợi...</span>
              <button
                onClick={() => {
                  console.log("🔄 User click retry");
                  pingAndCheckHealth();
                }}
                className="text-blue-600 hover:text-blue-800 underline ml-2"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
