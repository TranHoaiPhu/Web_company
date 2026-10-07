"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import MapEx from "./Map_Ex";
import PlaceCard from "./PlaceCard";
import {
  FaList,
  FaMapMarkerAlt,
  FaChevronLeft,
  FaChevronRight,
  FaInfoCircle,
} from "react-icons/fa";
import { PlaceResponse } from "@/types/backend";
import { useTranslation } from "@/lib/i18n/hooks";

const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

export default function ExplorePage() {
  const { t } = useTranslation("explore");
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [places, setPlaces] = useState<PlaceResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPlaces, setShowPlaces] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error" | "info",
  });
  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({
      visible: true,
      message,
      type,
    });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 5000);
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoggedIn, router]);

  // If not logged in, don't render the content
  if (!isLoggedIn) {
    return null;
  }

  const normalizePovinceName = (province: string): string => {
    // Remove common prefixes
    const normalized = province
      .replace(/^Tỉnh\s+/i, "") // Remove "Tỉnh" prefix
      .replace(/^tỉnh\s+/i, "") // Remove "tỉnh" prefix
      .replace(/^thành phố\s+/i, "") // Remove "thành phố" prefix
      .replace(/^Thành phố\s+/i, "") // Remove "Thành phố" prefix
      .replace(/^tp\.\s*/i, "") // Remove "tp." prefix
      .trim();

    // Optional: Map to standard names if needed
    const provinceMap: Record<string, string> = {
      "quảng nam": "Quảng Nam",
      "quảng ninh": "Quảng Ninh",
      // Add more mappings as needed
    };

    return (
      provinceMap[normalized] ||
      normalized.charAt(0).toUpperCase() + normalized.slice(1)
    );
  };

  const fetchPlacesFromGoogle = async (
    province: string,
    originalProvinceName?: string
  ): Promise<PlaceResponse[]> => {
    if (!GOOGLE_PLACES_API_KEY) {
      console.error("Missing Google Places API key");
      return [];
    }

    try {
      const query = `địa điểm du lịch nổi tiếng tại ${province}, Việt Nam`;

      // Sử dụng Google Maps JS Places API (tránh CORS)
      if (typeof window === "undefined" || !window.google?.maps) {
        console.warn("Google Maps JS API chưa sẵn sàng");
        return [];
      }

      // Load Places library với API mới
      const { Place } = (await google.maps.importLibrary(
        "places"
      )) as google.maps.PlacesLibrary;

      // Sử dụng searchByText thay vì TextSearchService
      const request = {
        textQuery: query,
        fields: ['id', 'displayName', 'formattedAddress', 'location', 'rating', 'photos'],
        maxResultCount: 10,
        language: 'vi',
        region: 'VN',
      };

      const { places: results } = await Place.searchByText(request);

      if (!results || results.length === 0) {
        return [];
      }

      const mapped: PlaceResponse[] = results
        .map((item) => {
          const address: string = item.formattedAddress || province;
          const parts = address.split(",").map((p: string) => p.trim());
          const cityFromAddress =
            parts.length >= 2 ? parts[parts.length - 2] : province;

          const lat = item.location?.lat();
          const lon = item.location?.lng();

          if (typeof lat !== "number" || typeof lon !== "number") {
            return null;
          }

          const ratingNumber =
            typeof item.rating === "number" && item.rating > 0
              ? item.rating
              : 4.5;

          const place: PlaceResponse = {
            idplace: item.id || `${lat}-${lon}`,
            name: item.displayName || "Địa điểm du lịch",
            country: "Việt Nam",
            city: cityFromAddress,
            province: originalProvinceName || province,
            address,
            description: item.formattedAddress || "",
            rating: ratingNumber.toFixed(1),
            type: 0,
            lat,
            lon,
            googlePlaceId: item.id,
          };

          return place;
        })
        .filter((p: PlaceResponse | null): p is PlaceResponse => p !== null);

      return mapped;
    } catch (error) {
      console.error("Error fetching places from Google:", error);
      return [];
    }
  };

  const fetchPlacesByProvince = async (province: string) => {
    setLoading(true);
    const normalizedProvince = normalizePovinceName(province);
    console.log(`Original: ${province}, Normalized: ${normalizedProvince}`);
    try {
      let data: PlaceResponse[] = [];
      // Trực tiếp gọi Google Places Text Search API cho tỉnh/thành được chọn
      const googlePlaces = await fetchPlacesFromGoogle(normalizedProvince, province);

      if (googlePlaces.length > 0) {
        data = googlePlaces;
      }

      console.log("Final processed data:", data);
      setPlaces(data);
      setShowPlaces(true);

      if (data.length > 0) {
        showToast(t("toast.foundPlaces", { params: { count: data.length } }), "success");
      } else {
        // Only show empty state if we really tried everything
        showToast("Không tìm thấy địa điểm nào", "info");
      }

    } catch (error) {
      console.error("Error fetching places:", error);
      setPlaces([]);
      setShowPlaces(true);
    } finally {
      setLoading(false);
    }
  };

  const handleProvinceSelect = (province: string) => {
    setSelectedProvince(province);
    fetchPlacesByProvince(province);
  };

  const handleBackToMap = () => {
    setShowPlaces(false);
    setSelectedProvince(null);
    setPlaces([]);
  };

  return (
    <div className="min-h-screen bg-blue-50 pt-20">
      {/* Main content */}
      <div className="p-6">
        {/* Header nav và button "Quay lại" */}
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {showPlaces && (
              <button
                onClick={handleBackToMap}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <svg
                  className="w-5 h-5 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L6.414 9H15a1 1 0 110 2H6.414l3.293 3.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                {t("navigation.back")}
              </button>
            )}
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
              {showPlaces ? t("title.suggestions") : t("title.explore")}
              </h2>
              <p className="mt-1 text-sm text-slate-500 max-w-xl">
                {t("subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Map and Places Container */}
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl overflow-hidden border border-slate-100">
          <div className="flex">
            {/* Guide Sidebar */}
            <div
              className={`relative border-r border-slate-200 bg-slate-50/80 transition-all duration-300 ${showGuide ? "w-80" : "w-10"}`}
            >
              <button
                onClick={() => setShowGuide((prev) => !prev)}
                className="absolute top-3 -right-3 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
                aria-label={showGuide ? t("guide.hideGuide") : t("guide.showGuide")}
              >
                {showGuide ? (
                  <FaChevronLeft className="h-4 w-4 text-gray-600" />
                ) : (
                  <FaChevronRight className="h-4 w-4 text-gray-600" />
                )}
              </button>

              {showGuide && (
                <div className="h-[calc(100vh-180px)] overflow-y-auto p-4 text-sm">
                  <div className="mb-3 flex items-center gap-2 text-blue-600">
                    <FaInfoCircle className="h-4 w-4" />
                    <span className="font-semibold tracking-wide">
                      {t("guide.title")}
                    </span>
                  </div>
                  <p className="mb-3 text-slate-700 leading-relaxed">
                    {t("guide.description")}
                  </p>
                  <ol className="mb-3 list-decimal space-y-1 pl-4 text-slate-700">
                    <li>{t("guide.steps.1")}</li>
                    <li>{t("guide.steps.2")}</li>
                    <li>{t("guide.steps.3")}</li>
                    <li>{t("guide.steps.4")}</li>
                  </ol>
                  <p className="text-xs text-slate-500">
                    {t("guide.note")}
                  </p>
                </div>
              )}
            </div>

            {/* Map + Places Container */}
            <div className="flex flex-1">
              {/* Map Section */}
              <div
                className={`transition-all duration-300 ${showPlaces ? "w-2/3" : "w-full"}
                  relative overflow-hidden`}
              >
                <MapEx
                  onProvinceSelect={handleProvinceSelect}
                  className="h-[calc(100vh-180px)] w-full z-0"
                />
              </div>

              {/* Places List Section */}
              {showPlaces && (
                <div className="w-1/3 border-l border-slate-200 flex flex-col bg-slate-50/60">
                  {/* Places Header */}
                  <div className="p-4 border-b border-slate-200 bg-white/90 backdrop-blur flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        {selectedProvince
                          ? t("places.title", { params: { province: selectedProvince } })
                          : t("title.suggestions")}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        {t("places.found", { params: { count: places.length } })}
                      </p>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <FaList className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Places List */}
                  <div className="flex-1 h-[calc(100vh-180px)] max-h-[calc(100vh-180px)] overflow-y-auto bg-gradient-to-b from-white/90 to-slate-50">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-2"></div>
                        <span className="text-sm">{t("loading")}</span>
                      </div>
                    ) : places.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                        <FaMapMarkerAlt className="w-8 h-8 mb-2 text-blue-400" />
                        <p className="text-sm">{t("places.empty")}</p>
                      </div>
                    ) : (
                      <div className="p-4 space-y-4">
                        {places.map((place, index) => (
                          <div
                            key={place.idplace}
                            className="group rounded-xl bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-md hover:ring-blue-100 transition transform hover:-translate-y-0.5"
                            style={{
                              animationDelay: `${index * 60}ms`,
                              animation: "fadeInUp 0.4s ease forwards",
                            }}
                          >
                            <PlaceCard place={place} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
