"use client"
import { useState, useEffect, use } from 'react';
import { tourService, Tour } from "@/services/tour.service";
import { BOOKING_API_URL } from '@/config/api';
import {
    ChevronLeft, X, Plus, Trash2, Save, Loader2,
    Calendar, DollarSign, Image as ImageIcon,
    CheckCircle, Settings, Map, Package, AlertCircle, MapPin
} from "lucide-react";
import Link from "next/link";
import MarkdownEditor from "@/components/MarkdownEditor";
import { uploadService } from "@/services/upload.service";
import LocationPickerModal from "@/components/tours/LocationPickerModal";
import { Location } from "@/services/location.service";

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

interface PageProps {
    params: Promise<{ id: string }>;
}

interface TourDay {
    id?: number;
    day_number: number;
    title: string;
    description: string;
    accommodation?: string;
    meals?: string;
    places?: DayPlace[];
}

interface DayPlace {
    id?: number;
    place_id: number;
    place_name?: string;
    visit_order: number;
    duration_minutes: number;
    notes?: string;
}

interface Amenity {
    id: number;
    name: string;
    category: string;
    icon?: string;
    is_included?: boolean;
    is_optional?: boolean;
    price?: number;
}

interface Schedule {
    id?: number;
    start_date: string;
    end_date: string;
    price_override?: number;
    total_slots: number;
    available_slots: number;
    status: string;
}

