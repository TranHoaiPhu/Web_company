"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
//import Header from "@/components/header";
import MainSidebar from "@/components/MainSidebar";
import Providers from "@/components/Providers";
import {
  ConversationProvider,
  useConversation,
} from "@/context/ConversationContext";
import TravelHeader from "./HeaderTravel";
import AdminChat from "./chat/AdminChat";
import Footer from "./footer";

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <Providers>
      <ClientLayoutWithAuth>{children}</ClientLayoutWithAuth>
    </Providers>
  );
}

// Component that uses AuthContext
function ClientLayoutWithAuth({ children }: ClientLayoutProps) {
  const [, setForceUpdate] = useState(0);



  // Force re-render when auth state changes
  useEffect(() => {
    const handleAuthChange = () => {
      setForceUpdate((prev) => prev + 1);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("authStateChanged", handleAuthChange);
      return () => {
        window.removeEventListener("authStateChanged", handleAuthChange);
      };
    }
  }, []);

  // Check if current route needs sidebar (chatbot/conversation pages)
  // Sidebar is permanently disabled
  // const needsSidebar =
  //   pathname?.startsWith("/home") ||
  //   pathname?.startsWith("/chatbot") ||
  //   pathname?.startsWith("/search") ||
  //   pathname?.startsWith("/map") ||
  //   pathname?.startsWith("/result");

  // Show sidebar only for specific chatbot/conversation pages when logged in
  const showSidebar = false; // Sidebar disabled

  return (
    <ConversationProvider>
      <ClientLayoutContent showSidebar={showSidebar}>
        {children}
      </ClientLayoutContent>
    </ConversationProvider>
  );
}

// Separate component to use conversation context
function ClientLayoutContent({
  showSidebar,
  children,
}: {
  showSidebar: boolean;
  children: ReactNode;
}) {
  const {
    currentConversationId,
    handleConversationSelect,
    handleNewConversation,
  } = useConversation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isHome =
    pathname === "/" ||
    pathname === "/vi" ||
    pathname === "/intro" ||
    pathname === "";

  // Hide header and footer for auth page
  const isAuthPage = pathname === "/auth" || pathname === "/login" || pathname === "/register";

  // If it's auth page, render without header/footer
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="flex flex-col min-h-screen">
        {/* Always show header */}
        <TravelHeader isHomePage={isHome} />

        {showSidebar ? (
          <>
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="fixed top-20 left-4 z-50 p-2 bg-white rounded shadow hover:bg-gray-50 transition-colors cursor-pointer"
              >
                ☰
              </button>
            )}
            <div className="flex h-screen overflow-hidden pt-20">
              {/* Sidebar Overlay */}
              <MainSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                currentConversationId={currentConversationId}
                onConversationSelect={handleConversationSelect}
                onNewConversation={handleNewConversation}
              />

              {/* Main Content */}
              <main
                className={`flex-1 overflow-auto ${sidebarOpen ? "" : "ps-16"}`}
              >
                {children}
              </main>
            </div>
          </>
        ) : (
          <main className="flex-grow">
            {children}
          </main>
        )}

        {/* Real-time Admin Chat */}
        <AdminChat />

        {/* Footer moved inside provider */}
        <Footer />
      </div>
    </>
  );
}
