"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useChatHistory } from '@/hooks/useHistory';
import HistorySidebar from '@/components/HistorySidebar';
import { MessageSquare, Sparkles, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import type { LocationItem } from '@/components/Map';
import type { ChatMessage, ChatHistoryItem } from '@/types/tripHistory';

// Use Leaflet Map instead of Google Maps to avoid API errors
const MapView = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-slate-800/50 rounded-3xl">
      <div className="text-gray-400">Đang tải bản đồ...</div>
    </div>
  ),
});

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ChatResponse interface no longer needed - using chatbotHelper types

// Vietnam locations database for mapping
const VIETNAM_LOCATIONS: Record<string, { lat: number; lon: number }> = {
  "hồ hoàn kiếm": { lat: 21.0285, lon: 105.8542 },
  "hồ gươm": { lat: 21.0285, lon: 105.8542 },
  "đền ngọc sơn": { lat: 21.0309, lon: 105.8528 },
  "văn miếu": { lat: 21.0276, lon: 105.8356 },
  "lăng bác": { lat: 21.0369, lon: 105.8344 },
  "nhà thờ lớn hà nội": { lat: 21.0285, lon: 105.8490 },
  "chợ đồng xuân": { lat: 21.0381, lon: 105.8497 },
  "phố cổ hà nội": { lat: 21.0341, lon: 105.8500 },
  "hà nội": { lat: 21.0285, lon: 105.8542 },
  "dinh độc lập": { lat: 10.7769, lon: 106.6955 },
  "nhà thờ đức bà": { lat: 10.7798, lon: 106.6990 },
  "chợ bến thành": { lat: 10.7725, lon: 106.6980 },
  "sài gòn": { lat: 10.7769, lon: 106.7009 },
  "hồ chí minh": { lat: 10.7769, lon: 106.7009 },
  "đà nẵng": { lat: 16.0544, lon: 108.2022 },
  "bà nà hills": { lat: 15.9977, lon: 107.9875 },
  "cầu vàng": { lat: 15.9932, lon: 107.9853 },
  "hội an": { lat: 15.8801, lon: 108.3380 },
  "huế": { lat: 16.4637, lon: 107.5909 },
  "đà lạt": { lat: 11.9404, lon: 108.4583 },
  "nha trang": { lat: 12.2388, lon: 109.1967 },
  "phú quốc": { lat: 10.2899, lon: 103.9840 },
  "hạ long": { lat: 20.9101, lon: 107.1839 },
  "sapa": { lat: 22.3364, lon: 103.8438 },
  "sa pa": { lat: 22.3364, lon: 103.8438 },
  "ninh bình": { lat: 20.2539, lon: 105.9750 },
  "tràng an": { lat: 20.2508, lon: 105.9363 },
};