export default function EditTourPage({ params }: PageProps) {
    const { id } = use(params);
    const [tour, setTour] = useState<Tour | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('basic');
    const [tourDetails, setTourDetails] = useState<any>(null);

    // Form states
    const [tourDays, setTourDays] = useState<TourDay[]>([]);
    const [amenities, setAmenities] = useState<Amenity[]>([]);
    const [allAmenities, setAllAmenities] = useState<Amenity[]>([]);
    const [locations, setLocations] = useState<{ id: number, name: string, latitude?: number, longitude?: number, image_url?: string }[]>([]);
    const [categories, setCategories] = useState<{ id: number, name: string }[]>([]);
    const [schedules, setSchedules] = useState<Schedule[]>([]);

    // Loading states for individual operations
    const [saving, setSaving] = useState(false);
    const [savingAmenity, setSavingAmenity] = useState<number | null>(null);
    const [savingSchedule, setSavingSchedule] = useState<number | null>(null);
    const [savingDay, setSavingDay] = useState<number | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [deletingImage, setDeletingImage] = useState<number | null>(null);

    // Location picker modal
    const [showLocationPicker, setShowLocationPicker] = useState(false);

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Basic info form
    const [basicInfo, setBasicInfo] = useState({
        name: '',
        short_description: '',
        description: '',
        highlights: '',
        included_services: '',
        excluded_services: '',
        base_price: 0,
        child_price: 0,
        duration_days: 1,
        duration_nights: 0,
        max_participants: 20,
        min_participants: 1,
        difficulty: 'MODERATE',
        status: 'ACTIVE',
        is_featured: false,
        is_hot_deal: false,
        location_id: '',
        category_id: '',
        terms_conditions: '',
        cancellation_policy: '',
        departure_location: '',
        return_location: '',
        transportation_type: ''
    });

    useEffect(() => {
        fetchTourData();
    }, [id]);

    const fetchTourData = async () => {
        try {
            // Fetch basic tour data
            const response = await tourService.getTour(id);
            setTour({ ...response.data.tour, id });

            // Set basic info - API returns snake_case, handle both formats
            // Cast to any to handle both snake_case and camelCase from API
            const t = response.data.tour as unknown as Record<string, unknown>;
            setBasicInfo({
                name: (t.name as string) || '',
                short_description: (t.short_description || t.shortDescription || '') as string,
                description: (t.description as string) || '',
                highlights: (t.highlights as string) || '',
                included_services: (t.included_services || t.includedServices || '') as string,
                excluded_services: (t.excluded_services || t.excludedServices || '') as string,
                base_price: (t.base_price || t.basePrice || 0) as number,
                child_price: (t.child_price || t.childPrice || 0) as number,
                duration_days: (t.duration_days || t.durationDays || 1) as number,
                duration_nights: (t.duration_nights || t.durationNights || 0) as number,
                max_participants: (t.max_participants || t.maxParticipants || 20) as number,
                min_participants: (t.min_participants || t.minParticipants || 1) as number,
                difficulty: (t.difficulty as string) || 'MODERATE',
                status: (t.status as string) || 'ACTIVE',
                is_featured: (t.is_featured || t.isFeatured || false) as boolean,
                is_hot_deal: (t.is_hot_deal || t.isHotDeal || false) as boolean,
                location_id: (t.location_id || t.locationId || '').toString(),
                category_id: (t.category_id || t.categoryId || '').toString(),
                terms_conditions: (t.terms_conditions || t.termsConditions || '') as string,
                cancellation_policy: (t.cancellation_policy || t.cancellationPolicy || '') as string,
                departure_location: (t.departure_location || t.departureLocation || '') as string,
                return_location: (t.return_location || t.returnLocation || '') as string,
                transportation_type: (t.transportation_type || t.transportationType || '') as string
            });

            // Fetch full tour details from API
            const detailsResponse = await fetch(`${BOOKING_API_URL}/tours/${id}`);
            if (detailsResponse.ok) {
                const data = await detailsResponse.json();
                setTourDetails(data.data);

                // Set tour days/itinerary
                if (data.data.itinerary) {
                    setTourDays(data.data.itinerary.map((day: any) => ({
                        id: day.id,
                        day_number: day.day_number,
                        title: day.title,
                        description: day.description,
                        accommodation: day.accommodation,
                        meals: day.meals,
                        places: day.places || []
                    })));
                }

                // Set amenities
                if (data.data.amenities) {
                    setAmenities(data.data.amenities);
                }

                // Set schedules
                if (data.data.upcoming_schedules) {
                    setSchedules(data.data.upcoming_schedules);
                }
            }

            // Fetch all available amenities
            const amenitiesResponse = await fetch(`${BOOKING_API_URL}/amenities`);
            if (amenitiesResponse.ok) {
                const amenitiesData = await amenitiesResponse.json();
                setAllAmenities(amenitiesData.data || []);
            }

            // Fetch locations for dropdown
            const locResponse = await fetch(`${BOOKING_API_URL}/locations`);
            if (locResponse.ok) {
                const locData = await locResponse.json();
                setLocations(locData.data || []);
            }

            // Fetch categories for dropdown
            const catResponse = await fetch(`${BOOKING_API_URL}/categories`);
            if (catResponse.ok) {
                const catData = await catResponse.json();
                setCategories(catData.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch tour", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBasicInfoChange = (field: string, value: string | number | boolean) => {
        setBasicInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveBasicInfo = async () => {
        setSaving(true);
        try {
            // Convert to format expected by API (camelCase)
            const payload = {
                name: basicInfo.name,
                shortDescription: basicInfo.short_description,
                description: basicInfo.description,
                highlights: basicInfo.highlights,
                includedServices: basicInfo.included_services,
                excludedServices: basicInfo.excluded_services,
                basePrice: basicInfo.base_price,
                childPrice: basicInfo.child_price,
                durationDays: basicInfo.duration_days,
                durationNights: basicInfo.duration_nights,
                maxParticipants: basicInfo.max_participants,
                minParticipants: basicInfo.min_participants,
                difficultyLevel: basicInfo.difficulty,
                status: basicInfo.status as 'ACTIVE' | 'DRAFT' | 'INACTIVE',
                isFeatured: basicInfo.is_featured,
                isHotDeal: basicInfo.is_hot_deal,
                locationId: basicInfo.location_id ? parseInt(basicInfo.location_id) : undefined,
                categoryId: basicInfo.category_id ? parseInt(basicInfo.category_id) : undefined,
                termsConditions: basicInfo.terms_conditions,
                cancellationPolicy: basicInfo.cancellation_policy,
                departureLocation: basicInfo.departure_location,
                returnLocation: basicInfo.return_location,
                transportationType: basicInfo.transportation_type
            };
            await tourService.updateTour(id, payload as any);
            showToast('Đã lưu thông tin cơ bản!', 'success');
        } catch (error: unknown) {
            console.error('Error saving:', error);
            const errorMessage = error instanceof Error ? error.message : 'Lỗi khi lưu thông tin!';
            showToast(errorMessage, 'error');
        } finally {
            setSaving(false);
        }
    };

    // Tour Days Management - Call API immediately
    const handleAddTourDay = async () => {
        const newDayNumber = tourDays.length + 1;
        const newDay: TourDay = {
            day_number: newDayNumber,
            title: `Ngày ${newDayNumber}`,
            description: '',
            accommodation: '',
            meals: '',
            places: []
        };

        setSavingDay(-1);
        try {
            const response = await tourService.addTourDay(id, {
                day_number: newDay.day_number,
                title: newDay.title,
                description: newDay.description,
                accommodation: newDay.accommodation,
                meals: newDay.meals
            });
            const createdDay = response.data || { ...newDay, id: Date.now() };
            setTourDays([...tourDays, createdDay]);
            showToast(`Đã thêm Ngày ${newDayNumber}`, 'success');
        } catch (error: unknown) {
            console.error('Error adding tour day:', error);
            showToast('Lỗi khi thêm ngày', 'error');
        } finally {
            setSavingDay(null);
        }
    };

    const handleUpdateTourDay = async (index: number) => {
        const day = tourDays[index];
        if (!day.id) return;

        setSavingDay(day.id);
        try {
            await tourService.updateTourDay(id, day.id, {
                day_number: day.day_number,
                title: day.title,
                description: day.description,
                accommodation: day.accommodation,
                meals: day.meals,
                places: day.places
            });
            showToast(`Đã cập nhật Ngày ${day.day_number}`, 'success');
        } catch (error: unknown) {
            console.error('Error updating tour day:', error);
            showToast('Lỗi khi cập nhật ngày', 'error');
        } finally {
            setSavingDay(null);
        }
    };

    const handleRemoveTourDay = async (index: number) => {
        const day = tourDays[index];
        if (!confirm(`Bạn có chắc muốn xóa "${day.title}"?`)) return;

        if (day.id) {
            setSavingDay(day.id);
            try {
                await tourService.deleteTourDay(id, day.id);
                const updated = tourDays.filter((_, i) => i !== index);
                updated.forEach((d, i) => d.day_number = i + 1);
                setTourDays(updated);
                showToast(`Đã xóa Ngày ${day.day_number}`, 'success');
            } catch (error: unknown) {
                console.error('Error deleting tour day:', error);
                showToast('Lỗi khi xóa ngày', 'error');
            } finally {
                setSavingDay(null);
            }
        } else {
            const updated = tourDays.filter((_, i) => i !== index);
            updated.forEach((d, i) => d.day_number = i + 1);
            setTourDays(updated);
        }
    };

    const updateTourDayLocal = (index: number, field: string, value: string | number) => {
        const updated = [...tourDays];
        updated[index] = { ...updated[index], [field]: value };
        setTourDays(updated);
    };

    // Amenity Management - Call API immediately
    const handleToggleAmenity = async (amenity: Amenity) => {
        const exists = amenities.find(a => a.id === amenity.id);
        setSavingAmenity(amenity.id);

        try {
            if (exists) {
                await tourService.removeTourAmenity(id, amenity.id);
                setAmenities(amenities.filter(a => a.id !== amenity.id));
                showToast(`Đã xóa "${amenity.name}" khỏi tour`, 'success');
            } else {
                await tourService.addTourAmenity(id, { amenity_id: amenity.id, is_included: true });
                setAmenities([...amenities, { ...amenity, is_included: true }]);
                showToast(`Đã thêm "${amenity.name}" vào tour`, 'success');
            }
        } catch (error: unknown) {
            console.error('Error toggling amenity:', error);
            showToast('Lỗi khi cập nhật dịch vụ', 'error');
        } finally {
            setSavingAmenity(null);
        }
    };

    // Schedule Management - Call API immediately
    const handleAddSchedule = async () => {
        const startDate = new Date();
        const endDate = new Date(Date.now() + basicInfo.duration_days * 24 * 60 * 60 * 1000);

        const newSchedule: Schedule = {
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            total_slots: basicInfo.max_participants,
            available_slots: basicInfo.max_participants,
            status: 'OPEN'
        };

        setSavingSchedule(-1);
        try {
            const response = await tourService.addTourSchedule(id, {
                start_date: newSchedule.start_date,
                end_date: newSchedule.end_date,
                total_slots: newSchedule.total_slots,
                status: newSchedule.status
            });
            const createdSchedule = response.data || { ...newSchedule, id: Date.now() };
            setSchedules([...schedules, createdSchedule]);
            showToast('Đã thêm lịch khởi hành mới', 'success');
        } catch (error: unknown) {
            console.error('Error adding schedule:', error);
            showToast('Lỗi khi thêm lịch', 'error');
        } finally {
            setSavingSchedule(null);
        }
    };

    const handleUpdateSchedule = async (index: number) => {
        const schedule = schedules[index];
        if (!schedule.id) return;

        setSavingSchedule(schedule.id);
        try {
            await tourService.updateTourSchedule(id, schedule.id, {
                start_date: schedule.start_date,
                end_date: schedule.end_date,
                price_override: schedule.price_override,
                total_slots: schedule.total_slots,
                available_slots: schedule.available_slots,
                status: schedule.status
            });
            showToast('Đã cập nhật lịch khởi hành', 'success');
        } catch (error: unknown) {
            console.error('Error updating schedule:', error);
            showToast('Lỗi khi cập nhật lịch', 'error');
        } finally {
            setSavingSchedule(null);
        }
    };

    const handleRemoveSchedule = async (index: number) => {
        const schedule = schedules[index];
        if (!confirm('Bạn có chắc muốn xóa lịch khởi hành này?')) return;

        if (schedule.id) {
            setSavingSchedule(schedule.id);
            try {
                await tourService.deleteTourSchedule(id, schedule.id);
                setSchedules(schedules.filter((_, i) => i !== index));
                showToast('Đã xóa lịch khởi hành', 'success');
            } catch (error: unknown) {
                console.error('Error deleting schedule:', error);
                showToast('Lỗi khi xóa lịch', 'error');
            } finally {
                setSavingSchedule(null);
            }
        } else {
            setSchedules(schedules.filter((_, i) => i !== index));
        }
    };

    const updateScheduleLocal = (index: number, field: string, value: string | number | null) => {
        const updated = [...schedules];
        updated[index] = { ...updated[index], [field]: value };
        setSchedules(updated);
    };

    // Image Management
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            // 1. Upload to Cloudinary
            const imageUrl = await uploadService.uploadImage(file);

            // 2. Add to Tour Images table via API
            await tourService.addTourImage(id, {
                url: imageUrl,
                alt: basicInfo.name,
                is_cover: (tourDetails?.images?.length || 0) === 0,
                display_order: (tourDetails?.images?.length || 0) + 1
            });

            // 3. Refresh data
            await fetchTourData();
            showToast('Đã tải lên hình ảnh!', 'success');
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Lỗi khi tải ảnh lên!', 'error');
        } finally {
            setUploadingImage(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleDeleteImage = async (imageId: number) => {
        if (!confirm('Bạn có chắc muốn xóa hình ảnh này?')) return;

        setDeletingImage(imageId);
        try {
            await tourService.deleteTourImage(id, imageId);
            await fetchTourData();
            showToast('Đã xóa hình ảnh!', 'success');
        } catch (error) {
            console.error('Delete error:', error);
            showToast('Lỗi khi xóa ảnh!', 'error');
        } finally {
            setDeletingImage(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const tabs = [
        { id: 'basic', label: 'Thông Tin Cơ Bản', icon: Settings },
        { id: 'itinerary', label: 'Lịch Trình', icon: Map },
        { id: 'amenities', label: 'Dịch Vụ', icon: Package },
        { id: 'schedules', label: 'Lịch Khởi Hành', icon: Calendar },
        { id: 'images', label: 'Hình Ảnh', icon: ImageIcon },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div>
                    <p className="text-slate-600 mt-4">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!tour) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 text-lg">Không tìm thấy tour</p>
                    <Link href="/tours" className="text-blue-600 hover:underline mt-2 inline-block">
                        Quay lại danh sách
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Toast Notification */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                            <Link href="/tours" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <ChevronLeft size={20} className="text-slate-600" />
                            </Link>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Chỉnh Sửa Tour</h1>
                                <p className="text-sm text-slate-500 hidden sm:block truncate max-w-[300px]">{tour.name || 'Tour chưa có tên'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${basicInfo.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                                }`}>
                                {basicInfo.status === 'ACTIVE' ? 'Hoạt động' : basicInfo.status === 'DRAFT' ? 'Nháp' : 'Không hoạt động'}
                            </span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 overflow-x-auto pb-px -mb-px">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                                    }`}
                            >
                                <tab.icon size={18} />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Form */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Tour Name & Description */}
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Thông Tin Chung</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Tên Tour *</label>
                                        <input
                                            type="text"
                                            value={basicInfo.name}
                                            onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                            placeholder="Nhập tên tour..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Địa Điểm</label>
                                            <div className="flex gap-2">
                                                <select
                                                    value={basicInfo.location_id}
                                                    onChange={(e) => handleBasicInfoChange('location_id', e.target.value)}
                                                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                                >
                                                    <option value="">Chọn địa điểm</option>
                                                    {locations.map(loc => (
                                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowLocationPicker(true)}
                                                    className="px-3 py-2.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                                    title="Chọn từ bản đồ"
                                                >
                                                    <MapPin size={18} />
                                                </button>
                                            </div>
                                            {/* Show selected location info */}
                                            {basicInfo.location_id && (() => {
                                                const selectedLoc = locations.find(l => l.id === Number(basicInfo.location_id));
                                                if (selectedLoc) {
                                                    return (
                                                        <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2">
                                                            {selectedLoc.image_url ? (
                                                                <img src={selectedLoc.image_url} alt={selectedLoc.name} className="w-10 h-10 rounded object-cover" />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center">
                                                                    <MapPin size={16} className="text-blue-500" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-blue-900 truncate">{selectedLoc.name}</p>
                                                                {selectedLoc.latitude && selectedLoc.longitude && (
                                                                    <p className="text-xs text-blue-600 font-mono">
                                                                        {selectedLoc.latitude.toFixed(4)}, {selectedLoc.longitude.toFixed(4)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Danh Mục</label>
                                            <select
                                                value={basicInfo.category_id}
                                                onChange={(e) => handleBasicInfoChange('category_id', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                            >
                                                <option value="">Chọn danh mục</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Điểm Khởi Hành</label>
                                            <input
                                                type="text"
                                                value={basicInfo.departure_location}
                                                onChange={(e) => handleBasicInfoChange('departure_location', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                                placeholder="Nơi tập trung/khởi hành..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Phương Tiện</label>
                                            <input
                                                type="text"
                                                value={basicInfo.transportation_type}
                                                onChange={(e) => handleBasicInfoChange('transportation_type', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                                placeholder="Máy bay, ô tô..."
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Mô Tả Ngắn</label>
                                        <textarea
                                            value={basicInfo.short_description}
                                            onChange={(e) => handleBasicInfoChange('short_description', e.target.value)}
                                            rows={2}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 resize-none"
                                            placeholder="Tóm tắt ngắn về tour..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Mô Tả</label>
                                        <textarea
                                            value={basicInfo.description}
                                            onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                                            rows={4}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 resize-none"
                                            placeholder="Mô tả chi tiết về tour..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Điểm Nổi Bật</label>
                                        <textarea
                                            value={basicInfo.highlights}
                                            onChange={(e) => handleBasicInfoChange('highlights', e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 resize-none"
                                            placeholder="Mỗi điểm nổi bật một dòng..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Giá Cả</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Giá Người Lớn *</label>
                                        <div className="relative">
                                            <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="number"
                                                value={basicInfo.base_price}
                                                onChange={(e) => handleBasicInfoChange('base_price', Number(e.target.value))}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Giá Trẻ Em</label>
                                        <div className="relative">
                                            <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="number"
                                                value={basicInfo.child_price}
                                                onChange={(e) => handleBasicInfoChange('child_price', Number(e.target.value))}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Duration & Participants */}
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Thời Gian & Số Lượng</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Số Ngày</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={basicInfo.duration_days}
                                            onChange={(e) => handleBasicInfoChange('duration_days', Number(e.target.value))}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Số Đêm</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={basicInfo.duration_nights}
                                            onChange={(e) => handleBasicInfoChange('duration_nights', Number(e.target.value))}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Tối Thiểu</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={basicInfo.min_participants}
                                            onChange={(e) => handleBasicInfoChange('min_participants', Number(e.target.value))}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Tối Đa</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={basicInfo.max_participants}
                                            onChange={(e) => handleBasicInfoChange('max_participants', Number(e.target.value))}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Services */}
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Dịch Vụ</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Bao Gồm</label>
                                        <textarea
                                            value={basicInfo.included_services}
                                            onChange={(e) => handleBasicInfoChange('included_services', e.target.value)}
                                            rows={4}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 resize-none"
                                            placeholder="Mỗi dịch vụ một dòng..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Không Bao Gồm</label>
                                        <textarea
                                            value={basicInfo.excluded_services}
                                            onChange={(e) => handleBasicInfoChange('excluded_services', e.target.value)}
                                            rows={4}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 resize-none"
                                            placeholder="Mỗi dịch vụ một dòng..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Policies */}
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Chính Sách & Điều Khoản</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Chính Sách Hủy</label>
                                        <textarea
                                            value={basicInfo.cancellation_policy}
                                            onChange={(e) => handleBasicInfoChange('cancellation_policy', e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 resize-none"
                                            placeholder="Quy định về việc hủy tour..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Điều Khoản & Điều Kiện</label>
                                        <textarea
                                            value={basicInfo.terms_conditions}
                                            onChange={(e) => handleBasicInfoChange('terms_conditions', e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 resize-none"
                                            placeholder="Các lưu ý và cam kết khác..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Status & Settings */}
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Cài Đặt</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Trạng Thái</label>
                                        <select
                                            value={basicInfo.status}
                                            onChange={(e) => handleBasicInfoChange('status', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                        >
                                            <option value="ACTIVE">Hoạt Động</option>
                                            <option value="INACTIVE">Không Hoạt Động</option>
                                            <option value="DRAFT">Nháp</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Độ Khó</label>
                                        <select
                                            value={basicInfo.difficulty}
                                            onChange={(e) => handleBasicInfoChange('difficulty', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                        >
                                            <option value="EASY">Dễ</option>
                                            <option value="MODERATE">Trung Bình</option>
                                            <option value="DIFFICULT">Khó</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-sm text-slate-700">Tour Nổi Bật</span>
                                        <button
                                            onClick={() => handleBasicInfoChange('is_featured', !basicInfo.is_featured)}
                                            className={`w-12 h-6 rounded-full transition-colors ${basicInfo.is_featured ? 'bg-blue-600' : 'bg-slate-200'}`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${basicInfo.is_featured ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-sm text-slate-700">Hot Deal</span>
                                        <button
                                            onClick={() => handleBasicInfoChange('is_hot_deal', !basicInfo.is_hot_deal)}
                                            className={`w-12 h-6 rounded-full transition-colors ${basicInfo.is_hot_deal ? 'bg-orange-500' : 'bg-slate-200'}`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${basicInfo.is_hot_deal ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            {tourDetails && (
                                <div className="bg-white rounded-xl border border-slate-200 p-6">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Thống Kê</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-blue-50 p-3 rounded-lg">
                                            <p className="text-xs text-blue-600 font-medium">Lượt xem</p>
                                            <p className="text-xl font-bold text-blue-900">{tourDetails.tour?.view_count || 0}</p>
                                        </div>
                                        <div className="bg-emerald-50 p-3 rounded-lg">
                                            <p className="text-xs text-emerald-600 font-medium">Đặt chỗ</p>
                                            <p className="text-xl font-bold text-emerald-900">{tourDetails.tour?.booking_count || 0}</p>
                                        </div>
                                        <div className="bg-amber-50 p-3 rounded-lg">
                                            <p className="text-xs text-amber-600 font-medium">Đánh giá</p>
                                            <p className="text-xl font-bold text-amber-900">{tourDetails.tour?.rating?.toFixed(1) || '0.0'}</p>
                                        </div>
                                        <div className="bg-purple-50 p-3 rounded-lg">
                                            <p className="text-xs text-purple-600 font-medium">Nhận xét</p>
                                            <p className="text-xl font-bold text-purple-900">{tourDetails.tour?.review_count || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tour ID */}
                            <div className="bg-slate-100 rounded-xl p-4">
                                <p className="text-xs font-medium text-slate-500 uppercase mb-1">ID Tour</p>
                                <p className="text-sm font-mono text-slate-700 break-all">{id}</p>
                            </div>

                            {/* Save Button */}
                            <button
                                onClick={handleSaveBasicInfo}
                                disabled={saving}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
                            >
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {saving ? 'Đang lưu...' : 'Lưu Thông Tin Cơ Bản'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Itinerary Tab */}
                {activeTab === 'itinerary' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Lịch Trình Tour</h2>
                                <p className="text-sm text-slate-500">Mỗi thay đổi sẽ được lưu khi bạn nhấn nút Lưu</p>
                            </div>
                            <button
                                onClick={handleAddTourDay}
                                disabled={savingDay === -1}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                            >
                                {savingDay === -1 ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                Thêm Ngày
                            </button>
                        </div>

                        {tourDays.length === 0 ? (
                            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                                <Map size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-medium text-slate-900 mb-2">Chưa có lịch trình</h3>
                                <p className="text-slate-500 mb-4">Bắt đầu thêm lịch trình cho tour của bạn</p>
                                <button
                                    onClick={handleAddTourDay}
                                    disabled={savingDay === -1}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                                >
                                    {savingDay === -1 ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                    Thêm Ngày Đầu Tiên
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {tourDays.map((day, index) => (
                                    <div key={day.id || index} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                                    {day.day_number}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={day.title}
                                                    onChange={(e) => updateTourDayLocal(index, 'title', e.target.value)}
                                                    className="text-lg font-semibold text-slate-900 bg-transparent border-none focus:ring-0 p-0"
                                                    placeholder="Tiêu đề ngày..."
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {day.id && (
                                                    <button
                                                        onClick={() => handleUpdateTourDay(index)}
                                                        disabled={savingDay === day.id}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                                                    >
                                                        {savingDay === day.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                        Lưu
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleRemoveTourDay(index)}
                                                    disabled={savingDay === day.id}
                                                    className="p-2 text-red-500 hover:bg-red-50 disabled:opacity-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Mô Tả Lịch Trình</label>
                                                <MarkdownEditor
                                                    value={day.description ?? ""}
                                                    onChange={(value) => updateTourDayLocal(index, 'description', value)}
                                                    placeholder="Mô tả hoạt động trong ngày...\n\n# Sáng\n- Tham quan điểm A\n- Ăn sáng tại khách sạn\n\n# Chiều\n**Hoạt động chính:** Tham quan bảo tàng\n\n# Tối\nNghỉ ngơi tại khách sạn"
                                                    rows={8}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">🏨 Lưu Trú</label>
                                                    <input
                                                        type="text"
                                                        value={day.accommodation || ''}
                                                        onChange={(e) => updateTourDayLocal(index, 'accommodation', e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                                        placeholder="Khách sạn, resort..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">🍽️ Bữa Ăn</label>
                                                    <input
                                                        type="text"
                                                        value={day.meals || ''}
                                                        onChange={(e) => updateTourDayLocal(index, 'meals', e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                                                        placeholder="Sáng, trưa, tối..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Amenities Tab */}
                {activeTab === 'amenities' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Dịch Vụ & Tiện Ích</h2>
                            <p className="text-sm text-slate-500">Nhấp vào dịch vụ để thêm/xóa - thay đổi được lưu ngay lập tức</p>
                        </div>

                        {/* Selected Amenities */}
                        {amenities.length > 0 && (
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <CheckCircle size={18} className="text-emerald-600" />
                                    Đã Chọn ({amenities.length})
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {amenities.map((amenity) => (
                                        <button
                                            key={amenity.id}
                                            onClick={() => handleToggleAmenity(amenity)}
                                            disabled={savingAmenity === amenity.id}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 rounded-full text-sm font-medium transition-colors"
                                        >
                                            {savingAmenity === amenity.id ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <CheckCircle size={14} />
                                            )}
                                            {amenity.name}
                                            <X size={14} className="hover:text-red-600" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* All Amenities */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h3 className="text-sm font-semibold text-slate-900 mb-4">Tất Cả Dịch Vụ</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {allAmenities.map((amenity) => {
                                    const isSelected = amenities.some(a => a.id === amenity.id);
                                    return (
                                        <button
                                            key={amenity.id}
                                            onClick={() => handleToggleAmenity(amenity)}
                                            disabled={savingAmenity === amenity.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left disabled:opacity-50 ${isSelected
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded flex items-center justify-center ${isSelected ? 'bg-blue-600' : 'border-2 border-slate-300'
                                                }`}>
                                                {savingAmenity === amenity.id ? (
                                                    <Loader2 size={12} className="text-white animate-spin" />
                                                ) : isSelected ? (
                                                    <CheckCircle size={14} className="text-white" />
                                                ) : null}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 text-sm">{amenity.name}</p>
                                                <p className="text-xs text-slate-500">{amenity.category}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Schedules Tab */}
                {activeTab === 'schedules' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Lịch Khởi Hành</h2>
                                <p className="text-sm text-slate-500">Thêm và quản lý các ngày khởi hành - nhấn Lưu để cập nhật</p>
                            </div>
                            <button
                                onClick={handleAddSchedule}
                                disabled={savingSchedule === -1}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                            >
                                {savingSchedule === -1 ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                Thêm Lịch
                            </button>
                        </div>

                        {schedules.length === 0 ? (
                            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                                <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-medium text-slate-900 mb-2">Chưa có lịch khởi hành</h3>
                                <p className="text-slate-500 mb-4">Thêm lịch khởi hành cho tour của bạn</p>
                                <button
                                    onClick={handleAddSchedule}
                                    disabled={savingSchedule === -1}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                                >
                                    {savingSchedule === -1 ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                    Thêm Lịch Đầu Tiên
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {schedules.map((schedule, index) => (
                                    <div key={schedule.id || index} className="bg-white rounded-xl border border-slate-200 p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${schedule.status === 'OPEN'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : schedule.status === 'FULL'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                {schedule.status === 'OPEN' ? 'Mở đặt' : schedule.status === 'FULL' ? 'Hết chỗ' : 'Đóng'}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                {schedule.id && (
                                                    <button
                                                        onClick={() => handleUpdateSchedule(index)}
                                                        disabled={savingSchedule === schedule.id}
                                                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 rounded transition-colors"
                                                        title="Lưu"
                                                    >
                                                        {savingSchedule === schedule.id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleRemoveSchedule(index)}
                                                    disabled={savingSchedule === schedule.id}
                                                    className="p-1 text-red-500 hover:bg-red-50 disabled:opacity-50 rounded transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-xs text-slate-500 mb-1">Ngày Đi</label>
                                                    <input
                                                        type="date"
                                                        value={schedule.start_date?.split('T')[0] || ''}
                                                        onChange={(e) => updateScheduleLocal(index, 'start_date', e.target.value)}
                                                        className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 text-slate-900"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-500 mb-1">Ngày Về</label>
                                                    <input
                                                        type="date"
                                                        value={schedule.end_date?.split('T')[0] || ''}
                                                        onChange={(e) => updateScheduleLocal(index, 'end_date', e.target.value)}
                                                        className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 text-slate-900"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Giá (để trống = giá gốc)</label>
                                                <input
                                                    type="number"
                                                    value={schedule.price_override || ''}
                                                    onChange={(e) => updateScheduleLocal(index, 'price_override', e.target.value ? Number(e.target.value) : null)}
                                                    placeholder={formatCurrency(basicInfo.base_price)}
                                                    className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 text-slate-900"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-xs text-slate-500 mb-1">Tổng Chỗ</label>
                                                    <input
                                                        type="number"
                                                        value={schedule.total_slots}
                                                        onChange={(e) => updateScheduleLocal(index, 'total_slots', Number(e.target.value))}
                                                        className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 text-slate-900"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-500 mb-1">Còn Trống</label>
                                                    <input
                                                        type="number"
                                                        value={schedule.available_slots}
                                                        onChange={(e) => updateScheduleLocal(index, 'available_slots', Number(e.target.value))}
                                                        className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 text-slate-900"
                                                    />
                                                </div>
                                            </div>

                                            <select
                                                value={schedule.status}
                                                onChange={(e) => updateScheduleLocal(index, 'status', e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 text-slate-900"
                                            >
                                                <option value="OPEN">Mở Đặt</option>
                                                <option value="FULL">Hết Chỗ</option>
                                                <option value="CLOSED">Đóng</option>
                                                <option value="COMPLETED">Hoàn Thành</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Images Tab */}
                {activeTab === 'images' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Hình Ảnh</h2>
                            <p className="text-sm text-slate-500">Quản lý hình ảnh của tour</p>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-slate-50 transition-all cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploadingImage}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                />
                                {uploadingImage ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
                                        <p className="text-blue-600 font-medium font-bold">Đang tải ảnh lên...</p>
                                    </div>
                                ) : (
                                    <>
                                        <ImageIcon size={48} className="mx-auto text-slate-300 mb-4" />
                                        <h3 className="text-lg font-medium text-slate-900 mb-2">Click hoặc kéo thả để tải ảnh</h3>
                                        <p className="text-slate-500 mb-4 font-bold">Dung lượng tối đa 5MB</p>
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg transition-colors">
                                            Chọn Hình Ảnh
                                        </div>
                                    </>
                                )}
                            </div>

                            {tourDetails?.images && tourDetails.images.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-6">Hình Ảnh Hiện Tại ({tourDetails.images.length})</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {tourDetails.images.map((img: any) => (
                                            <div key={img.id} className="relative group aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                                <img
                                                    src={img.url}
                                                    alt={img.alt || 'Tour image'}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />

                                                {/* Overlay on hover */}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                    <button
                                                        onClick={() => handleDeleteImage(img.id)}
                                                        disabled={deletingImage === img.id}
                                                        className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 disabled:opacity-50"
                                                        title="Xóa ảnh"
                                                    >
                                                        {deletingImage === img.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                                    </button>
                                                </div>

                                                {/* Cover badge */}
                                                {img.is_cover && (
                                                    <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                                                        ẢNH BÌA
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Location Picker Modal */}
            <LocationPickerModal
                isOpen={showLocationPicker}
                onClose={() => setShowLocationPicker(false)}
                currentLocationId={basicInfo.location_id}
                onSelect={(location: Location) => {
                    // Add to locations list if not exists
                    if (!locations.find(l => l.id === location.id)) {
                        setLocations(prev => [...prev, {
                            id: location.id,
                            name: location.name,
                            latitude: location.latitude,
                            longitude: location.longitude,
                            image_url: location.image_url
                        }]);
                    }
                    handleBasicInfoChange('location_id', location.id.toString());
                    showToast(`Đã chọn địa điểm: ${location.name}`, 'success');
                }}
            />

            {/* CSS for toast animation */}
            <style jsx>{`
                @keyframes slide-up {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}