'use client';

import { useState, useEffect } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ChatbotHealth {
  status: string;
  initialized: boolean;
  timestamp?: string;
}

export default function ChatbotStatus() {
  const [health, setHealth] = useState<ChatbotHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkHealth();
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/chatbot');
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Failed to check chatbot health:', error);
      setHealth({ status: 'error', initialized: false });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!health) return 'bg-gray-500';
    if (health.status === 'ok' && health.initialized) return 'bg-green-500';
    if (health.status === 'ok' && !health.initialized) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (isLoading) return 'Đang kiểm tra...';
    if (!health) return 'Không thể kết nối';
    if (health.status === 'ok' && health.initialized) return 'Hoạt động bình thường';
    if (health.status === 'ok' && !health.initialized) return 'Đang khởi tạo...';
    return 'Không khả dụng';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-full">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
              <span className="text-sm text-gray-600">{getStatusText()}</span>
            </div>
          </div>
        </div>
        
        <Link
          href="/chatbot"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Mở Chat
        </Link>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Trợ lý AI du lịch thông minh giúp bạn lên kế hoạch và tìm kiếm thông tin du lịch.</p>
        {health?.timestamp && (
          <p className="mt-1">
            Cập nhật lần cuối: {new Date(health.timestamp).toLocaleString('vi-VN')}
          </p>
        )}
      </div>
    </div>
  );
}
