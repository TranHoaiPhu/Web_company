'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FaSearch,
  FaMapMarkerAlt,
  FaClock,
  FaUsers,
  FaStar,

  FaArrowRight,
  FaFire,
  FaFilter,
  FaThLarge,
  FaList,
  FaSpinner,
  FaCompass,
  FaPlane,
  FaUmbrellaBeach,
  FaMountain,
  FaCity,
  FaLandmark,
  FaMoneyBillWave,
  FaTimes
} from 'react-icons/fa';
import { tourService } from '@/services/tours/tour.service';
import { tourCategoryService } from "@/services/tours/tour-categoy.service";
import { mapTourApiToBase } from '@/mapper/tour.mapper';
import type { TourApi } from '@/types/tour.api';
import type { TourBase } from '@/types/tour';
import httpBooking from '@/services/httpBooking';
import TourCard from '@/components/tours/TourCard';

// Category icons mapping
const categoryIcons: Record<string, React.ReactNode> = {
  'Du lịch biển đảo': <FaUmbrellaBeach className="text-cyan-500" />,
  'Du lịch văn hóa': <FaLandmark className="text-amber-500" />,
  'Du lịch mạo hiểm': <FaMountain className="text-green-500" />,
  'Du lịch nghỉ dưỡng': <FaStar className="text-purple-500" />,
  'Du lịch miền núi': <FaMountain className="text-emerald-500" />,
  'Du lịch thành phố': <FaCity className="text-blue-500" />,
};



// Main Tours Page
interface ToursPageProps {
  initialCategory?: string;
}

