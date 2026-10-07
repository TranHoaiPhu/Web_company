"use client";

import { useState } from 'react';
import { 
  MessageSquare, 
  MapPin, 
  Clock, 
  Trash2, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Calendar,
  Users,
  X
} from 'lucide-react';
import { ChatHistoryItem } from '@/types/tripHistory';

interface HistorySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  historyItems: ChatHistoryItem[];
  currentItemId?: string | null;
  onSelectItem: (item: ChatHistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onNewItem: () => void;
  type: 'chat' | 'trip';
  title: string;
  theme?: 'dark' | 'light';
  variant?: 'overlay' | 'inline';
  showToggleButton?: boolean;
}

export default function HistorySidebar({
  isOpen,
  onToggle,
  historyItems,
  currentItemId,
  onSelectItem,
  onDeleteItem,
  onNewItem,
  type,
  title,
  theme = 'dark',
  variant = 'overlay',
  showToggleButton = true
}: HistorySidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const isDark = theme === 'dark';

  // Filter items by search term
  const filteredItems = historyItems.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.preview.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date for display
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? 'Vừa xong' : `${diffMins} phút trước`;
      }
      return `${diffHours} giờ trước`;
    } else if (diffDays === 1) {
      return 'Hôm qua';
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deleteConfirmId === id) {
      onDeleteItem(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      // Auto reset after 3 seconds
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  // Theme-based styles
  const styles = {
    toggleButton: isDark 
      ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white'
      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white',
    sidebar: isDark
      ? 'bg-gradient-to-b from-slate-900 via-purple-950/50 to-slate-900 border-r border-white/10'
      : 'bg-gradient-to-b from-white via-blue-50 to-white border-r border-gray-200',
    header: isDark
      ? 'border-b border-white/10 bg-gradient-to-r from-purple-600/20 to-cyan-600/20'
      : 'border-b border-gray-200 bg-gradient-to-r from-blue-100 to-purple-100',
    headerTitle: isDark
      ? 'bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent'
      : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
    headerSubtext: isDark ? 'text-gray-400' : 'text-gray-500',
    searchBorder: isDark ? 'border-b border-white/5' : 'border-b border-gray-100',
    searchInput: isDark
      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20'
      : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-blue-400 focus:ring-blue-200',
    newButton: isDark
      ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white hover:shadow-purple-500/25'
      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white hover:shadow-blue-500/25',
    itemActive: isDark
      ? 'bg-gradient-to-r from-purple-600/30 to-cyan-600/30 border border-purple-500/50'
      : 'bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-300',
    itemInactive: isDark
      ? 'bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10'
      : 'bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200',
    itemTitle: isDark ? 'text-white' : 'text-gray-800',
    itemPreview: isDark ? 'text-gray-400' : 'text-gray-500',
    itemMeta: isDark ? 'text-gray-500' : 'text-gray-400',
    emptyText: isDark ? 'text-gray-400' : 'text-gray-500',
    emptySubtext: isDark ? 'text-gray-500' : 'text-gray-400',
    footer: isDark
      ? 'border-t border-white/10 bg-black/20'
      : 'border-t border-gray-200 bg-gray-50',
    footerText: isDark ? 'text-gray-500' : 'text-gray-400',
    iconBg: {
      chat: isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600',
      trip: isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-600'
    }
  };

  const ToggleButton = ({
    className
  }: {
    className: string;
  }) => (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 ${styles.toggleButton} px-3 py-3 rounded-r-xl shadow-lg transition-all duration-300 hover:pl-4 group ${className}`}
    >
      <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
      <div className="flex items-center gap-2">
        {type === 'chat' ? (
          <MessageSquare className="w-4 h-4" />
        ) : (
          <MapPin className="w-4 h-4" />
        )}
        <span className="text-xs whitespace-nowrap">Lịch sử</span>
      </div>
    </button>
  );

  // Inline variant: render as part of the layout (no fixed overlay)
  if (variant === 'inline') {
    // Collapsed inline state: show a slim, clickable column instead of a floating button
    if (!isOpen) {
      return (
        <aside className="w-16 shrink-0 sticky top-24 self-start h-[calc(100vh-6rem)]">
          <button
            onClick={onToggle}
            className={`${styles.sidebar} relative h-full w-full rounded-2xl flex flex-col items-center justify-between py-6 px-2 group shadow-xl overflow-hidden`}
          >
            <div className="flex flex-col items-center gap-4">
              <div className={`p-2 rounded-xl ${styles.iconBg[type]}`}>
                {type === 'chat' ? (
                  <MessageSquare className="w-5 h-5" />
                ) : (
                  <MapPin className="w-5 h-5" />
                )}
              </div>
              <span
                className={`text-[10px] tracking-[0.25em] uppercase ${styles.headerSubtext}`}
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
              >
                {title}
              </span>
            </div>
            <ChevronRight className="w-5 h-5 mb-1 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </aside>
      );
    }

    return (
      <aside className="w-64 shrink-0 sticky top-24 self-start h-[calc(100vh-6rem)]">
        <div className={`${styles.sidebar} shadow-xl flex flex-col overflow-hidden rounded-2xl h-full`}>
          {/* Header */}
          <div className={`relative px-4 py-5 ${styles.header}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`absolute inset-0 ${isDark ? 'bg-purple-500' : 'bg-blue-500'} blur-xl opacity-50 animate-pulse`} />
                  {type === 'chat' ? (
                    <MessageSquare className={`relative w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  ) : (
                    <MapPin className={`relative w-6 h-6 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                  )}
                </div>
                <div>
                  <h2 className={`text-lg font-bold ${styles.headerTitle}`}>
                    {title}
                  </h2>
                  <p className={`text-xs ${styles.headerSubtext}`}>
                    {historyItems.length} mục
                  </p>
                </div>
              </div>
              {showToggleButton && (
                <button
                  onClick={onToggle}
                  className={`p-2 ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} rounded-lg transition-colors group`}
                  title="Thu gọn"
                >
                  <ChevronLeft className={`w-5 h-5 ${isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-800'} transition-colors`} />
                </button>
              )}
            </div>
          </div>

          {/* Search Box */}
          <div className={`px-4 py-3 ${styles.searchBorder}`}>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm ${styles.searchInput}`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} rounded-full`}
                  title="Xóa"
                >
                  <X className={`w-3 h-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
              )}
            </div>
          </div>

          {/* New Item Button */}
          <div className="px-4 py-3">
            <button
              onClick={onNewItem}
              className={`w-full flex items-center justify-center gap-2 py-3 ${styles.newButton} rounded-xl font-medium transition-all duration-300 hover:shadow-lg group`}
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>{type === 'chat' ? 'Cuộc trò chuyện mới' : 'Lộ trình mới'}</span>
            </button>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2 custom-scrollbar">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className={`w-16 h-16 rounded-full ${isDark ? 'bg-white/5' : 'bg-gray-100'} flex items-center justify-center mb-4`}>
                  {type === 'chat' ? (
                    <MessageSquare className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  ) : (
                    <MapPin className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  )}
                </div>
                <p className={`font-medium ${styles.emptyText}`}>
                  {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có lịch sử'}
                </p>
                <p className={`text-sm mt-1 ${styles.emptySubtext}`}>
                  {searchTerm
                    ? 'Thử tìm kiếm với từ khóa khác'
                    : type === 'chat'
                      ? 'Bắt đầu trò chuyện để lưu lịch sử'
                      : 'Tạo lộ trình để lưu lịch sử'}
                </p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-300 shadow-sm ${
                    currentItemId === item.id
                      ? `${styles.itemActive} shadow-lg`
                      : styles.itemInactive
                  }`}
                >
                  {/* Item Content */}
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${styles.iconBg[type]}`}>
                      {type === 'chat' ? (
                        <MessageSquare className="w-4 h-4" />
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-medium text-sm whitespace-normal break-words leading-snug ${styles.itemTitle}`}>
                        {item.title}
                      </h3>
                      {/* Preview is hidden to save space - users can identify by title only */}

                      {/* Trip specific info */}
                      {item.type === 'trip' && item.tripData && (
                        <div className={`flex items-center gap-3 mt-2 text-xs ${styles.itemMeta}`}>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {item.tripData.startDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {item.tripData.travelers}
                          </span>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className={`flex items-center gap-1 mt-2 text-xs ${styles.itemMeta}`}>
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(item.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all ${
                      deleteConfirmId === item.id
                        ? 'bg-red-500 text-white'
                        : `opacity-0 group-hover:opacity-100 ${isDark ? 'bg-white/10 hover:bg-red-500/80 text-gray-400 hover:text-white' : 'bg-gray-100 hover:bg-red-500 text-gray-400 hover:text-white'}`
                    }`}
                    title={deleteConfirmId === item.id ? 'Nhấn lần nữa để xóa' : 'Xóa'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className={`px-4 py-3 ${styles.footer}`}>
            <p className={`text-xs text-center ${styles.footerText}`}>
              Lịch sử được lưu trên thiết bị của bạn
            </p>
          </div>
        </div>

        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(59, 130, 246, 0.3)'};
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${isDark ? 'rgba(139, 92, 246, 0.5)' : 'rgba(59, 130, 246, 0.5)'};
          }
        `}</style>
      </aside>
    );
  }

  // Collapsed state - overlay variant shows fixed toggle button
  if (!isOpen) {
    return (
      <div className="fixed left-0 top-24 z-50">
        <ToggleButton className="" />
      </div>
    );
  }

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={onToggle}
      />
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-24 h-[calc(100vh-6rem)] w-80 ${styles.sidebar} shadow-2xl z-40 flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className={`relative px-4 py-5 ${styles.header}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`absolute inset-0 ${isDark ? 'bg-purple-500' : 'bg-blue-500'} blur-xl opacity-50 animate-pulse`} />
                {type === 'chat' ? (
                  <MessageSquare className={`relative w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                ) : (
                  <MapPin className={`relative w-6 h-6 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                )}
              </div>
              <div>
                <h2 className={`text-lg font-bold ${styles.headerTitle}`}>
                  {title}
                </h2>
                <p className={`text-xs ${styles.headerSubtext}`}>
                  {historyItems.length} mục
                </p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className={`p-2 ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} rounded-lg transition-colors group`}
            >
              <ChevronLeft className={`w-5 h-5 ${isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-800'} transition-colors`} />
            </button>
          </div>
        </div>

        {/* Search Box */}
        <div className={`px-4 py-3 ${styles.searchBorder}`}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm ${styles.searchInput}`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} rounded-full`}
              >
                <X className={`w-3 h-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            )}
          </div>
        </div>

        {/* New Item Button */}
        <div className="px-4 py-3">
          <button
            onClick={onNewItem}
            className={`w-full flex items-center justify-center gap-2 py-3 ${styles.newButton} rounded-xl font-medium transition-all duration-300 hover:shadow-lg group`}
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span>{type === 'chat' ? 'Cuộc trò chuyện mới' : 'Lộ trình mới'}</span>
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className={`w-16 h-16 rounded-full ${isDark ? 'bg-white/5' : 'bg-gray-100'} flex items-center justify-center mb-4`}>
                {type === 'chat' ? (
                  <MessageSquare className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                ) : (
                  <MapPin className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                )}
              </div>
              <p className={`font-medium ${styles.emptyText}`}>
                {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có lịch sử'}
              </p>
              <p className={`text-sm mt-1 ${styles.emptySubtext}`}>
                {searchTerm 
                  ? 'Thử tìm kiếm với từ khóa khác'
                  : type === 'chat' 
                    ? 'Bắt đầu trò chuyện để lưu lịch sử'
                    : 'Tạo lộ trình để lưu lịch sử'
                }
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-300 shadow-sm ${
                  currentItemId === item.id
                    ? `${styles.itemActive} shadow-lg`
                    : styles.itemInactive
                }`}
              >
                {/* Item Content */}
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${styles.iconBg[type]}`}>
                    {type === 'chat' ? (
                      <MessageSquare className="w-4 h-4" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate text-sm ${styles.itemTitle}`}>
                      {item.title}
                    </h3>
                    <p className={`text-xs mt-1 truncate ${styles.itemPreview}`}>
                      {item.preview}
                    </p>
                    
                    {/* Trip specific info */}
                    {item.type === 'trip' && item.tripData && (
                      <div className={`flex items-center gap-3 mt-2 text-xs ${styles.itemMeta}`}>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {item.tripData.startDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {item.tripData.travelers}
                        </span>
                      </div>
                    )}
                    
                    {/* Timestamp */}
                    <div className={`flex items-center gap-1 mt-2 text-xs ${styles.itemMeta}`}>
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(item.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => handleDelete(e, item.id)}
                  className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all ${
                    deleteConfirmId === item.id
                      ? 'bg-red-500 text-white'
                      : `opacity-0 group-hover:opacity-100 ${isDark ? 'bg-white/10 hover:bg-red-500/80 text-gray-400 hover:text-white' : 'bg-gray-100 hover:bg-red-500 text-gray-400 hover:text-white'}`
                  }`}
                  title={deleteConfirmId === item.id ? 'Nhấn lần nữa để xóa' : 'Xóa'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className={`px-4 py-3 ${styles.footer}`}>
          <p className={`text-xs text-center ${styles.footerText}`}>
            Lịch sử được lưu trên thiết bị của bạn
          </p>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(59, 130, 246, 0.3)'};
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(139, 92, 246, 0.5)' : 'rgba(59, 130, 246, 0.5)'};
        }
      `}</style>
    </>
  );
}
