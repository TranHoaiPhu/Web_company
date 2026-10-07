"use client";

import React, { useState } from 'react';
import {
    X,
    MapPin,
    Clock,
    Users,
    Calendar,
    Star,
    Info,
    CheckCircle2,
    ChevronRight,
    Coffee,
    UtensilsCrossed,
    Plane,
    Bus,
    Hotel,
    Activity,
    ShieldCheck,
    Zap
} from 'lucide-react';

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    tourData: any;
    isDraft?: boolean;
}

export default function TourPreviewModal({ isOpen, onClose, tourData, isDraft = false }: PreviewModalProps) {
    const [activeTab, setActiveTab] = useState('overview');

    if (!isOpen) return null;

    const coverImage = tourData.images?.find((img: any) => img.isCover)?.url || tourData.images?.[0]?.url || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=1000';

    const tabs = [
        { id: 'overview', label: 'Tổng quan' },
        { id: 'itinerary', label: 'Lịch trình' },
        { id: 'amenities', label: 'Dịch vụ & Tiện ích' },
        { id: 'policy', label: 'Chính sách' },
    ];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 mt-10">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="absolute right-6 top-6 z-20">
                    <button
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition hover:bg-white/40 hover:scale-110"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex h-full flex-col lg:flex-row">
                    {/* Left Column - Visuals & Quick Info */}
                    <div className="relative h-64 w-full lg:h-full lg:w-2/5">
                        <img
                            src={coverImage}
                            alt={tourData.name}
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                        <div className="absolute bottom-0 left-0 p-8 text-white">
                            {isDraft && (
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-yellow-500/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                                    Bản nháp xem trước
                                </div>
                            )}
                            <h2 className="mb-4 text-3xl font-bold leading-tight">{tourData.name || 'Tên Tour Chưa Đặt'}</h2>

                            <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-200">
                                <div className="flex items-center gap-1.5 backdrop-blur-md bg-white/10 px-3 py-1.5 rounded-lg">
                                    <Clock className="h-4 w-4" />
                                    {tourData.durationDays}N{tourData.durationNights}Đ
                                </div>
                                <div className="flex items-center gap-1.5 backdrop-blur-md bg-white/10 px-3 py-1.5 rounded-lg">
                                    <Activity className="h-4 w-4" />
                                    {tourData.difficultyLevel === 'EASY' ? 'Dễ' : tourData.difficultyLevel === 'MODERATE' ? 'Thường' : 'Khó'}
                                </div>
                                <div className="flex items-center gap-1.5 backdrop-blur-md bg-white/10 px-3 py-1.5 rounded-lg">
                                    <Users className="h-4 w-4" />
                                    Tối đa {tourData.maxParticipants} khách
                                </div>
                            </div>

                            <div className="mt-8 flex items-baseline gap-2">
                                <span className="text-sm font-medium text-slate-400">Giá chỉ từ</span>
                                <span className="text-4xl font-black text-white">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tourData.basePrice || 0)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Detailed Info */}
                    <div className="flex flex-1 flex-col overflow-hidden bg-slate-50">
                        {/* Tabs Header */}
                        <div className="border-b border-slate-200 bg-white px-8 pt-6">
                            <div className="flex gap-8 overflow-x-auto no-scrollbar">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`relative pb-4 text-sm font-bold transition-all ${activeTab === tab.id
                                            ? 'text-indigo-600'
                                            : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        {tab.label}
                                        {activeTab === tab.id && (
                                            <div className="absolute bottom-0 left-0 h-1 w-full rounded-full bg-indigo-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                            {activeTab === 'overview' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <section>
                                        <h3 className="mb-4 text-xl font-bold text-slate-800 flex items-center gap-2">
                                            <Star className="text-yellow-500 fill-current" />
                                            Điểm nổi bật
                                        </h3>
                                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">
                                            <p className="whitespace-pre-wrap leading-relaxed text-slate-600 italic">
                                                "{tourData.highlights || 'Chưa có thông tin điểm nổi bật'}"
                                            </p>
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="mb-4 text-xl font-bold text-slate-800">Mô tả chi tiết</h3>
                                        <p className="whitespace-pre-wrap leading-relaxed text-slate-600">
                                            {tourData.description || 'Chưa có mô tả chi tiết'}
                                        </p>
                                    </section>

                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                                            <h4 className="mb-3 font-bold text-slate-800 flex items-center gap-2">
                                                <MapPin className="text-indigo-600" />
                                                Điểm khởi hành
                                            </h4>
                                            <p className="text-slate-600 font-medium">{tourData.departureLocation || 'Chưa xác định'}</p>
                                        </div>
                                        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                                            <h4 className="mb-3 font-bold text-slate-800 flex items-center gap-2 text-indigo-600">
                                                🚌 Vận chuyển
                                            </h4>
                                            <p className="text-slate-600 font-medium">{tourData.transportationType || 'Chưa xác định'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'itinerary' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                    {tourData.itinerary?.length > 0 ? (
                                        tourData.itinerary.map((day: any, idx: number) => (
                                            <div key={idx} className="relative pl-10">
                                                {/* Timeline line */}
                                                {idx !== tourData.itinerary.length - 1 && (
                                                    <div className="absolute left-[18px] top-10 h-full w-0.5 bg-slate-200" />
                                                )}
                                                {/* Timeline dot */}
                                                <div className="absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-indigo-600 text-sm font-bold text-white shadow-md">
                                                    {day.dayNumber || idx + 1}
                                                </div>

                                                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 mb-4">
                                                    <h4 className="mb-2 text-lg font-bold text-slate-800">{day.title || `Ngày ${idx + 1}`}</h4>
                                                    <div className="mb-4 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                        <span className="flex items-center gap-1.5">
                                                            <UtensilsCrossed className="h-3.5 w-3.5" />
                                                            {day.meals || 'Tự túc'}
                                                        </span>
                                                        <span className="flex items-center gap-1.5 text-indigo-500">
                                                            <Hotel className="h-3.5 w-3.5" />
                                                            {day.accommodation || 'Đang cập nhật'}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{day.description}</p>

                                                    {day.places?.length > 0 && (
                                                        <div className="mt-4 flex flex-wrap gap-2">
                                                            {day.places.map((p: any, pIdx: number) => (
                                                                <span key={pIdx} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 border border-slate-200">
                                                                    #{p.placeName || 'Địa điểm'}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex h-64 flex-col items-center justify-center text-slate-400">
                                            <Zap className="h-12 w-12 mb-4 opacity-20" />
                                            <p className="font-medium text-lg">Chưa có thông tin lịch trình</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'amenities' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid gap-8 lg:grid-cols-2">
                                        <section>
                                            <h4 className="mb-6 text-lg font-bold text-slate-800 flex items-center gap-2">
                                                <div className="h-8 w-1 bg-indigo-600 rounded-full" />
                                                Bao gồm dịch vụ
                                            </h4>
                                            <div className="space-y-4">
                                                {tourData.includedServices?.split('\n').filter((s: string) => s.trim()).map((service: string, idx: number) => (
                                                    <div key={idx} className="flex gap-3">
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                                        <span className="text-slate-600 font-medium leading-tight">{service}</span>
                                                    </div>
                                                )) || 'Đang cập nhật...'}

                                                {/* Also show specific amenities marked as included */}
                                                {tourData.amenities?.filter((a: any) => a.isIncluded).map((a: any, idx: number) => (
                                                    <div key={idx} className="flex gap-3">
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                                        <span className="text-slate-600 font-medium leading-tight">{a.amenityName}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        <section>
                                            <h4 className="mb-6 text-lg font-bold text-slate-800 flex items-center gap-2">
                                                <div className="h-8 w-1 bg-rose-500 rounded-full" />
                                                Không bao gồm
                                            </h4>
                                            <div className="space-y-4 opacity-80">
                                                {tourData.excludedServices?.split('\n').filter((s: string) => s.trim()).map((service: string, idx: number) => (
                                                    <div key={idx} className="flex gap-3">
                                                        <span className="h-5 w-5 rounded-full border-2 border-slate-300 text-slate-300 flex items-center justify-center text-[10px] font-black shrink-0">X</span>
                                                        <span className="text-slate-500 font-medium leading-tight">{service}</span>
                                                    </div>
                                                )) || 'Đang cập nhật...'}
                                            </div>
                                        </section>
                                    </div>

                                    <section className="rounded-2xl border border-yellow-100 bg-yellow-50/50 p-6">
                                        <h4 className="mb-4 text-lg font-bold text-yellow-800 flex items-center gap-2">
                                            <Star className="h-5 w-5 fill-current" />
                                            Tiện nghi tùy chọn (Mua thêm)
                                        </h4>
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {tourData.amenities?.filter((a: any) => a.isOptional).map((a: any, idx: number) => (
                                                <div key={idx} className="rounded-xl bg-white p-4 shadow-sm border border-yellow-200 flex justify-between items-center group hover:border-yellow-400 transition">
                                                    <span className="font-bold text-slate-700 text-sm">{a.amenityName}</span>
                                                    <span className="text-xs font-black text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                                                        {new Intl.NumberFormat('vi-VN').format(a.price)}đ
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeTab === 'policy' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <section className="rounded-2xl border border-blue-100 bg-white p-8 shadow-sm">
                                        <h4 className="mb-6 text-xl font-bold text-slate-800 flex items-center gap-2">
                                            <ShieldCheck className="text-indigo-600 h-6 w-6" />
                                            Điều khoản & Điều kiện
                                        </h4>
                                        <p className="whitespace-pre-wrap leading-relaxed text-slate-600 text-sm font-medium">
                                            {tourData.termsConditions || 'Chưa cập nhật chính sách cụ thể.'}
                                        </p>
                                    </section>

                                    <section className="rounded-2xl border border-rose-100 bg-rose-50/30 p-8">
                                        <h4 className="mb-6 text-xl font-bold text-rose-800 flex items-center gap-2">
                                            <Info className="h-6 w-6" />
                                            Chính sách hoàn hủy
                                        </h4>
                                        <p className="whitespace-pre-wrap leading-relaxed text-rose-900/70 text-sm font-bold">
                                            {tourData.cancellationPolicy || 'Chưa cập nhật chính sách hoàn hủy.'}
                                        </p>
                                    </section>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer (Action) */}
                        <div className="border-t border-slate-200 bg-white px-8 py-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-slate-500 italic">
                                    * Trình xem trước này được tạo từ dữ liệu form hiện tại
                                </div>
                                <button
                                    onClick={onClose}
                                    className="rounded-xl bg-slate-900 px-10 py-3 font-bold text-white transition hover:bg-slate-800 hover:scale-105 active:scale-95 shadow-xl"
                                >
                                    Quay lại chỉnh sửa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
        </div>
    );
}
