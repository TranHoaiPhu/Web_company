"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  FaMapMarkerAlt,
  FaUsers,
  FaCalendarAlt,
  FaRobot,
  FaArrowLeft,
  FaBars,
} from "react-icons/fa";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import Carousel from "@/components/carousel";
import { useData } from "@/context/DataContext";
import clsx from "clsx";
import HistorySidebar from "@/components/HistorySidebar";
import { useTripHistory } from "@/hooks/useHistory";

export default function TripSuggestions() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  type TripData = {
    departure: string;
    destination: string;
    startDate: string;
    endDate: string;
    travelers: string;
    budget: string;
    travelStyle: string;
    interests: string[];
    accommodation: string;
    transportation: string;
  };

  interface TripDay {
    day: number;
    date: string;
    activities: {
      time: string;
      name: string;
      lat: number;
      lon: number;
      description: string;
      namePlace: string;
      city: string;
      province?: string;
      address: string;
      rating: number;
    }[];
  }

  const [tripData, setTripData] = useState<TripData | null>(null);
  const [showInfo, setShowInfo] = useState<boolean[]>([]);
  const { data } = useData();
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);
  
  // Trip history hook
  const {
    tripHistory,
    currentTripId,
    isLoaded,
    deleteTripSession,
    selectTripSession,
  } = useTripHistory();

  const handleClick = (index: number) =>
    setShowInfo((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  // Parse URL parameters
  useEffect(() => {
    if (searchParams) {
      const tripData = {
        departure: searchParams.get("departure") || "",
        destination: searchParams.get("destination") || "",
        startDate: searchParams.get("startDate") || "",
        endDate: searchParams.get("endDate") || "",
        travelers: searchParams.get("travelers") || "1",
        budget: searchParams.get("budget") || "",
        travelStyle: searchParams.get("travelStyle") || "",
        interests: searchParams.get("interests")?.split(",") || [],
        accommodation: searchParams.get("accommodation") || "",
        transportation: searchParams.get("transportation") || "",
      };
      setTripData(tripData);

      // Simulate AI processing
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  }, [searchParams]);

  // Initialize showInfo array when data is loaded
  useEffect(() => {
    if (data?.parameters.days) {
      setShowInfo(Array(data.parameters.days.length).fill(true));
    }
  }, [data]);

  if (!isLoggedIn || !tripData) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <FaRobot className="text-6xl text-blue-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            AI đang tạo lộ trình...
          </h2>
          <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20">
      {/* Mobile history toggle button */}
      <button
        onClick={() => setIsMobileHistoryOpen(true)}
        className="lg:hidden fixed top-20 left-4 z-40 flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
      >
        <FaBars className="w-5 h-5 text-gray-700" />
      </button>

      <div className="flex min-h-screen">
        {/* History Sidebar - Desktop: always visible inline, Mobile: drawer overlay */}
        <div className="hidden lg:block">
          {isLoaded && (
            <HistorySidebar
              isOpen={true}
              onToggle={() => {}}
              historyItems={tripHistory || []}
              currentItemId={currentTripId}
              onSelectItem={(item) => selectTripSession(item.id)}
              onDeleteItem={deleteTripSession}
              onNewItem={() => router.push('/trips')}
              type="trip"
              title="Lịch sử lộ trình"
              theme="light"
              variant="inline"
              showToggleButton={false}
            />
          )}
        </div>

        {/* Mobile History Drawer */}
        {isLoaded && isMobileHistoryOpen && (
          <HistorySidebar
            isOpen={true}
            onToggle={() => setIsMobileHistoryOpen(false)}
            historyItems={tripHistory || []}
            currentItemId={currentTripId}
            onSelectItem={(item) => {
              selectTripSession(item.id);
              setIsMobileHistoryOpen(false);
            }}
            onDeleteItem={deleteTripSession}
            onNewItem={() => {
              router.push('/trips');
              setIsMobileHistoryOpen(false);
            }}
            type="trip"
            title="Lịch sử lộ trình"
            theme="light"
            variant="overlay"
          />
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-12 py-8">
          <div className="max-w-5xl mx-auto">
            {/* Header - Centered */}
            <div className="mb-8">
              {/* Back button - separate row */}
              <div className="mb-4">
                <button
                  onClick={() => router.push("/trips")}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                >
                  <FaArrowLeft className="w-4 h-4" />
                  Quay lại tạo lộ trình
                </button>
              </div>
              
              {/* Title - centered */}
              <div className="text-center">
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 drop-shadow-sm mb-2"
                >
                  Gợi ý lộ trình du lịch
                </motion.h1>
                <p className="text-gray-600 text-lg">Dựa trên thông tin bạn đã cung cấp</p>
              </div>
            </div>
        {/* Trip Summary */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaMapMarkerAlt className="mr-2 text-blue-600" />
            Thông tin chuyến đi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center">
              <FaMapMarkerAlt className="text-red-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Hành trình</p>
                <p className="font-semibold">
                  {tripData.departure} → {tripData.destination}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <FaCalendarAlt className="text-green-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Thời gian</p>
                <p className="font-semibold">
                  {formatDate(tripData.startDate)} -{" "}
                  {formatDate(tripData.endDate)}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <FaUsers className="text-purple-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Số người</p>
                <p className="font-semibold">{tripData.travelers} người</p>
              </div>
            </div>
          </div>
        </div>
        {/* Days Suggestions */}
        {data?.parameters.days.map((day: TripDay, i: number) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 mb-5"
          >
            <motion.div
              className="cursor-pointer text-center mb-6"
              onClick={() => handleClick(i)}
              whileHover={{ scale: 1.02 }}
            >
              <h2 className="text-2xl font-semibold text-blue-600 hover:underline">
                {`Ngày ${i + 1} (${formatDate(day.date)})`}
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{
                opacity: showInfo[i] ? 1 : 0,
                height: showInfo[i] ? "auto" : 0,
              }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <Carousel activities={day.activities} />
            </motion.div>
          </div>
        ))}
        {/* Action Buttons */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {[
            { label: "Lên kế hoạch", color: "green", icon: "📋" },
            { label: "Chỉnh sửa", color: "yellow", icon: "✏️" },
            { label: "Kết quả khác", color: "red", icon: "🔄" },
            { label: "Chia sẻ", color: "cyan", icon: "📤" },
          ].map(({ label, color, icon }) => {
            const colorClass = {
              green: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
              yellow: "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700",
              red: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
              cyan: "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700",
            }[color];

            return (
              <motion.button
                key={label}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
                className={clsx(
                  "text-white font-semibold rounded-xl px-6 py-4 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2",
                  colorClass
                )}
              >
                <span className="text-xl">{icon}</span>
                {label}
              </motion.button>
            );
          })}
        </motion.div>
        
        {/* Bottom Actions */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-xl p-8 text-center border border-blue-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Bạn muốn làm gì tiếp theo?</h3>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => router.push("/trips")}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Tạo lộ trình mới
            </button>
            <button
              onClick={() => router.push("/home")}
              className="px-8 py-4 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold border-2 border-gray-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Về trang chủ
            </button>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
