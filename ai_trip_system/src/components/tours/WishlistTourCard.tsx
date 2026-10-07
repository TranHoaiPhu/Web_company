"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import {
    FaMapMarkerAlt,
    FaClock,
    FaStar,
    FaTrashAlt,
    FaCalendarAlt,
    FaArrowRight,
    FaShieldAlt,
} from "react-icons/fa";
import { TourBase } from "@/types/tour";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/hooks";
import favoriteTourService from "@/services/tours/favorite-tour.service";
import { toast } from "react-toastify";

interface WishlistTourCardProps {
    tour: TourBase;
    onRemove?: () => void;
}

const WishlistTourCard = ({ tour, onRemove }: WishlistTourCardProps) => {
    const { t } = useTranslation("tour");
    const { t: tCommon } = useTranslation("common");
    const [isRemoving, setIsRemoving] = useState(false);

    const handleRemove = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsRemoving(true);
        try {
            await favoriteTourService.removeFavorite(Number(tour.id));
            window.dispatchEvent(new Event("favoriteChanged"));
            toast.success(tCommon("messages.removedFromFavorites"));
            onRemove?.();
        } catch (error) {
            console.error("Error removing from wishlist:", error);
            toast.error(tCommon("messages.deleteFailed"));
        } finally {
            setIsRemoving(false);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className="group relative bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-slate-800"
        >
            <div className="flex flex-col md:flex-row h-full">
                {/* Left: Image Section */}
                <div className="relative w-full md:w-2/5 h-64 md:h-auto overflow-hidden">
                    <motion.div
                        className="w-full h-full"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.8 }}
                    >
                        {tour.image ? (
                            <Image
                                src={tour.image}
                                alt={tour.title}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-200 dark:bg-slate-800 flex items-center justify-center">
                                <span className="text-gray-400">No image</span>
                            </div>
                        )}
                    </motion.div>

                    {/* Status Badge */}
                    <div className="absolute top-4 left-4">
                        <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
                            {tour.category}
                        </span>
                    </div>

                    {/* Remove Button (Glass style on image for mobile, moves or stays?) */}
                    <button
                        onClick={handleRemove}
                        disabled={isRemoving}
                        className="absolute top-4 right-4 p-3 bg-red-500/10 hover:bg-red-500 backdrop-blur-md text-red-500 hover:text-white rounded-2xl transition-all duration-300 shadow-lg group/remove"
                        title="Xóa khỏi yêu thích"
                    >
                        {isRemoving ? (
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <FaTrashAlt className="text-lg group-hover/remove:scale-110 transition-transform" />
                        )}
                    </button>
                </div>

                {/* Right: Content Section */}
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <Link href={`/tours/${tour.slug || tour.id}`} className="group/title">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover/title:text-blue-600 transition-colors line-clamp-2">
                                    {tour.title}
                                </h3>
                            </Link>
                        </div>

                        <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-500 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
                                    <FaMapMarkerAlt />
                                </div>
                                <span>{tour.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-500">
                                    <FaClock />
                                </div>
                                <span>{tour.duration}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-500">
                                    <FaStar />
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white">{tour.rating}</span>
                                <span>({tour.reviews} đánh giá)</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-6">
                            <FaShieldAlt />
                            <span>Đảm bảo hoàn tiền • Xác nhận tức thì</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-gray-100 dark:border-slate-800">
                        <div className="text-center sm:text-left">
                            <p className="text-gray-400 text-xs line-through mb-1">
                                {(tour.originalPrice || tour.price * 1.2).toLocaleString("vi-VN")}đ
                            </p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                                    {tour.price.toLocaleString("vi-VN")}đ
                                </span>
                                <span className="text-gray-500 text-xs font-medium">/ người</span>
                            </div>
                        </div>

                        <div className="flex gap-3 w-full sm:w-auto">
                            <Link href={`/tours/${tour.slug || tour.id}`} className="flex-1 sm:flex-none">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none transition-all group/btn"
                                >
                                    Đặt ngay
                                    <FaArrowRight className="group-hover/btn:translate-x-1 transition-transform" />
                                </motion.button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default WishlistTourCard;
