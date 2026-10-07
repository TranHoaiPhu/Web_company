import { Tour } from "@/services/tour.service";
import { Edit, Trash2, Eye, Calendar, Tag, ShoppingCart, MapPin, Zap, Flame, Users, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Can } from "../common/AccessControl";

interface TourTableProps {
    tours: Tour[];
    loading: boolean;
    onDelete: (id: string) => void;
    currentPage?: number;
    pageSize?: number;
}

export default function TourTable({ tours, loading, onDelete, currentPage = 1, pageSize = 10 }: TourTableProps) {
    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-8">
                <div className="space-y-5">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-5 animate-pulse">
                            <div className="w-20 h-20 bg-slate-100 rounded-xl"></div>
                            <div className="flex-1 space-y-3">
                                <div className="h-5 bg-slate-200 rounded w-2/3"></div>
                                <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-10 h-10 bg-slate-100 rounded-lg"></div>
                                <div className="w-10 h-10 bg-slate-100 rounded-lg"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const formatPrice = (price?: number) => {
        if (price === undefined) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'INACTIVE': return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'DRAFT': return 'bg-amber-50 text-amber-700 border-amber-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden" style={{ fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif" }}>
            {/* Header */}
            <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200">
                <div className="grid grid-cols-12 gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-1 text-center">STT</div>
                    <div className="col-span-3">Thông tin Tour</div>
                    <div className="col-span-2">Giá & Quy mô</div>
                    <div className="col-span-2">Phân loại</div>
                    <div className="col-span-1 text-center">Thống kê</div>
                    <div className="col-span-1 text-center">Trạng thái</div>
                    <div className="col-span-2 text-right">Thao tác</div>
                </div>
            </div>

            {/* Body */}
            <div className="divide-y divide-slate-100">
                {tours.length === 0 ? (
                    <div className="px-6 py-20 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                            <Eye size={32} className="text-slate-400" />
                        </div>
                        <p className="text-slate-400 text-base font-medium">
                            Không có tour nào. Hãy tạo tour mới!
                        </p>
                    </div>
                ) : (
                    tours.map((tour, index) => (
                        <div
                            key={tour.id}
                            className="px-6 py-5 hover:bg-slate-50/50 transition-colors duration-200 group"
                        >
                            <div className="grid grid-cols-12 gap-4 items-center">
                                {/* STT */}
                                <div className="col-span-1">
                                    <div className="flex items-center justify-center w-8 h-8 bg-slate-100/80 rounded-lg font-bold text-slate-500 text-xs">
                                        {(currentPage - 1) * pageSize + index + 1}
                                    </div>
                                </div>

                                {/* Tour Info */}
                                <div className="col-span-3">
                                    <div className="flex items-center gap-4">
                                        <div className="relative shrink-0">
                                            <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm group-hover:border-blue-300 transition-colors bg-slate-50">
                                                {tour.coverImage ? (
                                                    <img
                                                        src={tour.coverImage}
                                                        alt={tour.name}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center w-full h-full bg-slate-100">
                                                        <Eye size={24} className="text-slate-300" />
                                                    </div>
                                                )}
                                            </div>
                                            {/* Badges on image */}
                                            <div className="absolute -top-2 -left-2 flex flex-col gap-1">
                                                {tour.isFeatured && (
                                                    <div className="bg-amber-400 text-white p-1 rounded-md shadow-sm border border-white" title="Tour nổi bật">
                                                        <Zap size={10} fill="currentColor" />
                                                    </div>
                                                )}
                                                {tour.isHotDeal && (
                                                    <div className="bg-rose-500 text-white p-1 rounded-md shadow-sm border border-white" title="Hot Deal">
                                                        <Flame size={10} fill="currentColor" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                {tour.name}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter border border-blue-100">
                                                    #{tour.id}
                                                </span>
                                                <span className="text-[11px] text-slate-400 truncate font-medium">
                                                    {tour.slug}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Price & Duration & Capacity */}
                                <div className="col-span-2">
                                    <div className="space-y-1.5">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-base font-extrabold text-blue-600">
                                                {Number(tour.basePrice).toLocaleString()}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">VNĐ</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <Calendar size={12} className="text-slate-400" />
                                                <span className="text-xs font-semibold">
                                                    {tour.durationDays}N{tour.durationNights && tour.durationNights > 0 ? `/${tour.durationNights}Đ` : ""}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <Users size={12} className="text-slate-400" />
                                                <span className="text-xs font-semibold">Tối đa: {tour.maxParticipants} khách</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Category & Location */}
                                <div className="col-span-2">
                                    <div className="space-y-2">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100/50 rounded-lg border border-slate-200/60 w-full overflow-hidden">
                                            <Tag size={12} className="text-slate-400 shrink-0" />
                                            <span className="text-xs font-bold text-slate-600 truncate">
                                                {tour.categoryName || 'Chưa định danh'}
                                            </span>
                                        </div>
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50/30 rounded-lg border border-blue-100 w-full overflow-hidden">
                                            <MapPin size={12} className="text-blue-400 shrink-0" />
                                            <span className="text-xs font-bold text-blue-700 truncate">
                                                {tour.locationName || 'Toàn quốc'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="col-span-1">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <ShoppingCart size={14} className="text-blue-500" />
                                            <span className="text-xs font-bold">{tour.bookingCount || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <BarChart3 size={14} className="text-slate-400" />
                                            <span className="text-xs font-bold">{tour.viewCount || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="col-span-1">
                                    <div className="flex justify-center">
                                        <span className={`inline-flex items-center px-2 py-1 text-[10px] font-extrabold rounded-md border shadow-xs ${getStatusColor(tour.status)}`}>
                                            <div className={`w-1 h-1 rounded-full mr-1.5 animate-pulse ${tour.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                            {tour.status === 'ACTIVE' ? 'HIỂN THỊ' : tour.status === 'INACTIVE' ? 'ĐÃ TẮT' : 'NHÁP'}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="col-span-2">
                                    <div className="flex items-center justify-end gap-2">
                                        <a
                                            href={`/tours/${tour.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-slate-600 hover:text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg transition-all shadow-sm"
                                            title="Xem trên hệ thống"
                                        >
                                            <Eye size={16} />
                                        </a>
                                        <Can permission="tours_edit">
                                            <Link
                                                href={`/tours/${tour.id}/edit`}
                                                className="p-2 text-slate-600 hover:text-amber-600 bg-white hover:bg-amber-50 border border-slate-200 rounded-lg transition-all shadow-sm"
                                                title="Sửa Tour"
                                            >
                                                <Edit size={16} />
                                            </Link>
                                        </Can>
                                        <Can permission="tours_delete">
                                            <button
                                                onClick={() => onDelete(tour.id)}
                                                className="p-2 text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 rounded-lg transition-all shadow-sm"
                                                title="Gỡ bỏ"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </Can>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}