"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FaSearch,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUsers,
  FaPlay,
  FaChevronDown,
  FaStar,
  FaHeart,
  FaGlobeAsia,
  FaSpinner
} from "react-icons/fa";

import { HeroSlide } from "@/types/HeroSlide";
import { bannerService } from "@/services/Banners/banner.service";
import { useTranslation } from "@/lib/i18n/hooks";
import LocationSearchModal from "@/components/search/LocationSearchModal";

interface SelectedLocation {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

const HeroInspiration = () => {
  const { t } = useTranslation("home");
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [searchFocus] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [departureDate, setDepartureDate] = useState<string>('');

  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch banners
  useEffect(() => {
    const fetchBanners = async () => {
      setLoading(true);
      try {
        const response = await bannerService.getAll();
        console.log("API response:", response);

        // API trả về { success, pagination, data }
        const banners = response || [];

        // Map để đảm bảo type đúng
        const slides: HeroSlide[] = banners.map((item: HeroSlide) => ({
          id: item.id,
          title: item.title || "Khám Phá Việt Nam",
          subtitle: item.subtitle || "Hành trình tuyệt vời",
          location: item.location || "Việt Nam",
          tag: item.tag || "Hot",
          image_url: item.image_url || "/fallback-banner.jpg", // fallback nếu thiếu
          description: item.description || "",
          mobile_image_url: item.mobile_image_url || item.image_url || "/fallback-banner.jpg",
          alt_text: item.alt_text || item.title || "Banner",
          link_url: item.link_url || "#",
        } as HeroSlide));
        setHeroSlides(slides);
        setError(null);
      } catch (err: unknown) {
        // Only log non-404 errors
        const error = err as { status?: number };
        if (error.status !== 404) {
          console.error("Fetch banners failed:", err);
          setError(err instanceof Error ? err.message : t("hero.error"));
        }
        // Silently use empty array for 404
        setHeroSlides([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Auto slide chỉ khi có dữ liệu
  useEffect(() => {
    if (heroSlides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Nếu đang loading
  if (loading) {
    return (
      <div className="relative h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="text-white text-2xl flex items-center gap-4">
          <FaSpinner className="animate-spin text-4xl" />
          {t("hero.loading")}
        </div>
      </div>
    );
  }

  // Nếu lỗi
  if (error) {
    return (
      <div className="relative h-screen w-full flex items-center justify-center bg-red-900/80 text-white">
        <div className="text-center px-6">
          <p className="text-3xl font-bold mb-4">{t("hero.error")}</p>
          <p className="text-lg mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-white text-red-700 font-bold rounded-xl hover:bg-gray-100 transition"
          >
            {t("hero.retry")}
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background Slides */}
      {/* Background Slides */}
      <AnimatePresence mode="wait">
        {heroSlides.length > 0 ? (
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={heroSlides[currentSlide].image_url}
              alt={heroSlides[currentSlide].title}
              fill
              className="object-cover"
              priority={currentSlide < 2} // priority cho 2 slide đầu
              quality={85}
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
          </motion.div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center text-white">
            <p className="text-4xl font-bold">{t("hero.noBanners")}</p>
          </div>
        )}
      </AnimatePresence>

      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1920),
              y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 1080),
            }}
            animate={{
              y: [0, -150, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative h-full flex flex-col justify-center items-center text-white px-6 z-10 pt-3">
        {heroSlides.length > 0 && (
          <>
            {/* Tag Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6 mt-16 md:mt-14 xl:mt-16"
            >
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 text-sm font-medium">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                {heroSlides[currentSlide].tag}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              key={`title-${currentSlide}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4 max-w-5xl"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white">
                {heroSlides[currentSlide].title}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              key={`subtitle-${currentSlide}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="text-xl md:text-2xl text-center mb-4 max-w-3xl text-blue-100 font-light"
            >
              {heroSlides[currentSlide].subtitle}
            </motion.p>

            {/* Location */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex items-center gap-2 mb-4 text-white/90"
            >
              <FaMapMarkerAlt className="text-red-400" />
              <span className="text-lg">{heroSlides[currentSlide].location}</span>
            </motion.div>
          </>
        )}

        {/* Search Box */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="w-full max-w-4xl"
        >
          <div
            className={`bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-4 md:p-6 transition-all duration-300 ${searchFocus ? "ring-4 ring-blue-400/50 scale-105" : ""
              }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Destination - Click to open map picker */}
              <div className="relative md:col-span-2">
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  {t("search.destination")}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 z-10" />
                    <input
                      type="text"
                      readOnly
                      onClick={() => setIsLocationModalOpen(true)}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all cursor-pointer bg-white ${selectedLocation
                        ? "border-blue-500 text-gray-800"
                        : "border-gray-200 text-gray-400 hover:border-blue-300"
                        }`}
                      value={selectedLocation
                        ? selectedLocation.address.length > 35
                          ? selectedLocation.address.substring(0, 35) + '...'
                          : selectedLocation.address
                        : t("search.destinationPlaceholder") || "Bạn muốn đi đâu?"}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl border-2 border-blue-200 transition-all shadow-sm"
                    title="Chọn trên bản đồ"
                  >
                    <FaMapMarkerAlt />
                  </button>
                </div>
              </div>

              {/* Date */}
              <div className="relative">
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  {t("search.departureDate")}
                </label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-800 transition-all"
                  />
                </div>
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (selectedLocation) {
                      // Có địa điểm -> search theo location + date
                      const params = new URLSearchParams({
                        lat: selectedLocation.lat.toString(),
                        lng: selectedLocation.lng.toString(),
                        address: selectedLocation.address,
                        radius: '50'
                      });
                      if (departureDate) {
                        params.set('startDate', departureDate);
                      }
                      router.push(`/search-tours?${params.toString()}`);
                    } else if (departureDate) {
                      // Có ngày nhưng không có địa điểm -> search theo ngày ở trang tours
                      const params = new URLSearchParams();
                      params.set('startDate', departureDate);
                      router.push(`/tours?${params.toString()}`);
                    } else {
                      // Không có gì -> mở modal chọn địa điểm
                      setIsLocationModalOpen(true);
                    }
                  }}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 transition-all"
                >
                  <FaSearch />
                  {t("search.searchButton")}
                </motion.button>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              {[
                { key: "beach", label: t("filters.beach") },
                { key: "mountain", label: t("filters.mountain") },
                { key: "culture", label: t("filters.culture") },
                { key: "food", label: t("filters.food") },
                { key: "adventure", label: t("filters.adventure") }
              ].map(
                (filter, index) => (
                  <motion.button
                    key={filter.key}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.3 + index * 0.1 }}
                    whileHover={{ scale: 1.1 }}
                    className="px-4 py-2 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-600 rounded-full text-sm font-medium transition-all"
                  >
                    {filter.label}
                  </motion.button>
                ),
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        {/*   <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="flex flex-wrap justify-center gap-8 mt-6"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 + index * 0.1 }}
              className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20"
            >
              <div className="text-2xl text-blue-300">{stat.icon}</div>
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-blue-100">{t(stat.labelKey)}</div>
              </div>
            </motion.div>
          ))}
        </motion.div> */}
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className="group relative"
          >
            <div
              className={`w-12 h-1.5 rounded-full transition-all duration-300 ${index === currentSlide
                ? "bg-white"
                : "bg-white/30 hover:bg-white/50"
                }`}
            />
            {index === currentSlide && (
              <motion.div
                layoutId="activeSlide"
                className="absolute inset-0 bg-white rounded-full"
                initial={false}
              />
            )}
          </button>
        ))}
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 right-8 flex flex-col items-center gap-2 text-white z-20"
      >
        <span className="text-sm font-medium">{t("hero.scrollDown")}</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <FaChevronDown className="text-2xl" />
        </motion.div>
      </motion.div>

      {/* Video Play Button (Optional) */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.8 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsVideoPlaying(true)}
        className="absolute bottom-8 left-8 bg-white/20 backdrop-blur-md p-6 rounded-full border-2 border-white/40 hover:bg-white/30 transition-all z-20 group"
      >
        <FaPlay className="text-white text-2xl group-hover:scale-110 transition-transform" />
      </motion.button>

      {/* Floating Elements */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 right-12 hidden lg:block pointer-events-none"
      >
        <div className="bg-white/10 backdrop-blur-lg p-4 rounded-2xl border border-white/20 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <FaStar className="text-white text-xl" />
            </div>
            <div>
              <div className="text-white font-bold text-lg">{t("hero.hotOffer")}</div>
              <div className="text-blue-100 text-sm">{t("hero.discount")}</div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{
          y: [0, 20, 0],
          rotate: [0, -5, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-1/4 left-12 hidden lg:block pointer-events-none"
      >
        <div className="bg-white/10 backdrop-blur-lg p-4 rounded-2xl border border-white/20 shadow-2xl">
          <div className="text-white font-bold mb-1">🔥 {t("hero.trending")}</div>
          <div className="text-blue-100 text-sm">Tour Sapa 3N2Đ</div>
          <div className="text-yellow-400 text-xs mt-1">⭐ 4.9 (1.2k)</div>
        </div>
      </motion.div>
      {/* Video Modal */}
      <AnimatePresence>
        {isVideoPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setIsVideoPlaying(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsVideoPlaying(false)}
                className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/40 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl"
              >
                ✕
              </button>

              {/* Video */}
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/1La4QzGeaaQ?autoplay=1&mute=1"
                title="Travel Inspiration Video"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Search Modal */}
      <LocationSearchModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={(location, filters) => {
          setSelectedLocation(location);
          setIsLocationModalOpen(false);

          // Navigate to search-tours with all filters
          const params = new URLSearchParams({
            lat: location.lat.toString(),
            lng: location.lng.toString(),
            address: location.address,
            radius: (filters?.radius || 50).toString()
          });

          if (filters?.participants && filters.participants > 0) {
            params.set('participants', filters.participants.toString());
          }
          if (filters?.startDate) {
            params.set('startDate', filters.startDate);
          }
          if (filters?.endDate) {
            params.set('endDate', filters.endDate);
          }

          router.push(`/search-tours?${params.toString()}`);
        }}
        initialLocation={selectedLocation}
      />
    </div>
  );
};

export default HeroInspiration;
