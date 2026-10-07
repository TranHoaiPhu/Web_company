"use client"
import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Users, CreditCard, ChevronLeft, ChevronRight, Package, Sparkles, Loader2 } from 'lucide-react';
import { orderService } from '@/services/orders/order.service';
import ReviewModal from '@/components/tour-detail/ReviewModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/hooks';
import Image from "next/image";

interface Order {
  id: number;
  tour_id: number;
  order_code: string;
  tour_name: string;
  payment_status: string;
  created_at: string;
  cover_image?: string;
  location_name?: string;
  start_date?: string;
  end_date?: string;
  num_of_participants?: number;
  adult_quantity?: number;
  child_quantity?: number;
  infant_quantity?: number;
  total_price?: string | number;
  discount_amount?: number;
  status?: string;
  payment_method?: string;
  has_review?: boolean;
  review_id?: number;
  review_rating?: number;
}

const OrderHistoryPage = () => {
  const { t } = useTranslation("order");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [payingOrderCode, setPayingOrderCode] = useState<string | null>(null);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null);
  const pageSize = 10;
  const router = useRouter();

  // Handle VNPay payment for unpaid orders
  const handlePayNow = async (order: Order) => {
    try {
      setPayingOrderCode(order.order_code);

      const paymentData = new FormData();
      const amount = (order.total_price || 0).toString();
      paymentData.append("amount", amount);

      const isMomo = order.payment_method?.toUpperCase() === 'MOMO';
      const endpoint = isMomo ? "/api/momo/create-payment-url" : "/api/vnpay/create-payment-url";

      if (isMomo) {
        paymentData.append("order_id", order.order_code);
        paymentData.append("order_info", `Thanh toán đơn tour #${order.order_code}`);
      } else {
        paymentData.append("order_desc", `Thanh toán đơn tour #${order.order_code}`);
        paymentData.append("bank_code", "");
      }

      const response = await fetch(endpoint, {
        method: "POST",
        body: paymentData,
      });

      if (response.ok) {
        const paymentUrl = await response.text();
        window.location.href = paymentUrl;
      } else {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          toast.error(errorJson.error || "Không thể tạo link thanh toán. Vui lòng thử lại.");
        } catch {
          toast.error("Không thể tạo link thanh toán. Vui lòng thử lại.");
        }
        setPayingOrderCode(null);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Đã xảy ra lỗi khi thanh toán. Vui lòng thử lại.");
      setPayingOrderCode(null);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter, sort]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = getCookie('token') as string | undefined;
      console.log('Fetched token from cookie:', token);
      if (!token) {
        setOrders([]);
        setTotalPages(1);
        setLoading(false);
        return;
      }
      const result = await orderService.getMyOrders(token);
      let filtered = result.data || [];
      // Search filter
      if (search) {
        filtered = filtered.filter((order: { order_code: string; tour_name: string }) =>
          order.order_code.toLowerCase().includes(search.toLowerCase()) ||
          order.tour_name.toLowerCase().includes(search.toLowerCase())
        );
      }
      // Status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter((order: { payment_status: string }) => order.payment_status === statusFilter.toUpperCase());
      }
      // Sort
      if (sort === 'newest') {
        filtered.sort((a: { created_at: string }, b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else {
        filtered.sort((a: { created_at: string }, b: { created_at: string }) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }
      const total = filtered.length;
      const totalPages = Math.ceil(total / pageSize);
      const start = (page - 1) * pageSize;
      const data = filtered.slice(start, start + pageSize);
      setOrders(data);
      setTotalPages(totalPages);
    } catch {
      setOrders([]);
      setTotalPages(1);
    }
    setLoading(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value);
    setPage(1);
  };

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(Number(price));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      CONFIRMED: 'bg-green-100 text-green-700',
      PENDING: 'bg-yellow-100 text-yellow-700',
      CANCELLED: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPaymentStatusColor = (status: string) => {
    return status === 'PAID'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-rose-100 text-rose-700';
  };

  const SkeletonCard = () => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-4/12 h-48 md:h-auto bg-gray-200"></div>
        <div className="w-full md:w-8/12 p-6 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-6 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-50 rounded-full mb-6">
        <Package className="w-12 h-12 text-blue-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{t("empty.title")}</h3>
      <p className="text-gray-600 mb-6">{t("empty.message")}</p>
      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        {t("empty.exploreTours")}
      </button>
    </div>
  );

  const Pagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const showPages = 5;
      let start = Math.max(1, page - Math.floor(showPages / 2));
      const end = Math.min(totalPages, start + showPages - 1);

      if (end - start < showPages - 1) {
        start = Math.max(1, end - showPages + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
    };

    return (
      <div className="mt-8 flex items-center justify-center gap-2">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="hidden md:flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{t("pagination.previous")}</span>
        </button>

        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="md:hidden flex items-center justify-center w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="hidden md:flex gap-2">
          {getPageNumbers().map(pageNum => (
            <button
              key={pageNum}
              onClick={() => setPage(pageNum)}
              className={`w-10 h-10 rounded-lg transition-colors ${pageNum === page
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 hover:bg-gray-50'
                }`}
            >
              {pageNum}
            </button>
          ))}
        </div>

        <div className="md:hidden px-4 py-2 text-sm text-gray-600">
          {t("pagination.page")} {page} / {totalPages}
        </div>

        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="hidden md:flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span>{t("pagination.next")}</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="md:hidden flex items-center justify-center w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("history.title")}</h1>
          <p className="text-gray-600">{t("history.subtitle")}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t("filters.searchPlaceholder")}
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">{t("filters.allStatus")}</option>
              <option value="paid">{t("filters.paid")}</option>
              <option value="unpaid">{t("filters.unpaid")}</option>
            </select>
            <select
              value={sort}
              onChange={handleSortChange}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="newest">{t("filters.newestFirst")}</option>
              <option value="oldest">{t("filters.oldestFirst")}</option>
            </select>
          </div>
        </div>

        {/* Order List */}
        <div className="space-y-4">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : orders.length === 0 ? (
            <EmptyState />
          ) : (
            orders.map(order => (
              <div
                key={order.order_code}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image */}
                  <div className="w-full md:w-4/12 h-48 md:h-auto relative overflow-hidden">
                    <Image
                      src={order.cover_image || "/images/tour-placeholder.jpg"}
                      alt={order.tour_name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Content */}
                  <div className="w-full md:w-8/12 p-6">
                    <div className="flex flex-col h-full">
                      {/* Top Section */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                          <h3 className="text-xl font-bold text-gray-900 flex-1">
                            {order.tour_name}
                          </h3>
                          <div className="flex gap-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status || '')}`}>
                              {order.status}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                              {order.payment_status === 'PAID' ? t("payment.paid") : t("payment.unpaid")}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{order.location_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">
                              {formatDate(order.start_date)} → {formatDate(order.end_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">
                              {(order.adult_quantity || 0) > 0 && `${order.adult_quantity} ${t("guests.adults")}`}
                              {(order.child_quantity || 0) > 0 && `, ${order.child_quantity} ${t("guests.children")}`}
                              {(order.infant_quantity || 0) > 0 && `, ${order.infant_quantity} ${t("guests.infants")}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
                          <span className="font-mono bg-gray-100 px-3 py-1 rounded">
                            {order.order_code}
                          </span>
                          <span>{formatDate(order.created_at)}</span>
                          {order.payment_method && (
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-4 h-4" />
                              {order.payment_method}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 mb-4">
                          {(order.discount_amount || 0) > 0 && (
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-orange-500" />
                              <span className="text-sm text-gray-600">
                                {t("card.discount")}: <span className="font-semibold text-orange-600">{formatPrice(order.discount_amount || 0)}</span>
                              </span>
                            </div>
                          )}
                          <div className="text-2xl font-bold text-blue-600">
                            {formatPrice(order.total_price || 0)}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3 pt-4 border-t">
                        <button
                          className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          onClick={() => router.push(`/order-history/${order.order_code}`)}
                        >
                          {t("actions.viewDetail")}
                        </button>

                        {order.status === 'CONFIRMED' && order.payment_status === 'PAID' && !order.has_review && (
                          <button
                            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
                            onClick={() => setSelectedOrderForReview(order)}
                          >
                            <Sparkles className="w-4 h-4" />
                            Đánh giá ngay
                          </button>
                        )}
                        {order.has_review && (
                          <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Đã đánh giá {order.review_rating && `(${order.review_rating}⭐)`}
                          </div>
                        )}
                        {order.payment_status === 'UNPAID' && order.status !== 'CANCELLED' && (
                          <button
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            onClick={() => handlePayNow(order)}
                            disabled={payingOrderCode === order.order_code}
                          >
                            {payingOrderCode === order.order_code ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang xử lý...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4" />
                                {t("actions.payNow")}
                              </>
                            )}
                          </button>
                        )}
                        {order.status === 'PENDING' && (
                          <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                            {t("actions.cancel")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && orders.length > 0 && <Pagination />}
      </div>

      {/* Review Modal */}
      {selectedOrderForReview && (
        <ReviewModal
          isOpen={!!selectedOrderForReview}
          onClose={() => setSelectedOrderForReview(null)}
          tourId={selectedOrderForReview.tour_id.toString()}
          orderId={selectedOrderForReview.id}
          tourName={selectedOrderForReview.tour_name}
          onSuccess={() => fetchOrders()}
        />
      )}
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default OrderHistoryPage;