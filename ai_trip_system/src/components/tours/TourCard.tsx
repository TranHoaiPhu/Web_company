"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import {
  FaMapMarkerAlt,
  FaClock,
  FaUsers,
  FaStar,
  FaHeart,
  FaRegHeart,
  FaArrowRight,
  FaFire,
  FaShoppingBag,
} from "react-icons/fa";
import { TourBase } from "@/types/tour";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/hooks";
import favoriteTourService from "@/services/tours/favorite-tour.service";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import { useEffect } from "react";

// TourCard Component
const TourCard = ({ tour, onFavoriteToggle }: { tour: TourBase, onFavoriteToggle?: (isFavorite: boolean) => void }) => {
  const { t } = useTranslation("tour");
  const { t: tCommon } = useTranslation("common");
  const { isLoggedIn } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if tour is already favorited
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!isLoggedIn || !tour.id) return;
      try {
        const { is_favorite } = await favoriteTourService.checkFavorite(Number(tour.id));
        setIsFavorite(is_favorite);
      } catch (error) {
        console.error("Error checking favorite status:", error);
      }
    };
    checkFavoriteStatus();
  }, [isLoggedIn, tour.id]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Ngăn văng sự kiện click lên thẻ Link cha
    if (!isLoggedIn) {
      toast.info(tCommon("messages.loginToFavorite"));
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorite) {
        await favoriteTourService.removeFavorite(Number(tour.id));
        setIsFavorite(false);
        onFavoriteToggle?.(false);
        window.dispatchEvent(new Event("favoriteChanged"));
        toast.success(tCommon("messages.removedFromFavorites"));
      } else {
        await favoriteTourService.addFavorite(Number(tour.id));
        setIsFavorite(true);
        onFavoriteToggle?.(true);
        window.dispatchEvent(new Event("favoriteChanged"));
        toast.success(tCommon("messages.addedToFavorites"));
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error(tCommon("messages.favoriteUpdateFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const discount = tour.originalPrice
    ? Math.round(((tour.originalPrice - tour.price) / tour.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 h-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Link href={`/tours/${tour.slug || tour.id}`} className="flex flex-col h-full">

        {/* Image Container */}
        <div className="relative h-64 overflow-hidden flex-shrink-0">
          <motion.div
            className="w-full h-full"
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.6 }}
          >
            {tour.image ? (
              <Image
                src={tour.image}
                alt={tour.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-500">No image</span>
              </div>
            )}
          </motion.div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {tour.featured && (
              <motion.span
                className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <FaFire className="text-sm" />
                {t("card.hotDeal")}
              </motion.span>
            )}
            {discount > 0 && (
              <motion.span
                className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                -{discount}%
              </motion.span>
            )}
            {tour.badges?.map((badge, index) => (
              <motion.span
                key={index}
                className="bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                {badge}
              </motion.span>
            ))}
          </div>

          {/* Favorite Button */}
          <motion.button
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-lg hover:bg-white transition-colors"
            onClick={handleFavoriteClick}
            disabled={isLoading}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isFavorite ? (
              <FaHeart className="text-red-500 text-lg" />
            ) : (
              <FaRegHeart className="text-gray-700 text-lg" />
            )}
          </motion.button>

          {/* Category Tag */}
          <div className="absolute bottom-4 left-4">
            <span className="bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-semibold px-4 py-2 rounded-full shadow-lg">
              {tour.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-blue-600 transition-colors">
            {tour.title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {tour.description}
          </p>

          {/* Location */}
          <div className="flex items-center gap-2 text-gray-700 mb-4">
            <FaMapMarkerAlt className="text-red-500 flex-shrink-0" />
            <span className="text-sm font-medium truncate">{tour.location}</span>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-600">
              <FaClock className="text-blue-500 flex-shrink-0" />
              <span className="text-sm">{tour.duration}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <FaUsers className="text-purple-500 flex-shrink-0" />
              <span className="text-sm">{t("card.maxGuests", { params: { count: tour.maxParticipants || 0 } }).replace("{count}", String(tour.maxParticipants || 0))}</span>
            </div>
            {tour.bookingCount !== undefined && tour.bookingCount > 0 && (
              <div className="flex items-center gap-2 text-gray-600 col-span-2">
                <FaShoppingBag className="text-green-500 flex-shrink-0" />
                <span className="text-sm font-medium text-green-600">
                  {tour.bookingCount.toLocaleString("vi-VN")} lượt đặt
                </span>
              </div>
            )}
          </div>

          {/* Rating & Reviews */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={
                    i < Math.floor(tour.rating)
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {tour.rating}
            </span>
            <span className="text-sm text-gray-500">({t("card.reviews", { params: { count: tour.reviews } }).replace("{count}", String(tour.reviews))})</span>
          </div>

          {/* Available Spots */}
          {tour.availableSpots && tour.availableSpots <= 5 && (
            <div className="mb-4">
              <p className="text-xs text-red-600 font-semibold">
                ⚡ {t("card.spotsLeft", { params: { count: tour.availableSpots } }).replace("{count}", String(tour.availableSpots))}
              </p>
            </div>
          )}

          {/* Price & CTA */}
          <div className="flex items-center justify-between mt-auto">
            <div>
              {tour.originalPrice && (
                <p className="text-sm text-gray-400 line-through">
                  {tour.originalPrice.toLocaleString("vi-VN")}đ
                </p>
              )}
              <p className="text-2xl font-bold text-blue-600">
                {tour.price.toLocaleString("vi-VN")}đ
              </p>
              <p className="text-xs text-gray-500">{t("card.perPerson")}</p>
            </div>
            <motion.button
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t("card.bookNow")}
              <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default TourCard;