// Extract locations from AI response using Google Places API
const extractLocationsFromResponse = async (response: string): Promise<LocationItem[]> => {
  const locations: LocationItem[] = [];

  // First try hardcoded Vietnam locations for quick match
  const responseLower = response.toLowerCase();
  const sortedLocations = Object.entries(VIETNAM_LOCATIONS).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [locationName, coords] of sortedLocations) {
    if (responseLower.includes(locationName)) {
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

  // If found locations from hardcoded list, return them
  if (locations.length > 0) {
    console.log("Found locations from hardcoded list:", locations);
    return locations.slice(0, 10);
  }

  // Otherwise, try to extract location names from text and geocode them
  console.log("No hardcoded locations found, trying Google Places geocoding...");

  // Extract potential location names from text (looking for patterns)
  // Pattern: numbered lists like "1. Địa điểm", "**Địa điểm**", etc.
  const locationPatterns = [
    /\d+\.\s+\*\*([^*]+)\*\*/g,  // 1. **Location Name**
    /\d+\.\s+([^(\n]+)(?:\s+\(|$)/g,  // 1. Location Name (rating) or 1. Location Name\n
    /\*\*([^*]+)\*\*/g,  // **Location Name**
  ];

  const potentialLocations = new Set<string>();

  for (const pattern of locationPatterns) {
    let match;
    while ((match = pattern.exec(response)) !== null) {
      const locationName = match[1].trim();
      // Filter out generic words
      if (locationName.length > 3 && !locationName.includes('http') && !locationName.includes('ngày')) {
        potentialLocations.add(locationName);
      }
    }
  }

  console.log("Potential locations found:", Array.from(potentialLocations));

  // Geocode using Google Places API
  if (potentialLocations.size > 0 && typeof window !== 'undefined' && window.google?.maps) {
    try {
      const { Place } = (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;

      for (const locationName of Array.from(potentialLocations).slice(0, 10)) {
        try {
          const { places } = await Place.searchByText({
            textQuery: `${locationName}, Vietnam`,
            fields: ['displayName', 'location'],
            maxResultCount: 1,
            language: 'vi',
            region: 'VN',
          });

          if (places && places.length > 0) {
            const place = places[0];
            const lat = place.location?.lat();
            const lon = place.location?.lng();

            if (typeof lat === 'number' && typeof lon === 'number') {
              locations.push({
                name: place.displayName || locationName,
                lat: lat,
                lon: lon,
              });
            }
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error geocoding ${locationName}:`, error);
        }
      }

      console.log("Geocoded locations:", locations);
    } catch (error) {
      console.error("Error loading Google Places for geocoding:", error);
    }
  }

  return locations.slice(0, 10);
};

// Parse inline markdown (bold, italic, etc.)
const parseInlineMarkdown = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let keyCounter = 0;

  // Match **bold** or __bold__
  const boldRegex = /(\*\*|__)(.*?)\1/g;

  const textWithPlaceholders = text.replace(boldRegex, (match, delimiter, content, offset) => {
    return `__BOLD_${offset}_${content}__`;
  });

  // Split by bold placeholders
  const segments = textWithPlaceholders.split(/(__BOLD_\d+_.*?__)/);

  segments.forEach((segment) => {
    if (segment.startsWith('__BOLD_')) {
      // Extract the bold content
      const content = segment.match(/__BOLD_\d+_(.*?)__/)?.[1];
      if (content) {
        parts.push(
          <strong key={`bold-${keyCounter++}`} className="font-bold text-cyan-300">
            {content}
          </strong>
        );
      }
    } else if (segment) {
      parts.push(segment);
    }
  });

  return parts.length > 0 ? parts : [text];
};

// Render markdown-like text with formatting
const renderMarkdown = (text: string) => {
  const lines = text.split('\n');

  return lines.map((line, lineIndex) => {
    if (line.startsWith('### ')) {
      return (
        <h3 key={lineIndex} className="text-lg font-bold text-cyan-300 mt-4 mb-2">
          {parseInlineMarkdown(line.slice(4))}
        </h3>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={lineIndex} className="text-xl font-bold text-cyan-300 mt-4 mb-2">
          {parseInlineMarkdown(line.slice(3))}
        </h2>
      );
    }
    if (line.startsWith('# ')) {
      return (
        <h1 key={lineIndex} className="text-2xl font-bold text-cyan-300 mt-4 mb-2">
          {parseInlineMarkdown(line.slice(2))}
        </h1>
      );
    }

    if (line.match(/^\s*\*\s+/)) {
      const content = line.replace(/^\s*\*\s+/, '');
      return (
        <li key={lineIndex} className="ml-4 list-disc list-inside text-gray-200 my-1">
          {parseInlineMarkdown(content)}
        </li>
      );
    }

    if (line.match(/^\s*\d+\.\s+/)) {
      const content = line.replace(/^\s*\d+\.\s+/, '');
      return (
        <li key={lineIndex} className="ml-4 list-decimal list-inside text-gray-200 my-1">
          {parseInlineMarkdown(content)}
        </li>
      );
    }

    if (line.trim() === '') {
      return <br key={lineIndex} />;
    }

    return (
      <p key={lineIndex} className="text-gray-200 my-1">
        {parseInlineMarkdown(line)}
      </p>
    );
  });
};

const AssistancePage = () => {
  const [isMapExpanded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [locations, setLocations] = useState<LocationItem[]>([]);
  // Desktop inline sidebar open state
  const [isHistoryOpenDesktop, setIsHistoryOpenDesktop] = useState(true);
  // Mobile overlay sidebar open state
  const [isHistoryOpenMobile, setIsHistoryOpenMobile] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Chat history hook
  const {
    chatHistory,
    currentChatId,
    isLoaded,
    createChatSession,
    updateChatSession,
    deleteChatSession,
    selectChatSession,
    setCurrentChatId
  } = useChatHistory();

  // No longer need backend URL - using client-side Google Places API

  // Initialize session
  useEffect(() => {
    const newSessionId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);

    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI của bạn. Tôi có thể giúp bạn tìm kiếm địa điểm, lên kế hoạch hành trình, hoặc trả lời bất kỳ câu hỏi nào về du lịch. Bạn cần gì hôm nay?',
      timestamp: new Date()
    }]);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update history when messages change (except welcome message)
  useEffect(() => {
    if (messages.length > 1 && currentChatId) {
      const chatMessages: ChatMessage[] = messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }));
      updateChatSession(currentChatId, chatMessages);
    }
  }, [messages, currentChatId, updateChatSession]);

  // Callbacks for location management
  const handleClearLocations = useCallback(() => {
    setLocations([]);
  }, []);

  const handleAddLocations = useCallback((newLocations: LocationItem[]) => {
    setLocations(prev => {
      const existingCoords = new Set(prev.map(loc => `${loc.lat},${loc.lon}`));
      const uniqueNew = newLocations.filter(
        loc => !existingCoords.has(`${loc.lat},${loc.lon}`)
      );
      return [...prev, ...uniqueNew];
    });
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Send message function
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    // If this is the first user message, create a new chat session
    if (!currentChatId && messages.length <= 1) {
      const chatMessages: ChatMessage[] = [{
        id: userMessage.id,
        role: userMessage.role,
        content: userMessage.content,
        timestamp: userMessage.timestamp
      }];
      createChatSession(chatMessages);
    }

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      // Call backend AI chatbot service (deployed on Cloud Run)
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.response) {
        const assistantMessage: Message = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => {
          const newMessages = [...prev, assistantMessage];

          // Update chat history with new messages
          if (currentChatId) {
            const chatMessages: ChatMessage[] = newMessages.map(m => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: m.timestamp
            }));
            updateChatSession(currentChatId, chatMessages, newMessages[0]?.content || 'New Chat');
          }

          return newMessages;
        });

        // Add locations from chatbot response to map
        // Priority 1: Use locations array from backend if available
        if (data.locations && data.locations.length > 0) {
          console.log("Using locations from backend:", data.locations);
          handleAddLocations(data.locations);
        } else {
          // Priority 2: Extract locations from text response
          extractLocationsFromResponse(data.response).then(extractedLocations => {
            if (extractedLocations.length > 0) {
              console.log("Extracted locations from text:", extractedLocations);
              handleAddLocations(extractedLocations);
            } else {
              console.log("No locations found in response");
            }
          }).catch(error => {
            console.error("Error extracting locations:", error);
          });
        }
      } else {
        throw new Error(data.error || 'Không thể xử lý tin nhắn');
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Đã xảy ra lỗi';
      setError('Xin lỗi, không thể kết nối đến chatbot. Vui lòng thử lại sau.');

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

  // Handle selecting a history item
  const handleSelectHistoryItem = (item: ChatHistoryItem) => {
    selectChatSession(item.id);
    if (item.messages && item.messages.length > 0) {
      const loadedMessages: Message[] = item.messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp)
      }));
      setMessages(loadedMessages);
      setLocations([]);
      
      // Extract locations from all assistant messages
      item.messages
        .filter(m => m.role === 'assistant')
        .forEach(async (m) => {
          const locs = await extractLocationsFromResponse(m.content);
          if (locs.length > 0) {
            handleAddLocations(locs);
          }
        });
    }
    setIsHistoryOpenMobile(false);
  };

  // Handle creating new chat
  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI của bạn. Tôi có thể giúp bạn tìm kiếm địa điểm, lên kế hoạch hành trình, hoặc trả lời bất kỳ câu hỏi nào về du lịch. Bạn cần gì hôm nay?',
      timestamp: new Date()
    }]);
    setLocations([]);
    setError('');
    setIsHistoryOpenMobile(false);
  };

  const suggestedQuestions = [
    { icon: MessageSquare, text: 'Tìm địa điểm', query: 'Gợi ý cho tôi những địa điểm du lịch nổi tiếng ở Việt Nam' },
    { icon: Sparkles, text: 'Gợi ý hành trình', query: 'Lên kế hoạch du lịch Đà Lạt 3 ngày 2 đêm' },
  ];

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 pt-36">
      {/* Mobile: overlay history sidebar with floating toggle */}
      {isLoaded && (
        <div className="lg:hidden">
          <HistorySidebar
            isOpen={isHistoryOpenMobile}
            onToggle={() => setIsHistoryOpenMobile(!isHistoryOpenMobile)}
            historyItems={chatHistory}
            currentItemId={currentChatId}
            onSelectItem={handleSelectHistoryItem}
            onDeleteItem={deleteChatSession}
            onNewItem={handleNewChat}
            type="chat"
            title="Lịch sử trò chuyện"
          />
        </div>
      )}

      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Gradient Orbs */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      {/* Cursor Glow Effect */}
      <div
        className="pointer-events-none fixed w-96 h-96 rounded-full opacity-30 transition-all duration-300 ease-out"
        style={{
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        }}
      />

      {/* Main Content Container */}
      <div className="relative h-full flex items-stretch gap-6 p-6 transition-all duration-500">
        {/* Desktop: inline history sidebar as a collapsible column */}
        {isLoaded && (
          <div className="hidden lg:block">
            <HistorySidebar
              isOpen={isHistoryOpenDesktop}
              onToggle={() => setIsHistoryOpenDesktop(!isHistoryOpenDesktop)}
              historyItems={chatHistory}
              currentItemId={currentChatId}
              onSelectItem={handleSelectHistoryItem}
              onDeleteItem={deleteChatSession}
              onNewItem={handleNewChat}
              type="chat"
              title="Lịch sử trò chuyện"
              theme="dark"
              variant="inline"
            />
          </div>
        )}

        {/* Main panels: Chatbot & Map */}
        <div className="flex-1 flex items-stretch gap-4">
          {/* Left Panel - Chatbot - Increased width */}
          <div
            className={`transition-all duration-700 ease-in-out ${
              isMapExpanded ? 'w-1/4' : 'w-[45%]'
            }`}
          >
          {/* Chatbot Component */}
          <div className="h-full flex flex-col backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl overflow-hidden hover:border-purple-500/30 transition-all duration-500">
            {/* Header - Compact */}
            <div className="relative px-4 py-3 border-b border-white/10 bg-gradient-to-r from-purple-600/10 to-cyan-600/10 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-500 blur-xl opacity-50 animate-pulse" />
                    <MessageSquare className="relative w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      AI Assistant
                    </h2>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      Đang hoạt động
                    </p>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
              </div>
            </div>

            {/* Messages Area - Compact padding */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  {message.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className={`flex-1 max-w-[85%] ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl rounded-tr-sm'
                      : 'bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-xl rounded-tl-sm backdrop-blur-sm border border-white/10'
                  } p-3`}>
                    <div className="text-gray-200 text-sm leading-relaxed break-words">
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

              {/* Suggested Questions */}
              {messages.length === 1 && !isLoading && (
                <div className="grid grid-cols-2 gap-3 mt-6">
                  {suggestedQuestions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(action.query)}
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

            {/* Input Area - Compact */}
            <div className="px-4 py-3 border-t border-white/10 bg-gradient-to-r from-purple-600/5 to-cyan-600/5 flex-shrink-0">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập tin nhắn..."
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 pr-12 text-sm bg-white/10 rounded-xl border border-white/20 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-white placeholder-gray-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 group/send disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white group-hover/send:translate-x-0.5 transition-transform" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

          {/* Right Panel - Map with Leaflet - Reduced width */}
          <div
            className={`transition-all duration-700 ease-in-out ${
              isMapExpanded ? 'flex-1' : 'w-[55%]'
            }`}
            style={{ minHeight: 'calc(100vh - 120px)' }}
          >
            <div 
              className="h-full backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl overflow-hidden hover:border-cyan-500/30 transition-all duration-500"
              style={{ minHeight: '500px' }}
            >
              <MapView locations={locations} onClearLocations={handleClearLocations} />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default AssistancePage;