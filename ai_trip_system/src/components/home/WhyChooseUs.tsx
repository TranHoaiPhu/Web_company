"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { BOOKING_API_URL } from "@/config/api";
import {
  FaShieldAlt,
  FaMoneyBillWave,
  FaHeadset,
  FaUndoAlt,
  FaCertificate,
  FaStar,
  FaLock,
  FaGift,
} from "react-icons/fa";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/hooks";

// Types
interface Feature {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  stats?: string;
  color: string;
  gradient: string;
}



interface Testimonial {
  name: string;
  avatar: string;
  rating: number;
  comment: string;
  tour: string;
  date: string;
}

const WhyChooseUs = () => {
  const { t } = useTranslation("home");
  const [activeFeature, setActiveFeature] = useState<number | null>(null);

  // Main features
  const features: Feature[] = [
    {
      id: 1,
      icon: <FaMoneyBillWave className="text-4xl" />,
      title: t("whyChooseUs.features.transparentPrice.title"),
      description: t("whyChooseUs.features.transparentPrice.description"),
      stats: t("whyChooseUs.features.transparentPrice.stats"),
      color: "from-green-500 to-emerald-600",
      gradient: "bg-gradient-to-br from-green-50 to-emerald-50",
    },
    {
      id: 2,
      icon: <FaUndoAlt className="text-4xl" />,
      title: t("whyChooseUs.features.flexibleRefund.title"),
      description: t("whyChooseUs.features.flexibleRefund.description"),
      stats: t("whyChooseUs.features.flexibleRefund.stats"),
      color: "from-blue-500 to-cyan-600",
      gradient: "bg-gradient-to-br from-blue-50 to-cyan-50",
    },
    {
      id: 3,
      icon: <FaHeadset className="text-4xl" />,
      title: t("whyChooseUs.features.support247.title"),
      description: t("whyChooseUs.features.support247.description"),
      stats: t("whyChooseUs.features.support247.stats"),
      color: "from-purple-500 to-pink-600",
      gradient: "bg-gradient-to-br from-purple-50 to-pink-50",
    },
    {
      id: 4,
      icon: <FaCertificate className="text-4xl" />,
      title: t("whyChooseUs.features.trustedPartners.title"),
      description: t("whyChooseUs.features.trustedPartners.description"),
      stats: t("whyChooseUs.features.trustedPartners.stats"),
      color: "from-orange-500 to-red-600",
      gradient: "bg-gradient-to-br from-orange-50 to-red-50",
    },
  ];


  // Customer testimonials state
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    const fetchRecentReviews = async () => {
      try {
        const response = await fetch(`${BOOKING_API_URL}/reviews/recent?limit=3`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
          const fetchedReviews = result.data.map((r: unknown) => {
            const review = r as { user: { name: string; avatar: string }; rating: number; comment: string; tour: { name: string }; createdAt: string };
            return {
              name: review.user.name || "Khách hàng",
              avatar: review.user.avatar || (review.user.name ? review.user.name.charAt(0) : "👤"),
              rating: review.rating,
              comment: review.comment,
              tour: review.tour.name,
              date: new Date(review.createdAt).toLocaleDateString('vi-VN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })
            };
          });
          setTestimonials(fetchedReviews);
        } else {
          // Fallback to default if no reviews in DB
          setTestimonials([
            {
              name: "Nguyễn Minh Anh",
              avatar: "👩‍💼",
              rating: 5,
              comment: "Trải nghiệm tuyệt vời! Dịch vụ chuyên nghiệp, hướng dẫn viên nhiệt tình. Chắc chắn sẽ quay lại!",
              tour: "Tour Phú Quốc 4N3Đ",
              date: "2 tuần trước",
            },
            {
              name: "Trần Hoàng Nam",
              avatar: "👨‍💻",
              rating: 5,
              comment: "Giá cả hợp lý, lịch trình chi tiết. Đặc biệt là team support phản hồi cực nhanh!",
              tour: "Tour Sapa 3N2Đ",
              date: "1 tháng trước",
            },
            {
              name: "Lê Thị Hương",
              avatar: "👩‍🏫",
              rating: 5,
              comment: "Gia đình tôi rất hài lòng. Khách sạn đẹp, ăn uống ngon, không phát sinh chi phí gì thêm.",
              tour: "Tour Đà Lạt 2N1Đ",
              date: "3 tuần trước",
            }
          ]);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchRecentReviews();
  }, []);

  return (
    <section className="py-20 bg-[var(--bg-primary)] overflow-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-semibold mb-4"
          >
            <FaShieldAlt className="animate-pulse" />
            {t("whyChooseUs.badge")}
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {t("whyChooseUs.title")}{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              {t("whyChooseUs.brandName")}
            </span>
            ?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            {t("whyChooseUs.subtitle")}
          </p>
        </motion.div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              onHoverStart={() => setActiveFeature(feature.id)}
              onHoverEnd={() => setActiveFeature(null)}
              className="relative group"
            >
              {/* Card */}
              <div
                className={`relative h-full p-8 rounded-2xl border-2 transition-all duration-300 overflow-hidden bg-[var(--card-bg)] ${activeFeature === feature.id
                  ? "border-transparent shadow-2xl scale-105"
                  : "border-[var(--border-color)] shadow-lg hover:border-blue-200 dark:hover:border-blue-500"
                  }`}
              >
                {/* Icon */}
                <motion.div
                  animate={{
                    rotate: activeFeature === feature.id ? 360 : 0,
                  }}
                  transition={{ duration: 0.6 }}
                  className={`relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 shadow-lg group-hover:shadow-2xl transition-shadow`}
                >
                  {feature.icon}
                </motion.div>

                {/* Content */}
                <h3 className="relative z-10 text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="relative z-10 text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                  {feature.description}
                </p>


                {/* Decorative Element - colored circle in corner */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-10 dark:opacity-20 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Signals Bar */}
        {/*  <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 mb-16 shadow-2xl"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustSignals.map((signal, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center text-white"
              >
                <div className="text-4xl mb-2">{signal.icon}</div>
                <h4 className="font-bold text-lg mb-1">{signal.title}</h4>
                <p className="text-blue-100 text-sm">{signal.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div> */}



        {/* Customer Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            {t("whyChooseUs.testimonials.title")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loadingReviews ? (
              // Skeleton Loading UI
              [...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 animate-pulse"
                >
                  {/* Skeleton Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
                    ))}
                  </div>

                  {/* Skeleton Comment */}
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
                  </div>

                  {/* Skeleton Author */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                    </div>
                  </div>
                </div>
              ))
            ) : testimonials.length === 0 ? (
              // Empty State
              <div className="col-span-3 text-center py-12">
                <FaStar className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Chưa có đánh giá nào. Hãy trở thành người đầu tiên đánh giá!
                </p>
              </div>
            ) : (
              // Actual Testimonials
              testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="bg-[var(--card-bg)] p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-[var(--border-color)]"
                >
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FaStar key={i} className="text-yellow-400" />
                    ))}
                  </div>

                  {/* Comment */}
                  <p className="text-gray-700 dark:text-gray-300 mb-4 italic leading-relaxed line-clamp-3 h-[72px]">
                    &ldquo;{testimonial.comment}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl overflow-hidden">
                      {testimonial.avatar && (testimonial.avatar.startsWith('http') || testimonial.avatar.startsWith('/')) ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={testimonial.avatar}
                            alt={testimonial.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <span className="text-white">{testimonial.avatar}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{testimonial.tour}</p>
                      <p className="text-xs text-gray-400">{testimonial.date}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Guarantee Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-8 text-center text-white shadow-2xl"
        >
          <div className="flex flex-col items-center max-w-3xl mx-auto">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6"
            >
              <FaShieldAlt className="text-5xl" />
            </motion.div>
            <h3 className="text-3xl font-bold mb-4">
              {t("whyChooseUs.guarantee.title")}
            </h3>
            <p className="text-xl text-green-100 mb-6">
              {t("whyChooseUs.guarantee.description")}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <FaLock />
                <span className="font-semibold">{t("whyChooseUs.guarantee.securePayment")}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <FaGift />
                <span className="font-semibold">{t("whyChooseUs.guarantee.freeInsurance")}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <FaHeadset />
                <span className="font-semibold">{t("whyChooseUs.guarantee.support247")}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t("whyChooseUs.cta.ready")}
          </p>
          <motion.button
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
          >
            {t("whyChooseUs.cta.exploreTours")}
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyChooseUs;