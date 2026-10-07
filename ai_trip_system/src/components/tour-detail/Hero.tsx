// components/tour-detail/Hero.tsx
'use client';
import { TourDetail } from '@/types/tour';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Star, MapPin, Calendar, Users, ShoppingBag } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/hooks';

export default function Hero({ tour }: { tour: TourDetail }) {
  const { t } = useTranslation('tour');

  return (
    <section className="relative h-[70vh] md:h-[85vh] overflow-hidden">
      {/* Background Image with Parallax Effect */}
      <div className="absolute inset-0">
        {tour.cover_image ? (
          <Image
            src={tour.cover_image}
            alt={tour.tour.name}
            fill
            className="object-cover scale-105 hover:scale-100 transition-transform duration-[3s]"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700" />
        )}
        {/* Multi-layer Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
        {/* Animated Glow */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-blue-600/20 to-transparent animate-pulse" />
      </div>

      {/* Content Container */}
      <div className="relative h-full flex items-end">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12 md:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {tour.tour.is_hot_deal && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1.5 backdrop-blur-sm"
                >
                  <span className="text-lg">🔥</span>
                  {t('detail.hero.hotDeal')}
                </motion.div>
              )}
              <div className="bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-medium border border-white/30">
                {tour.category.name}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 md:mb-6 leading-tight drop-shadow-2xl">
              {tour.tour.name}
            </h1>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              {/* Rating Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-all duration-300 group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-2xl font-bold text-white">{tour.tour.rating}</span>
                </div>
                <p className="text-sm text-white/80">{t('detail.hero.reviews', { params: { count: tour.tour.review_count } }).replace('{count}', String(tour.tour.review_count))}</p>
              </motion.div>

              {/* Duration Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-all duration-300 group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <span className="text-2xl font-bold text-white">{tour.tour.duration_days}N{tour.tour.duration_nights}Đ</span>
                </div>
                <p className="text-sm text-white/80">{t('detail.hero.duration')}</p>
              </motion.div>

              {/* Location Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-all duration-300 group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-5 h-5 text-green-400" />
                  <span className="text-lg font-bold text-white truncate">{tour.location?.name || 'Việt Nam'}</span>
                </div>
                <p className="text-sm text-white/80">{t('detail.hero.destination')}</p>
              </motion.div>

              {/* Booking Count Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-all duration-300 group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingBag className="w-5 h-5 text-orange-400" />
                  <span className="text-2xl font-bold text-white">{tour.tour.booking_count?.toLocaleString() || 0}</span>
                </div>
                <p className="text-sm text-white/80">{t('detail.hero.bookingCount')}</p>
              </motion.div>
            </div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center justify-center gap-2">
                  {t('detail.hero.bookNow')}
                  <Calendar className="w-5 h-5" />
                </span>
              </button>

              <button className="px-8 py-4 bg-white/10 backdrop-blur-xl border-2 border-white/40 text-white rounded-2xl font-bold text-lg hover:bg-white/20 hover:border-white/60 transition-all duration-300 hover:scale-105">
                {t('detail.hero.contact')}
              </button>
            </motion.div>

            {/* Price Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 }}
              className="inline-block mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-full shadow-xl"
            >
              <span className="text-sm font-medium">{t('detail.hero.priceFrom')} </span>
              <span className="text-2xl font-bold">{tour.tour.base_price.toLocaleString()}đ</span>
              <span className="text-sm font-medium">{t('detail.hero.perPerson')}</span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, repeat: Infinity, duration: 1.5 }}
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 hidden md:block"
      >
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-white rounded-full animate-bounce" />
        </div>
      </motion.div>
    </section>
  );
}