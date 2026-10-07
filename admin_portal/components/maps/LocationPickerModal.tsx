"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import {
    X,
    MapPin,
    Search,
    Loader2,
    Navigation,
    Check,
    LocateFixed,
    Info,
    Map as MapIcon,
    Crosshair
} from 'lucide-react';

export interface LocationData {
    latitude: number;
    longitude: number;
    name: string;
    address: string;
    placeId?: string;
    photos?: string[];
}

interface LocationPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectLocation: (location: LocationData) => void;
    initialLocation?: LocationData | null;
    title?: string;
}

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

export default function LocationPickerModal({
    isOpen,
    onClose,
    onSelectLocation,
    initialLocation,
    title = "Chọn địa điểm du lịch"
}: LocationPickerModalProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [markerPos, setMarkerPos] = useState<google.maps.LatLngLiteral | null>(
        initialLocation ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : null
    );
    const [locationName, setLocationName] = useState(initialLocation?.name || '');
    const [locationAddress, setLocationAddress] = useState(initialLocation?.address || '');
    const [placeId, setPlaceId] = useState(initialLocation?.placeId || '');
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchInput, setSearchInput] = useState(initialLocation?.name || '');

    // Reset state when modal opens with new initialLocation
    useEffect(() => {
        if (isOpen && initialLocation) {
            setMarkerPos({ lat: initialLocation.latitude, lng: initialLocation.longitude });
            setLocationName(initialLocation.name);
            setLocationAddress(initialLocation.address);
            setPlaceId(initialLocation.placeId || '');
            setSearchInput(initialLocation.name);
        } else if (isOpen) {
            // Default position (Da Nang) if no initial location
            // setMarkerPos({ lat: 16.0544, lng: 108.2022 });
        }
    }, [isOpen, initialLocation]);

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    const updateLocation = async (lat: number, lng: number) => {
        setMarkerPos({ lat, lng });
        setIsLoading(true);

        try {
            const geocoder = new google.maps.Geocoder();
            const response = await geocoder.geocode({ location: { lat, lng } });

            if (response.results[0]) {
                const result = response.results[0];
                const addr = result.formatted_address;

                // Find a good name
                const poi = result.address_components.find(c =>
                    c.types.includes('point_of_interest') ||
                    c.types.includes('establishment') ||
                    c.types.includes('natural_feature')
                );
                const name = poi ? poi.long_name : result.address_components[0].long_name;

                setLocationName(name);
                setLocationAddress(addr);
                setPlaceId(result.place_id);
                setSearchInput(name);
            }
        } catch (error) {
            console.error("Geocoding error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            updateLocation(e.latLng.lat(), e.latLng.lng());
        }
    }, [map]);

    const onPlaceChanged = () => {
        if (autocomplete) {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();

                if (map) {
                    map.panTo({ lat, lng });
                    map.setZoom(17);
                }

                setMarkerPos({ lat, lng });
                const name = place.name || '';
                const addr = place.formatted_address || '';
                setLocationName(name);
                setLocationAddress(addr);
                setPlaceId(place.place_id || '');
                setSearchInput(name);
            }
        }
    };

    const goToCurrentLocation = () => {
        if (!navigator.geolocation) return alert("Trình duyệt không hỗ trợ định vị.");
        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                if (map) {
                    map.panTo({ lat: latitude, lng: longitude });
                    map.setZoom(17);
                }
                updateLocation(latitude, longitude);
            },
            () => {
                setIsLoading(false);
                alert("Không thể lấy vị trí hiện tại.");
            }
        );
    };

    const handleConfirm = () => {
        if (!markerPos) return;
        onSelectLocation({
            latitude: markerPos.lat,
            longitude: markerPos.lng,
            name: locationName,
            address: locationAddress,
            placeId: placeId
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4"
                onClick={(e: React.MouseEvent) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden ring-1 ring-white/20"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <MapIcon className="h-6 w-6" />
                            </div>
                            <h2 className="text-xl font-bold tracking-tight">
                                {title}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Search & Actions Row */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                {isLoaded ? (
                                    <Autocomplete
                                        onLoad={setAutocomplete}
                                        onPlaceChanged={onPlaceChanged}
                                    >
                                        <div className="relative group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                            <input
                                                type="text"
                                                value={searchInput}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
                                                placeholder="Tìm kiếm địa điểm hoặc địa chỉ..."
                                                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:outline-none text-gray-800 bg-gray-50/50 transition-all font-medium"
                                            />
                                        </div>
                                    </Autocomplete>
                                ) : (
                                    <div className="w-full h-14 bg-gray-100 animate-pulse rounded-2xl" />
                                )}
                            </div>
                            <button
                                onClick={goToCurrentLocation}
                                disabled={isLoading}
                                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-50 text-indigo-700 rounded-2xl font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50 border-2 border-indigo-100"
                            >
                                <Crosshair className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                                <span>Vị trí của tôi</span>
                            </button>
                        </div>

                        {/* Map View */}
                        <div className="relative rounded-3xl overflow-hidden border-2 border-gray-100 h-[350px] md:h-[450px] shadow-sm bg-gray-50">
                            {isLoaded ? (
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                    center={markerPos || { lat: 16.0544, lng: 108.2022 }}
                                    zoom={markerPos ? 16 : 6}
                                    onLoad={onLoad}
                                    onUnmount={onUnmount}
                                    onClick={handleMapClick}
                                    options={{
                                        disableDefaultUI: false,
                                        zoomControl: true,
                                        mapTypeControl: false,
                                        streetViewControl: false,
                                        fullscreenControl: false,
                                        styles: [
                                            {
                                                "featureType": "poi",
                                                "elementType": "labels",
                                                "stylers": [{ "visibility": "off" }]
                                            }
                                        ]
                                    }}
                                >
                                    {markerPos && <Marker position={markerPos} animation={google.maps.Animation.DROP} />}
                                </GoogleMap>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                                    <p className="font-bold text-gray-400">Đang tải bản đồ...</p>
                                </div>
                            )}

                            {isLoading && (
                                <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] flex items-center justify-center z-10">
                                    <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white flex items-center gap-3">
                                        <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
                                        <span className="text-sm font-bold text-gray-700">Đang tìm tọa độ...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Selected Location Details */}
                        {markerPos ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100 rounded-3xl p-5 flex items-start gap-4 shadow-sm"
                            >
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                                    <MapPin className="text-white h-6 w-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">ĐỊA ĐIỂM ĐÃ CHỌN</span>
                                    </div>
                                    <h4 className="font-black text-gray-900 text-lg leading-tight truncate">{locationName || "Chưa có tên"}</h4>
                                    <p className="text-sm font-medium text-gray-600 line-clamp-2 mt-1">{locationAddress}</p>
                                    <div className="mt-2 text-[10px] font-mono font-bold text-indigo-400 bg-white/50 inline-block px-2 py-1 rounded-md">
                                        {markerPos.lat.toFixed(6)}, {markerPos.lng.toFixed(6)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setMarkerPos(null);
                                        setSearchInput('');
                                        setLocationName('');
                                        setLocationAddress('');
                                    }}
                                    className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-rose-500"
                                >
                                    <X size={20} />
                                </button>
                            </motion.div>
                        ) : (
                            <div className="flex items-center justify-center py-8 px-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 italic text-sm">
                                <Info className="h-5 w-5 mr-3 shrink-0" />
                                <p>Bạn hãy click trực tiếp trên bản đồ hoặc tìm kiếm để chọn vị trí</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t bg-gray-50 flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-100 transition-all active:scale-95"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!markerPos || isLoading}
                            className="flex-[2] px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-lg hover:shadow-xl hover:shadow-indigo-200 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
                        >
                            <Check className="h-6 w-6 stroke-[3]" />
                            XÁC NHẬN VỊ TRÍ
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
