"use client";

import React, { useEffect } from "react";
import { App, notification } from "antd";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/config/api";
import { usePathname, useRouter } from "next/navigation";
import { MessageOutlined } from "@ant-design/icons";

export default function ChatNotificationListener() {
    const { notification } = App.useApp();
    const pathname = usePathname();
    const router = useRouter();

    const pathnameRef = React.useRef(pathname);

    useEffect(() => {
        pathnameRef.current = pathname;
    }, [pathname]);

    useEffect(() => {
        const token = Cookies.get("admin_token");
        if (!token) return;

        const wsUrl =
            API_BASE_URL.replace("https://", "wss://").replace("http://", "ws://") +
            `/chat/ws/${token}`;

        console.log("Connecting to Global Chat WS:", wsUrl);
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("Global Chat WS Connected");
        };

        ws.onmessage = (event) => {
            try {
                const newMsg = JSON.parse(event.data);

                // Only notify if message is from a user (customer)
                if (newMsg.role === "user") {
                    // Don't show toast if already on the chat page 
                    // (because chat page UI handles it)
                    // Use ref to check current pathname without re-triggering effect
                    if (pathnameRef.current !== "/chat") {
                        notification.info({
                            message: "Tin nhắn mới từ khách hàng",
                            description: (
                                <div className="space-y-2">
                                    <p className="line-clamp-2 text-gray-600 italic">
                                        "{newMsg.content}"
                                    </p>
                                    <button
                                        onClick={() => {
                                            router.push("/chat");
                                            // Close all notifications
                                            notification.destroy();
                                        }}
                                        className="w-full bg-blue-50 text-blue-600 py-1.5 rounded-lg font-medium text-xs hover:bg-blue-100 transition-colors"
                                    >
                                        Xem và phản hồi
                                    </button>
                                </div>
                            ),
                            icon: <div className="bg-blue-100 p-2 rounded-full"><MessageOutlined className="text-blue-600" /></div>,
                            placement: "topRight",
                            duration: 8,
                            style: {
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                border: '1px solid #E2E8F0'
                            }
                        });
                    }
                }
            } catch (error) {
                console.error("Error parsing chat message:", error);
            }
        };

        ws.onerror = (err) => {
            console.error("Global Chat WS Error. Token might be invalid or server down.");
            console.dir(err);
        };

        return () => {
            console.log("Closing Global Chat WS");
            ws.close();
        };
    }, [router, notification]); // Removed pathname from deps

    return null;
}
