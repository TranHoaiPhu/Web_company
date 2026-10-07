'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, CloudSun, Users, Compass,
  Star, Info, Calendar, Utensils,
  Lightbulb, Camera, Waves, Mountain,
  ChevronRight, ArrowRight, Heart, Share2,
  Search, Filter, Map, Clock, DollarSign,
  Sparkles, Smile, Globe, Landmark, TreePalm,
  Building2, Image as ImageIcon, Target
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script'; // Added Script import
import httpBooking from '@/services/httpBooking';
import { API_BASE_URL } from '@/config/api';
import TourCTA from '@/components/home/TourCTA';

interface Destination {
  id: number;
  name: string;
  slug: string;
  description: string;
  type: string;
  parent_id: number | null;
  latitude: number;
  longitude: number;
  image_url: string;
  hero_image_url?: string;
  tagline?: string;
  subtitle?: string;
  climate?: string;
  suitable_for?: string;
  famous_for?: string;
  vibe?: string;
  comparison?: string;
  season_data?: any[];
  highlights_data?: any[];
  cuisine_data?: any[];
  ideal_for_data?: any[];
  tips_data?: string[];
  activities_data?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Fixed UI Constants
const VIBES = [
  { id: 'BEACH', label: 'Biển & Nghỉ dưỡng', icon: <Waves size={20} />, color: 'bg-blue-500' },
  { id: 'NATURE', label: 'Núi & Thiên nhiên', icon: <Mountain size={20} />, color: 'bg-green-500' },
  { id: 'HISTORICAL', label: 'Văn hóa – Lịch sử', icon: <Landmark size={20} />, color: 'bg-amber-600' },
  { id: 'CITY', label: 'Thành phố năng động', icon: <Building2 size={20} />, color: 'bg-indigo-500' },
  { id: 'CHECKIN', label: 'Check-in sống ảo', icon: <Camera size={20} />, color: 'bg-pink-500' },
];

const REGIONS = [
  { id: 'north', label: 'Miền Bắc' },
  { id: 'central', label: 'Miền Trung' },
  { id: 'south', label: 'Miền Nam' },
];

const BUDGETS = [
  { id: 'low', label: 'Rẻ', icon: '💰' },
  { id: 'mid', label: 'Trung bình', icon: '💰💰' },
  { id: 'high', label: 'Cao cấp', icon: '💰💰💰' },
];

const AUDIENCES = [
  { id: 'family', label: 'Gia đình' },
  { id: 'couple', label: 'Couple' },
  { id: 'friends', label: 'Bạn bè' },
  { id: 'solo', label: 'Solo' },
];

// Helper to format image URL
const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return '/images/elementor-placeholder-image.webp';
  if (url.startsWith('http') && !url.includes('proxy_image')) {
    return `${API_BASE_URL}/proxy_image/?url=${encodeURIComponent(url)}`;
  }
  return url;
};

