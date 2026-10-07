"use client";

import { useState, useEffect, useCallback } from 'react';
import { locationService, Location, LocationCreateInput } from '@/services/location.service';
import {
    Plus, Search, MapPin, Edit2, Trash2, Eye, EyeOff,
    Loader2, ChevronDown, ChevronRight, X, Save, Map,
    Image as ImageIcon, CheckCircle, AlertCircle
} from 'lucide-react';
import GoogleMapPicker, { LocationData } from '@/components/maps/GoogleMapPicker';

// Toast notification component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slide-up ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        } text-white`}>
        {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
        <span className="font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-80">
            <X size={18} />
        </button>
    </div>
);

const LOCATION_TYPES = [
    { value: 'COUNTRY', label: 'Quốc gia' },
    { value: 'REGION', label: 'Vùng miền' },
    { value: 'PROVINCE', label: 'Tỉnh/Thành phố' },
    { value: 'CITY', label: 'Thành phố/Quận/Huyện' },
    { value: 'DISTRICT', label: 'Phường/Xã' },
    { value: 'ATTRACTION', label: 'Điểm tham quan' },
];

export default function LocationsPage() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState<LocationCreateInput>({
        name: '',
        type: 'CITY',
        parent_id: null,
        description: '',
        latitude: undefined,
        longitude: undefined,
        image_url: '',
        hero_image_url: '',
        is_active: true,
        tagline: '',
        subtitle: '',
        climate: '',
        suitable_for: '',
        famous_for: '',
        vibe: '',
    });

    // Parent locations for dropdown
    const [parentLocations, setParentLocations] = useState<Location[]>([]);

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchLocations = useCallback(async () => {
        setLoading(true);
        try {
            const response = await locationService.getLocations({
                page,
                pageSize: 15,
                search: searchTerm || undefined,
                type: typeFilter || undefined,
            });
            setLocations(response.data);
            setTotalPages(response.totalPages);
            setTotal(response.total);
        } catch (error) {
            console.error('Error fetching locations:', error);
            showToast('Lỗi khi tải danh sách địa điểm', 'error');
        } finally {
            setLoading(false);
        }
    }, [page, searchTerm, typeFilter]);

    const fetchParentLocations = async () => {
        try {
            const response = await locationService.getActiveLocations();
            setParentLocations(response);
        } catch (error) {
            console.error('Error fetching parent locations:', error);
        }
    };

    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);

    useEffect(() => {
        fetchParentLocations();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchLocations();
    };

    const openCreateModal = () => {
        setEditingLocation(null);
        setFormData({
            name: '',
            type: 'CITY',
            parent_id: null,
            description: '',
            latitude: undefined,
            longitude: undefined,
            image_url: '',
            hero_image_url: '',
            is_active: true,
            tagline: '',
            subtitle: '',
            climate: '',
            suitable_for: '',
            famous_for: '',
            vibe: '',
        });
        setShowModal(true);
    };

    const openEditModal = async (location: Location) => {
        try {
            const fullLocation = await locationService.getLocationById(location.id);
            setEditingLocation(fullLocation);
            setFormData({
                name: fullLocation.name,
                type: fullLocation.type,
                parent_id: fullLocation.parent_id || null,
                description: fullLocation.description || '',
                latitude: fullLocation.latitude,
                longitude: fullLocation.longitude,
                image_url: fullLocation.image_url || '',
                hero_image_url: fullLocation.hero_image_url || '',
                is_active: fullLocation.is_active,
                tagline: fullLocation.tagline || '',
                subtitle: fullLocation.subtitle || '',
                climate: fullLocation.climate || '',
                suitable_for: fullLocation.suitable_for || '',
                famous_for: fullLocation.famous_for || '',
                vibe: fullLocation.vibe || '',
            });
            setShowModal(true);
        } catch (error) {
            console.error('Error loading location:', error);
            showToast('Lỗi khi tải thông tin địa điểm', 'error');
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.type) {
            showToast('Vui lòng nhập tên và loại địa điểm', 'error');
            return;
        }

        setSaving(true);
        try {
            if (editingLocation) {
                await locationService.updateLocation(editingLocation.id, formData);
                showToast('Đã cập nhật địa điểm', 'success');
            } else {
                await locationService.createLocation(formData);
                showToast('Đã tạo địa điểm mới', 'success');
            }
            setShowModal(false);
            fetchLocations();
            fetchParentLocations();
        } catch (error: any) {
            console.error('Error saving location:', error);
            showToast(error?.response?.data?.error || 'Lỗi khi lưu địa điểm', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (location: Location) => {
        if (!confirm(`Bạn có chắc muốn xóa "${location.name}"?`)) return;

        try {
            await locationService.deleteLocation(location.id);
            showToast('Đã xóa địa điểm', 'success');
            fetchLocations();
            fetchParentLocations();
        } catch (error: any) {
            console.error('Error deleting location:', error);
            showToast(error?.response?.data?.error || 'Lỗi khi xóa địa điểm', 'error');
        }
    };

    const handleLocationSelect = (locationData: LocationData) => {
        setFormData(prev => ({
            ...prev,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            name: prev.name || locationData.name,
            description: prev.description || locationData.address,
            image_url: prev.image_url || (locationData.photos?.[0] || ''),
        }));
    };

    const getTypeLabel = (type: string) => {
        return LOCATION_TYPES.find(t => t.value === type)?.label || type;
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Quản Lý Địa Điểm</h1>
                        <p className="text-slate-500 mt-1">Quản lý các địa điểm du lịch trên hệ thống</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                    >
                        <Plus size={20} />
                        Thêm Địa Điểm
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm địa điểm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                        className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                    >
                        <option value="">Tất cả loại</option>
                        {LOCATION_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
                    >
                        Tìm kiếm
                    </button>
                </form>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Địa điểm</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Loại</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Tọa độ</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                                        <p className="text-slate-500 mt-2">Đang tải...</p>
                                    </td>
                                </tr>
                            ) : locations.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                                        Không có địa điểm nào
                                    </td>
                                </tr>
                            ) : (
                                locations.map((location) => (
                                    <tr key={location.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                {location.image_url ? (
                                                    <img
                                                        src={location.image_url}
                                                        alt={location.name}
                                                        className="w-12 h-12 rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                                                        <MapPin size={20} className="text-slate-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-slate-900">{location.name}</p>
                                                    <p className="text-sm text-slate-500">{location.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                                                {getTypeLabel(location.type)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            {location.latitude && location.longitude ? (
                                                <span className="text-sm text-slate-600 font-mono">
                                                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-slate-400">Chưa có</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {location.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                                                    <Eye size={14} />
                                                    Hiện
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">
                                                    <EyeOff size={14} />
                                                    Ẩn
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(location)}
                                                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(location)}
                                                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Xóa"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
                        <p className="text-sm text-slate-600">
                            Hiển thị {locations.length} / {total} địa điểm
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Trước
                            </button>
                            <span className="px-3 py-1.5 text-sm font-medium text-slate-900 bg-slate-100 rounded">
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setShowModal(false)} />

                        <div className="relative inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-slate-900">
                                    {editingLocation ? 'Chỉnh Sửa Địa Điểm' : 'Thêm Địa Điểm Mới'}
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                                {/* Left Column - Form Fields */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Tên địa điểm *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                            placeholder="Nhập tên địa điểm..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Loại *</label>
                                            <select
                                                value={formData.type}
                                                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                            >
                                                {LOCATION_TYPES.map(type => (
                                                    <option key={type.value} value={type.value}>{type.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Thuộc về</label>
                                            <select
                                                value={formData.parent_id || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value ? parseInt(e.target.value) : null }))}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                            >
                                                <option value="">-- Không có --</option>
                                                {parentLocations
                                                    .filter(loc => loc.id !== editingLocation?.id)
                                                    .map(loc => (
                                                        <option key={loc.id} value={loc.id}>{loc.name} ({getTypeLabel(loc.type)})</option>
                                                    ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            rows={3}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 resize-none"
                                            placeholder="Mô tả về địa điểm..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Tagline</label>
                                            <input
                                                type="text"
                                                value={formData.tagline}
                                                onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                                placeholder="Slogan ngắn..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Vibe</label>
                                            <input
                                                type="text"
                                                value={formData.vibe}
                                                onChange={(e) => setFormData(prev => ({ ...prev, vibe: e.target.value }))}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                                placeholder="Cảm giác, không khí..."
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nổi tiếng vì</label>
                                        <input
                                            type="text"
                                            value={formData.famous_for}
                                            onChange={(e) => setFormData(prev => ({ ...prev, famous_for: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                            placeholder="Điều đặc biệt của địa điểm..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Ảnh đại diện (URL)</label>
                                        <input
                                            type="url"
                                            value={formData.image_url}
                                            onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                            placeholder="https://..."
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                                            Hiển thị địa điểm
                                        </label>
                                    </div>
                                </div>

                                {/* Right Column - Map Picker */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            <Map size={16} className="inline mr-1" />
                                            Chọn vị trí trên bản đồ
                                        </label>
                                        <GoogleMapPicker
                                            onLocationSelect={handleLocationSelect}
                                            initialLocation={formData.latitude && formData.longitude ? {
                                                latitude: formData.latitude,
                                                longitude: formData.longitude,
                                                name: formData.name,
                                                address: formData.description || '',
                                            } : undefined}
                                            height="350px"
                                        />
                                    </div>

                                    {/* Coordinates display */}
                                    {formData.latitude && formData.longitude && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <p className="text-sm font-medium text-blue-900">Tọa độ đã chọn:</p>
                                            <p className="text-sm text-blue-700 font-mono mt-1">
                                                {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                                            </p>
                                        </div>
                                    )}

                                    {/* Image Preview */}
                                    {formData.image_url && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Xem trước ảnh</label>
                                            <img
                                                src={formData.image_url}
                                                alt="Preview"
                                                className="w-full h-40 object-cover rounded-lg border border-slate-200"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2.5 text-slate-700 hover:text-slate-900 font-medium transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            {editingLocation ? 'Cập nhật' : 'Tạo mới'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
