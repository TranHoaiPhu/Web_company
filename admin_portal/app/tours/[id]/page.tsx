"use client"
import { useState, useEffect, use } from 'react';
import { ChevronLeft, MapPin, Clock, Users, Star, AlertCircle, Check, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface PageProps {
    params: Promise<{ id: string }>;
}

interface TourData {
    tour: any;
    location: any;
    category: any;
    cover_image: string;
    images: any[];
    itinerary: any[];
    amenities: any[];
    upcoming_schedules: any[];
}

export default function TourDetailsPage({ params }: PageProps) {
    const { id } = use(params);
    const [tourData, setTourData] = useState<TourData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchTourDetails = async () => {
            try {
                const response = await fetch(`https://booking-tour-api-v5tqubp6lq-uc.a.run.app/api/tours/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setTourData(data.data);
                } else {
                    console.error('Failed to fetch tour details');
                }
            } catch (error) {
                console.error('Error fetching tour details:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTourDetails();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block">
                        <div className="animate-spin">
                            <div className="h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
                        </div>
                    </div>
                    <p className="text-slate-600 mt-4">Đang tải thông tin tour...</p>
                </div>
            </div>
        );
    }

    if (!tourData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 text-lg">Không tìm thấy tour</p>
                </div>
            </div>
        );
    }

    const tour = tourData.tour;
    const location = tourData.location;
    const category = tourData.category;
    const images = tourData.images || [];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const amenitiesByCategory = tourData.amenities.reduce((acc: any, amenity: any) => {
        if (!acc[amenity.category]) {
            acc[amenity.category] = [];
        }
        acc[amenity.category].push(amenity);
        return acc;
    }, {});

    const getCategoryLabel = (category: string) => {
        const labels: any = {
            accommodation: '🏨 Lưu Trú',
            meals: '🍽️ Ăn Uống',
            transport: '🚌 Vận Chuyển',
            experience: '🎯 Trải Nghiệm',
            service: '🎫 Dịch Vụ',
            extra: '➕ Dịch Vụ Thêm'
        };
        return labels[category] || category;
    };

    return (
        <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', 'Segoe UI', '-apple-system', 'BlinkMacSystemFont', sans-serif" }}>
            {/* Navigation */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <Link href="/tours" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold transition-colors">
                        <ChevronLeft size={20} />
                        Quay lại
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Header Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Hero Image */}
                        <div className="mb-8">
                            <div className="relative w-full h-96 bg-slate-200 rounded-2xl overflow-hidden mb-4">
                                {images[selectedImage] ? (
                                    <img
                                        src={images[selectedImage].url}
                                        alt={images[selectedImage].alt}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-300 flex items-center justify-center">
                                        <span className="text-slate-500">Không có ảnh</span>
                                    </div>
                                )}
                                {/* Featured Badge */}
                                {tour.is_featured && (
                                    <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                                        ⭐ Nổi Bật
                                    </div>
                                )}
                            </div>

                            {/* Image Gallery */}
                            {images.length > 0 && (
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage(idx)}
                                            className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${selectedImage === idx ? 'border-blue-600' : 'border-slate-200'
                                                }`}
                                        >
                                            <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Title & Basic Info */}
                        <div className="mb-8">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h1 className="text-5xl font-bold text-slate-900 mb-3 leading-tight">{tour.name}</h1>
                                    <div className="flex items-center gap-6 text-slate-600">
                                        <div className="flex items-center gap-2 text-lg">
                                            <MapPin size={20} />
                                            <span className="font-semibold">{location.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-lg">
                                            <Clock size={20} />
                                            <span className="font-semibold">{tour.duration_days} ngày {tour.duration_nights} đêm</span>
                                        </div>
                                        {tour.rating > 0 && (
                                            <div className="flex items-center gap-2 text-lg">
                                                <Star size={20} className="fill-yellow-400 text-yellow-400" />
                                                <span className="font-semibold">{tour.rating} ({tour.review_count} đánh giá)</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Category Badge */}
                            <div className="inline-block">
                                <span className="inline-block px-5 py-2.5 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                                    {category.name}
                                </span>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-slate-200 mb-8">
                            <div className="flex gap-8">
                                {['overview', 'itinerary', 'amenities', 'schedules'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`py-4 font-bold border-b-2 transition-all text-lg ${activeTab === tab
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-slate-600 hover:text-slate-900'
                                            }`}
                                    >
                                        {tab === 'overview' && 'Tổng Quan'}
                                        {tab === 'itinerary' && 'Lịch Trình'}
                                        {tab === 'amenities' && 'Dịch Vụ'}
                                        {tab === 'schedules' && 'Lịch Khởi Hành'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'overview' && (
                            <div className="space-y-10">
                                {/* Description */}
                                <div>
                                    <h2 className="text-3xl font-bold text-slate-900 mb-6">Mô Tả Tour</h2>
                                    <p className="text-lg text-slate-700 leading-relaxed whitespace-pre-wrap font-normal">{tour.description}</p>
                                </div>

                                {/* Highlights */}
                                {tour.highlights && (
                                    <div>
                                        <h2 className="text-3xl font-bold text-slate-900 mb-6">Điểm Nhấn</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {tour.highlights.split('\n').map((highlight: string, idx: number) => (
                                                <div key={idx} className="flex items-start gap-4 bg-blue-50 p-5 rounded-lg border border-blue-200">
                                                    <Check className="text-blue-600 flex-shrink-0 mt-1 font-bold" size={24} />
                                                    <span className="text-slate-700 text-lg font-medium">{highlight.replace('- ', '')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Included Services */}
                                {tour.included_services && (
                                    <div>
                                        <h2 className="text-3xl font-bold text-slate-900 mb-6">Dịch Vụ Bao Gồm</h2>
                                        <div className="space-y-3">
                                            {tour.included_services.split('\n').map((service: string, idx: number) => (
                                                <div key={idx} className="flex items-center gap-4">
                                                    <Check className="text-green-600 flex-shrink-0" size={24} />
                                                    <span className="text-slate-700 text-lg font-medium">{service.replace('- ', '')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'itinerary' && (
                            <div className="space-y-6">
                                {tourData.itinerary.map((day: any, idx: number) => (
                                    <div key={idx} className="border border-slate-200 rounded-xl p-6">
                                        <h3 className="text-xl font-bold text-slate-900 mb-3">
                                            Ngày {day.day_number}: {day.title}
                                        </h3>
                                        <p className="text-slate-600 mb-4">{day.description}</p>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            {day.accommodation && (
                                                <div className="bg-blue-50 p-3 rounded-lg">
                                                    <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Lưu Trú</p>
                                                    <p className="text-slate-900 font-medium">{day.accommodation}</p>
                                                </div>
                                            )}
                                            {day.meals && (
                                                <div className="bg-amber-50 p-3 rounded-lg">
                                                    <p className="text-xs font-semibold text-amber-600 uppercase mb-1">Ăn Uống</p>
                                                    <p className="text-slate-900 font-medium">{day.meals}</p>
                                                </div>
                                            )}
                                        </div>

                                        {day.places && day.places.length > 0 && (
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700 mb-2">Địa Điểm Tham Quan:</p>
                                                <div className="space-y-2">
                                                    {day.places.map((place: any, pIdx: number) => (
                                                        <div key={pIdx} className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg">
                                                            <span className="text-sm font-semibold text-blue-600">{place.visit_order}.</span>
                                                            <div className="flex-1">
                                                                <p className="font-medium text-slate-900">{place.place.name}</p>
                                                                <p className="text-xs text-slate-500">{place.place.address}</p>
                                                                <p className="text-xs text-slate-600 mt-1">⏱️ {place.duration_minutes} phút</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'amenities' && (
                            <div className="space-y-8">
                                {Object.entries(amenitiesByCategory).map(([category, amenities]: [string, any]) => (
                                    <div key={category}>
                                        <h3 className="text-xl font-bold text-slate-900 mb-4">{getCategoryLabel(category)}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {amenities.map((amenity: any) => (
                                                <div
                                                    key={amenity.amenity_id}
                                                    className={`p-4 rounded-lg border-2 ${amenity.is_included
                                                            ? 'bg-green-50 border-green-200'
                                                            : 'bg-slate-50 border-slate-200'
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-start gap-2">
                                                            {amenity.is_included ? (
                                                                <Check className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                                                            ) : (
                                                                <X className="text-slate-400 flex-shrink-0 mt-0.5" size={18} />
                                                            )}
                                                            <div>
                                                                <p className="font-semibold text-slate-900">{amenity.name}</p>
                                                                {amenity.price > 0 && !amenity.is_included && (
                                                                    <p className="text-sm text-slate-600">+{formatCurrency(amenity.price)}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {amenity.is_optional && (
                                                        <p className="text-xs text-slate-500">Tùy chọn</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'schedules' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {tourData.upcoming_schedules.map((schedule: any, idx: number) => (
                                    <div key={idx} className="border border-slate-200 rounded-xl p-6">
                                        <h3 className="text-lg font-bold text-slate-900 mb-4">
                                            {new Date(schedule.start_date).toLocaleDateString('vi-VN')} - {new Date(schedule.end_date).toLocaleDateString('vi-VN')}
                                        </h3>

                                        <div className="space-y-3 mb-6">
                                            <div className="bg-slate-50 p-3 rounded-lg">
                                                <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Giá</p>
                                                <p className="text-2xl font-bold text-blue-600">
                                                    {formatCurrency(schedule.price_override || tour.base_price)}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-blue-50 p-3 rounded-lg">
                                                    <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Chỗ Trống</p>
                                                    <p className="text-2xl font-bold text-blue-700">{schedule.available_slots}</p>
                                                    <p className="text-xs text-blue-600">/  {schedule.total_slots} chỗ</p>
                                                </div>

                                                <div className="bg-emerald-50 p-3 rounded-lg">
                                                    <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">Đã Đặt</p>
                                                    <p className="text-2xl font-bold text-emerald-700">{schedule.booked_slots}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Tiến Độ Đặt Chỗ</p>
                                                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-blue-600 h-full"
                                                        style={{ width: `${(schedule.booked_slots / schedule.total_slots) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-xs text-slate-600 mt-1">
                                                    {Math.round((schedule.booked_slots / schedule.total_slots) * 100)}% đã đặt
                                                </p>
                                            </div>
                                        </div>

                                        <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold ${schedule.status === 'OPEN'
                                                ? 'bg-green-100 text-green-700'
                                                : schedule.status === 'FULL'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-slate-100 text-slate-700'
                                            }`}>
                                            {schedule.status === 'OPEN' ? '✓ Mở Đặt' : schedule.status === 'FULL' ? '✕ Hết Chỗ' : 'Đóng'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            {/* Pricing Card */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                                <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4">Giá Từ</h3>
                                <div className="mb-6">
                                    <p className="text-4xl font-bold text-blue-900">{formatCurrency(tour.base_price)}</p>
                                    <p className="text-sm text-blue-700 mt-2">/ khách</p>
                                </div>

                                {tour.child_price && (
                                    <div className="pb-4 border-b border-blue-200 mb-4">
                                        <p className="text-sm text-blue-700">👶 Trẻ em: {formatCurrency(tour.child_price)}</p>
                                    </div>
                                )}


                            </div>

                            {/* Tour Info */}
                            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                                <h3 className="font-bold text-slate-900 mb-4">Thông Tin Tour</h3>

                                <div className="flex items-center gap-3">
                                    <Clock className="text-blue-600" size={20} />
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Thời Gian</p>
                                        <p className="font-semibold text-slate-900">{tour.duration_days}N{tour.duration_nights}Đ</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <MapPin className="text-blue-600" size={20} />
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Địa Điểm</p>
                                        <p className="font-semibold text-slate-900">{location.name}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Users className="text-blue-600" size={20} />
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Độ Khó</p>
                                        <p className="font-semibold text-slate-900">{tour.difficulty === 'MODERATE' ? 'Trung Bình' : 'Khó'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <AlertCircle className="text-blue-600" size={20} />
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Lượt Xem</p>
                                        <p className="font-semibold text-slate-900">{tour.view_count}</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
