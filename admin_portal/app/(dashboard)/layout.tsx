"use client";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { LayoutProvider, useLayoutContext } from "@/context/LayoutContext";
import { App, ConfigProvider } from "antd";
import ChatNotificationListener from "@/components/ChatNotificationListener";

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { sidebarCollapsed } = useLayoutContext();

    return (
        <div className="min-h-screen bg-[#F1F5F9] flex flex-col transition-all duration-500 relative overflow-hidden">
            {/* Minimal background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-100/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-indigo-100/20 rounded-full blur-3xl"></div>
            </div>

            <Header />
            <ChatNotificationListener />

            <Sidebar />

            <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${sidebarCollapsed ? "ml-20" : "ml-64"} pt-16`}>
                <main className="p-4 sm:p-6 lg:p-8 relative z-10 flex-1">
                    {/* Content wrapper */}
                    <div className="min-h-full">
                        {children}
                    </div>
                </main>

                {/* Footer with gradient */}
                <footer className="relative z-10 py-6 px-8 backdrop-blur-xl bg-white/80 border-t border-gray-200/50">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            All rights reserved.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="text-sm text-gray-600 hover:text-purple-600 transition-colors duration-300">Privacy Policy</a>
                            <span className="text-gray-300">•</span>
                            <a href="#" className="text-sm text-gray-600 hover:text-purple-600 transition-colors duration-300">Terms of Service</a>
                            <span className="text-gray-300">•</span>
                            <a href="#" className="text-sm text-gray-600 hover:text-purple-600 transition-colors duration-300">Contact</a>
                        </div>
                    </div>
                </footer>
            </div>

            <style jsx>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
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
            `}</style>
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ConfigProvider>
            <App message={{ top: 80 }} notification={{ placement: 'topRight' }}>
                <LayoutProvider>
                    <DashboardContent>
                        {children}
                    </DashboardContent>
                </LayoutProvider>
            </App>
        </ConfigProvider>
    );
}
