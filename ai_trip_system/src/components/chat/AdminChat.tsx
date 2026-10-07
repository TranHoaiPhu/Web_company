"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaHeadset, FaTimes, FaPaperPlane, FaUser, FaRobot } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { chatService, ChatMessage, Conversation } from "@/services/chat/chat.service";
import { getCookie } from "cookies-next";
import { API_BASE_URL } from "@/config/api";

const AdminChat = () => {
    const { isLoggedIn, user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState("");
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    useEffect(() => {
        if (isLoggedIn && isOpen && !conversation) {
            const initChat = async () => {
                try {
                    const token = getCookie("token") as string;
                    const conv = await chatService.getAdminConversation(token);
                    setConversation(conv);

                    const history = await chatService.getMessages(conv.id);
                    setMessages(history);

                    // Connect WebSocket
                    const wsUrl = API_BASE_URL.replace("https://", "wss://")
                        .replace("http://", "ws://") + `/chat/ws/${token}`;

                    const ws = new WebSocket(wsUrl);

                    ws.onmessage = (event) => {
                        const newMsg = JSON.parse(event.data);
                        setMessages((prev) => [...prev, newMsg]);
                    };

                    ws.onclose = () => console.log("Chat WS Closed");
                    ws.onerror = (err) => console.error("Chat WS Error", err);

                    setSocket(ws);
                } catch (error) {
                    console.error("Failed to init admin chat:", error);
                }
            };

            initChat();
        }

        return () => {
            if (socket) {
                socket.close();
            }
        };
    }, [isLoggedIn, isOpen]);

    const handleSend = () => {
        if (!inputText.trim() || !socket || !conversation) return;

        const msgData = {
            conversation_id: conversation.id,
            content: inputText,
        };

        socket.send(JSON.stringify(msgData));

        // Optimistic update
        const optimisticMsg: ChatMessage = {
            id: Date.now().toString(),
            conversation_id: conversation.id,
            content: inputText,
            role: "user",
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, optimisticMsg]);
        setInputText("");
    };

    // Linkify function to detect URLs in the message content
    const linkify = (text: string, role: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.split(urlRegex).map((part, i) => {
            if (part.match(urlRegex)) {
                return (
                    <a
                        key={i}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`underline transition-colors break-all ${role === "user"
                            ? "text-blue-200 hover:text-white"
                            : "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            }`}
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    if (!isLoggedIn) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none">
            <AnimatePresence>
                {isOpen ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="bg-white dark:bg-slate-900 w-[350px] h-[500px] mb-4 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 dark:border-slate-800 pointer-events-auto"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <FaHeadset className="text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Hỗ trợ khách hàng</h3>
                                    <p className="text-[10px] opacity-80">Chúng tôi luôn sẵn sàng giúp đỡ bạn</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="hover:bg-white/20 p-2 rounded-full transition-colors"
                                title="Đóng"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
                            {messages.length === 0 && (
                                <div className="text-center py-10 opacity-50">
                                    <FaRobot className="text-4xl mx-auto mb-2" />
                                    <p className="text-xs">Bắt đầu cuộc trò chuyện với Admin!</p>
                                </div>
                            )}
                            {messages.map((msg, idx) => (
                                <div
                                    key={msg.id || idx}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div className={`max-w-[80%] flex items-end gap-2 ${msg.role === "user" ? "flex-reverse" : ""}`}>
                                        {msg.role !== "user" && (
                                            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                                <FaHeadset className="text-[10px] text-blue-600" />
                                            </div>
                                        )}
                                        <div className={`p-3 rounded-2xl text-sm ${msg.role === "user"
                                            ? "bg-blue-600 text-white rounded-br-none"
                                            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-gray-100 dark:border-slate-700 rounded-bl-none shadow-sm"
                                            }`}>
                                            {linkify(msg.content, msg.role)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                    placeholder="Nhập nội dung..."
                                    className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!inputText.trim()}
                                    className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-full flex items-center justify-center transition-colors"
                                >
                                    <FaPaperPlane className="text-sm ml-[-2px]" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center cursor-pointer relative pointer-events-auto"
            >
                <FaHeadset className="text-2xl" />
                {!isOpen && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></span>
                )}
            </motion.button>
        </div>
    );
};

export default AdminChat;
