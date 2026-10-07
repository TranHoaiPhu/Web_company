"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { FaSpinner, FaExclamationTriangle } from "react-icons/fa";

import TourCard from "./TourCard";
import { tourService } from "@/services/tours/tour.service";
import { mapTourApiToBase } from "@/mapper/tour.mapper";
import { useTranslation } from "@/lib/i18n/hooks";

import type { TourApi } from "@/types/tour.api";
import type { TourBase } from "@/types/tour";

export type TourCategory =
  | "Du lịch biển đảo"
  | "Du lịch văn hóa"
  | "Du lịch mạo hiểm"
  | "Du lịch nghỉ dưỡng"
  | "Du lịch miền núi"
  | "Khác";

const TOUR_CATEGORIES: TourCategory[] = [
  "Du lịch biển đảo",
  "Du lịch văn hóa",
  "Du lịch mạo hiểm",
  "Du lịch nghỉ dưỡng",
  "Du lịch miền núi",
  "Khác",
] as const;

interface FilterOption {
  id: string;
  label: string;
  count: number;
}

/* ──────────────────────────────────────────────── */

const TourList = () => {
  const { t } = useTranslation("tour");
  const [tours, setTours] = useState<TourBase[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tours - only run once on mount
  useEffect(() => {
    let isMounted = true;

    const fetchTours = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await tourService.getAll();
        const apiTours = response as TourApi[];
        console.log('apiTours', apiTours);
        const mapped = apiTours.map(mapTourApiToBase);

        if (isMounted) setTours(mapped);
      } catch {
        if (isMounted) setError("Có lỗi xảy ra khi tải danh sách tour");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTours();

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Computed filters ───────────────────────────────────────
  const filters = useMemo<FilterOption[]>(() => {
    const base = [
      { id: "all", label: t("list.filters.all"), count: tours.length },
      { id: "featured", label: t("list.filters.featured"), count: tours.filter(t => t.featured).length },
    ];

    const categoryFilters = TOUR_CATEGORIES.map(cat => ({
      id: cat.toLowerCase().replace(/\s+/g, "-"),
      label: cat,
      count: tours.filter(t => t.category === cat).length,
    }));

    return [...base, ...categoryFilters];
  }, [tours]);

  // ── Filtered tours ─────────────────────────────────────────
  const filteredTours = useMemo(() => {
    if (selectedFilter === "all") return tours;
    if (selectedFilter === "featured") return tours.filter(t => t.featured);

    const selectedCategory = filters.find(f => f.id === selectedFilter)?.label;
    if (!selectedCategory) return tours;

    return tours.filter(t => t.category === selectedCategory);
  }, [tours, selectedFilter, filters]);

  // ── Grid column classes ────────────────────────────────────
  const gridClasses =
    viewMode === "list"
      ? "grid-cols-1"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 S2xl:grid-cols-3";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-20">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        {/* Controls */}
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Filter buttons */}
          <div className="flex flex-wrap gap-3 overflow-x-auto pb-1.5">
            {filters.map(filter => (
              <motion.button
                key={filter.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedFilter(filter.id)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-6 py-2.5 text-sm font-medium shadow transition-colors ${selectedFilter === filter.id
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/30"
                  : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
              >
                {filter.label}
                <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-semibold">
                  {filter.count}
                </span>
              </motion.button>
            ))}
          </div>

          {/* View mode toggle */}
          <div className="inline-flex rounded-xl bg-white p-1.5 shadow-sm">
            {(["grid", "list"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${viewMode === mode
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                {mode === "grid" ? "Grid" : "List"}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
            <FaSpinner className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-lg font-medium text-gray-600">{t("list.loading")}</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 rounded-2xl bg-red-50/80 p-10 text-center">
            <FaExclamationTriangle className="h-16 w-16 text-red-500" />
            <div>
              <h3 className="mb-2 text-2xl font-bold text-red-800">{t("list.error.title")}</h3>
              <p className="text-red-700">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-red-600 px-8 py-3 font-medium text-white shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              {t("list.error.retry")}
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {filteredTours.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex min-h-[50vh] flex-col items-center justify-center gap-4 py-24 text-center"
              >
                <div className="text-7xl">🏖️</div>
                <h3 className="text-2xl font-bold text-gray-800 sm:text-3xl">
                  {t("list.empty.title")}
                </h3>
                <p className="max-w-md text-lg text-gray-600">
                  {t("list.empty.message")}
                </p>
              </motion.div>
            ) : (
              <motion.div
                layout
                className={`grid gap-6 sm:gap-8 ${gridClasses}`}
              >
                {filteredTours.map((tour, idx) => (
                  <motion.div
                    key={tour.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.06 }}
                  >
                    <TourCard tour={tour} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TourList;