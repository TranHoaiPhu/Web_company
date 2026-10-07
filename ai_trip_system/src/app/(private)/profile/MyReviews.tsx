import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { FaStar, FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface Review {
    id: number;
    rating: number;
    title: string;
    comment: string;
    images: string[];
    created_at: string;
    tour_id: number;
    tour_name: string;
    tour_slug: string;
    tour_image: string;
    order_code: string;
}

interface MyReviewsProps {
    apiBaseUrl: string;
    token?: string;
}

export default function MyReviews({ apiBaseUrl, token }: MyReviewsProps) {
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 5;

    const fetcher = (url: string) =>
        fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then((res) => res.json());

    const { data, error, isLoading } = useSWR(
        token ? `${apiBaseUrl}/reviews/my?page=${page}&limit=${PAGE_SIZE}` : null,
        fetcher
    );

    if (isLoading) return (
        <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error) return <div className="p-8 text-center text-red-500">Lỗi khi tải đánh giá. Vui lòng thử lại.</div>;

    const reviews = data?.data || [];
    const pagination = data?.pagination || { totalPages: 0 };

    if (reviews.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
                <div className="w-16 h-16 bg-yellow-50 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-4 text-yellow-400">
                    <FaStar size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Chưa có đánh giá nào</h3>
                <p className="text-gray-500 mt-1 mb-6">Bạn chưa viết đánh giá cho chuyến đi nào.</p>
                <Link href="/profile?tab=my-trips" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Viết đánh giá ngay
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Lịch sử đánh giá</h2>
            <div className="space-y-4">
                {reviews.map((review: Review) => (
                    <div key={review.id} className="bg-white dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow p-5">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Tour Info (Thumbnail) */}
                            <div className="w-full md:w-32 flex-shrink-0">
                                <div className="relative aspect-video md:aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700">
                                    {review.tour_image ? (
                                        <Image
                                            src={review.tour_image}
                                            alt={review.tour_name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400 text-xs">No Image</div>
                                    )}
                                </div>
                            </div>

                            {/* Review Content */}
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div className="mb-2">
                                        <Link href={`/tours/${review.tour_slug}`} className="font-bold text-gray-900 dark:text-white hover:text-blue-600 transition line-clamp-1">
                                            {review.tour_name}
                                        </Link>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Mã đơn: <span className="font-mono">{review.order_code}</span> • Đã viết ngày {format(new Date(review.created_at), "dd/MM/yyyy", { locale: vi })}
                                        </div>
                                    </div>
                                    {/* <div className="flex gap-2">
                                        <button className="text-gray-400 hover:text-blue-600 p-1" title="Chỉnh sửa">
                                            <FaEdit />
                                        </button>
                                        <button className="text-gray-400 hover:text-red-600 p-1" title="Xóa">
                                            <FaTrash />
                                        </button>
                                    </div> */}
                                </div>

                                {/* Rating */}
                                <div className="flex items-center gap-1 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar
                                            key={i}
                                            className={i < review.rating ? "text-yellow-400" : "text-gray-300"}
                                            size={14}
                                        />
                                    ))}
                                    <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">{review.title}</span>
                                </div>

                                {/* Comment */}
                                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-3">
                                    {review.comment}
                                </p>

                                {/* Images */}
                                {review.images && review.images.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {review.images.map((img, idx) => (
                                            <div key={idx} className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                                                <Image src={img} alt={`Review img ${idx}`} fill className="object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 border dark:border-slate-700 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <FaChevronLeft />
                    </button>
                    <span className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-800 rounded-md">
                        Trang {page} / {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                        disabled={page === pagination.totalPages}
                        className="p-2 border dark:border-slate-700 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <FaChevronRight />
                    </button>
                </div>
            )}
        </div>
    );
}
