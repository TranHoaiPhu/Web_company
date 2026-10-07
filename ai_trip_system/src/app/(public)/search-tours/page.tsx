'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaMapMarkerAlt, FaSearch, FaArrowLeft, FaSpinner, FaFilter, FaSortAmountDown, FaExclamationTriangle, FaUsers, FaCalendarAlt, FaTimes, FaArrowRight } from 'react-icons/fa';
import { tourService, TourWithDistance, SearchByLocationResponse } from '@/services/tours/tour.service';
import LocationSearchModal, { SearchFilters } from '@/components/search/LocationSearchModal';
import TourCard from '@/components/tours/TourCard';
import { mapTourApiToBase } from '@/mapper/tour.mapper';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface Location {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tours, setTours] = useState<TourWithDistance[]>([]);
  const [pagination, setPagination] = useState<SearchByLocationResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [radius, setRadius] = useState(50);
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'rating'>('distance');
  const [page, setPage] = useState(1);

  // New filter states
  const [participants, setParticipants] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Get params from URL
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const address = searchParams.get('address');
  const radiusParam = searchParams.get('radius');
  const participantsParam = searchParams.get('participants');
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');

  useEffect(() => {
    if (lat && lng) {
      setSelectedLocation({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        address: address || 'Vị trí đã chọn'
      });
      if (radiusParam) setRadius(parseInt(radiusParam));
      if (participantsParam) setParticipants(parseInt(participantsParam));
      if (startDateParam) setStartDate(startDateParam);
      if (endDateParam) setEndDate(endDateParam);
    }
  }, [lat, lng, address, radiusParam, participantsParam, startDateParam, endDateParam]);

  // Search tours when location changes
  const searchTours = useCallback(async () => {
    if (!selectedLocation) return;

    setLoading(true);
    setError(null);

    try {
      const response = await tourService.searchByLocation({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        radius: radius,
        limit: 20,
        page: page,
        participants: participants > 0 ? participants : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });

      const filteredData = response.data || [];
      setTours(filteredData);
      setPagination(response.pagination || null);

      if (!filteredData || filteredData.length === 0) {
        setError('Không tìm thấy tour nào trong khu vực này. Hãy thử tăng bán kính tìm kiếm.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [selectedLocation, radius, page, participants, startDate, endDate]);

  useEffect(() => {
    if (selectedLocation) {
      searchTours();
    } else {
      setLoading(false);
    }
  }, [selectedLocation, radius, page, participants, startDate, endDate, searchTours]);

  // Build URL params helper
  const buildUrlParams = useCallback((location: Location, filters?: Omit<SearchFilters, 'location'>) => {
    const params = new URLSearchParams({
      lat: location.lat.toString(),
      lng: location.lng.toString(),
      address: location.address,
      radius: (filters?.radius || radius).toString()
    });

    if (filters?.participants && filters.participants > 0) {
      params.set('participants', filters.participants.toString());
    }
    if (filters?.startDate) {
      params.set('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params.set('endDate', filters.endDate);
    }

    return params;
  }, [radius]);

  const handleSelectLocation = (location: Location, filters?: Omit<SearchFilters, 'location'>) => {
    setSelectedLocation(location);
    setPage(1);

    if (filters) {
      if (filters.radius) setRadius(filters.radius);
      if (filters.participants !== undefined) setParticipants(filters.participants);
      if (filters.startDate !== undefined) setStartDate(filters.startDate);
      if (filters.endDate !== undefined) setEndDate(filters.endDate);
    }

    const params = buildUrlParams(location, filters);
    router.push(`/search-tours?${params.toString()}`);
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    setPage(1);

    if (selectedLocation) {
      const params = buildUrlParams(selectedLocation, { radius: newRadius, participants, startDate, endDate });
      router.push(`/search-tours?${params.toString()}`);
    }
  };

  const clearParticipants = () => {
    setParticipants(0);
    if (selectedLocation) {
      const params = buildUrlParams(selectedLocation, { radius, startDate, endDate });
      router.push(`/search-tours?${params.toString()}`);
    }
  };

  const clearStartDate = () => {
    setStartDate('');
    if (selectedLocation) {
      const params = buildUrlParams(selectedLocation, { radius, participants, endDate });
      router.push(`/search-tours?${params.toString()}`);
    }
  };

  const clearEndDate = () => {
    setEndDate('');
    if (selectedLocation) {
      const params = buildUrlParams(selectedLocation, { radius, participants, startDate });
      router.push(`/search-tours?${params.toString()}`);
    }
  };

  const sortedTours = [...tours].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        return (a.distance || 0) - (b.distance || 0);
      case 'price':
        return (a.originalPrice || a.price || 0) - (b.originalPrice || b.price || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 mt-25">
      {/* Clean Header */}
      <div className="relative bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
          <Image
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200"
            alt="background"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          >
            <FaArrowLeft className="text-xs" />
            Quay lại trang chủ
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Tìm Kiếm Hành Trình
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Khám phá những vùng đất mới với công cụ tìm kiếm thông minh
            </p>
          </div>

          {/* Clean Search Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-slate-700">
              {/* Location Picker */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex-1 flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <FaMapMarkerAlt size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Địa điểm</div>
                  <div className={`font-semibold truncate text-sm ${selectedLocation ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                    {selectedLocation?.address || 'Bạn muốn đi đâu?'}
                  </div>
                </div>
              </button>

              {/* Radius */}
              <div className="lg:w-44 px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Bán kính</div>
                <select
                  value={radius}
                  onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                  className="w-full bg-transparent outline-none font-semibold text-gray-900 dark:text-white text-sm"
                >
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                  <option value={100}>100 km</option>
                  <option value={200}>200 km</option>
                </select>
              </div>

              {/* Participants */}
              <div className="lg:w-44 flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                  <FaUsers size={16} />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Số người</div>
                  <select
                    value={participants}
                    onChange={(e) => setParticipants(parseInt(e.target.value))}
                    className="w-full bg-transparent outline-none font-semibold text-gray-900 dark:text-white text-sm"
                  >
                    <option value={0}>Tất cả</option>
                    <option value={1}>1 người</option>
                    <option value={2}>2 người</option>
                    <option value={3}>3 người</option>
                    <option value={4}>4 người</option>
                    <option value={5}>5+ người</option>
                  </select>
                </div>
              </div>

              {/* Start Date */}
              <div className="flex-1 flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
                  <FaCalendarAlt size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Từ ngày</div>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-transparent outline-none font-semibold text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              {/* End Date */}
              <div className="flex-1 flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 flex-shrink-0">
                  <FaCalendarAlt size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Đến ngày</div>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-transparent outline-none font-semibold text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              {/* Search Button */}
              <div className="lg:w-auto p-2">
                <button
                  onClick={searchTours}
                  disabled={!selectedLocation || loading}
                  className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white px-8 py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <FaSpinner className="animate-spin text-base" />
                  ) : (
                    <>
                      {/*   <FaSearch size={14} /> */}
                      <span>Tìm kiếm</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Active Filters */}
            {(participants > 0 || startDate || endDate) && (
              <div className="px-5 py-3 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">Đang lọc:</span>

                  {participants > 0 && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium">
                      <FaUsers className="text-xs" />
                      {participants}+ người
                      <button onClick={clearParticipants} className="hover:text-blue-900 dark:hover:text-blue-100 ml-1">
                        <FaTimes className="text-xs" />
                      </button>
                    </span>
                  )}

                  {(startDate || endDate) && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium">
                      <FaCalendarAlt className="text-xs" />
                      {startDate && `Từ ${new Date(startDate).toLocaleDateString('vi-VN')}`}
                      {endDate && ` • Đến ${new Date(endDate).toLocaleDateString('vi-VN')}`}
                      <button
                        onClick={() => {
                          clearStartDate();
                          clearEndDate();
                        }}
                        className="hover:text-blue-900 dark:hover:text-blue-100 ml-1"
                      >
                        <FaTimes className="text-xs" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* No location selected */}
        {!selectedLocation && !loading && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <FaMapMarkerAlt className="text-3xl text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Bạn chưa chọn địa điểm
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Hãy click vào ô tìm kiếm phía trên để bắt đầu khám phá các tour gần bạn nhất
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Chọn địa điểm ngay
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <FaSpinner className="text-4xl text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Đang tìm kiếm các hành trình cho bạn...
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-8 text-center">
              <FaExclamationTriangle className="text-4xl text-amber-600 dark:text-amber-400 mx-auto mb-4" />
              <p className="text-amber-900 dark:text-amber-200 mb-6">{error}</p>
              <button
                onClick={() => handleRadiusChange(radius * 2)}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
              >
                Thử tăng bán kính lên {radius * 2} km
              </button>
            </div>
          </div>
        )}

        {/* Results Header */}
        {selectedLocation && !loading && tours.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  Tìm thấy {pagination?.total || tours.length} hành trình
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Trong phạm vi {radius}km từ {selectedLocation.address}
                </p>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800">
                <FaSortAmountDown className="text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'distance' | 'price' | 'rating')}
                  className="bg-transparent outline-none font-medium text-gray-900 dark:text-white text-sm"
                >
                  <option value="distance">Gần đây nhất</option>
                  <option value="price">Giá ưu đãi nhất</option>
                  <option value="rating">Được yêu thích nhất</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tour Grid */}
        {!loading && tours.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTours.map((tour, index) => (
              <motion.div
                key={tour.tourId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <TourCard tour={mapTourApiToBase(tour)} showDistance distance={tour.distance} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
            >
              Trước
            </button>

            <div className="flex gap-2">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium text-sm transition-colors ${page === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-4 py-2 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Location Search Modal */}
      <LocationSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectLocation={handleSelectLocation}
        initialLocation={selectedLocation}
      />
    </div>
  );
}

export default function SearchToursPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-4xl text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}