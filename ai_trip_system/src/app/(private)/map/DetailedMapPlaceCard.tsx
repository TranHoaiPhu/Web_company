"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaHeart,
  FaRegHeart,
  FaMapMarkerAlt,
  FaClock,
  FaTag,
  FaLightbulb,
  FaHotel,
  FaInfoCircle,
} from "react-icons/fa";
import PlaceImage from "@/components/PlaceImage";
import Reviews from "./PlaceCardReview";
import { useTranslation } from "@/lib/i18n/hooks";
import type { PlaceResponse } from "@/types/backend";

interface DetailedMapPlaceCardProps {
  place: PlaceResponse;
  token: string;
}

export default function DetailedMapPlaceCard({
  place,
}: DetailedMapPlaceCardProps) {
  const { t } = useTranslation("map");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"info" | "reviews">("info");
  const [isFavorite, setIsFavorite] = useState(false);
  const uiHelperData = {
    openHours: "08:00 - 18:00",
    entranceFee: t("placeCard.contactForDetails"),
    bestTimeToVisit: t("placeCard.earlyMorningEvening"),
  };

  const getActivitiesByType = (type: number | null): string[] => {
    // TODO: Implement proper i18n array support
    switch (type) {
      case 0:
        return ["Enjoy cuisine", "Meet friends", "Experience local food"];
      case 1:
        return ["Relax", "Unwind", "Use hotel amenities"];
      case 2:
        return ["Swim", "Relax", "Water sports"];
      default:
        return ["Sightseeing", "Photography", "Explore"];
    }
  };

  const activities = getActivitiesByType(place.type);

  const handleBookingNow = () => {
    router.push(`/booking?idPlace=${place.idplace}&namePlace=${place.name}`);
  };

  const handleDetailsClick = () => {
    router.push(`/place?idPlace=${place.idplace}`);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="relative h-48 w-full">
        <PlaceImage
          idPlace={place.idplace}
          altText={place.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">{place.name}</h3>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-1 rounded-full bg-white/20 backdrop-blur-sm"
            >
              {isFavorite ? (
                <FaHeart className="text-red-500 text-lg" />
              ) : (
                <FaRegHeart className="text-white text-lg" />
              )}
            </button>
          </div>
          <p className="text-white/90 text-sm">{place.address}</p>
        </div>
      </div>

      <div className="flex border-b text-lg text-gray-900">
        <button
          onClick={() => setActiveTab("info")}
          className={`flex-1 py-2 font-medium ${
            activeTab === "info"
              ? "text-cyan-500 border-b-2 border-cyan-500"
              : "text-gray-600"
          }`}
        >
          {t("placeCard.tabs.info")}
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`flex-1 py-2 font-medium ${
            activeTab === "reviews"
              ? "text-cyan-500 border-b-2 border-cyan-500"
              : "text-gray-600"
          }`}
        >
          {t("placeCard.tabs.reviews")}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "info" && (
          <div>
            <div className="mb-4">
              <h4 className="text-lg font-bold text-gray-800 mb-2">{t("placeCard.description")}</h4>
              <p className="text-gray-600 text-sm">
                {place.description || t("placeCard.noDescription")}
              </p>
            </div>
            <div className="mb-4">
              <h4 className="text-lg font-bold text-gray-800 mb-2">
                {t("placeCard.detailedInfo")}
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <FaClock className="text-cyan-500" />
                  <div>
                    <p className="font-bold">{t("placeCard.openHours")}</p>
                    <p className="text-gray-600">{uiHelperData.openHours}</p>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <FaTag className="text-cyan-500" />
                  <div>
                    <p className="font-bold">{t("placeCard.ticketPrice")}</p>
                    <p className="text-gray-600">{uiHelperData.entranceFee}</p>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <FaLightbulb className="text-cyan-500" />
                  <div>
                    <p className="font-bold">{t("placeCard.idealTime")}</p>
                    <p className="text-gray-600">
                      {uiHelperData.bestTimeToVisit}
                    </p>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-cyan-500" />
                  <div>
                    <p className="font-bold">{t("placeCard.address")}</p>
                    <p className="text-gray-600">{place.address}</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-800 mb-3">
                {t("placeCard.featuredActivities")}
              </h4>
              <ul className="grid grid-cols-1 gap-2 text-sm">
                {activities.map((activity, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 text-cyan-600 font-bold">
                      {index + 1}
                    </span>
                    <span>{activity}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleBookingNow}
                className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2 text-sm"
              >
                <FaHotel /> {t("placeCard.bookNearbyHotel")}
              </button>
              <button
                onClick={handleDetailsClick}
                className="w-full py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition flex items-center justify-center gap-2 text-sm"
              >
                <FaInfoCircle /> {t("placeCard.details")}
              </button>
            </div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div>
            <Reviews idPlace={place.idplace} />
          </div>
        )}
      </div>
    </div>
  );
}
