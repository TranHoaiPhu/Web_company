"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Search, X, Loader2, Plus, Check, Navigation, Map as MapIcon } from 'lucide-react';
import GoogleMapPicker, { LocationData } from '@/components/maps/GoogleMapPicker';
import { locationService, Location } from '@/services/location.service';

interface LocationPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (location: Location) => void;
    currentLocationId?: number | string;
}

export default function LocationPickerModal({
    isOpen,
    onClose,
    onSelect,
    currentLocationId
}: LocationPickerModalProps) {
    const [mode, setMode] = useState<'list' | 'map'>('list');
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [creating, setCreating] = useState(false);
    const [selectedFromMap, setSelectedFromMap] = useState<LocationData | null>(null);

    const fetchLocations = useCallback(async () => {
        setLoading(true);
        try {
            const response = await locationService.getLocations({
                pageSize: 100,
                search: searchTerm || undefined,
                is_active: true
            });
            setLocations(response.data || []);
        } catch (error) {
            console.error('Error fetching locations:', error);
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        if (isOpen) {
            fetchLocations();
        }
    }, [isOpen, fetchLocations]);

    const handleLocationSelect = (locationData: LocationData) => {
        setSelectedFromMap(locationData);
    };

    const handleCreateFromMap = async () => {
        if (!selectedFromMap) return;

        setCreating(true);
        try {
            const result = await locationService.findOrCreateByCoordinates({
                latitude: selectedFromMap.latitude,
                longitude: selectedFromMap.longitude,
                name: selectedFromMap.name,
                address: selectedFromMap.address,
                placeId: selectedFromMap.placeId,
                photos: selectedFromMap.photos
            });

            onSelect(result.data);
            onClose();
        } catch (error) {
            console.error('Error creating location:', error);
        } finally {
            setCreating(false);
        }
    };

    const handleSelectExisting = (location: Location) => {
        onSelect(location);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">

                {/* Premium Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 flex items-center justify-between text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Chọn Địa Điểm</h3>
                            <p className="text-blue-100 text-xs mt-0.5">Tìm kiếm hoặc chọn vị trí trên bản đồ để tiếp tục</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex p-2 bg-slate-50 border-b border-slate-100 shrink-0">
                    <button
                        onClick={() => setMode('list')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-200 font-semibold text-sm ${mode === 'list'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                    >
                        <Search size={18} />
                        Danh sách có sẵn
                    </button>
                    <button
                        onClick={() => setMode('map')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-200 font-semibold text-sm ${mode === 'map'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                    >
                        <MapIcon size={18} />
                        Tìm trên bản đồ
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {mode === 'list' ? (
                        <div className="space-y-4">
                            {/* Improved Search Input */}
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && fetchLocations()}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                />
                            </div>

                            {/* Enhanced List */}
                            <div className="grid grid-cols-1 gap-3">
                                {loading ? (
                                    <div className="py-20 text-center">
                                        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto" />
                                        <p className="text-slate-500 mt-3 font-medium">Đang tải danh sách...</p>
                                    </div>
                                ) : locations.length === 0 ? (
                                    <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 mt-4">
                                        <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-500">Không tìm thấy địa điểm nào phù hợp</p>
                                    </div>
                                ) : (
                                    locations.map((location) => (
                                        <button
                                            key={location.id}
                                            onClick={() => handleSelectExisting(location)}
                                            className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${currentLocationId && Number(currentLocationId) === location.id
                                                    ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500'
                                                    : 'bg-white border-slate-100 hover:border-blue-300 hover:shadow-md'
                                                }`}
                                        >
                                            <div className="relative shrink-0">
                                                {location.image_url ? (
                                                    <img src={location.image_url} className="w-14 h-14 rounded-xl object-cover" alt={location.name} />
                                                ) : (
                                                    <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center">
                                                        <MapPin className="text-slate-400" />
                                                    </div>
                                                )}
                                                {currentLocationId && Number(currentLocationId) === location.id && (
                                                    <div className="absolute -top-1 -right-1 bg-blue-600 text-white p-1 rounded-full shadow-lg">
                                                        <Check size={12} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                                    {location.name}
                                                </h4>
                                                <p className="text-sm text-slate-500 truncate mt-0.5">{location.address || 'Chưa có địa chỉ'}</p>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                                        {location.type || 'LOCATION'}
                                                    </span>
                                                    {location.latitude && (
                                                        <span className="text-[10px] font-mono text-slate-400">
                                                            {Number(location.latitude).toFixed(4)}, {Number(location.longitude).toFixed(4)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-slate-300 group-hover:text-blue-400 transition-colors">
                                                <Check size={20} className={currentLocationId && Number(currentLocationId) === location.id ? 'text-blue-600' : 'opacity-0 group-hover:opacity-100'} />
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 flex flex-col h-[500px]">
                            {/* Map Tip */}
                            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-start gap-3 text-sm text-amber-800">
                                <Plus className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <p>
                                    Hệ thống sẽ tự động tạo địa điểm mới nếu thông tin chưa tồn tại trong cơ sở dữ liệu.
                                </p>
                            </div>

                            <div className="flex-1 rounded-3xl overflow-hidden border border-slate-200 relative shadow-inner">
                                <GoogleMapPicker
                                    onLocationSelect={handleLocationSelect}
                                    height="100%"
                                />
                                {creating && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                        <div className="bg-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 border border-slate-100">
                                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                            <span className="font-bold text-slate-700">Đang khởi tạo địa điểm...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Selected Card Overlay-ish */}
                            {selectedFromMap && (
                                <div className="bg-white border-2 border-blue-500 rounded-2xl p-4 shadow-xl animate-in slide-in-from-bottom-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-blue-100 rounded-xl">
                                            <MapPin className="text-blue-600 w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-900 text-lg">{selectedFromMap.name || 'Địa điểm được chọn'}</p>
                                            <p className="text-sm text-slate-500 line-clamp-2">{selectedFromMap.address}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                                                    {selectedFromMap.latitude.toFixed(6)}, {selectedFromMap.longitude.toFixed(6)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => setSelectedFromMap(null)}
                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Better Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 border border-slate-300 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all"
                    >
                        Đóng
                    </button>
                    {mode === 'map' && (
                        <button
                            onClick={handleCreateFromMap}
                            disabled={!selectedFromMap || creating}
                            className={`flex-[2] py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30 ${!selectedFromMap || creating
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                                }`}
                        >
                            {creating ? <Loader2 className="animate-spin w-5 h-5" /> : <Check className="w-5 h-5" />}
                            Xác nhận địa điểm
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
