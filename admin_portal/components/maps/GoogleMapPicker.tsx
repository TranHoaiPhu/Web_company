"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { MapPin, Search, Loader2, X, Navigation, Check, LocateFixed } from 'lucide-react';

export interface LocationData {
    latitude: number;
    longitude: number;
    name: string;
    address: string;
    placeId?: string;
    photos?: string[];
}

interface GoogleMapPickerProps {
    onLocationSelect: (location: LocationData) => void;
    initialLocation?: LocationData;
    height?: string;
    showConfirmButton?: boolean;
}

const containerStyle = {
    width: '100%',
    height: '100%'
};

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

export default function GoogleMapPicker({
    onLocationSelect,
    initialLocation,
    height = '500px',
    showConfirmButton = false
}: GoogleMapPickerProps) {
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
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            updateLocation(lat, lng);
        }
    }, [map]);

    const updateLocation = async (lat: number, lng: number) => {
        setMarkerPos({ lat, lng });
        setIsLoading(true);

        try {
            const geocoder = new google.maps.Geocoder();
            const response = await geocoder.geocode({ location: { lat, lng } });

            if (response.results[0]) {
                const result = response.results[0];
                const addr = result.formatted_address;

                // Try to find a good name (e.g. point of interest)
                const poi = result.address_components.find(c => c.types.includes('point_of_interest') || c.types.includes('establishment'));
                const name = poi ? poi.long_name : result.address_components[0].long_name;

                setLocationName(name);
                setLocationAddress(addr);

                if (!showConfirmButton) {
                    onLocationSelect({
                        latitude: lat,
                        longitude: lng,
                        name: name,
                        address: addr,
                        placeId: result.place_id
                    });
                }
            }
        } catch (error) {
            console.error("Geocoding error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const onAutocompleteLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
        setAutocomplete(autocompleteInstance);
    };

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
                setLocationName(place.name || '');
                setLocationAddress(place.formatted_address || '');

                if (!showConfirmButton) {
                    onLocationSelect({
                        latitude: lat,
                        longitude: lng,
                        name: place.name || '',
                        address: place.formatted_address || '',
                        placeId: place.place_id
                    });
                }
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
        onLocationSelect({
            latitude: markerPos.lat,
            longitude: markerPos.lng,
            name: locationName,
            address: locationAddress
        });
    };

    if (loadError) return <div className="p-4 text-red-500">Lỗi tải Google Maps: {loadError.message}</div>;
    if (!isLoaded) return (
        <div className="w-full bg-slate-50 rounded-3xl flex flex-col items-center justify-center border border-slate-200" style={{ height }}>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="font-bold text-slate-400">Đang tải bản đồ Google...</p>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            {/* Search Overlay */}
            <div className="absolute top-4 left-4 right-4 z-10 flex gap-2">
                <Autocomplete
                    onLoad={onAutocompleteLoad}
                    onPlaceChanged={onPlaceChanged}
                    className="flex-1"
                >
                    <div className="relative group overflow-hidden rounded-2xl shadow-2xl border border-white/40 ring-1 ring-slate-900/5 bg-white/90 backdrop-blur-xl">
                        <div className="flex items-center px-4 py-3">
                            <Search className="h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm trên Google Maps..."
                                className="bg-transparent border-none focus:ring-0 w-full px-3 text-slate-800 placeholder-slate-400 font-medium"
                            />
                        </div>
                    </div>
                </Autocomplete>

                <button
                    type="button"
                    onClick={goToCurrentLocation}
                    className="p-4 bg-white/90 backdrop-blur-xl rounded-2xl text-blue-600 hover:bg-white hover:text-blue-700 transition-all shadow-xl border border-white/40 ring-1 ring-slate-900/5"
                >
                    <LocateFixed className="h-5 w-5" />
                </button>
            </div>

            {/* Google Map */}
            <div className="relative flex-1 rounded-3xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100" style={{ minHeight: height }}>
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={markerPos || { lat: 16.0544, lng: 108.2022 }}
                    zoom={markerPos ? 17 : 6}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    onClick={handleMapClick}
                    options={{
                        disableDefaultUI: false,
                        zoomControl: true,
                        streetViewControl: false,
                        mapTypeControl: false,
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
                    {markerPos && (
                        <Marker
                            position={markerPos}
                            animation={google.maps.Animation.DROP}
                        />
                    )}
                </GoogleMap>

                {isLoading && (
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] z-20 flex items-center justify-center">
                        <div className="bg-white/90 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-white flex items-center gap-3">
                            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                            <span className="font-bold text-slate-700">Đang tải tọa độ...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Selection Card */}
            {markerPos && !isLoading && (
                <div className="absolute bottom-6 left-6 right-6 z-10 animate-in slide-in-from-bottom-6 fade-in duration-500">
                    <div className="bg-white/90 backdrop-blur-2xl rounded-[32px] p-6 shadow-2xl border border-white shadow-slate-900/10">
                        <div className="flex items-center gap-6">
                            <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shrink-0 flex items-center justify-center shadow-lg shadow-blue-200">
                                <MapPin className="h-10 w-10 text-white" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GOOGLE MAPS SELECTION</span>
                                </div>
                                <h4 className="text-xl font-black text-slate-800 truncate leading-tight">
                                    {locationName || 'Untitled Location'}
                                </h4>
                                <p className="text-sm font-medium text-slate-500 line-clamp-1 mt-1 font-sans">
                                    {locationAddress}
                                </p>
                                <div className="flex gap-2 mt-3">
                                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-mono font-bold text-slate-600">
                                        {markerPos.lat.toFixed(6)}, {markerPos.lng.toFixed(6)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => { setMarkerPos(null); setLocationName(''); setLocationAddress(''); }}
                                    className="p-3 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-2xl transition-all"
                                >
                                    <X size={20} />
                                </button>
                                {showConfirmButton && (
                                    <button
                                        onClick={handleConfirm}
                                        className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all shadow-lg shadow-blue-200"
                                    >
                                        <Check size={20} strokeWidth={3} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