// --- New Fallback Image Component ---
const DestinationImage = ({ dest }: { dest: Destination }) => {
  const [imgSrc, setImgSrc] = useState<string>(getImageUrl(dest.image_url));
  const [isFallbackTried, setIsFallbackTried] = useState(false);

  const handleGoogleFallback = useCallback(async () => {
    if (isFallbackTried || typeof window === 'undefined') return;
    setIsFallbackTried(true);

    try {
      // Look for API Key
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      if (!apiKey) return;

      // If google maps is not yet on window, we shouldn't try to use it
      if (!window.google?.maps) {
        // Simple fetch attempt as fallback or just use placeholder
        setImgSrc('/images/elementor-placeholder-image.webp');
        return;
      }

      const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
      const { LatLng } = await google.maps.importLibrary("core") as google.maps.CoreLibrary;

      const query = `${dest.name} Việt Nam landscape travel`;
      const { places } = await Place.searchByText({
        textQuery: query,
        fields: ['photos'],
        locationBias: dest.latitude && dest.longitude ? new LatLng(dest.latitude, dest.longitude) : undefined,
        maxResultCount: 1,
      });

      if (places && places.length > 0 && places[0].photos && places[0].photos.length > 0) {
        const url = places[0].photos[0].getURI({ maxWidth: 800, maxHeight: 600 });
        if (url) setImgSrc(url);
      } else {
        setImgSrc('/images/elementor-placeholder-image.webp');
      }
    } catch (error) {
      console.error("Error in Google fallback:", error);
      setImgSrc('/images/elementor-placeholder-image.webp');
    }
  }, [dest.name, dest.latitude, dest.longitude, dest.type, isFallbackTried]);

  useEffect(() => {
    if (!dest.image_url && !isFallbackTried) {
      handleGoogleFallback();
    }
  }, [dest.image_url, isFallbackTried, handleGoogleFallback]);

  return (
    <Image
      src={imgSrc}
      alt={dest.name}
      fill
      className="object-cover transition-transform duration-700 group-hover:scale-110"
      onError={() => {
        if (!isFallbackTried) handleGoogleFallback();
      }}
    />
  );
};

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<string | null>(null);
  const [isFilterSticky, setIsFilterSticky] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [galleryReviews, setGalleryReviews] = useState<any[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 9;

  useEffect(() => {
    fetchDestinations();
    fetchGalleryReviews();

    const handleScroll = () => {
      if (filterRef.current) {
        const offset = filterRef.current.offsetTop;
        setIsFilterSticky(window.scrollY > offset - 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !isLoadingMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, isLoadingMore]);

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      const response = await httpBooking.get(`/locations?is_active=true&page=1&pageSize=${PAGE_SIZE}`);
      if (response.data.data) {
        setDestinations(response.data.data);
        setHasMore(response.data.data.length < response.data.total);
      }
    } catch (error) {
      console.error('Error fetching destinations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await httpBooking.get(`/locations?is_active=true&page=${nextPage}&pageSize=${PAGE_SIZE}`);
      if (response.data.data) {
        setDestinations(prev => [...prev, ...response.data.data]);
        setPage(nextPage);
        setHasMore(destinations.length + response.data.data.length < response.data.total);
      }
    } catch (error) {
      console.error('Error loading more:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const fetchGalleryReviews = async () => {
    try {
      const response = await httpBooking.get('/reviews/recent?limit=10');
      if (response.data.success && response.data.data) {
        // Flatten all images from reviews into a single array
        const allReviews = response.data.data;
        setGalleryReviews(allReviews.filter((r: any) => r.images && r.images.length > 0));
      }
    } catch (error) {
      console.error('Error fetching gallery reviews:', error);
    }
  };

  const filteredDestinations = useMemo(() => {
    return destinations.filter(d => {
      const matchesSearch = !searchTerm || d.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesVibe = !selectedVibe || d.type === selectedVibe;
      // Since region/budget/audience might not be in the DB yet, we simulate or filter based on descriptions
      // In a real app, these would be specific DB columns
      return matchesSearch && matchesVibe;
    });
  }, [destinations, searchTerm, selectedVibe, selectedRegion, selectedBudget, selectedAudience]);

  return (
    <div className="min-h-screen bg-white">
      {/* 1. HERO SECTION & VIBE PICKER */}
      <section className="relative h-[80vh] w-full flex items-center justify-center overflow-hidden mt-20">
        <Image
          src="https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2000&auto=format&fit=crop"
          alt="Travel Inspiration"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-white" />

        <div className="relative z-10 text-center px-4 max-w-4xl mt-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 drop-shadow-lg">
              Bạn muốn trốn đi đâu hôm nay?
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-12 font-medium">
              Đừng tìm địa lý, hãy tìm cảm xúc. Chọn "vibe" của bạn:
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              {VIBES.map((vibe) => (
                <motion.button
                  key={vibe.id}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedVibe(selectedVibe === vibe.id ? null : vibe.id)}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl backdrop-blur-md transition-all border-2 ${selectedVibe === vibe.id
                    ? 'bg-white text-gray-900 border-white shadow-2xl'
                    : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                    }`}
                >
                  <span className={selectedVibe === vibe.id ? 'text-blue-600' : 'text-white'}>
                    {vibe.icon}
                  </span>
                  <span className="font-bold whitespace-nowrap">{vibe.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. FILTER BAR (STICKY) */}
      <div ref={filterRef} className={`z-50 transition-all duration-300 ${isFilterSticky ? 'sticky top-20 bg-white/80 backdrop-blur-xl shadow-md py-4' : 'py-8'}`}>
        <div className="container mx-auto px-4">
          <div className="bg-gray-50 rounded-3xl p-4 md:p-6 flex flex-wrap items-center gap-6 shadow-inner border border-gray-100">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 shrink-0">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Tìm điểm đến..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm font-medium w-32 md:w-48"
              />
            </div>

            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden md:block">Khu vực:</span>
                <div className="flex gap-1">
                  {REGIONS.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRegion(selectedRegion === r.id ? null : r.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedRegion === r.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-100 hover:border-blue-200'}`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-px h-8 bg-gray-200 hidden md:block" />

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden md:block">Chi phí:</span>
                <div className="flex gap-1">
                  {BUDGETS.map(b => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBudget(selectedBudget === b.id ? null : b.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedBudget === b.id ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-100 hover:border-orange-200'}`}
                    >
                      {b.icon} {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-px h-8 bg-gray-200 hidden md:block" />

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden md:block">Đi cùng:</span>
                <div className="flex gap-1">
                  {AUDIENCES.map(a => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAudience(selectedAudience === a.id ? null : a.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedAudience === a.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-100 hover:border-indigo-200'}`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DESTINATION CARD GRID */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900">Kết quả cho hành trình của bạn</h2>
            <p className="text-gray-500">Tìm thấy {filteredDestinations.length} điểm đến phù hợp</p>
          </div>
          {(selectedVibe || selectedRegion || selectedBudget || selectedAudience || searchTerm) && (
            <button
              onClick={() => {
                setSelectedVibe(null);
                setSelectedRegion(null);
                setSelectedBudget(null);
                setSelectedAudience(null);
                setSearchTerm('');
              }}
              className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              Xóa tất cả bộ lọc
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[450px] bg-gray-100 animate-pulse rounded-[40px]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {filteredDestinations.map((dest) => (
              <motion.div
                key={dest.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -10 }}
                className="group relative bg-white rounded-[40px] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col h-full"
              >
                {/* Card Image */}
                <div className="relative h-72 overflow-hidden shadow-lg">
                  <DestinationImage dest={dest} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Duration Tag */}
                  <div className="absolute top-6 right-6 bg-white dark:bg-slate-900 px-4 py-2 rounded-full text-xs font-black shadow-lg flex items-center gap-2 text-slate-900 dark:text-white border border-gray-100 dark:border-slate-700 transition-colors z-20">
                    <Clock size={14} className="text-blue-600 dark:text-blue-400" />
                    <span>{dest.slug?.includes('phu-quoc') ? '3N2Đ lý tưởng' : '2N1Đ gợi ý'}</span>
                  </div>

                  {/* Badge Type */}
                  <div className="absolute bottom-6 left-6 flex gap-2">
                    <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                      {dest.type || 'Khám phá'}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                      {dest.name}
                    </h3>
                    <div className="flex items-center gap-1 text-gray-400">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      {/* <span className="text-xs font-bold text-gray-900">4.9</span> */}
                    </div>
                  </div>

                  <p className="text-gray-500 mb-6 italic line-clamp-2">
                    “{dest.vibe || dest.comparison || `Thiên đường hòa mình cùng ${dest.name}`}”
                  </p>

                  {/* Audience Tags */}
                  <div className="flex flex-wrap gap-2 mb-8 h-8">
                    {dest.ideal_for_data && Array.isArray(dest.ideal_for_data) && dest.ideal_for_data.length > 0 ? (
                      dest.ideal_for_data.slice(0, 3).map((item, idx) => {
                        const targetId = typeof item === 'string' ? item.toLowerCase() : item.id;
                        const audience = AUDIENCES.find(a => a.id === targetId);

                        return (
                          <div key={idx} className="bg-gray-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl flex items-center gap-2 text-[11px] font-bold text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-slate-700">
                            {targetId === 'family' && <Users size={12} className="text-blue-500" />}
                            {targetId === 'couple' && <Heart size={12} className="text-red-500" />}
                            {targetId === 'friends' && <Smile size={12} className="text-green-500" />}
                            {targetId === 'solo' && <Compass size={12} className="text-orange-500" />}
                            {!['family', 'couple', 'friends', 'solo'].includes(targetId) && <Sparkles size={12} className="text-yellow-500" />}
                            {audience ? audience.label : (typeof item === 'string' ? item : item.label)}
                          </div>
                        );
                      })
                    ) : (
                      <>
                        <div className="bg-gray-50 px-3 py-1.5 rounded-xl flex items-center gap-2 text-[11px] font-bold text-gray-600">
                          <Compass size={12} className="text-blue-500" /> Khám phá
                        </div>
                        <div className="bg-gray-50 px-3 py-1.5 rounded-xl flex items-center gap-2 text-[11px] font-bold text-gray-600">
                          <Target size={12} className="text-purple-500" /> Trải nghiệm
                        </div>
                      </>
                    )}
                  </div>
                  <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-between">
                    {/*   <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Chi phí trung bình</span>
                      <span className="text-lg font-black text-gray-900">3 – 5 triệu</span>
                    </div> */}
                    <Link href={`/destinations/${dest.slug}`} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all text-sm group-hover:px-8 shadow-lg shadow-blue-600/20">
                      Khám phá <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Load More Trigger/Button */}
        <div ref={loadMoreRef} className="mt-20 flex flex-col items-center gap-6">
          {hasMore && !loading && (
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="group relative bg-white text-gray-900 border-2 border-gray-100 px-10 py-4 rounded-2xl font-black shadow-xl hover:shadow-2xl hover:border-blue-600 transition-all duration-300 disabled:opacity-50"
            >
              <span className="flex items-center gap-3">
                {isLoadingMore ? (
                  <>
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent animate-spin rounded-full"></div>
                    Đang tìm thêm...
                  </>
                ) : (
                  <>
                    Xem thêm điểm đến
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          )}
          {!hasMore && destinations.length > 0 && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-1 bg-gray-100 rounded-full" />
              <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Bạn đã khám phá hết tất cả điểm đến</p>
            </div>
          )}
        </div>
      </section>

      {/* 4. HIGHLIGHT SECTION: BEST FOR WHAT */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase">Địa điểm nào cho mục đích gì?</h2>
            <p className="text-gray-400 text-xl font-medium">Chúng tôi đã chọn lọc giúp bạn những tọa độ "đỉnh" nhất</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Nghỉ dưỡng sang', places: 'Phú Quốc, Nha Trang', icon: <TreePalm className="text-blue-400" size={32} /> },
              { title: 'Săn mây', places: 'Đà Lạt, Sapa', icon: <CloudSun className="text-cyan-400" size={32} /> },
              { title: 'Du lịch tâm linh', places: 'Ninh Bình, Yên Tử', icon: <Landmark className="text-amber-400" size={32} /> },
              { title: 'Ăn uống', places: 'Huế, Hội An', icon: <Utensils className="text-orange-400" size={32} /> },
            ].map((item, idx) => (
              <div key={idx} className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-[40px] hover:bg-white/10 transition-all group">
                <div className="mb-6">{item.icon}</div>
                <h3 className="text-xl font-black mb-3">{item.title}</h3>
                <p className="text-gray-400 font-medium">{item.places}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. COMMUNITY GALLERY */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase italic tracking-tighter">Vibe thật từ du khách</h2>
              <p className="text-gray-500 font-medium">Câu chuyện thực tế qua lăng kính người đi</p>
            </div>
            <button className="flex items-center gap-2 font-black text-blue-600 border-b-2 border-blue-600 pb-1">
              Xem tất cả story <Image src="https://flagcdn.com/vn.svg" alt="VN" width={16} height={12} className="rounded-sm" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {galleryReviews.length > 0 ? (
              galleryReviews.slice(0, 10).map((review, i) => (
                <Link
                  href={review.tour?.slug ? `/tours/${review.tour.slug}` : (review.tour?.id ? `/tours/${review.tour.id}` : '/tours')}
                  key={review.id || i}
                  className="relative aspect-[3/4] rounded-3xl overflow-hidden group shadow-lg hover:shadow-2xl transition-all cursor-pointer"
                >
                  <Image
                    src={getImageUrl(review.images[0])}
                    alt={review.tour?.name || "Community"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                  <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    <Star size={10} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-[10px] font-black dark:text-white">{review.rating}</span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs font-black leading-tight line-clamp-1 mb-1">
                      {review.tour?.name}
                    </p>
                    <p className="text-[10px] font-bold leading-tight line-clamp-2 italic opacity-90">
                      “{review.comment || review.title || 'Trải nghiệm tuyệt vời!'}”
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {review.user?.avatar && (
                        <div className="relative w-4 h-4 rounded-full overflow-hidden border border-white/50">
                          <Image src={getImageUrl(review.user.avatar)} alt={review.user.name} fill className="object-cover" />
                        </div>
                      )}
                      <p className="text-[9px] font-medium opacity-70">{review.user?.name}</p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              [
                "https://images.unsplash.com/photo-1596422846543-75c6fc185061?q=80&w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1555400030-1883a48e9a68?q=80&w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1512236322275-06ac4ce35af1?q=80&w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1508913922359-8ca6af829a21?q=80&w=600&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1540202404-a2f29036bb57?q=80&w=600&auto=format&fit=crop"
              ].map((url, i) => (
                <Link
                  href="/tours"
                  key={i}
                  className="relative aspect-[3/4] rounded-3xl overflow-hidden group shadow-lg hover:shadow-2xl transition-all cursor-pointer"
                >
                  <Image src={url} alt="CommunityFallback" fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                  <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs font-bold leading-tight">“Góc này chụp lúc 5h chiều đẹp xỉu luôn mn ơi!”</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>


    </div>
  );
}
