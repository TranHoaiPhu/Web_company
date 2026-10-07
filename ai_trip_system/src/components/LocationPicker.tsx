"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { FaSearch, FaMapMarkerAlt, FaLocationArrow, FaCheck, FaTimes, FaSpinner } from "react-icons/fa";

interface Location {
    lat: number;
    lon: number;
    display_name: string;
}

interface LocationPickerProps {
    initialAddress?: string;
    onSelect: (address: string) => void;
    onClose: () => void;
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

const LeafletPicker = ({ initialAddress, onSelect, onClose }: LocationPickerProps) => {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
    const markerRef = useRef<import("leaflet").Marker | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Location[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(initialAddress || "");
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Debounced search query
    const debouncedSearchQuery = useDebounce(searchQuery, 400);

    // Initialize Map
    useEffect(() => {
        if (typeof window === "undefined" || !mapRef.current) return;

        import("leaflet").then((L) => {
            if (mapInstanceRef.current) return;

            // Fix default icons
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
                iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
                shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            });

            const map = L.map(mapRef.current!, {
                center: [16.047079, 108.206230], // Default center (Da Nang)
                zoom: 6,
            });

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            }).addTo(map);

            mapInstanceRef.current = map;

            // Click event to pick location
            map.on("click", async (e) => {
                const { lat, lng } = e.latlng;
                updateMarker(lat, lng, L);

                // Reverse geocoding
                setIsLoading(true);
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                    const data = await res.json();
                    if (data && data.display_name) {
                        setSelectedAddress(data.display_name);
                    }
                } catch (error) {
                    console.error("Reverse geocoding error:", error);
                } finally {
                    setIsLoading(false);
                }
            });
        });

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    const updateMarker = (lat: number, lng: number, L: any) => {
        if (!mapInstanceRef.current) return;

        if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
        } else {
            markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current);
        }

        mapInstanceRef.current.setView([lat, lng], 16);
    };

    // Realtime search effect
    useEffect(() => {
        const searchLocation = async () => {
            if (!debouncedSearchQuery.trim() || debouncedSearchQuery.length < 2) {
                setSearchResults([]);
                setShowResults(false);
                return;
            }

            setIsSearching(true);
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedSearchQuery)}&countrycodes=vn&limit=5`);
                const data = await res.json();
                setSearchResults(data);
                setShowResults(data.length > 0);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setIsSearching(false);
            }
        };

        searchLocation();
    }, [debouncedSearchQuery]);

    const handleSelectResult = useCallback((loc: Location) => {
        if (!mapInstanceRef.current) return;

        import("leaflet").then((L) => {
            const lat = parseFloat(String(loc.lat));
            const lon = parseFloat(String(loc.lon));

            updateMarker(lat, lon, L);
            setSelectedAddress(loc.display_name);
            setSearchResults([]);
            setShowResults(false);
            setSearchQuery("");
        });
    }, []);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Trình duyệt không hỗ trợ định vị!");
            return;
        }

        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                if (mapInstanceRef.current) {
                    import("leaflet").then((L) => {
                        updateMarker(latitude, longitude, L);
                    });

                    // Get address
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
                        const data = await res.json();
                        if (data && data.display_name) {
                            setSelectedAddress(data.display_name);
                        }
                    } catch (err) {
                        console.error(err);
                    } finally {
                        setIsLoading(false);
                    }
                }
            },
            (err) => {
                console.error(err);
                setIsLoading(false);
                alert("Không thể lấy vị trí hiện tại.");
            }
        );
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FaMapMarkerAlt size={20} />
                        <h3 className="font-bold text-lg">Chọn địa chỉ trên bản đồ</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <FaTimes size={18} />
                    </button>
                </div>

                {/* Search Bar - OUTSIDE MAP */}
                <div className="p-4 bg-gray-50 border-b">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <input
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm"
                                placeholder="Tìm kiếm địa điểm... (nhập ít nhất 2 ký tự)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                            />
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            {isSearching && (
                                <FaSpinner className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
                            )}

                            {/* Search Results Dropdown */}
                            {showResults && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden max-h-64 overflow-y-auto z-50">
                                    {searchResults.map((res, idx) => (
                                        <div
                                            key={idx}
                                            className="p-3.5 hover:bg-blue-50 cursor-pointer border-b last:border-0 transition-colors"
                                            onClick={() => handleSelectResult(res)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <FaMapMarkerAlt className="text-red-500 mt-1 shrink-0" />
                                                <div>
                                                    <div className="font-medium text-gray-900 text-sm">{res.display_name.split(',')[0]}</div>
                                                    <div className="text-gray-500 text-xs mt-0.5 line-clamp-2">{res.display_name}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleGetCurrentLocation}
                            disabled={isLoading}
                            className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
                            title="Vị trí của tôi"
                        >
                            {isLoading ? <FaSpinner className="animate-spin" /> : <FaLocationArrow />}
                            <span className="hidden sm:inline">Vị trí của tôi</span>
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        💡 Gợi ý: Bạn có thể click trực tiếp trên bản đồ để chọn vị trí hoặc tìm kiếm theo tên địa điểm
                    </p>
                </div>

                {/* Map Container */}
                <div className="flex-1 relative">
                    <div ref={mapRef} className="w-full h-full bg-gray-100" />

                    {/* Loading overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                            <div className="bg-white p-4 rounded-xl shadow-lg flex items-center gap-3">
                                <FaSpinner className="animate-spin text-blue-500" />
                                <span className="text-gray-700">Đang tải...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer - Selected Address & Actions */}
                <div className="p-4 border-t bg-white">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                                <FaMapMarkerAlt className="text-red-500" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-gray-500 mb-1">Địa chỉ đã chọn:</p>
                                <p className="font-medium text-gray-900 truncate">
                                    {selectedAddress || "Chưa chọn địa điểm - Click trên bản đồ hoặc tìm kiếm"}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto shrink-0">
                            <button
                                onClick={onClose}
                                className="flex-1 sm:flex-initial px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => onSelect(selectedAddress)}
                                disabled={!selectedAddress || isLoading}
                                className="flex-1 sm:flex-initial px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors"
                            >
                                <FaCheck />
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Wrapper for Dynamic Import
import dynamic from 'next/dynamic';

const DynamicPicker = dynamic(() => Promise.resolve(LeafletPicker), {
    ssr: false,
    loading: () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-xl shadow-xl flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Đang tải bản đồ...</p>
            </div>
        </div>
    )
});

export default DynamicPicker;
