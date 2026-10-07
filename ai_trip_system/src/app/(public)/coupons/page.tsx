'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaTicketAlt, 
  FaCopy, 
  FaCheck, 
  FaPercent, 
  FaMoneyBillWave,
  FaClock,
  FaGift,
  FaTag,
  FaInfoCircle,
  FaSpinner
} from 'react-icons/fa';
import Link from 'next/link';
import httpBooking from '@/services/httpBooking';

interface Coupon {
  id: number;
  code: string;
  name: string;
  description: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  max_discount_amount: number | null;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  is_public: boolean;
}

export default function CouponPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await httpBooking.get('/coupons');
      // Filter only public and active coupons
      const publicCoupons = response.data.filter(
        (coupon: Coupon) => coupon.is_public && coupon.is_active && new Date(coupon.valid_to) > new Date()
      );
      setCoupons(publicCoupons);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (validTo: string) => {
    const now = new Date();
    const endDate = new Date(validTo);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDiscountText = (coupon: Coupon) => {
    if (coupon.discount_type === 'PERCENTAGE') {
      return `${coupon.discount_value}%`;
    }
    return formatPrice(coupon.discount_value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-yellow-300 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-pink-300 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 py-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <FaGift className="animate-bounce" />
              <span className="text-sm font-medium">Ưu đãi đặc biệt</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              🎉 Mã Giảm Giá Hot
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Săn ngay các mã giảm giá hấp dẫn để tiết kiệm cho chuyến du lịch của bạn!
            </p>
          </motion.div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 50L60 45C120 40 240 30 360 35C480 40 600 60 720 65C840 70 960 60 1080 50C1200 40 1320 30 1380 25L1440 20V100H1380C1320 100 1200 100 1080 100C960 100 840 100 720 100C600 100 480 100 360 100C240 100 120 100 60 100H0V50Z" 
              fill="rgb(250, 245, 255)" />
          </svg>
        </div>
      </div>

      {/* Coupons Grid */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <FaSpinner className="text-4xl text-purple-500 animate-spin" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-20">
            <FaTicketAlt className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Chưa có mã giảm giá</h2>
            <p className="text-gray-500">Hãy quay lại sau để săn các ưu đãi mới nhất!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((coupon, index) => {
              const daysRemaining = getDaysRemaining(coupon.valid_to);
              const isExpiringSoon = daysRemaining <= 3;
              
              return (
                <motion.div
                  key={coupon.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Coupon Card */}
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    {/* Top section with gradient */}
                    <div className={`relative p-6 ${
                      coupon.discount_type === 'PERCENTAGE' 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                        : 'bg-gradient-to-r from-orange-500 to-red-500'
                    }`}>
                      {/* Expiring soon badge */}
                      {isExpiringSoon && (
                        <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                          Sắp hết hạn!
                        </div>
                      )}
                      
                      {/* Discount value */}
                      <div className="flex items-center gap-3 text-white">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          {coupon.discount_type === 'PERCENTAGE' ? (
                            <FaPercent className="text-2xl" />
                          ) : (
                            <FaMoneyBillWave className="text-2xl" />
                          )}
                        </div>
                        <div>
                          <p className="text-4xl font-bold">
                            {getDiscountText(coupon)}
                          </p>
                          <p className="text-white/80 text-sm">
                            {coupon.discount_type === 'PERCENTAGE' ? 'Giảm giá' : 'Giảm trực tiếp'}
                          </p>
                        </div>
                      </div>

                      {/* Max discount */}
                      {coupon.discount_type === 'PERCENTAGE' && coupon.max_discount_amount && (
                        <p className="text-white/90 text-sm mt-2">
                          Giảm tối đa {formatPrice(coupon.max_discount_amount)}
                        </p>
                      )}

                      {/* Decorative circles */}
                      <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-purple-50 rounded-full"></div>
                      <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-purple-50 rounded-full"></div>
                    </div>

                    {/* Dashed divider */}
                    <div className="relative px-4">
                      <div className="border-t-2 border-dashed border-gray-200"></div>
                    </div>

                    {/* Bottom section */}
                    <div className="p-6 pt-4">
                      <h3 className="font-bold text-gray-800 text-lg mb-1">{coupon.name}</h3>
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                        {coupon.description || 'Áp dụng cho tất cả các tour du lịch'}
                      </p>

                      {/* Conditions */}
                      <div className="space-y-2 mb-4">
                        {coupon.min_order_amount && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FaInfoCircle className="text-blue-500" />
                            <span>Đơn tối thiểu {formatPrice(coupon.min_order_amount)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FaClock className={isExpiringSoon ? 'text-red-500' : 'text-green-500'} />
                          <span className={isExpiringSoon ? 'text-red-500 font-medium' : ''}>
                            HSD: {formatDate(coupon.valid_to)} ({daysRemaining} ngày)
                          </span>
                        </div>
                        {coupon.max_uses && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FaTag className="text-purple-500" />
                            <span>Còn {coupon.max_uses - coupon.used_count} lượt sử dụng</span>
                          </div>
                        )}
                      </div>

                      {/* Code & Copy button */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg px-4 py-3">
                          <p className="text-xs text-gray-500 mb-1">Mã giảm giá</p>
                          <p className="font-mono font-bold text-lg text-purple-600 tracking-wider">
                            {coupon.code}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCopy(coupon.code)}
                          className={`px-4 py-4 rounded-lg font-medium transition-all flex items-center gap-2 ${
                            copiedCode === coupon.code
                              ? 'bg-green-500 text-white'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {copiedCode === coupon.code ? (
                            <>
                              <FaCheck />
                              <span className="hidden sm:inline">Đã copy</span>
                            </>
                          ) : (
                            <>
                              <FaCopy />
                              <span className="hidden sm:inline">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Bắt đầu chuyến phiêu lưu của bạn! 🚀
            </h2>
            <p className="text-white/90 mb-6 max-w-xl mx-auto">
              Khám phá hàng trăm tour du lịch hấp dẫn với giá ưu đãi đặc biệt
            </p>
            <Link
              href="/tours"
              className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-full font-bold hover:shadow-lg hover:scale-105 transition-all"
            >
              <FaTicketAlt />
              Khám phá tour ngay
            </Link>
          </div>
        </motion.div>

        {/* Tips Section */}
        <div className="mt-12 bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <FaInfoCircle className="text-blue-500" />
            Hướng dẫn sử dụng mã giảm giá
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-gray-800">Copy mã giảm giá</p>
                <p className="text-sm text-gray-500">Nhấn nút Copy để sao chép mã</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-gray-800">Chọn tour yêu thích</p>
                <p className="text-sm text-gray-500">Duyệt và chọn tour bạn muốn đặt</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-gray-800">Áp dụng khi thanh toán</p>
                <p className="text-sm text-gray-500">Dán mã vào ô mã giảm giá</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
