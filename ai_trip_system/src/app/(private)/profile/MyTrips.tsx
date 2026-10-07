import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";

import { FaMapMarkerAlt, FaTicketAlt, FaMoneyBillWave, FaQrcode, FaSuitcase, FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface Order {
    id: number;
    order_code: string;
    tour_name: string;
    tour_slug: string;
    cover_image: string;
    start_date: string;
    total_participants: number;
    total_price: string;
    payment_status: string;
    status: string;
}

interface MyTripsProps {
    type: 'upcoming' | 'history' | 'cancelled';
    apiBaseUrl: string;
    token?: string;
}

export default function MyTrips({ type, apiBaseUrl, token }: MyTripsProps) {
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 5;

    // Reset page when type changes
    useEffect(() => {
        setPage(1);
    }, [type]);

    const fetcher = (url: string) =>
        fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then((res) => res.json());

    const { data, error, isLoading } = useSWR(
        token ? `${apiBaseUrl}/orders/my?type=${type}&page=${page}&pageSize=${PAGE_SIZE}` : null,
        fetcher
    );

    if (isLoading) return (
        <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error) return <div className="p-8 text-center text-red-500">Lỗi khi tải dữ liệu. Vui lòng thử lại.</div>;

    const orders = data?.data || [];
    const totalPages = data?.totalPages || 0;

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <FaSuitcase size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Chưa có chuyến đi nào</h3>
                <p className="text-gray-500 mt-1 mb-6">Bạn chưa có đơn đặt tour nào trong mục này.</p>
                <Link href="/tours" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Khám phá Tour ngay
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {orders.map((order: Order) => (
                    <div key={order.id} className="bg-white dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col md:flex-row">
                        {/* Image */}
                        <div className="w-full md:w-48 h-32 md:h-auto relative bg-gray-200 dark:bg-slate-700">
                            {order.cover_image ? (
                                <Image
                                    src={order.cover_image}
                                    alt={order.tour_name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <FaMapMarkerAlt size={24} />
                                </div>
                            )}
                            <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded backdrop-blur-sm">
                                {format(new Date(order.start_date), "dd/MM/yyyy")}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4 md:p-5 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600 transition">
                                        <Link href={`/tours/${order.tour_slug}`}>
                                            {order.tour_name}
                                        </Link>
                                    </h3>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${order.payment_status === 'PAID' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                        }`}>
                                        {order.payment_status === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
                                    <div className="flex items-center gap-1.5">
                                        <FaQrcode className="text-gray-400" />
                                        <span className="font-mono text-gray-900 dark:text-gray-200">{order.order_code}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <FaTicketAlt className="text-gray-400" />
                                        <span>{order.total_participants} hành khách</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <FaMoneyBillWave className="text-gray-400" />
                                        <span className="font-medium text-blue-600">
                                            {parseFloat(order.total_price).toLocaleString('vi-VN')}đ
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-3 justify-end">
                                <Link
                                    href={`/order-history/${order.order_code}`}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 transition-colors"
                                >
                                    Xem chi tiết
                                </Link>
                                {order.payment_status !== 'PAID' && type !== 'cancelled' && (
                                    <Link
                                        href={`/payment/${order.order_code}`}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200"
                                    >
                                        Thanh toán ngay
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 border dark:border-slate-700 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <FaChevronLeft />
                    </button>
                    <span className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-800 rounded-md">
                        Trang {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 border dark:border-slate-700 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <FaChevronRight />
                    </button>
                </div>
            )}
        </div>
    );
}


