// components/tour-detail/MobileBookingBar.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, Phone, Calendar, ChevronUp } from 'lucide-react';

interface MobileBookingBarProps {
  basePrice: number;
  tourName: string;
}

export default function MobileBookingBar({ basePrice, tourName }: MobileBookingBarProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleBooking = () => {
    if (!isLoggedIn) {
      // Store current URL for return after login
      const callbackUrl = window.location.pathname + window.location.search;
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }
    // Scroll to booking section or open modal
    const bookingSection = document.getElementById('booking-section');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 lg:hidden z-50 shadow-2xl"
    >
      {/* Expanded Options */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white/95 backdrop-blur-xl border-t border-gray-200 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-3">
              <button 
                onClick={handleBooking}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 hover:border-blue-300 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900">Xem Lịch Trình</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </button>

              <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 hover:border-emerald-300 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900">Liên Hệ Tư Vấn</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Bar */}
      <div className="bg-white/98 backdrop-blur-2xl border-t border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Expand Button */}
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 flex items-center justify-center transition-all shadow-md"
            >
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronUp className="w-5 h-5 text-gray-600" />
              </motion.div>
            </motion.button>

            {/* Price Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">Giá từ</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                  {basePrice.toLocaleString('vi-VN')}
                </p>
                <span className="text-sm text-gray-600">₫</span>
              </div>
            </div>

            {/* Booking Button */}
            <motion.button
              onClick={handleBooking}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0 group relative px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl transition-all overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center gap-2 text-sm">
                Đặt Ngay
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.button>
          </div>
        </div>

        {/* Tour Name Ticker (Optional) */}
        <div className="px-4 pb-2 overflow-hidden">
          <p className="text-xs text-gray-500 truncate">{tourName}</p>
        </div>
      </div>

      {/* Safe Area for iOS */}
      <div className="h-safe-bottom bg-white" />
    </motion.div>
  );
}