export default function ToursPage({ initialCategory }: ToursPageProps) {
  const searchParams = useSearchParams();
  const locationId = searchParams.get('location');
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  const participantsParam = searchParams.get('participants');

  const [tours, setTours] = useState<TourBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'rating' | 'newest'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000000]);
  const [showFilters, setShowFilters] = useState(
    !!(startDateParam || endDateParam || participantsParam)
  );
  const [locationName, setLocationName] = useState<string | null>(null);

  // New filter states for participants and date - initialize from URL params
  const [participants, setParticipants] = useState<number>(participantsParam ? parseInt(participantsParam) : 0);
  const [startDate, setStartDate] = useState<string>(startDateParam || '');
  const [endDate, setEndDate] = useState<string>(endDateParam || '');

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const limitSize = 9; // Items per page (3x3 grid)

  // Fuzzy Search Debounce Logic
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Side Effect for Scrolling when page changes
  useEffect(() => {
    if (!loading && !isPageLoading) {
      const element = document.getElementById('tour-results');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Fetch location name if filtering by location
  useEffect(() => {
    if (locationId) {
      httpBooking.get(`/locations/${locationId}`)
        .then(res => {
          if (res.data) {
            setLocationName(res.data.name);
          }
        })
        .catch(() => { });
    }
  }, [locationId]);

  // Fetch categories
  const [categoriesList, setCategoriesList] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await tourCategoryService.getAll();
        setCategoriesList(cats);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    loadCategories();
  }, []);

  // Fetch tours logic
  const fetchToursData = useCallback(async (pageNum: number) => {
    // If we have a selected category but categories aren't loaded yet, wait.
    if (selectedCategory && selectedCategory !== 'featured' && categoriesList.length === 0) {
      return;
    }

    try {
      if (pageNum === 1) setLoading(true);
      else setIsPageLoading(true);

      // Resolve category ID
      let categoryId: string | undefined;
      if (selectedCategory && selectedCategory !== 'featured') {
        const cat = categoriesList.find(c => c.name === selectedCategory);
        if (cat) categoryId = cat.id;
      }

      const response = await tourService.getList({
        page: pageNum,
        limit: limitSize,
        search: debouncedSearch || undefined,
        sortBy: sortBy,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 50000000 ? priceRange[1] : undefined,
        locationId: locationId || undefined,
        isFeatured: selectedCategory === 'featured' ? true : undefined,
        categoryId: categoryId,
        participants: participants > 0 ? participants : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (response && response.success) {
        const apiTours = response.data as TourApi[];
        const mapped = apiTours.map(mapTourApiToBase);

        setTours(mapped);
        setTotalPages(response.pagination.totalPages);
        setPage(response.pagination.page);
        setTotalResults(response.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching tours:', error);
    } finally {
      setLoading(false);
      setIsPageLoading(false);
    }
  }, [debouncedSearch, sortBy, priceRange, locationId, selectedCategory, categoriesList, participants, startDate, endDate]);

  // Initial fetch and filter change
  useEffect(() => {
    fetchToursData(1);
  }, [fetchToursData]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      fetchToursData(newPage);
    }
  };

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedCategory(null);
    setPriceRange([0, 50000000]);
    setSortBy('newest');
    setParticipants(0);
    setStartDate('');
    setEndDate('');
    setPage(1);
  }, []);

  // Use full categories list for filter pills
  const categories = useMemo(() => {
    return categoriesList.map(c => c.name);
  }, [categoriesList]);

  // Derive stats from current view (ideally should be from server total)
  const stats = useMemo(() => ({
    total: totalResults, // Use totalResults from server
    featured: tours.filter(t => t.featured).length,
    avgPrice: tours.length > 0 ? Math.round(tours.reduce((sum, t) => sum + t.price, 0) / tours.length) : 0,
    avgRating: tours.length > 0 ? (tours.reduce((sum, t) => sum + t.rating, 0) / tours.length).toFixed(1) : '0'
  }), [tours, totalResults]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 mt-22">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        {/* Background patterns */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-yellow-300 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-36 h-36 bg-pink-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-cyan-300 rounded-full blur-3xl"></div>
        </div>

        {/* Floating icons */}
        <motion.div
          className="absolute top-20 left-[10%] text-white/20"
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          <FaPlane className="text-6xl" />
        </motion.div>
        <motion.div
          className="absolute bottom-20 right-[15%] text-white/20"
          animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        >
          <FaUmbrellaBeach className="text-5xl" />
        </motion.div>
        <motion.div
          className="absolute top-1/3 right-[20%] text-white/20"
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        >
          <FaMountain className="text-4xl" />
        </motion.div>

        <div className="container mx-auto px-4 py-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <FaCompass className="animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-sm font-medium">
                {locationName ? `Tour tại ${locationName}` : 'Khám phá tour du lịch'}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              ✈️ {locationName ? `Tour ${locationName}` : 'Tất Cả Tour Du Lịch'}
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
              Khám phá hàng trăm tour du lịch hấp dẫn với giá ưu đãi đặc biệt
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="flex items-center bg-white rounded-full shadow-2xl overflow-hidden">
                <FaSearch className="ml-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm tour theo tên, địa điểm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-4 text-gray-800 focus:outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="p-2 mr-2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes />
                  </button>
                )}
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 font-semibold hover:opacity-90 transition-opacity">
                  Tìm kiếm
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <div className="bg-white/10 backdrop-blur-sm border-t border-white/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-wrap justify-center gap-8 text-white">
              <div className="flex items-center gap-2">
                <FaPlane className="text-yellow-300" />
                <span className="font-bold">{totalResults}</span>
                <span className="text-white/80">tour</span>
              </div>
              <div className="flex items-center gap-2">
                <FaFire className="text-orange-400" />
                <span className="font-bold">{stats.featured}</span>
                <span className="text-white/80">hot deal</span>
              </div>
              <div className="flex items-center gap-2">
                <FaStar className="text-yellow-300" />
                <span className="font-bold">{stats.avgRating}</span>
                <span className="text-white/80">đánh giá TB</span>
              </div>
              <div className="flex items-center gap-2">
                <FaMoneyBillWave className="text-green-400" />
                <span className="font-bold">{stats.avgPrice.toLocaleString('vi-VN')}đ</span>
                <span className="text-white/80">giá TB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 50L60 45C120 40 240 30 360 35C480 40 600 60 720 65C840 70 960 60 1080 50C1200 40 1320 30 1380 25L1440 20V100H1380C1320 100 1200 100 1080 100C960 100 840 100 720 100C600 100 480 100 360 100C240 100 120 100 60 100H0V50Z"
              fill="rgb(239, 246, 255)" />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-4 mb-8 sticky top-4 z-20"
        >
          <div className="flex flex-wrap items-center gap-4">
            {/* Category Pills */}
            <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${!selectedCategory
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setSelectedCategory('featured')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1 ${selectedCategory === 'featured'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <FaFire /> Hot Deal
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${selectedCategory === cat
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {categoryIcons[cat]}
                  {cat}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 rounded-xl transition-colors ${showFilters ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <FaFilter />
              </button>

              {/* Category Dropdown */}
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả danh mục</option>
                <option value="featured">🔥 Hot Deal</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá thấp → cao</option>
                <option value="price-desc">Giá cao → thấp</option>
                <option value="rating">Đánh giá cao nhất</option>
              </select>

              {/* View Mode */}
              <div className="hidden md:flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-500'
                    }`}
                >
                  <FaThLarge />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500'
                    }`}
                >
                  <FaList />
                </button>
              </div>
            </div>
          </div>

          {/* Extended Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Participants Filter */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        <FaUsers className="inline mr-1 text-purple-500" />
                        Số người
                      </label>
                      <select
                        value={participants}
                        onChange={(e) => setParticipants(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value={0}>Không giới hạn</option>
                        <option value={1}>1 người</option>
                        <option value={2}>2 người</option>
                        <option value={3}>3 người</option>
                        <option value={4}>4 người</option>
                        <option value={5}>5 người</option>
                        <option value={6}>6-10 người</option>
                        <option value={10}>10+ người</option>
                      </select>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        <FaClock className="inline mr-1 text-blue-500" />
                        Ngày khởi hành
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        <FaClock className="inline mr-1 text-blue-500" />
                        Đến ngày
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        <FaMoneyBillWave className="inline mr-1 text-green-500" />
                        Khoảng giá
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={priceRange[0]}
                          onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Từ"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                          type="number"
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Đến"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Filters Row */}
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    {/* Quick price filters */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Mức giá:</span>
                      {[
                        { label: 'Dưới 1tr', range: [0, 1000000] },
                        { label: '1-3tr', range: [1000000, 3000000] },
                        { label: '3-5tr', range: [3000000, 5000000] },
                        { label: 'Trên 5tr', range: [5000000, 50000000] },
                      ].map(({ label, range }) => (
                        <button
                          key={label}
                          onClick={() => setPriceRange(range as [number, number])}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${priceRange[0] === range[0] && priceRange[1] === range[1]
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Active filter badges */}
                    {(participants > 0 || startDate || endDate) && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Đang lọc:</span>
                        {participants > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            {participants}+ người
                            <button onClick={() => setParticipants(0)} className="hover:text-purple-900">
                              <FaTimes className="w-3 h-3" />
                            </button>
                          </span>
                        )}
                        {startDate && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            Từ {new Date(startDate).toLocaleDateString('vi-VN')}
                            <button onClick={() => setStartDate('')} className="hover:text-blue-900">
                              <FaTimes className="w-3 h-3" />
                            </button>
                          </span>
                        )}
                        {endDate && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            Đến {new Date(endDate).toLocaleDateString('vi-VN')}
                            <button onClick={() => setEndDate('')} className="hover:text-blue-900">
                              <FaTimes className="w-3 h-3" />
                            </button>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Clear filters */}
                    <button
                      onClick={clearFilters}
                      className="ml-auto px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Xóa tất cả bộ lọc
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Info */}
        <div id="tour-results" className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Hiển thị <span className="font-bold text-gray-900">{totalResults > 0 ? Math.min(tours.length, 1) + (page - 1) * limitSize : 0}-{Math.min(totalResults, page * limitSize)}</span> trên <span className="font-bold text-gray-900">{totalResults}</span> tour
            {selectedCategory && selectedCategory !== 'featured' && ` trong "${selectedCategory}"`}
            {selectedCategory === 'featured' && ' hot deal'}
            {searchTerm && ` cho "${searchTerm}"`}
          </p>
        </div>

        {/* Tours Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FaSpinner className="text-5xl text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600 font-medium">Đang tải danh sách tour...</p>
          </div>
        ) : tours.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-8xl mb-6">🏝️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy tour nào</h2>
            <p className="text-gray-500 mb-6">Hãy thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác</p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </motion.div>
        ) : (
          <>
            <div className={`grid gap-6 ${viewMode === 'grid'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'
              : 'grid-cols-1'
              }`}>
              {tours.map((tour: TourBase) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex flex-col items-center gap-4">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1 || isPageLoading}
                    className="p-3 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-600 disabled:opacity-30 transition-all font-medium flex items-center gap-2 shadow-sm"
                  >
                    <FaArrowRight className="rotate-180" />
                    Trước
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                      .map((p, i, arr) => (
                        <div key={p} className="flex items-center">
                          {i > 0 && arr[i - 1] !== p - 1 && <span className="px-2 text-gray-400">...</span>}
                          <button
                            onClick={() => handlePageChange(p)}
                            disabled={isPageLoading}
                            className={`w-12 h-12 rounded-xl font-bold transition-all ${page === p
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                              : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-600 hover:text-blue-600'
                              }`}
                          >
                            {p}
                          </button>
                        </div>
                      ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages || isPageLoading}
                    className="p-3 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-600 disabled:opacity-30 transition-all font-medium flex items-center gap-2 shadow-sm"
                  >
                    Sau
                    <FaArrowRight />
                  </button>
                </div>
                {isPageLoading && (
                  <div className="flex items-center gap-2 text-blue-600 font-medium animate-pulse">
                    <FaSpinner className="animate-spin" />
                    Đang tải trang {page}...
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16"
        >
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3"></div>

            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Cần tư vấn tour phù hợp? 🤔
              </h2>
              <p className="text-white/90 mb-6 max-w-xl mx-auto">
                Liên hệ với chúng tôi để được hỗ trợ lên kế hoạch chuyến đi hoàn hảo
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/destinations"
                  className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-full font-bold hover:shadow-lg hover:scale-105 transition-all"
                >
                  <FaMapMarkerAlt />
                  Xem điểm đến
                </Link>
                <Link
                  href="/coupons"
                  className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white border-2 border-white/50 px-8 py-4 rounded-full font-bold hover:bg-white/30 transition-all"
                >
                  Mã giảm giá
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
