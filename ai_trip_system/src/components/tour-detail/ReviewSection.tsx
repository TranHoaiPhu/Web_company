"use client";

import { useState, useEffect, useCallback } from "react";
import { FaStar, FaRegStar, FaUserCircle, FaSpinner, FaChevronDown } from "react-icons/fa";
import { motion } from "framer-motion";
import { tourService } from "@/services/tours/tour.service";
import moment from "moment";
import Image from "next/image";

interface ReviewSectionProps {
    tourId: string;
}

interface Review {
    id: string;
    user?: {
        name: string;
        avatar?: string;
    };
    rating: number;
    comment: string;
    title?: string;
    createdAt: string;
    images?: string[];
}

interface ReviewStats {
    averageRating: number;
    totalReviews: number;
}

export default function ReviewSection({ tourId }: ReviewSectionProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy] = useState("newest"); // Removed unused setSortBy

    const loadReviews = useCallback(async (pageNum: number) => {
        try {
            setLoading(true);
            const res = await tourService.getReviews(tourId, { page: pageNum, limit: 5, sort: sortBy }) as {
                success: boolean;
                data: {
                    reviews: Review[];
                    statistics: ReviewStats;
                    pagination: {
                        page: number;
                        limit: number;
                        total: number;
                        totalPages: number;
                    };
                };
            };
            if (res.success) {
                if (pageNum === 1) {
                    setReviews(res.data.reviews);
                } else {
                    setReviews((prev) => [...prev, ...res.data.reviews]);
                }
                setStats(res.data.statistics);
                setTotalPages(res.data.pagination.totalPages);
                setPage(res.data.pagination.page);
            }
        } catch (error) {
            console.error("Error loading reviews:", error);
        } finally {
            setLoading(false);
        }
    }, [tourId, sortBy]);

    useEffect(() => {
        loadReviews(1);
    }, [loadReviews]);

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5 text-yellow-400">
                {[...Array(5)].map((_, i) => (
                    i < Math.floor(rating) ? <FaStar key={i} /> : <FaRegStar key={i} className="text-gray-300" />
                ))}
            </div>
        );
    };

    if (loading && page === 1) {
        return (
            <div className="py-20 flex justify-center items-center">
                <FaSpinner className="animate-spin text-4xl text-blue-600" />
            </div>
        );
    }

    return (
        <section className="mt-16 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 p-8 lg:p-10 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-1 h-8 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full" />
                        <h2 className="text-2xl font-bold text-gray-900">Đánh Giá Từ Khách Hàng</h2>
                    </div>
                    <p className="text-gray-500">Cảm nhận thực tế từ những người đã trải nghiệm tour này</p>
                </div>

                {stats && (
                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="text-center">
                            <div className="text-4xl font-black text-gray-900">{stats.averageRating ? stats.averageRating.toFixed(1) : 0}</div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">trên 5</div>
                        </div>
                        <div className="h-10 w-px bg-gray-100" />
                        <div>
                            <div className="flex mb-1">{renderStars(stats.averageRating)}</div>
                            <div className="text-sm font-medium text-gray-600">{stats.totalReviews} lượt đánh giá</div>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {reviews.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <div className="text-4xl mb-4">⭐</div>
                        <p className="text-gray-500 font-medium">Chưa có đánh giá nào cho tour này.</p>
                        <p className="text-sm text-gray-400">Hãy là người đầu tiên chia sẻ cảm nhận!</p>
                    </div>
                ) : (
                    <>
                        {reviews.map((review, idx) => (
                            <motion.div
                                key={review.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        {review.user?.avatar ? (
                                            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-blue-50">
                                                <Image
                                                    src={review.user.avatar}
                                                    alt={review.user.name || "User avatar"}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <FaUserCircle className="text-4xl text-gray-300" />
                                        )}
                                        <div>
                                            <div className="font-bold text-gray-900">{review.user?.name || "Khách hàng ẩn danh"}</div>
                                            <div className="text-xs text-gray-400">{moment(review.createdAt).format("DD/MM/YYYY")}</div>
                                        </div>
                                    </div>
                                    <div>{renderStars(review.rating)}</div>
                                </div>

                                {review.title && <h4 className="font-bold text-gray-800 mb-2">{review.title}</h4>}
                                <p className="text-gray-600 leading-relaxed text-sm md:text-base">{review.comment}</p>

                                {review.images && review.images.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {review.images.map((img: string, i: number) => (
                                            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden cursor-zoom-in hover:opacity-90 active:scale-95 transition-all">
                                                <Image
                                                    src={img}
                                                    alt={`Review image ${i}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ))}

                        {/* Skeleton Loading State for Load More */}
                        {loading && reviews.length > 0 && (
                            <>
                                {[...Array(2)].map((_, i) => (
                                    <div key={`skeleton-${i}`} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                                                <div className="space-y-2">
                                                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                                                </div>
                                            </div>
                                            <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                        </div>
                                        <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                                        <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                                        <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                                    </div>
                                ))}
                            </>
                        )}

                        {page < totalPages && (
                            <div className="flex flex-col items-center mt-12 gap-4">
                                {/* Simple text status */}
                                <div className="text-sm text-gray-500 font-medium">
                                    Đang hiển thị {reviews.length} trên tổng số {stats?.totalReviews} đánh giá
                                </div>

                                {/* Modern Button */}
                                <button
                                    onClick={() => loadReviews(page + 1)}
                                    disabled={loading}
                                    className="group relative px-8 py-3 bg-white text-gray-800 font-bold rounded-full border border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-400 hover:text-blue-600 transition-all duration-300 transform hover:-translate-y-0.5"
                                >
                                    <span className="flex items-center gap-2">
                                        {loading ? (
                                            <FaSpinner className="animate-spin text-blue-500" />
                                        ) : (
                                            <FaChevronDown className="group-hover:translate-y-0.5 transition-transform duration-300" />
                                        )}
                                        <span>Xem thêm đánh giá</span>
                                    </span>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
