"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FaSpinner, FaFire, FaStar, FaArrowRight } from "react-icons/fa";
import Link from "next/link";

import TourCard from "../tours/TourCard";
import { tourService } from "@/services/tours/tour.service";
import { mapTourApiToBase } from "@/mapper/tour.mapper";

import type { TourApi } from "@/types/tour.api";
import type { TourBase } from "@/types/tour";

interface FeaturedToursProps {
  limit?: number;
  title?: string;
  subtitle?: string;
}

const FeaturedTours = ({ 
  limit = 6, 
  title = "Tour Nổi Bật & Hot Deal 🔥",
  subtitle = "Những tour du lịch được yêu thích nhất với ưu đãi hấp dẫn"
}: FeaturedToursProps) => {
  const [tours, setTours] = useState<TourBase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchTours = async () => {
      try {
        setLoading(true);
        const response = await tourService.getAll();
        const apiTours = response as TourApi[];
        const mapped = apiTours.map(mapTourApiToBase);

        // Chỉ lấy tour featured hoặc có giảm giá (hot deal)
        const featuredTours = mapped.filter(tour => 
          tour.featured || (tour.originalPrice && tour.originalPrice > tour.price)
        );

        // Giới hạn số lượng
        const limitedTours = featuredTours.slice(0, limit);

        if (isMounted) setTours(limitedTours);
      } catch (error) {
        console.error("Error fetching featured tours:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTours();

    return () => {
      isMounted = false;
    };
  }, [limit]);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full mb-4">
            <FaFire className="animate-pulse" />
            <span className="text-sm font-semibold">Đang Hot</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          <p className="text-gray-700 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <FaSpinner className="text-4xl text-blue-500 animate-spin" />
          </div>
        )}

        {/* Tours Grid */}
        {!loading && tours.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {tours.map((tour, idx) => (
                <motion.div
                  key={tour.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                >
                  <TourCard tour={tour} />
                </motion.div>
              ))}
            </div>

            {/* View All Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <Link
                href="/tours"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all"
              >
                <FaStar />
                Xem tất cả tour
                <FaArrowRight className="text-sm" />
              </Link>
            </motion.div>
          </>
        )}

        {/* Empty State */}
        {!loading && tours.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏖️</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              Chưa có tour nổi bật
            </h3>
            <p className="text-gray-500">
              Hãy quay lại sau để xem những ưu đãi hấp dẫn!
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedTours;
