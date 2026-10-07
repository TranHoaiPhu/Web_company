"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Sparkles, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { CHATBOT_SERVICE_URL } from '@/config/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatResponse {
  success: boolean;
  response?: string;
  error?: string;
  metadata?: {
    sessionId?: string;
    responseTime?: number;
  };
}

// Function to render markdown-like text with formatting
const renderMarkdown = (text: string) => {
  // Split by lines first
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    // Handle headers
    if (line.startsWith('### ')) {
      return (
        <h3 key={lineIndex} className="text-lg font-bold text-cyan-300 mt-4 mb-2">
          {renderInlineMarkdown(line.slice(4))}
        </h3>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={lineIndex} className="text-xl font-bold text-cyan-300 mt-4 mb-2">
          {renderInlineMarkdown(line.slice(3))}
        </h2>
      );
    }
    if (line.startsWith('# ')) {
      return (
        <h1 key={lineIndex} className="text-2xl font-bold text-cyan-300 mt-4 mb-2">
          {renderInlineMarkdown(line.slice(2))}
        </h1>
      );
    }
    
    // Handle bullet points with different indentation levels
    if (line.match(/^\s*\*\s+/)) {
      const indent = line.match(/^(\s*)/)?.[1]?.length || 0;
      const content = line.replace(/^\s*\*\s+/, '');
      return (
        <li key={lineIndex} className={`ml-${Math.min(indent, 8)} list-disc list-inside text-gray-200 my-1`}>
          {renderInlineMarkdown(content)}
        </li>
      );
    }
    
    // Handle numbered lists
    if (line.match(/^\s*\d+\.\s+/)) {
      const content = line.replace(/^\s*\d+\.\s+/, '');
      return (
        <li key={lineIndex} className="ml-4 list-decimal list-inside text-gray-200 my-1">
          {renderInlineMarkdown(content)}
        </li>
      );
    }
    
    // Empty lines
    if (line.trim() === '') {
      return <br key={lineIndex} />;
    }
    
    // Regular paragraphs
    return (
      <p key={lineIndex} className="text-gray-200 my-1">
        {renderInlineMarkdown(line)}
      </p>
    );
  });
};

// Helper function to render inline markdown (bold, italic, etc.)
const renderInlineMarkdown = (text: string) => {
  const parts: (string | React.ReactElement)[] = [];
  let remaining = text;
  let keyIndex = 0;
  
  while (remaining.length > 0) {
    // Bold text **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Italic text *text* (but not ** which is bold)
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+?)\*(?!\*)/);
    
    // Find the earliest match
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
      // Add text before the match
      if (earliestIndex > 0) {
        parts.push(remaining.slice(0, earliestIndex));
      }
      
      // Add the formatted text
      if (matchType === 'bold') {
        parts.push(
          <strong key={keyIndex++} className="font-bold text-purple-300">
            {earliestMatch[1]}
          </strong>
        );
      } else if (matchType === 'italic') {
        parts.push(
          <em key={keyIndex++} className="italic text-cyan-200">
            {earliestMatch[1]}
          </em>
        );
      }
      
      remaining = remaining.slice(earliestIndex + earliestMatch[0].length);
    } else {
      // No more matches, add remaining text
      parts.push(remaining);
      break;
    }
  }
  
  return parts.length > 0 ? parts : text;
};

// Interface for location items
export interface LocationItem {
  name: string;
  lat: number;
  lon: number;
  description?: string;
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

  // Try to extract from metadata first
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

interface ChatbotAssistantProps {
  onAddLocations?: (locations: LocationItem[]) => void;
}

export default function ChatbotAssistant({ onAddLocations }: ChatbotAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get chatbot URL with fallback
  const chatbotUrl = CHATBOT_SERVICE_URL || 'https://travel-chatbot-40205731279.us-central1.run.app';

  useEffect(() => {
    // Generate session ID on mount
    const newSessionId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);

    // Add welcome message
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI của bạn. Tôi có thể giúp bạn tìm kiếm địa điểm, lên kế hoạch hành trình, hoặc trả lời bất kỳ câu hỏi nào về du lịch. Bạn cần gì hôm nay?',
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      console.log('Chatbot URL:', chatbotUrl); // Debug log

      const response = await fetch(`${chatbotUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId: sessionId,
          history: messages.slice(-10).map(m => ({ // Send last 10 messages as context
            role: m.role,
            content: m.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();

      if (data.success && data.response) {
        const assistantMessage: Message = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Extract locations from response and notify parent
        const extractedLocations = extractLocationsFromResponse(
          data.response,
          data.metadata as Record<string, unknown>
        );
        
        if (extractedLocations.length > 0 && onAddLocations) {
          onAddLocations(extractedLocations);
        }
      } else {
        throw new Error(data.error || 'Không nhận được phản hồi từ chatbot');
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Đã xảy ra lỗi';
      setError('Xin lỗi, không thể kết nối đến chatbot. Vui lòng thử lại sau.');

      // Add error message to chat
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu của bạn: ${errorMsg}. Vui lòng thử lại sau.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    { icon: MessageSquare, text: 'Tìm địa điểm', query: 'Gợi ý cho tôi những địa điểm du lịch nổi tiếng ở Việt Nam' },
    { icon: Sparkles, text: 'Gợi ý hành trình', query: 'Lên kế hoạch du lịch Đà Lạt 3 ngày 2 đêm' },
  ];

  const handleSuggestedClick = (query: string) => {
    setInput(query);
  };

  return (
    <div className="h-full flex flex-col backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl overflow-hidden hover:border-purple-500/30 transition-all duration-500">
      {/* Header */}
      <div className="relative px-8 py-6 border-b border-white/10 bg-gradient-to-r from-purple-600/10 to-cyan-600/10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500 blur-xl opacity-50 animate-pulse" />
              <MessageSquare className="relative w-7 h-7 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                AI Assistant
              </h2>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Đang hoạt động
              </p>
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
            {message.role === 'assistant' && (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            )}
            <div className={`flex-1 max-w-[80%] ${
              message.role === 'user'
                ? 'bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl rounded-tr-sm'
                : 'bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-2xl rounded-tl-sm backdrop-blur-sm border border-white/10'
            } p-5`}>
              <div className="text-gray-200 leading-relaxed break-words">
                {message.role === 'assistant' 
                  ? renderMarkdown(message.content)
                  : <p className="whitespace-pre-wrap">{message.content}</p>
                }
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {message.role === 'user' && (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
            <div className="flex-1 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-2xl rounded-tl-sm p-5 backdrop-blur-sm border border-white/10">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}

        {/* Suggested Questions - Show only when no messages (except welcome) */}
        {messages.length === 1 && !isLoading && (
          <div className="grid grid-cols-2 gap-3 mt-6">
            {suggestedQuestions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleSuggestedClick(action.query)}
                className="group/btn relative p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-0 group-hover/btn:opacity-10 transition-opacity" />
                <action.icon className="w-5 h-5 text-gray-400 group-hover/btn:text-white transition-colors mb-2" />
                <p className="text-sm text-gray-300 text-left">{action.text}</p>
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-8 py-3 bg-red-500/10 border-t border-red-500/20 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="px-8 py-6 border-t border-white/10 bg-gradient-to-r from-purple-600/5 to-cyan-600/5 flex-shrink-0">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn của bạn..."
            disabled={isLoading}
            className="w-full px-6 py-4 pr-14 bg-white/10 rounded-2xl border border-white/20 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-white placeholder-gray-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 group/send disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <ChevronRight className="w-5 h-5 text-white group-hover/send:translate-x-0.5 transition-transform" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
