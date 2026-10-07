"use client";
import { useState, useRef, useEffect } from "react";
import { FaPaperPlane, FaRobot, FaUser, FaSpinner } from "react-icons/fa";

// Định nghĩa kiểu dữ liệu cho tin nhắn
interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  metadata?: {
    category?: string;
    location?: string;
    searchResultsCount?: number;
    responseTime?: number;
  };
}

// Định nghĩa kiểu response từ API
interface ChatAPIResponse {
  success: boolean;
  response?: string;
  error?: string;
  metadata?: {
    category?: string;
    location?: string;
    searchResultsCount?: number;
    sessionId?: string;
    responseTime?: number;
    contextUsed?: boolean;
    followUpDetected?: boolean;
  };
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Xin chào! Tôi là TourMate - trợ lý du lịch AI của bạn. Tôi có thể giúp bạn:\n\n🍽️ Gợi ý nhà hàng, quán ăn\n🏨 Tìm khách sạn, homestay\n🗺️ Điểm tham quan hấp dẫn\n🌤️ Thông tin thời tiết\n🚗 Phương tiện di chuyển\n💰 Ước tính ngân sách\n📋 Lên lịch trình du lịch chi tiết\n\nBạn muốn đi đâu? Hãy cho tôi biết nhé! 😊",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [chatbotStatus, setChatbotStatus] = useState<"unknown" | "online" | "offline">("unknown");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Kiểm tra trạng thái chatbot service khi component mount
  useEffect(() => {
    checkChatbotHealth();
  }, []);

  // Kiểm tra health của chatbot service
  const checkChatbotHealth = async () => {
    try {
      const response = await fetch("/api/chatbot", {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();
        setChatbotStatus(data.initialized ? "online" : "offline");
      } else {
        setChatbotStatus("offline");
      }
    } catch (error) {
      console.error("Health check failed:", error);
      setChatbotStatus("offline");
    }
  };

  // Xử lý khi gửi tin nhắn
  const handleSendMessage = async () => {
    if (inputMessage.trim() === "" || isLoading) return;

    // Thêm tin nhắn của người dùng
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Gọi API chatbot thật
    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputMessage,
          sessionId: sessionId,
          history: messages.map((msg) => ({
            text: msg.text,
            isUser: msg.sender === "user",
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ChatAPIResponse = await response.json();

      if (data.success && data.response) {
        // Thêm phản hồi từ bot
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          sender: "bot",
          timestamp: new Date(),
          metadata: data.metadata,
        };

        setMessages((prev) => [...prev, botMessage]);
        setChatbotStatus("online");
      } else {
        // Xử lý lỗi từ API
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.error || "Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại.",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Chat API error:", error);
      setChatbotStatus("offline");

      // Hiển thị lỗi cho user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "❌ Không thể kết nối đến dịch vụ chatbot. Vui lòng kiểm tra:\n\n1. Chatbot service đang chạy (port 5000)\n2. File .env đã cấu hình đúng\n3. Kết nối mạng ổn định\n\nHoặc thử lại sau vài giây.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý khi nhấn Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format metadata để hiển thị
  const formatMetadata = (metadata?: Message["metadata"]) => {
    if (!metadata) return null;

    const parts = [];
    if (metadata.category) {
      const categoryLabels: Record<string, string> = {
        food: "🍽️ Ẩm thực",
        accommodation: "🏨 Chỗ ở",
        attractions: "🗺️ Điểm tham quan",
        weather: "🌤️ Thời tiết",
        transportation: "🚗 Di chuyển",
        budget: "💰 Ngân sách",
        itinerary: "📋 Lịch trình",
        general: "💬 Tổng hợp",
      };
      parts.push(categoryLabels[metadata.category] || metadata.category);
    }
    if (metadata.location) parts.push(`📍 ${metadata.location}`);
    if (metadata.searchResultsCount && metadata.searchResultsCount > 0) {
      parts.push(`🔍 ${metadata.searchResultsCount} nguồn`);
    }
    if (metadata.responseTime) {
      parts.push(`⏱️ ${(metadata.responseTime / 1000).toFixed(1)}s`);
    }

    return parts.length > 0 ? parts.join(" • ") : null;
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-md border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-xl">
        <div className="flex items-center">
          <FaRobot className="text-xl mr-2" />
          <h2 className="text-lg font-semibold">TourMate AI Assistant</h2>
        </div>
        {/* Status indicator */}
        <div className="flex items-center">
          <div
            className={`w-2 h-2 rounded-full mr-2 ${
              chatbotStatus === "online"
                ? "bg-green-400"
                : chatbotStatus === "offline"
                ? "bg-red-400"
                : "bg-yellow-400"
            }`}
          />
          <span className="text-xs">
            {chatbotStatus === "online"
              ? "Trực tuyến"
              : chatbotStatus === "offline"
              ? "Ngoại tuyến"
              : "Đang kiểm tra..."}
          </span>
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
                message.sender === "user"
                  ? "bg-blue-500 text-white rounded-tr-none"
                  : "bg-white text-gray-800 rounded-tl-none border border-gray-200"
              }`}
            >
              <div className="flex items-center mb-1">
                {message.sender === "bot" ? (
                  <FaRobot className="mr-2 text-indigo-600" />
                ) : (
                  <FaUser className="mr-2 text-blue-300" />
                )}
                <span className="font-semibold text-sm">
                  {message.sender === "user" ? "Bạn" : "TourMate"}
                </span>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>

              {/* Metadata */}
              {message.metadata && formatMetadata(message.metadata) && (
                <div className="text-xs opacity-70 mt-2 pt-2 border-t border-gray-300">
                  {formatMetadata(message.metadata)}
                </div>
              )}

              {/* Timestamp */}
              <div
                className={`text-xs opacity-70 text-right mt-1 ${
                  message.sender === "user" ? "text-blue-100" : "text-gray-500"
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-white text-gray-800 rounded-tl-none border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <FaRobot className="mr-2 text-indigo-600" />
                <span className="font-semibold text-sm mr-2">TourMate</span>
                <FaSpinner className="animate-spin text-indigo-600" />
              </div>
              <p className="text-sm text-gray-600 mt-1">Đang suy nghĩ...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
        <div className="flex items-center">
          <textarea
            className="flex-grow p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800"
            placeholder="Nhập câu hỏi về du lịch... (VD: Gợi ý lịch trình Đà Lạt 2 ngày)"
            rows={2}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
          />
          <button
            className={`p-2 rounded-r-lg h-full transition-colors ${
              isLoading || inputMessage.trim() === ""
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
            onClick={handleSendMessage}
            disabled={isLoading || inputMessage.trim() === ""}
          >
            {isLoading ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaPaperPlane />
            )}
          </button>
        </div>

        {/* Quick suggestions */}
        {messages.length === 1 && (
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => setInputMessage("Lịch trình du lịch Đà Lạt 2 ngày 1 đêm")}
              className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
            >
              📋 Lịch trình Đà Lạt
            </button>
            <button
              onClick={() => setInputMessage("Nhà hàng ngon ở TP.HCM")}
              className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
            >
              🍽️ Nhà hàng TP.HCM
            </button>
            <button
              onClick={() => setInputMessage("Chi phí du lịch Phú Quốc 3 ngày")}
              className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
            >
              💰 Ngân sách Phú Quốc
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
