"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaHeart, FaRegFolderOpen, FaSpinner, FaArrowLeft, FaMapMarkerAlt, FaArrowRight } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/hooks";
import favoriteTourService from "@/services/tours/favorite-tour.service";
import { tourService } from "@/services/tours/tour.service";
import { mapTourApiToBase } from "@/mapper/tour.mapper";
import WishlistTourCard from "@/components/tours/WishlistTourCard";
import { TourBase } from "@/types/tour";

export default function WishlistPage() {
    const { t } = useTranslation("common");
    const router = useRouter();
    const [favorites, setFavorites] = useState<TourBase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFavorites = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const favoriteIds = await favoriteTourService.getMyFavorites();

            if (favoriteIds.length === 0) {
                setFavorites([]);
                setIsLoading(false);
                return;
            }

            const tourDetailsPromises = favoriteIds.map(async (fav: any) => {
                try {
                    const detail = await tourService.getById(fav.id_tour.toString());
                    const tourData = {
                        ...detail.data.tour,
                        locationName: detail.data.location?.name,
                        categoryName: detail.data.category?.name,
                        coverImage: detail.data.cover_image
                    };
                    return mapTourApiToBase(tourData as any);
                } catch (err) {
                    console.error(`Failed to fetch tour ${fav.id_tour}:`, err);
                    return null;
                }
            });

            const tourDetails = await Promise.all(tourDetailsPromises);
            const validTours = tourDetails.filter((tour): tour is TourBase => tour !== null);

            setFavorites(validTours);
        } catch (err) {
            console.error("Error fetching favorites:", err);
            setError("Không thể tải danh sách yêu thích. Vui lòng thử lại sau.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFavorites();

        const handleFavoriteChanged = () => {
            fetchFavorites();
        };

        window.addEventListener("favoriteChanged", handleFavoriteChanged);
        return () => {
            window.removeEventListener("favoriteChanged", handleFavoriteChanged);
        };
    }, [fetchFavorites]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pt-32 pb-20 transition-colors duration-500">
            <div className="container mx-auto px-4 max-w-5xl">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors mb-4 group"
                        >
                            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                            {t("buttons.back")}
                        </button>
                        <h1 className="text-5xl font-black text-gray-900 dark:text-white flex items-center gap-4">
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-[2rem] shadow-sm text-red-500">
                                <FaHeart />
                            </div>
                            {t("labels.wishlist")}
                        </h1>
                        <p className="text-gray-500 dark:text-slate-400 mt-4 ml-2 text-lg">
                            Bạn có <span className="font-bold text-gray-900 dark:text-white border-b-2 border-red-200 dark:border-red-900">{favorites.length}</span> hành trình mơ ước đã lưu lại
                        </p>
                    </motion.div>

                    <Link
                        href="/search-tours"
                        className="inline-flex items-center gap-3 bg-white dark:bg-slate-900 text-gray-900 dark:text-white px-8 py-4 rounded-2xl font-bold shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all group"
                    >
                        <FaMapMarkerAlt className="text-blue-500 group-hover:scale-110 transition-transform" />
                        Tiếp tục khám phá
                    </Link>
                </div>

                {/* List Content */}
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-32"
                        >
                            <div className="relative">
                                <FaSpinner className="text-6xl text-blue-500 animate-spin mb-4" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <FaHeart className="text-blue-200 text-xs animate-pulse" />
                                </div>
                            </div>
                            <p className="text-gray-500 dark:text-slate-400 font-medium animate-pulse">
                                Đang chuẩn bị vali cho những hành trình yêu thích của bạn...
                            </p>
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 rounded-[2.5rem] p-16 text-center"
                        >
                            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                                ⚠️
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{error}</h2>
                            <button
                                onClick={fetchFavorites}
                                className="bg-red-500 text-white px-10 py-4 rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-200 dark:shadow-none"
                            >
                                Thử lại ngay
                            </button>
                        </motion.div>
                    ) : favorites.length > 0 ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col gap-10"
                        >
                            {favorites.map((tour) => (
                                <WishlistTourCard
                                    key={tour.id}
                                    tour={tour}
                                    onRemove={fetchFavorites}
                                />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900/50 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-[3rem] p-24 text-center"
                        >
                            <div className="relative inline-block mb-10">
                                <div className="w-40 h-40 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-6xl">
                                    <FaRegFolderOpen className="text-gray-200 dark:text-slate-700" />
                                </div>
                                <motion.div
                                    className="absolute -bottom-2 -right-2 w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center text-white border-4 border-white dark:border-slate-900 shadow-xl"
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    <FaHeart className="text-xl" />
                                </motion.div>
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-6">
                                Chưa có tour nào "vào tầm ngắm"
                            </h2>
                            <p className="text-gray-500 dark:text-slate-400 mb-12 text-xl max-w-lg mx-auto leading-relaxed">
                                Hãy khám phá những điểm đến tuyệt vời và lưu lại hành trình bạn thích nhất nhé!
                            </p>
                            <Link
                                href="/search-tours"
                                className="inline-flex items-center gap-3 bg-blue-600 text-white px-12 py-5 rounded-2xl font-black shadow-2xl shadow-blue-200 dark:shadow-none hover:bg-blue-700 hover:translate-y-[-4px] transition-all text-xl"
                            >
                                Khám phá tour ngay thôi
                                <FaArrowRight />
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
