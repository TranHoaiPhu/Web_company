"use client";
import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import HomeChatbot from "@/components/HomeChatbot";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import { useConversation } from "@/context/ConversationContext";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/hooks";

// Interface for location items shared between Chatbot and Map
export interface LocationItem {
  name: string;
  lat: number;
  lon: number;
  description?: string;
}

const Home = () => {
  const { t } = useTranslation("home");
  const { loading } = useAuthCheck();
  const { currentConversationId, handleConversationCreate } = useConversation();
  const router = useRouter();
  
  // State to manage locations from AI responses
  const [locations, setLocations] = useState<LocationItem[]>([]);

  // Callback to update locations from Chatbot
  const handleLocationsUpdate = useCallback((newLocations: LocationItem[]) => {
    setLocations(newLocations);
  }, []);

  // Callback to add locations (append to existing)
  const handleAddLocations = useCallback((newLocations: LocationItem[]) => {
    setLocations(prev => {
      // Filter out duplicates based on coordinates
      const existingCoords = new Set(prev.map(loc => `${loc.lat},${loc.lon}`));
      const uniqueNew = newLocations.filter(
        loc => !existingCoords.has(`${loc.lat},${loc.lon}`)
      );
      return [...prev, ...uniqueNew];
    });
  }, []);

  // Clear all locations
  const handleClearLocations = useCallback(() => {
    setLocations([]);
  }, []);

  const MapView = dynamic(() => import("@/components/Map"), {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">{t("page.loadingMap")}</div>
      </div>
    ),
  });

  if (loading) return <p>{t("page.checkingLogin")}</p>;

  const handleMapClick = () => {
    router.push("/map"); // Chuyển hướng đến trang /map (map/page.tsx)
  };

  return (
    <div className="flex h-full">
      {/* AI Chatbot */}
      <div className="flex-1">
        <HomeChatbot
          conversationId={currentConversationId}
          onConversationCreate={handleConversationCreate}
          onLocationsUpdate={handleLocationsUpdate}
          onAddLocations={handleAddLocations}
          onClearLocations={handleClearLocations}
        />
      </div>

      {/* Bản đồ (bên phải) - Thêm onClick để điều hướng */}
      <div className="w-100 flex-shrink-0" onClick={handleMapClick}>
        <div className="h-full cursor-pointer hover:bg-gray-100 transition-colors">
          <MapView locations={locations} onClearLocations={handleClearLocations} />
        </div>
      </div>
    </div>
  );
};

export default Home;
