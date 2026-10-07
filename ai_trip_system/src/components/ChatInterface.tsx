"use client";
import { useState, useRef, useEffect } from "react";
import { FaPaperPlane, FaRobot, FaUser } from "react-icons/fa";

// Định nghĩa kiểu dữ liệu cho tin nhắn
interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Xin chào! Tôi là Explavue Assistant. Tôi có thể giúp gì cho bạn về việc lên kế hoạch du lịch?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Xử lý khi gửi tin nhắn
  const handleSendMessage = () => {
    if (inputMessage.trim() === "") return;

    // Thêm tin nhắn của người dùng
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    // Giả lập phản hồi từ bot sau 1 giây
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputMessage),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  // Xử lý khi nhấn Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Hàm giả lập phản hồi từ bot
  const getBotResponse = (message: string): string => {
    const lowerCaseMessage = message.toLowerCase();

    if (
      lowerCaseMessage.includes("xin chào") ||
      lowerCaseMessage.includes("hello")
    ) {
      return "Xin chào! Tôi có thể giúp gì cho bạn về kế hoạch du lịch?";
    } else if (
      lowerCaseMessage.includes("đà nẵng") ||
      lowerCaseMessage.includes("da nang")
    ) {
      return "Đà Nẵng là một điểm đến tuyệt vời! Bạn có thể khám phá Bà Nà Hills, Cầu Vàng, bãi biển Mỹ Khê và nhiều địa điểm hấp dẫn khác. Bạn muốn đi vào thời gian nào?";
    } else if (
      lowerCaseMessage.includes("hà nội") ||
      lowerCaseMessage.includes("ha noi")
    ) {
      return "Hà Nội có nhiều địa điểm du lịch nổi tiếng như Hồ Hoàn Kiếm, Văn Miếu, Hoàng Thành Thăng Long. Bạn muốn tôi gợi ý lịch trình mấy ngày?";
    } else if (
      lowerCaseMessage.includes("hồ chí minh") ||
      lowerCaseMessage.includes("ho chi minh") ||
      lowerCaseMessage.includes("sài gòn") ||
      lowerCaseMessage.includes("sai gon")
    ) {
      return "Thành phố Hồ Chí Minh có nhiều điểm tham quan như Nhà thờ Đức Bà, Bưu điện Trung tâm, Chợ Bến Thành. Bạn quan tâm đến ẩm thực, mua sắm hay tham quan?";
    } else if (
      lowerCaseMessage.includes("phú quốc") ||
      lowerCaseMessage.includes("phu quoc")
    ) {
      return "Phú Quốc có những bãi biển đẹp, nước trong xanh và nhiều hoạt động thú vị như lặn biển, câu cá, tham quan vườn tiêu. Bạn dự định đi trong bao lâu?";
    } else if (lowerCaseMessage.includes("nha trang")) {
      return "Nha Trang nổi tiếng với những bãi biển đẹp, các khu nghỉ dưỡng cao cấp và ẩm thực hải sản tuyệt vời. Bạn muốn tôi gợi ý khách sạn phù hợp với ngân sách của bạn không?";
    } else {
      return "Cảm ơn thông tin của bạn. Tôi có thể giúp bạn lên kế hoạch chi tiết cho chuyến đi. Bạn có thể cho tôi biết thêm về thời gian, ngân sách và sở thích của bạn không?";
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-md border border-gray-200">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-xl">
        <FaRobot className="text-xl mr-2" />
        <h2 className="text-lg font-semibold">Explavue Assistant</h2>
      </div>

      {/* Messages container */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.sender === "user"
                  ? "bg-blue-500 text-white rounded-tr-none"
                  : "bg-gray-100 text-gray-800 rounded-tl-none"
              }`}
            >
              <div className="flex items-center mb-1">
                {message.sender === "bot" ? (
                  <FaRobot className="mr-2 text-indigo-600" />
                ) : (
                  <FaUser className="mr-2 text-blue-300" />
                )}
                <span className="font-semibold">
                  {message.sender === "user" ? "Bạn" : "Explavue Assistant"}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{message.text}</p>
              <div className="text-xs opacity-70 text-right mt-1">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <textarea
            className="flex-grow p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Nhập tin nhắn..."
            rows={2}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <button
            className="bg-blue-500 text-white p-2 rounded-r-lg h-full hover:bg-blue-600 transition-colors"
            onClick={handleSendMessage}
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
