"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AiOutlineExpandAlt } from "react-icons/ai";
import dynamic from "next/dynamic";
import { API_BASE_URL } from "@/config/api";
import {
  FaClock,
  FaMapMarkerAlt,
  FaTag,
  FaLightbulb,
  FaStar,
  FaShare,
  FaHeart,
  FaRegHeart,
  FaMapMarkedAlt,
  FaHotel,
  FaShoppingBag,
} from "react-icons/fa";
import { getCookie } from "cookies-next";
import Loading from "@/components/Loading";
import PlaceImage from "@/components/PlaceImage";
import Reviews from "./Review";
import { useTranslation } from "@/lib/i18n/hooks";
import type { PlaceResponse } from "@/types/backend";

const MapView = dynamic(() => import("@/components/Map"), {
  ssr: false,
});

// Additional UI data types that might not come directly from API
// interface Review {
//   user: string;
//   rating: number;
//   comment: string;
// }

interface NearbyPlace {
  name: string;
  distance: string;
  type: string;
}

export default function DetailPage() {
  const { t } = useTranslation("map");
  const router = useRouter();
  const searchParams = useSearchParams();
  const idBooking = searchParams.get("idBooking");
  const idPlace = searchParams.get("idPlace");
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [placeData, setPlaceData] = useState<PlaceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = getCookie("token") as string;
  // const [imageUrl, setImageUrl] = useState("");

  // Optional additional data for UI enhancements
  // const [reviews, setReviews] = useState<Review[]>([]);
  const [nearbyPlaces] = useState<NearbyPlace[]>([]);

  // Default additional information (could be fetched from another API endpoint)
  const uiHelperData = {
    openHours: "08:00 - 18:00",
    entranceFee: t("placeCard.contactForDetails"),
    bestTimeToVisit: t("placeCard.earlyMorningEvening"),
  };

  // Activities based on place type
  const getActivitiesByType = (type: number): string[] => {
    switch (type) {
      case 1: // Historical site
        return ["Explore historical architecture", "Photography", "Learn about local history"];
      case 2: // Beach
        return ["Swimming", "Sunbathing", "Water sports", "Beach volleyball"];
      default:
        return ["Sightseeing", "Photography", "Relaxation"];
    }
  };

  useEffect(() => {
    const fetchPlaceData = async () => {
      setIsLoading(true);
      try {
        if (!idPlace) {
          const placeResponse = await fetch(
            `${API_BASE_URL}/bookings/${idBooking}/places/`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (!placeResponse.ok)
            throw new Error("Không thể lấy thông tin địa điểm");

          const data: PlaceResponse = await placeResponse.json();
          setPlaceData(data);
        } else {
          const placeResponse = await fetch(
            `${API_BASE_URL}/places?idPlace=${idPlace}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (!placeResponse.ok)
            throw new Error("Không thể lấy thông tin địa điểm");

          const data: PlaceResponse = await placeResponse.json();
          setPlaceData(data);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching place data:", err);
        setError(
          err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaceData();
  }, [idBooking, idPlace, token]);

  console.log(placeData);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-sky-50 to-blue-100">
        <Loading message={t("loading")} />
      </div>
    );
  }

  if (error || !placeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-sky-50 to-blue-100">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">
            {t("error.loadFailed")}
          </h2>
          <p className="text-gray-600 mb-6">
            {error || t("error.retry")}
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
          >
            {t("error.retry")}
          </button>
        </div>
      </div>
    );
  }

  // Calculate activities based on place type
  const activities = getActivitiesByType(placeData.type);

  const handleBookingNow = () => {
    router.push(`/booking?idPlace=${idPlace}&namePlace=${placeData.name}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-100">
      <main className="container mx-auto px-4 py-8">
        {/* Featured Image and Title Section */}
        <div className="relative w-full h-[400px] rounded-xl overflow-hidden mb-6 shadow-xl">
          <PlaceImage
            idPlace={placeData.idplace}
            altText={placeData.name}
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {placeData.name}
              </h1>
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="p-2 rounded-full bg-white/20 backdrop-blur-sm"
              >
                {isFavorite ? (
                  <FaHeart className="text-red-500 text-xl" />
                ) : (
                  <FaRegHeart className="text-white text-xl" />
                )}
              </button>
            </div>

            <div className="flex items-center mt-2">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={`${
                    i < Math.round(placeData.rating as unknown as number)
                      ? "text-yellow-400"
                      : "text-gray-400"
                  }`}
                />
              ))}
              <span className="text-white ml-2 font-medium">
                {placeData.rating}
              </span>
            </div>

            <p className="text-white/90 mt-2 text-sm md:text-base">
              {placeData.address}
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-xl overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b text-2xl text-gray-900 font-stretch-extra-condensed">
            <button
              onClick={() => setActiveTab("info")}
              className={`flex-1 py-4 font-medium ${
                activeTab === "info"
                  ? "text-cyan-500 border-b-2 border-cyan-500"
                  : "text-gray-600"
              }`}
            >
              {t("placeCard.tabs.info")}
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`flex-1 py-4 font-medium ${
                activeTab === "reviews"
                  ? "text-cyan-500 border-b-2 border-cyan-500"
                  : "text-gray-600"
              }`}
            >
              {t("placeCard.tabs.reviews")}
            </button>
            <button
              onClick={() => setActiveTab("nearby")}
              className={`flex-1 py-4 font-medium ${
                activeTab === "nearby"
                  ? "text-cyan-500 border-b-2 border-cyan-500"
                  : "text-gray-600"
              }`}
            >
              {t("place.nearby")}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "info" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-3">
                    {t("placeCard.description")}
                  </h2>
                  <p className="text-gray-600">
                    {placeData.description || t("placeCard.noDescription")}
                  </p>
                </div>

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-3">
                    {t("placeCard.detailedInfo")}
                  </h2>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <FaClock className="text-cyan-500" />
                      <div>
                        <p className="font-semibold">{t("placeCard.openHours")}</p>
                        <p className="text-gray-600 text-sm">
                          {uiHelperData.openHours}
                        </p>
                      </div>
                    </li>
                    <li className="flex items-center gap-3">
                      <FaTag className="text-cyan-500" />
                      <div>
                        <p className="font-semibold">{t("placeCard.ticketPrice")}</p>
                        <p className="text-gray-600 text-sm">
                          {uiHelperData.entranceFee}
                        </p>
                      </div>
                    </li>
                    <li className="flex items-center gap-3">
                      <FaLightbulb className="text-cyan-500" />
                      <div>
                        <p className="font-semibold">{t("placeCard.idealTime")}</p>
                        <p className="text-gray-600 text-sm">
                          {uiHelperData.bestTimeToVisit}
                        </p>
                      </div>
                    </li>
                    <li className="flex items-center gap-3">
                      <FaMapMarkerAlt className="text-cyan-500" />
                      <div>
                        <p className="font-semibold">{t("placeCard.address")}</p>
                        <p className="text-gray-600 text-sm">
                          {placeData.address}
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-3">
                    {t("placeCard.featuredActivities")}
                  </h2>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {activities.map((activity, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-cyan-100 text-cyan-600 font-semibold text-sm">
                          {index + 1}
                        </span>
                        <span>{activity}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative h-[300px] rounded-lg overflow-hidden mb-6 border-2 border-white shadow-lg">
                  <MapView />
                  <button
                    onClick={() => setIsMapExpanded(!isMapExpanded)}
                    className="absolute bottom-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg"
                  >
                    <AiOutlineExpandAlt className="text-gray-700" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                {/* Reviews Section */}
                {idPlace ? (
                  <Reviews idPlace={idPlace} />
                ) : (
                  <p className="text-gray-500 italic">
                    {t("place.noReviewsInfo")}
                  </p>
                )}
              </div>
            )}

            {activeTab === "nearby" && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {t("place.nearbyPlaces")}
                </h2>
                {nearbyPlaces.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {nearbyPlaces.map((place, index) => (
                      <div
                        key={index}
                        className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition flex items-start gap-3"
                      >
                        <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                          {place.type === "Bãi biển" && (
                            <FaHotel className="text-cyan-600" />
                          )}
                          {place.type === "Làng nghề" && (
                            <FaShoppingBag className="text-cyan-600" />
                          )}
                          {place.type === "Di tích" && (
                            <FaMapMarkerAlt className="text-cyan-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{place.name}</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <span>{place.type}</span>
                            <span className="mx-2">•</span>
                            <span>{place.distance}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    {t("place.noNearbyPlaces")}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Call-to-action Buttons */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center gap-2 bg-cyan-500 text-white py-3 rounded-lg hover:bg-cyan-600 transition shadow-md">
            <FaMapMarkedAlt /> <span>{t("place.viewOnMap")}</span>
          </button>
          <button
            className="flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition shadow-md"
            onClick={handleBookingNow}
          >
            <FaHotel /> <span>{t("placeCard.bookNearbyHotel")}</span>
          </button>
          <button className="flex items-center justify-center gap-2 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition shadow-md col-span-2 md:col-span-1">
            <FaShare /> <span>{t("place.share")}</span>
          </button>
        </div>
      </main>

      {/* Modal for expanded map */}
      {isMapExpanded && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl h-3/4 overflow-hidden relative">
            <button
              onClick={() => setIsMapExpanded(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md text-gray-700"
            >
              ✕
            </button>
            <div className="h-full w-full">
              <MapView />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
