"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete, Circle } from '@react-google-maps/api';
import { MapPin, Search, Loader2, X, AlertCircle, Navigation, Check, Star } from 'lucide-react';

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

interface PlaceMapPickerProps {
    onPlaceSelect: (place: PlaceData) => void;
    initialPlace?: PlaceData;
    parentLocation?: {
        id: number;
        latitude: number;
        longitude: number;
        name: string;
    };
    maxDistanceKm?: number;
    height?: string;
}

const containerStyle = {
    width: '100%',
    height: '100%'
};

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

export default function PlaceMapPicker({
    onPlaceSelect,
    initialPlace,
    parentLocation,
    maxDistanceKm = 100,
    height = '500px'
}: PlaceMapPickerProps) {
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
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [distanceError, setDistanceError] = useState<string | null>(null);

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
            setDistanceError(`Địa điểm quá xa (${distance}km). Vui lòng chọn trong phạm vi ${maxDistanceKm}km tính từ ${parentLocation?.name}.`);
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
                const poi = result.address_components.find(c => c.types.includes('point_of_interest') || c.types.includes('establishment'));
                const name = poi ? poi.long_name : result.address_components[0].long_name;

                setPlaceName(name);
                setPlaceAddress(addr);
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
                setPlaceName(place.name || '');
                setPlaceAddress(place.formatted_address || '');
            }
        }
    };

    const handleConfirm = () => {
        if (!markerPos) return;
        onPlaceSelect({
            latitude: markerPos.lat,
            longitude: markerPos.lng,
            name: placeName,
            address: placeAddress
        });
    };

    if (loadError) return <div className="p-4 text-red-500">Lỗi tải Google Maps: {loadError.message}</div>;
    if (!isLoaded) return (
        <div className="w-full bg-slate-50 flex flex-col items-center justify-center p-20">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="font-bold text-slate-400 font-sans tracking-widest uppercase">Initializing Itinerary Google Maps...</p>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 relative font-sans">
            {/* Header / Search Overlay */}
            <div className="absolute top-4 left-4 right-4 z-10 space-y-3">
                {parentLocation && (
                    <div className="bg-indigo-600/90 backdrop-blur-md rounded-2xl px-4 py-2 flex items-center gap-3 shadow-xl border border-indigo-400/30">
                        <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                        <p className="text-xs font-black text-white uppercase tracking-widest">
                            Tham quan quanh {parentLocation.name} ({maxDistanceKm}km)
                        </p>
                    </div>
                )}

                <div className="flex gap-2">
                    <Autocomplete
                        onLoad={setAutocomplete}
                        onPlaceChanged={onPlaceChanged}
                        className="flex-1"
                    >
                        <div className="relative group overflow-hidden rounded-2xl shadow-2xl border border-white/40 ring-1 ring-slate-900/5 bg-white/90 backdrop-blur-xl">
                            <div className="flex items-center px-4 py-3">
                                <Search className="h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm điểm tham quan, nhà hàng, khách sạn..."
                                    className="bg-transparent border-none focus:ring-0 w-full px-3 text-slate-800 placeholder-slate-400 font-medium"
                                />
                            </div>
                        </div>
                    </Autocomplete>
                </div>

                {distanceError && (
                    <div className="bg-rose-500/90 backdrop-blur-md border border-rose-400/30 rounded-2xl p-4 flex items-start gap-3 shadow-2xl animate-in slide-in-from-top-4">
                        <AlertCircle className="w-5 h-5 text-white shrink-0" />
                        <p className="text-sm text-white font-bold">{distanceError}</p>
                    </div>
                )}
            </div>

            {/* Map */}
            <div className="relative flex-1 rounded-3xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100" style={{ minHeight: height }}>
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={markerPos || (parentLocation ? { lat: parentLocation.latitude, lng: parentLocation.longitude } : { lat: 16.0544, lng: 108.2022 })}
                    zoom={markerPos ? 17 : (parentLocation ? 13 : 6)}
                    onLoad={setMap}
                    onClick={(e) => e.latLng && updateLocation(e.latLng.lat(), e.latLng.lng())}
                    options={{
                        disableDefaultUI: false,
                        zoomControl: true,
                        streetViewControl: false,
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
                                fillOpacity: 0.1,
                                strokeColor: "#6366f1",
                                strokeOpacity: 0.3,
                                strokeWeight: 2,
                            }}
                        />
                    )}

                    {markerPos && <Marker position={markerPos} />}
                </GoogleMap>

                {isLoading && (
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] z-20 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                    </div>
                )}
            </div>

            {/* Selection Info Card */}
            {markerPos && !isLoading && !distanceError && (
                <div className="absolute bottom-6 left-6 right-6 z-10 animate-in slide-in-from-bottom-6 fade-in duration-500">
                    <div className="bg-white/90 backdrop-blur-2xl rounded-[32px] p-6 shadow-2xl border border-white">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 bg-emerald-500 rounded-3xl shrink-0 flex items-center justify-center shadow-lg shadow-emerald-200">
                                <MapPin className="h-8 w-8 text-white" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <h4 className="text-xl font-black text-slate-800 truncate leading-tight">
                                    {placeName || 'Điểm tham quan'}
                                </h4>
                                <p className="text-sm font-medium text-slate-500 line-clamp-1 mt-1">
                                    {placeAddress}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setMarkerPos(null); setPlaceName(''); }}
                                    className="p-3 bg-slate-100 hover:bg-rose-50 text-slate-500 rounded-2xl transition-all"
                                >
                                    <X size={20} />
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all font-black shadow-lg shadow-blue-200 flex items-center gap-2"
                                >
                                    <Check size={20} strokeWidth={3} />
                                    <span>THÊM</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
