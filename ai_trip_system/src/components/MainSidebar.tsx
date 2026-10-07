"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import useSWR from "swr";
import { getCookie } from "cookies-next";
import { API_BASE_URL } from "@/config/api";
import {
  ChatBubbleLeftRightIcon,
  MapIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  HomeIcon,
  MapPinIcon,
  CalendarDaysIcon,
  UserIcon,
  CogIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useConversation } from "@/context/ConversationContext";
import { useAuth } from "@/context/AuthContext";

interface MainSidebarProps {
  currentConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function MainSidebar({
  currentConversationId,
  onConversationSelect,
  onNewConversation,
  isOpen = false,
  onClose,
}: MainSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isRecentChatExpanded, setIsRecentChatExpanded] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [userid, setUserid] = useState<string>("");

  const { conversations, isLoading, createConversation } = useConversation();

  const { logout } = useAuth();

  // Get user ID from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("current_user_id");
      if (storedUserId) {
        setUserid(storedUserId);
      }
    }
  }, []);

  // Fetch user data from API using SWR
  const { data: userData } = useSWR(
    userid ? ["/api/user", userid] : null,
    ([, id]) =>
      fetch(
        `${API_BASE_URL}/users/idUser?lookup=${id}`,
        {
          headers: {
            Authorization: `Bearer ${getCookie("token") || ""}`,
            "Content-Type": "application/json",
          },
        }
      ).then((res) => res.json()),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const handleNewConversation = async () => {
    try {
      const newConversation = await createConversation("Cuộc trò chuyện mới");
      if (newConversation) {
        onNewConversation();
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const menuItems = [
    {
      icon: HomeIcon,
      label: "Trang chủ",
      route: "/home",
    },
    {
      icon: MapIcon,
      label: "Khám phá",
      route: "/explore",
    },
    {
      icon: MapPinIcon,
      label: "Lên kế hoạch",
      route: "/trips",
    },
    {
      icon: CalendarDaysIcon,
      label: "Đặt chỗ của bạn",
      route: "/yourbooking",
    },
    {
      icon: MagnifyingGlassIcon,
      label: "Tìm kiếm",
      route: "/search",
    },
  ];

  const isActiveRoute = (route: string) => {
    return pathname === route;
  };

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  // Sort conversations by most recent first
  interface Conversation {
    id: string;
    title: string;
    createdAt?: string;
    updatedAt?: string;
    lastMessage?: string;
    // Add other properties as needed
  }

  const sortConversationsByRecent = (conversations: Conversation[]) => {
    return [...conversations].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA; // Most recent first
    });
  };

  const filteredConversations: Conversation[] = conversations.filter(
    (conv: unknown): conv is Conversation =>
      typeof conv === "object" &&
      conv !== null &&
      typeof (conv as { id?: unknown }).id === "string" &&
      typeof (conv as { title?: unknown }).title === "string" &&
      (typeof (conv as { createdAt?: unknown }).createdAt === "string" ||
        typeof (conv as { updatedAt?: unknown }).updatedAt === "string")
  );
  const sortedConversations = sortConversationsByRecent(filteredConversations);

  const handleLogout = () => {
    // Use the logout function from AuthContext
    logout();

    // Redirect to home page (will show header layout since user is logged out)
    router.push("/");
  };

  const handleProfile = () => {
    setIsProfileDropdownOpen(false);
    router.push(`/profile/${userid}`);
  };

  if (!isOpen) return null;

  return (
    <div className="relative w-72 bg-gradient-to-b from-slate-50 to-gray-100 border-r border-gray-200 flex flex-col h-full">
      {/* Close Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={onClose}
          className="text-gray-600 hover:text-black text-xl"
          aria-label="Đóng sidebar"
        >
          ✕
        </button>
      </div>
      {/* Logo Section */}
      <div className="border-b border-gray-200">
        <div
          onClick={() => handleNavigation("/home")}
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity px-4 py-3"
        >
          <div className="w-32 h-12 relative flex-shrink-0">
            <Image
              src="/logo/travelVN.png"
              fill
              alt="AI Travel Logo"
              className="object-contain"
              priority
            />
          </div>
          <div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
              TravelVN
            </span>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-4 space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.route ? isActiveRoute(item.route) : false;

          return (
            <div
              key={index}
              onClick={() => {
                if (item.route) {
                  handleNavigation(item.route);
                }
              }}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                isActive
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </div>
          );
        })}
      </div>

      {/* Recent Chat Section */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setIsRecentChatExpanded(!isRecentChatExpanded)}
            className="flex items-center gap-2 w-full text-left text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ClockIcon className="h-5 w-5" />
            <span className="font-medium">Trò chuyện gần đây</span>
            {isRecentChatExpanded ? (
              <ChevronDownIcon className="h-4 w-4 ml-auto" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 ml-auto" />
            )}
          </button>
        </div>

        {/* Conversations List */}
        {isRecentChatExpanded && (
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-10 bg-gray-200 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-2xl mb-2">💬</div>
                <p className="text-sm">Chưa có cuộc trò chuyện nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* New Chat Button */}
                <button
                  onClick={handleNewConversation}
                  className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors text-gray-700"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  <span className="font-medium">Trò chuyện mới</span>
                  <PlusIcon className="h-4 w-4 ml-auto" />
                </button>

                <div className="space-y-1">
                  {sortedConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => onConversationSelect(conversation.id)}
                      className={`p-2 rounded-lg cursor-pointer transition-colors text-sm ${
                        conversation.id === currentConversationId
                          ? "bg-blue-100 text-blue-700"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <div className="truncate font-medium">
                        {conversation.title}
                      </div>
                      {conversation.lastMessage && (
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          {conversation.lastMessage}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200 relative">
        <div
          onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
        >
          <div className="w-8 h-8 relative">
            <Image
              src={
                userData?.avatar
                  ? `${API_BASE_URL}/proxy_image/?url=${encodeURIComponent(
                      userData.avatar
                    )}`
                  : "/images/profile.svg"
              }
              fill
              className="rounded-full object-cover"
              alt="profile"
            />
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-800">
              {userData?.username || "User"}
            </div>
          </div>
          <ChevronDownIcon
            className={`h-4 w-4 text-gray-500 transition-transform ${
              isProfileDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </div>

        {/* Profile Dropdown */}
        {isProfileDropdownOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div
              onClick={handleProfile}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
            >
              <UserIcon className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-700">Hồ sơ</span>
            </div>
            <div
              onClick={() => {
                setIsProfileDropdownOpen(false);
                router.push("/settings");
              }}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
            >
              <CogIcon className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-700">Cài đặt</span>
            </div>
            <div
              onClick={handleLogout}
              className="flex items-center gap-3 p-3 hover:bg-red-50 cursor-pointer transition-colors text-red-600"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="font-medium">Đăng xuất</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
