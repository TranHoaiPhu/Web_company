"use client";
import { useState } from "react";
import { FaHistory, FaTrash, FaEdit, FaSearch } from "react-icons/fa";

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  isActive: boolean;
}

const ChatHistory = () => {
  // Dữ liệu mẫu cho lịch sử trò chuyện
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: "1",
      title: "Kế hoạch du lịch Đà Nẵng",
      lastMessage: "Bạn muốn đi vào thời gian nào?",
      timestamp: new Date(2023, 6, 15),
      isActive: true,
    },
    {
      id: "2",
      title: "Khám phá Hà Nội",
      lastMessage: "Tôi đã gửi cho bạn lịch trình 3 ngày ở Hà Nội",
      timestamp: new Date(2023, 6, 10),
      isActive: false,
    },
    {
      id: "3",
      title: "Tìm khách sạn ở Nha Trang",
      lastMessage: "Đây là một số khách sạn phù hợp với ngân sách của bạn",
      timestamp: new Date(2023, 6, 5),
      isActive: false,
    },
    {
      id: "4",
      title: "Ẩm thực Huế",
      lastMessage: "Bạn nên thử bún bò Huế và các món đặc sản khác",
      timestamp: new Date(2023, 5, 28),
      isActive: false,
    },
    {
      id: "5",
      title: "Lịch trình Phú Quốc",
      lastMessage: "Tôi đã tạo lịch trình 5 ngày cho chuyến đi của bạn",
      timestamp: new Date(2023, 5, 20),
      isActive: false,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  // Xử lý khi chọn một phiên trò chuyện
  const handleSelectSession = (id: string) => {
    setChatSessions(
      chatSessions.map((session) => ({
        ...session,
        isActive: session.id === id,
      }))
    );
  };

  // Xử lý khi xóa một phiên trò chuyện
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatSessions(chatSessions.filter((session) => session.id !== id));
  };

  // Lọc các phiên trò chuyện theo từ khóa tìm kiếm
  const filteredSessions = chatSessions.filter(
    (session) =>
      session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Hàm định dạng ngày tháng
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return "Hôm nay";
    } else if (diffDays === 1) {
      return "Hôm qua";
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString("vi-VN");
    }
  };

  return (
    <div className="h-[600px] bg-white rounded-xl shadow-md border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-xl">
        <div className="flex items-center">
          <FaHistory className="text-xl mr-2" />
          <h2 className="text-lg font-semibold">Lịch sử trò chuyện</h2>
        </div>
      </div>

      {/* Search box */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Chat sessions list */}
      <div className="flex-grow overflow-y-auto">
        {filteredSessions.length > 0 ? (
          filteredSessions.map((session) => (
            <div
              key={session.id}
              className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                session.isActive ? "bg-blue-50" : ""
              }`}
              onClick={() => handleSelectSession(session.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                  <h3 className="font-medium text-gray-900 truncate">
                    {session.title}
                  </h3>
                  <p className="text-sm text-gray-500 truncate mt-1">
                    {session.lastMessage}
                  </p>
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {formatDate(session.timestamp)}
                </div>
              </div>
              <div className="flex justify-end mt-2 space-x-2">
                <button
                  className="text-gray-500 hover:text-blue-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Xử lý chỉnh sửa tên cuộc trò chuyện
                  }}
                >
                  <FaEdit />
                </button>
                <button
                  className="text-gray-500 hover:text-red-500"
                  onClick={(e) => handleDeleteSession(session.id, e)}
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            Không tìm thấy cuộc trò chuyện nào
          </div>
        )}
      </div>

      {/* New chat button */}
      <div className="p-3 border-t border-gray-200">
        <button className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          Tạo cuộc trò chuyện mới
        </button>
      </div>
    </div>
  );
};

export default ChatHistory;
