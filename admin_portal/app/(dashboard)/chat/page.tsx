"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import {
    List,
    Avatar,
    Input,
    Button,
    Card,
    Badge,
    Empty,
    Spin,
    Typography,
    Divider,
    message,
    Tooltip,
} from "antd";
import {
    SendOutlined,
    UserOutlined,
    MessageOutlined,
    SearchOutlined,
    ClockCircleOutlined,
    ArrowLeftOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    ReloadOutlined,
    RobotOutlined,
    CloseOutlined,
} from "@ant-design/icons";
import { Sparkles, MessageCircle, Zap, Lightbulb } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    chatService,
    SupportConversation,
    ChatMessage,
} from "@/services/chat.service";
import { AuthService } from "@/services/auth.service";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/config/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

function ChatContent() {
    const [conversations, setConversations] = useState<SupportConversation[]>([]);
    const [selectedConv, setSelectedConv] = useState<SupportConversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(true);
    const [msgLoading, setMsgLoading] = useState(false);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [suggestions, setSuggestions] = useState<{ label: string; content: string }[]>([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [showAssistant, setShowAssistant] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [assistantMessages, setAssistantMessages] = useState<
        {
            role: "user" | "assistant";
            content: string;
            suggestions?: { label: string; content: string }[];
        }[]
    >([]);
    const [assistantInput, setAssistantInput] = useState("");
    const [assistantLoading, setAssistantLoading] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(384);
    const [assistantWidth, setAssistantWidth] = useState(380);
    const [isResizingSidebar, setIsResizingSidebar] = useState(false);
    const [isResizingAssistant, setIsResizingAssistant] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const selectedConvRef = useRef<SupportConversation | null>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const contRect = containerRef.current.getBoundingClientRect();

            if (isResizingSidebar) {
                const newWidth = e.clientX - contRect.left;
                if (newWidth > 150 && newWidth < 600) setSidebarWidth(newWidth);
            }
            if (isResizingAssistant) {
                const newWidth = contRect.right - e.clientX;
                if (newWidth > 250 && newWidth < 600) setAssistantWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizingSidebar(false);
            setIsResizingAssistant(false);
            document.body.style.cursor = "default";
            document.body.classList.remove('select-none');
        };

        if (isResizingSidebar || isResizingAssistant) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "col-resize";
            document.body.classList.add('select-none');
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            document.body.classList.remove('select-none');
        };
    }, [isResizingSidebar, isResizingAssistant]);

    const searchParams = useSearchParams();
    const router = useRouter();
    const targetEmail = searchParams.get("email");

    useEffect(() => {
        selectedConvRef.current = selectedConv;
    }, [selectedConv]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const fetchConvs = async () => {
            try {
                const data = await chatService.getConversations();
                setConversations(data);
                if (targetEmail) {
                    const cleanTarget = targetEmail.trim().toLowerCase();
                    const matched = data.find(
                        (c) => c.user?.email?.toLowerCase() === cleanTarget
                    );
                    if (matched) {
                        setSelectedConv(matched);
                        setSearchQuery("");
                    } else {
                        // If not found in list, try to get or create it specifically
                        try {
                            const newConv = await chatService.getOrCreateByEmail(targetEmail);
                            setConversations(prev => {
                                if (prev.some(c => c.id === newConv.id)) return prev;
                                return [newConv, ...prev];
                            });
                            setSelectedConv(newConv);
                            setSearchQuery("");
                        } catch (err: any) {
                            console.error("Failed to auto-create support conversation:", err);
                            message.warning(`Không tìm thấy tài khoản cho email: ${targetEmail}`);
                            if (data.length > 0 && !selectedConv) {
                                setSelectedConv(data[0]);
                            }
                        }
                    }
                } else if (data.length > 0 && !selectedConv) {
                    // Auto-select the first conversation if none is selected
                    setSelectedConv(data[0]);
                }
            } catch (error) {
                console.error("Failed to fetch conversations:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchConvs();
    }, [targetEmail]);

    useEffect(() => {
        const currentUser = AuthService.getCurrentUser();
        const token = AuthService.getToken();

        if (!currentUser || !token) {
            console.log("No valid admin session found for WebSocket");
            return;
        }

        const wsUrl =
            API_BASE_URL.replace("https://", "wss://").replace("http://", "ws://") +
            `/chat/ws?token=${token}`;

        console.log("Connecting to WebSocket:", wsUrl.split('?')[0] + "?token=...");
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("Admin Chat WebSocket connected");
        };

        ws.onmessage = (event) => {
            const newMsg = JSON.parse(event.data);
            console.log("Admin received message:", newMsg);

            const currentSelectedConv = selectedConvRef.current;
            if (currentSelectedConv && newMsg.conversation_id === currentSelectedConv.id) {
                setMessages((prev) => [...prev, newMsg]);
            }

            setConversations((prev) => {
                const index = prev.findIndex((c) => c.id === newMsg.conversation_id);
                if (index !== -1) {
                    const updated = [...prev];
                    updated[index] = {
                        ...updated[index],
                        updated_at: new Date().toISOString(),
                    };
                    const item = updated.splice(index, 1)[0];
                    return [item, ...updated];
                }
                return prev;
            });
        };

        ws.onerror = (err) => console.error("Admin Chat WS Error:", err);
        ws.onclose = () => console.log("Admin Chat WebSocket disconnected");

        setSocket(ws);

        return () => {
            ws.close();
        };
    }, []);

    useEffect(() => {
        if (selectedConv) {
            const fetchMessages = async () => {
                setMsgLoading(true);
                try {
                    const data = await chatService.getMessages(selectedConv.id);
                    setMessages(data);
                } catch (error) {
                    console.error("Failed to fetch messages:", error);
                } finally {
                    setMsgLoading(false);
                }
            };
            fetchMessages();
            fetchSuggestions(selectedConv.id);
        }
    }, [selectedConv]);

    const fetchSuggestions = async (convId: string) => {
        setSuggestionsLoading(true);
        try {
            const data = await chatService.getSuggestions(convId);
            setSuggestions(data.suggestions);
        } catch (error) {
            console.error("Failed to fetch suggestions:", error);
        } finally {
            setSuggestionsLoading(false);
        }
    };

    const handleSend = () => {
        if (!inputText.trim() || !socket || !selectedConv) return;

        const msgData = {
            conversation_id: selectedConv.id,
            content: inputText,
        };

        socket.send(JSON.stringify(msgData));

        const optimisticMsg: ChatMessage = {
            id: Date.now().toString(),
            conversation_id: selectedConv.id,
            content: inputText,
            role: "assistant",
            created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, optimisticMsg]);
        setInputText("");
    };

    const handleAssistantSend = async () => {
        if (!assistantInput.trim() || assistantLoading) return;

        const userMsg = { role: "user" as const, content: assistantInput };
        setAssistantMessages((prev) => [...prev, userMsg]);
        setAssistantInput("");
        setAssistantLoading(true);

        try {
            const history = messages
                .slice(-10)
                .map((m) => `${m.role === "user" ? "Khách" : "Admin"}: ${m.content}`)
                .join("\n");

            const result = await chatService.chatWithAssistant(assistantInput, history);
            setAssistantMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: result.response,
                    suggestions: result.suggestions,
                },
            ]);
        } catch (error) {
            console.error("Assistant chat failed:", error);
            message.error("Không thể kết nối với Trợ lý Gemini");
        } finally {
            setAssistantLoading(false);
        }
    };

    return (
        <div ref={containerRef} className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
            {/* Left: Conversation List */}
            <div
                style={{ width: isCollapsed ? 80 : sidebarWidth }}
                className="relative bg-white border-r border-gray-200 flex flex-col shadow-sm transition-all duration-300"
            >
                {/* Collapse Toggle Button */}
                <Tooltip title={isCollapsed ? "Mở rộng" : "Thu gọn"} placement="right">
                    <Button
                        type="text"
                        icon={isCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="absolute right-2 top-4 z-10 text-gray-400 hover:text-blue-600 transition-colors ml-4"
                    />
                </Tooltip>

                {/* Header */}
                <div className="p-6 pb-4">
                    {!isCollapsed ? (
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                    <MessageCircle className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <Title level={5} className="!mb-0 !text-gray-800">
                                        Hỗ trợ khách hàng
                                    </Title>
                                    <Text className="text-xs text-gray-500">
                                        {conversations.length} cuộc hội thoại
                                    </Text>
                                </div>
                            </div>

                            {/* Search */}
                            <Input
                                prefix={<SearchOutlined className="text-gray-400" />}
                                placeholder="Tìm kiếm khách hàng..."
                                className="rounded-xl border-gray-200 hover:border-blue-300 focus:border-blue-400 transition-colors"
                                size="large"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </>
                    ) : (
                        <div className="flex justify-center pt-4">
                            {/*  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <MessageCircle className="w-5 h-5 text-white" />
                            </div> */}
                        </div>
                    )}
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <Spin size="large" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="Chưa có cuộc hội thoại nào"
                        />
                    ) : (
                        <List
                            dataSource={conversations.filter(
                                (c) =>
                                    c.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    c.user?.email.toLowerCase().includes(searchQuery.toLowerCase())
                            )}
                            renderItem={(item) => (
                                <div
                                    key={item.id}
                                    onClick={() => {
                                        setSelectedConv(item);
                                        if (targetEmail) {
                                            router.push('/chat', { scroll: false });
                                        }
                                    }}
                                    className={`mx-3 mb-2 px-4 py-3 cursor-pointer transition-all rounded-xl ${selectedConv?.id === item.id
                                        ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 scale-[1.02]"
                                        : "hover:bg-gray-50 bg-white border border-gray-100"
                                        } ${isCollapsed ? "!px-0 flex justify-center !mx-2 shadow-none bg-transparent border-none" : ""}`}
                                >
                                    {!isCollapsed ? (
                                        <List.Item.Meta
                                            avatar={
                                                <Badge dot status={item.status === "open" ? "success" : "default"} offset={[-6, 38]}>
                                                    <Avatar
                                                        src={item.user?.avatar}
                                                        icon={<UserOutlined />}
                                                        size={48}
                                                        className={
                                                            selectedConv?.id === item.id
                                                                ? "bg-white/20 text-white ring-2 ring-white/50"
                                                                : "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 shadow-sm"
                                                        }
                                                    />
                                                </Badge>
                                            }
                                            title={
                                                <div className="flex items-center justify-between">
                                                    <span
                                                        className={`font-semibold ${selectedConv?.id === item.id ? "!text-white" : "text-gray-800"
                                                            }`}
                                                    >
                                                        {item.user?.name || "Khách hàng"}
                                                    </span>
                                                    <Text
                                                        className={`text-xs ${selectedConv?.id === item.id
                                                            ? "!text-white/80"
                                                            : "text-gray-400"
                                                            }`}
                                                    >
                                                        {dayjs(item.updated_at).fromNow()}
                                                    </Text>
                                                </div>
                                            }
                                            description={
                                                <Text
                                                    className={`text-sm ${selectedConv?.id === item.id ? "!text-white/90" : "text-gray-500"
                                                        }`}
                                                >
                                                    {item.user?.email}
                                                </Text>
                                            }
                                        />
                                    ) : (
                                        <Tooltip title={item.user?.name} placement="right">
                                            <Badge dot status={item.status === "open" ? "success" : "default"} offset={[-4, 34]}>
                                                <Avatar
                                                    src={item.user?.avatar}
                                                    icon={<UserOutlined />}
                                                    size={44}
                                                    className={`transition-all duration-300 ${selectedConv?.id === item.id
                                                        ? "ring-4 ring-white shadow-xl scale-110"
                                                        : "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-500 shadow-md hover:scale-105"
                                                        }`}
                                                />
                                            </Badge>
                                        </Tooltip>
                                    )}
                                </div>
                            )}
                        />
                    )}
                </div>

                {/* Resizer Sidebar */}
                {!isCollapsed && (
                    <div
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setIsResizingSidebar(true);
                        }}
                        className={`absolute right-[-4px] top-0 bottom-0 w-3 cursor-col-resize z-30 group transition-all ${isResizingSidebar ? "bg-blue-500/10" : "hover:bg-blue-500/5"
                            }`}
                    >
                        <div className={`absolute right-[4px] inset-y-0 w-[2px] transition-colors ${isResizingSidebar ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-gray-200 group-hover:bg-blue-400"
                            }`} />
                        <div className={`absolute top-1/2 right-[1px] -translate-y-1/2 w-4 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity ${isResizingSidebar ? "!opacity-100" : ""
                            }`}>
                            <div className="w-[2px] h-3 bg-gray-300 rounded-full mx-[1px]" />
                            <div className="w-[2px] h-3 bg-gray-300 rounded-full mx-[1px]" />
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Chat Window */}
            {selectedConv ? (
                <div className="flex-1 flex flex-col bg-white">
                    {/* Chat Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-white to-blue-50/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar
                                    src={selectedConv.user?.avatar}
                                    icon={<UserOutlined />}
                                    size={52}
                                    className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-white"
                                />
                                <div>
                                    <Title level={5} className="!mb-0 text-gray-800">
                                        {selectedConv.user?.name}
                                    </Title>
                                    <Text className="text-sm text-gray-500">
                                        {selectedConv.user?.email}
                                    </Text>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    type={showAssistant ? "primary" : "default"}
                                    icon={<Sparkles className="w-4 h-4" />}
                                    onClick={() => setShowAssistant(!showAssistant)}
                                    className={`rounded-xl px-4 shadow-sm transition-all ${showAssistant
                                        ? "bg-gradient-to-r from-purple-500 to-purple-600 border-0 shadow-purple-500/30"
                                        : "hover:border-purple-300"
                                        }`}
                                >
                                    Trợ lý AI
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Message Window */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50/50 to-white custom-scrollbar">
                        {msgLoading ? (
                            <div className="flex justify-center items-center h-full">
                                <Spin size="large" tip="Đang tải tin nhắn..." />
                            </div>
                        ) : (
                            <div className="max-w-4xl mx-auto space-y-4">
                                {messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"
                                            } animate-fade-in`}
                                    >
                                        <div
                                            className={`max-w-[70%] ${msg.role === "user"
                                                ? "bg-white border border-gray-200 shadow-sm"
                                                : "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                                                } rounded-2xl px-5 py-3 transition-all hover:scale-[1.01]`}
                                        >
                                            <div className="text-[15px] leading-relaxed break-words">
                                                {msg.content.split(/(https?:\/\/[^\s]+)/g).map((part: string, i: number) =>
                                                    part.match(/https?:\/\/[^\s]+/) ? (
                                                        <a
                                                            key={i}
                                                            href={part}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`underline ${msg.role === "user"
                                                                ? "text-blue-600 hover:text-blue-700"
                                                                : "text-white/90 hover:text-white"
                                                                }`}
                                                        >
                                                            {part}
                                                        </a>
                                                    ) : (
                                                        part
                                                    )
                                                )}
                                            </div>
                                            <div
                                                className={`text-xs mt-2 flex items-center gap-1 ${msg.role === "user" ? "text-gray-400" : "text-white/70"
                                                    }`}
                                            >
                                                <ClockCircleOutlined className="text-[10px]" />
                                                {dayjs(msg.created_at).format("DD/MM/YYYY HH:mm")}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Chat Input */}
                    <div className="border-t border-gray-200 bg-white">
                        {/* AI Suggestions */}
                        {selectedConv && (
                            <div className="px-6 pt-4 pb-2">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Lightbulb className="w-4 h-4 text-amber-500" />
                                        <span>Gợi ý từ AI</span>
                                    </div>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<ReloadOutlined spin={suggestionsLoading} />}
                                        onClick={() => fetchSuggestions(selectedConv.id)}
                                        disabled={suggestionsLoading}
                                        className="text-gray-400 hover:text-blue-600 transition-colors"
                                    >
                                        Làm mới
                                    </Button>
                                </div>

                                <div className="flex gap-2 flex-wrap">
                                    {suggestionsLoading ? (
                                        Array(3)
                                            .fill(0)
                                            .map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="h-9 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg animate-pulse"
                                                    style={{ width: `${Math.random() * 100 + 120}px` }}
                                                />
                                            ))
                                    ) : suggestions.length > 0 ? (
                                        suggestions.map((sug, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setInputText(sug.content)}
                                                className="group px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 hover:border-gray-300 rounded-xl text-sm text-gray-700 transition-all hover:scale-105 hover:shadow-md flex items-center gap-2"
                                            >
                                                <Zap className="w-3.5 h-3.5 text-gray-500 group-hover:animate-pulse" />
                                                {sug.label}
                                            </button>
                                        ))
                                    ) : (
                                        <Text className="text-sm text-gray-400 italic">Chưa có gợi ý</Text>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="px-6 py-4 flex items-end gap-3">
                            <Input.TextArea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Nhập tin nhắn của bạn..."
                                autoSize={{ minRows: 1, maxRows: 4 }}
                                className="rounded-xl border-gray-200 hover:border-blue-300 focus:border-blue-400 resize-none transition-colors"
                                size="large"
                            />
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                size="large"
                                onClick={handleSend}
                                disabled={!inputText.trim()}
                                className="h-auto rounded-xl px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0 shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                            >
                                Gửi
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/20">
                    <Empty
                        image={
                            <div className="mb-4 flex justify-center">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                    <MessageCircle className="w-12 h-12 text-blue-500" />
                                </div>
                            </div>
                        }
                        description={
                            <div className="text-center">
                                <Title level={4} className="text-gray-600 !mb-2">
                                    Chưa chọn cuộc hội thoại
                                </Title>
                                <Text className="text-gray-400">
                                    Chọn một khách hàng từ danh sách bên trái để bắt đầu hỗ trợ
                                </Text>
                            </div>
                        }
                    />
                </div>
            )}

            {/* Gemini Assistant Sidebar */}
            {selectedConv && showAssistant && (
                <>
                    {/* Resizer Assistant */}
                    <div
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setIsResizingAssistant(true);
                        }}
                        className={`relative w-1 cursor-col-resize z-30 group transition-all ${isResizingAssistant ? "bg-purple-500/10" : "hover:bg-purple-500/5"
                            }`}
                    >
                        {/* Hit area - invisible but wide */}
                        <div className="absolute inset-y-0 -left-2 -right-2 z-10" />

                        {/* Visual line */}
                        <div className={`absolute inset-y-0 left-0 w-[2px] z-20 transition-colors ${isResizingAssistant ? "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" : "bg-gray-200 group-hover:bg-purple-400"
                            }`} />

                        {/* Visual handle */}
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-30 ${isResizingAssistant ? "!opacity-100" : ""
                            }`}>
                            <div className="w-[2px] h-3 bg-gray-300 rounded-full mx-[1px]" />
                            <div className="w-[2px] h-3 bg-gray-300 rounded-full mx-[1px]" />
                        </div>
                    </div>
                    <div
                        style={{ width: assistantWidth }}
                        className="bg-white border-l border-slate-200 flex flex-col shadow-lg"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Title level={5} className="!mb-0 text-slate-800">
                                        Trợ lý AI
                                    </Title>
                                    <Text className="text-xs text-slate-500">

                                    </Text>
                                </div>

                                <Button
                                    type="text"
                                    icon={<CloseOutlined />}
                                    onClick={() => setShowAssistant(false)}
                                    className="text-slate-500 hover:text-slate-700"
                                />
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {assistantMessages.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                                        <RobotOutlined className="text-2xl text-slate-500" />
                                    </div>
                                    <Title level={5} className="text-slate-700 !mb-2">
                                        Hỏi AI để được hỗ trợ
                                    </Title>
                                    <Text className="text-sm text-slate-500 max-w-xs mx-auto">
                                        Hỏi cách trả lời khách hàng, giải thích tour hoặc nhờ AI soạn nội dung.
                                    </Text>
                                </div>
                            )}

                            {assistantMessages.map((msg, idx) => (
                                <div key={idx}>
                                    <div
                                        className={`${msg.role === "user"
                                            ? "ml-8 bg-slate-900 text-white shadow-md"
                                            : "mr-8 bg-slate-50 border border-slate-200 text-slate-700"
                                            } rounded-xl p-4`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`w-8 h-8 rounded-md flex items-center justify-center ${msg.role === "user"
                                                    ? "bg-white/20"
                                                    : "bg-slate-200"
                                                    }`}
                                            >
                                                {msg.role === "user" ? (
                                                    <UserOutlined className="text-white" />
                                                ) : (
                                                    <RobotOutlined className="text-slate-600" />
                                                )}
                                            </div>
                                            <div className="text-sm leading-relaxed flex-1">
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Suggestions */}
                                    {msg.role === "assistant" && msg.suggestions?.length > 0 && (
                                        <div className="mt-3 space-y-2 mr-8">
                                            <div className="text-xs font-medium text-slate-500 mb-1">
                                                Gợi ý phản hồi
                                            </div>

                                            {msg.suggestions.map((sug, sIdx) => (
                                                <div
                                                    key={sIdx}
                                                    onClick={() => setInputText(sug.content)}
                                                    className="bg-white border border-slate-200 rounded-lg p-3 cursor-pointer hover:bg-slate-50 transition"
                                                >
                                                    <div className="text-sm font-medium text-slate-700 mb-1">
                                                        {sug.label}
                                                    </div>
                                                    <div className="text-xs text-slate-500 line-clamp-2">
                                                        “{sug.content}”
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {assistantLoading && (
                                <div className="mr-8 bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <div className="flex items-center gap-2">
                                        <Spin size="small" />
                                        <Text className="text-xs text-slate-500">
                                            AI đang suy nghĩ...
                                        </Text>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-slate-200 bg-white">
                            <div className="flex items-end gap-3">
                                <Input.TextArea
                                    value={assistantInput}
                                    onChange={(e) => setAssistantInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleAssistantSend();
                                        }
                                    }}
                                    placeholder="Nhập câu hỏi cho AI..."
                                    autoSize={{ minRows: 1, maxRows: 3 }}
                                    className="rounded-lg border-slate-300 focus:border-blue-500 text-sm resize-none"
                                />
                                <Button
                                    type="primary"
                                    icon={<SendOutlined />}
                                    onClick={handleAssistantSend}
                                    disabled={!assistantInput.trim() || assistantLoading}
                                    className="bg-blue-600 hover:bg-blue-700 border-0 rounded-lg"
                                />
                            </div>
                        </div>
                    </div>

                </>
            )}

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}

export default function AdminChatPage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-screen items-center justify-center">
                    <Spin size="large" />
                </div>
            }
        >
            <ChatContent />
        </Suspense>
    );
}