"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete, Circle } from '@react-google-maps/api';
import {
    X,
    MapPin,
    Search,
    Loader2,
    Check,
    AlertCircle,
    Info,
    Map as MapIcon,
    Star
} from 'lucide-react';

export interface PlaceData {
    id?: number;
    locationId?: number;
    latitude: number;
    longitude: number;
    name: string;
    address: string;
    placeId?: string;
    photos?: string[];
    type?: string;
}

interface PlacePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPlaceSelect: (place: PlaceData) => void;
    initialPlace?: PlaceData | null;
    parentLocation?: {
        id: number;
        latitude: number;
        longitude: number;
        name: string;
    };
    maxDistanceKm?: number;
    title?: string;
}

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

export default function PlacePickerModal({
    isOpen,
    onClose,
    onPlaceSelect,
    initialPlace,
    parentLocation,
    maxDistanceKm = 100,
    title = "Chọn điểm tham quan"
}: PlacePickerModalProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [markerPos, setMarkerPos] = useState<google.maps.LatLngLiteral | null>(
        initialPlace?.latitude && initialPlace?.longitude ? { lat: initialPlace.latitude, lng: initialPlace.longitude } : null
    );
    const [placeName, setPlaceName] = useState(initialPlace?.name || '');
    const [placeAddress, setPlaceAddress] = useState(initialPlace?.address || '');
    const [placeId, setPlaceId] = useState(initialPlace?.placeId || '');
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [distanceError, setDistanceError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState(initialPlace?.name || '');

    useEffect(() => {
        if (isOpen && initialPlace) {
            setMarkerPos({ lat: initialPlace.latitude, lng: initialPlace.longitude });
            setPlaceName(initialPlace.name);
            setPlaceAddress(initialPlace.address);
            setPlaceId(initialPlace.placeId || '');
            setSearchInput(initialPlace.name);
            setDistanceError(null);
        }
    }, [isOpen, initialPlace]);

    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        if (typeof google === 'undefined') return 0;
        const p1 = new google.maps.LatLng(lat1, lng1);
        const p2 = new google.maps.LatLng(lat2, lng2);
        return google.maps.geometry.spherical.computeDistanceBetween(p1, p2) / 1000;
    };

    const validateDistance = (lat: number, lng: number): { valid: boolean; distance: number } => {
        if (!parentLocation) return { valid: true, distance: 0 };
        const distance = calculateDistance(parentLocation.latitude, parentLocation.longitude, lat, lng);
        return { valid: distance <= maxDistanceKm, distance: Math.round(distance * 10) / 10 };
    };

    const updateLocation = async (lat: number, lng: number) => {
        const { valid, distance } = validateDistance(lat, lng);
        if (!valid) {
            setDistanceError(`Địa điểm quá xa (${distance}km). Vui lòng chọn trong phạm vi ${maxDistanceKm}km từ ${parentLocation?.name}.`);
            return;
        }

        setDistanceError(null);
        setMarkerPos({ lat, lng });
        setIsLoading(true);

        try {
            const geocoder = new google.maps.Geocoder();
            const response = await geocoder.geocode({ location: { lat, lng } });

            if (response.results[0]) {
                const result = response.results[0];
                const addr = result.formatted_address;
                const poi = result.address_components.find(c =>
                    c.types.includes('point_of_interest') ||
                    c.types.includes('establishment')
                );
                const name = poi ? poi.long_name : result.address_components[0].long_name;

                setPlaceName(name);
                setPlaceAddress(addr);
                setPlaceId(result.place_id);
                setSearchInput(name);
            }
        } catch (error) {
            console.error("Geocoding error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const onPlaceChanged = () => {
        if (autocomplete) {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();

                const { valid, distance } = validateDistance(lat, lng);
                if (!valid) {
                    setDistanceError(`Địa điểm "${place.name}" quá xa (${distance}km).`);
                    return;
                }

                if (map) {
                    map.panTo({ lat, lng });
                    map.setZoom(17);
                }

                setDistanceError(null);
                setMarkerPos({ lat, lng });
                const name = place.name || '';
                const addr = place.formatted_address || '';
                setPlaceName(name);
                setPlaceAddress(addr);
                setPlaceId(place.place_id || '');
                setSearchInput(name);
            }
        }
    };

    const handleConfirm = () => {
        if (!markerPos) return;
        onPlaceSelect({
            latitude: markerPos.lat,
            longitude: markerPos.lng,
            name: placeName,
            address: placeAddress,
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
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden ring-1 ring-white/20"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <MapPin className="h-6 w-6" />
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
                        {/* Status Bar */}
                        {parentLocation && (
                            <div className="bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-600 rounded-lg text-white">
                                        <Star className="h-4 w-4 fill-current" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">TRUNG TÂM PHẠM VI</p>
                                        <p className="font-bold text-indigo-900 text-sm leading-none">{parentLocation.name}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">BÁN KÍNH CHO PHÉP</p>
                                    <p className="font-bold text-indigo-900 text-sm leading-none">{maxDistanceKm} km</p>
                                </div>
                            </div>
                        )}

                        {/* Search Bar */}
                        <div className="relative">
                            {isLoaded ? (
                                <Autocomplete
                                    onLoad={setAutocomplete}
                                    onPlaceChanged={onPlaceChanged}
                                >
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input
                                            type="text"
                                            value={searchInput}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
                                            placeholder="Tìm điểm tham quan, địa chỉ cụ thể..."
                                            className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 rounded-2xl focus:border-emerald-500 focus:outline-none text-gray-800 bg-gray-50/50 transition-all font-medium"
                                        />
                                    </div>
                                </Autocomplete>
                            ) : (
                                <div className="w-full h-14 bg-gray-100 animate-pulse rounded-2xl" />
                            )}
                        </div>

                        {/* Alerts */}
                        {distanceError && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-rose-50 border-2 border-rose-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm text-rose-700 font-bold"
                            >
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p className="text-sm">{distanceError}</p>
                            </motion.div>
                        )}

                        {/* Map */}
                        <div className="relative rounded-3xl overflow-hidden border-2 border-gray-100 h-[400px] md:h-[500px] shadow-sm bg-gray-50">
                            {isLoaded ? (
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                    center={markerPos || (parentLocation ? { lat: parentLocation.latitude, lng: parentLocation.longitude } : { lat: 16.0544, lng: 108.2022 })}
                                    zoom={markerPos ? 17 : (parentLocation ? 13 : 6)}
                                    onLoad={setMap}
                                    onClick={(e) => e.latLng && updateLocation(e.latLng.lat(), e.latLng.lng())}
                                    options={{
                                        disableDefaultUI: false,
                                        zoomControl: true,
                                        mapTypeControl: false,
                                        styles: [
                                            {
                                                "featureType": "poi",
                                                "stylers": [{ "visibility": "simplified" }]
                                            }
                                        ]
                                    }}
                                >
                                    {parentLocation && (
                                        <Circle
                                            center={{ lat: parentLocation.latitude, lng: parentLocation.longitude }}
                                            radius={maxDistanceKm * 1000}
                                            options={{
                                                fillColor: "#6366f1",
                                                fillOpacity: 0.05,
                                                strokeColor: "#6366f1",
                                                strokeOpacity: 0.3,
                                                strokeWeight: 2,
                                                clickable: false
                                            }}
                                        />
                                    )}
                                    {markerPos && <Marker position={markerPos} />}
                                </GoogleMap>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                                    <p className="font-bold text-gray-400">Đang tải bản đồ...</p>
                                </div>
                            )}

                            {isLoading && (
                                <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] flex items-center justify-center z-10">
                                    <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white flex items-center gap-3">
                                        <Loader2 className="h-5 w-5 text-emerald-600 animate-spin" />
                                        <span className="text-sm font-bold text-gray-700">Đang tìm tọa độ...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Selection Card */}
                        {markerPos && !isLoading && !distanceError ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-100 rounded-3xl p-5 flex items-start gap-4 shadow-sm"
                            >
                                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                                    <MapPin className="text-white h-6 w-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">ĐIỂM THAM QUAN ĐÃ CHỌN</span>
                                    </div>
                                    <h4 className="font-black text-gray-900 text-lg leading-tight truncate">{placeName || "Chưa có tên"}</h4>
                                    <p className="text-sm font-medium text-gray-600 line-clamp-2 mt-1">{placeAddress}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setMarkerPos(null);
                                        setSearchInput('');
                                        setPlaceName('');
                                    }}
                                    className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-rose-500"
                                >
                                    <X size={20} />
                                </button>
                            </motion.div>
                        ) : (
                            <div className="flex items-center justify-center py-6 px-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 italic text-sm">
                                <Info className="h-5 w-5 mr-3 shrink-0" />
                                <p>Bạn hãy click trực tiếp trên bản đồ hoặc tìm kiếm để chọn điểm tham quan</p>
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
                            disabled={!markerPos || isLoading || !!distanceError}
                            className="flex-[2] px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black text-lg hover:shadow-xl hover:shadow-emerald-200 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
                        >
                            <Check className="h-6 w-6 stroke-[3]" />
                            THÊM ĐỊA ĐIỂM NÀY
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
