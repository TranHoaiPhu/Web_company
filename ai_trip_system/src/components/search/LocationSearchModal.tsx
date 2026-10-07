'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaMapMarkerAlt, FaSearch, FaSpinner, FaCrosshairs, FaUsers, FaCalendarAlt, FaCheck, FaLocationArrow } from 'react-icons/fa';
import dynamic from 'next/dynamic';

// Leaflet styles
import 'leaflet/dist/leaflet.css';

interface Location {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

// Extended search filters interface
export interface SearchFilters {
  location: Location;
  participants?: number;
  startDate?: string;
  endDate?: string;
  radius?: number;
}

interface LocationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (location: Location, filters?: Omit<SearchFilters, 'location'>) => void;
  initialLocation?: Location | null;
  showFilters?: boolean; // Enable/disable extra filters
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function LocationSearchModal({
  isOpen,
  onClose,
  onSelectLocation,
  initialLocation,
  showFilters = true
}: LocationSearchModalProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null); // Leaflet Map instance
  const markerRef = useRef<any>(null); // Leaflet Marker instance
  const circleRef = useRef<any>(null); // Leaflet Circle instance

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation || null);
  const [searchInput, setSearchInput] = useState(initialLocation?.address || '');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const debouncedSearchQuery = useDebounce(searchInput, 500);

  // New filter states
  const [participants, setParticipants] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [radius, setRadius] = useState<number>(50);

  // Initialize Map
  useEffect(() => {
    if (!isOpen || typeof window === "undefined" || !mapRef.current) return;

    let L: any;
    const initMap = async () => {
      L = await import('leaflet');

      if (mapInstanceRef.current) return;

      // Fix default icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });

      const center: [number, number] = initialLocation?.lat && initialLocation?.lng
        ? [initialLocation.lat, initialLocation.lng]
        : [16.0544, 108.2022]; // Da Nang center

      const map = L.map(mapRef.current!, {
        center: center,
        zoom: initialLocation ? 14 : 6,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      mapInstanceRef.current = map;

      // If initial location exists, add marker
      if (initialLocation?.lat && initialLocation?.lng) {
        markerRef.current = L.marker([initialLocation.lat, initialLocation.lng]).addTo(map);
        updateCircle(initialLocation.lat, initialLocation.lng, radius, L);
      }

      // Click event to pick location
      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng;
        handleLocationPicked(lat, lng, L);
      });
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
      }
    };
  }, [isOpen]);

  // Update circle when radius changes
  useEffect(() => {
    if (selectedLocation && mapInstanceRef.current) {
      import('leaflet').then((L) => {
        updateCircle(selectedLocation.lat, selectedLocation.lng, radius, L);
      });
    }
  }, [radius]);

  const updateCircle = (lat: number, lng: number, radiusKm: number, L: any) => {
    if (!mapInstanceRef.current) return;

    if (circleRef.current) {
      circleRef.current.setLatLng([lat, lng]);
      circleRef.current.setRadius(radiusKm * 1000);
    } else {
      circleRef.current = L.circle([lat, lng], {
        radius: radiusKm * 1000,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
      }).addTo(mapInstanceRef.current);
    }
  };

  const handleLocationPicked = async (lat: number, lng: number, L: any) => {
    if (!mapInstanceRef.current) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current);
    }

    updateCircle(lat, lng, radius, L);
    mapInstanceRef.current.setView([lat, lng], 14);

    setIsLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      if (data && data.display_name) {
        const name = data.address.suburb || data.address.town || data.address.city || data.display_name.split(',')[0];
        setSelectedLocation({
          lat,
          lng,
          address: data.display_name,
          name: name
        });
        setSearchInput(data.display_name);
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Search logic
  useEffect(() => {
    const searchLocation = async () => {
      if (!debouncedSearchQuery.trim() || debouncedSearchQuery.length < 2 || isSearching) {
        if (!debouncedSearchQuery.trim()) setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedSearchQuery)}&countrycodes=vn&limit=5`);
        const data = await res.json();
        setSearchResults(data);
        setShowSearchResults(data.length > 0);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    searchLocation();
  }, [debouncedSearchQuery]);

  const handleSelectSearchResult = (res: any) => {
    const lat = parseFloat(res.lat);
    const lng = parseFloat(res.lon);

    import('leaflet').then((L) => {
      handleLocationPicked(lat, lng, L);
    });

    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Get current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        import('leaflet').then((L) => {
          handleLocationPicked(latitude, longitude, L);
        });
      },
      (err) => {
        console.error(err);
        setIsLoading(false);
      }
    );
  };

  // Confirm selection
  const handleConfirm = useCallback(() => {
    if (selectedLocation) {
      const filters: Omit<SearchFilters, 'location'> = {
        radius,
      };

      if (participants > 0) filters.participants = participants;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      onSelectLocation(selectedLocation, filters);
      onClose();
    }
  }, [selectedLocation, participants, startDate, endDate, radius, onSelectLocation, onClose]);

  // Clear selection
  const clearSelection = useCallback(() => {
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }
    setSelectedLocation(null);
    setSearchInput('');
    setSearchResults([]);
  }, []);

  // Get today's date for min date restriction
  const today = new Date().toISOString().split('T')[0];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex-shrink-0">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaMapMarkerAlt />
              Tìm kiếm địa điểm du lịch
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Search Box */}
            <div className="relative z-[1001]">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    if (e.target.value.length >= 2) setShowSearchResults(true);
                  }}
                  onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                  placeholder="Nhập tên địa điểm hoặc địa chỉ..."
                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:outline-none text-gray-800 bg-gray-50/50"
                />
                {isSearching && (
                  <FaSpinner className="absolute right-12 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
                )}
                {searchInput && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes size={16} />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[1002]">
                  {searchResults.map((res: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 transition-colors"
                      onClick={() => handleSelectSearchResult(res)}
                    >
                      <div className="flex items-start gap-3">
                        <FaMapMarkerAlt className="text-red-500 mt-1 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 text-sm truncate">{res.display_name.split(',')[0]}</div>
                          <div className="text-gray-500 text-xs truncate">{res.display_name}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleGetCurrentLocation}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition flex items-center gap-2 disabled:opacity-50"
              >
                <FaLocationArrow />
                Vị trí của tôi
              </button>
            </div>

            {/* Filters Section */}
            {showFilters && (
              <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl p-4 border border-blue-100/50">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Bộ lọc nâng cao
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Participants */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1.5 block flex items-center gap-1">
                      <FaUsers className="text-purple-500" />
                      Số người
                    </label>
                    <select
                      value={participants}
                      onChange={(e) => setParticipants(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
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

                  {/* Start Date */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1.5 block flex items-center gap-1">
                      <FaCalendarAlt className="text-blue-500" />
                      Từ ngày
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={today}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1.5 block flex items-center gap-1">
                      <FaCalendarAlt className="text-blue-500" />
                      Đến ngày
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || today}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  {/* Radius */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1.5 block flex items-center gap-1">
                      <FaMapMarkerAlt className="text-red-500" />
                      Bán kính (km)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="5"
                        max="200"
                        step="5"
                        value={radius}
                        onChange={(e) => setRadius(Number(e.target.value))}
                        className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <span className="text-sm font-semibold text-blue-600 w-12 text-right">{radius}km</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Map Container */}
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 h-[300px] md:h-[350px] shadow-inner bg-gray-50">
              <div ref={mapRef} className="w-full h-full z-0" />

              {/* Overlay for loading */}
              {isLoading && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
                    <FaSpinner className="animate-spin text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Đang xử lý...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Selected Location Details */}
            {selectedLocation && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <FaMapMarkerAlt className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-blue-900 text-sm">{selectedLocation.name || 'Địa điểm được chọn'}</p>
                  <p className="text-xs text-blue-700 line-clamp-2 mt-0.5">{selectedLocation.address}</p>
                  <p className="text-[10px] text-blue-400 mt-1 font-mono">{selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
                </div>
                <button
                  onClick={clearSelection}
                  className="p-2 hover:bg-blue-100 rounded-lg transition text-blue-400 hover:text-blue-600"
                >
                  <FaTimes size={16} />
                </button>
              </div>
            )}

            {!selectedLocation && (
              <div className="text-center py-2">
                <p className="text-xs text-gray-500 italic">
                  💡 Bạn có thể click trực tiếp trên bản đồ để chọn vị trí
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedLocation || isLoading}
              className="flex-[2] px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FaCheck />
              Xác nhận và Tìm tour
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const DynamicModal = dynamic(() => Promise.resolve(LocationSearchModal), {
  ssr: false
});

export default DynamicModal;

