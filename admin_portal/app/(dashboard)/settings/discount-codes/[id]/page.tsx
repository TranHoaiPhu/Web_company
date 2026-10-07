'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Loader2 } from 'lucide-react';
import DiscountCodeForm from '@/components/discount-codes/DiscountCodeForm';
import couponHttp from '@/services/promotion.service';

interface Promotion {
    id?: number;
    code: string;
    name: string;
    description?: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
    maxDiscountAmount?: number;
    minOrderAmount?: number;
    maxUses?: number;
    maxUsesPerUser?: number;
    validFrom: string;
    validTo: string;
    isActive: boolean;
    isPublic?: boolean;
    applicableTourIds?: number[];
    applicableCategoryIds?: number[];
    isExpired?: boolean;
}

export default function EditDiscountCodePage() {
    const router = useRouter();
    const { id } = useParams();
    const [promotion, setPromotion] = useState<Promotion | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const fetchPromotion = async () => {
            try {
                setLoading(true);
                const response = await couponHttp.get(`/${id}`);
                if (response.data) {
                    const item = response.data;
                    setPromotion({
                        id: item.id,
                        code: item.code,
                        name: item.name,
                        description: item.description,
                        discountType: item.discount_type,
                        discountValue: typeof item.discount_value === 'string' ? parseFloat(item.discount_value) : item.discount_value,
                        maxDiscountAmount: item.max_discount_amount ? parseFloat(item.max_discount_amount.toString()) : undefined,
                        minOrderAmount: item.min_order_amount ? parseFloat(item.min_order_amount.toString()) : undefined,
                        maxUses: item.max_uses,
                        maxUsesPerUser: item.max_uses_per_user,
                        validFrom: item.valid_from,
                        validTo: item.valid_to,
                        isActive: item.is_active,
                        isPublic: item.is_public,
                        applicableTourIds: item.applicable_tour_ids,
                        applicableCategoryIds: item.applicable_category_ids,
                    });
                }
            } catch (error) {
                console.error('Error fetching promotion:', error);
                setMessage({ type: 'error', text: 'Không thể tải thông tin mã giảm giá' });
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchPromotion();
    }, [id]);

    const handleUpdate = async (data: any) => {
        try {
            const payload = {
                code: data.code,
                name: data.name,
                description: data.description,
                discount_type: data.discountType,
                discount_value: data.discountValue,
                max_discount_amount: data.maxDiscountAmount,
                min_order_amount: data.minOrderAmount,
                max_uses: data.maxUses,
                max_uses_per_user: data.maxUsesPerUser,
                valid_from: data.validFrom,
                valid_to: data.validTo,
                is_active: data.isActive,
                is_public: data.isPublic,
                applicable_tour_ids: data.applicableTourIds,
                applicable_category_ids: data.applicableCategoryIds,
            };

            const response = await couponHttp.put(`/${id}`, payload);
            if (response.data) {
                setMessage({ type: 'success', text: 'Cập nhật mã giảm giá thành công!' });
                setTimeout(() => {
                    router.push('/settings/discount-codes');
                }, 1500);
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Lỗi khi cập nhật mã giảm giá' });
            console.error('Error updating promotion:', error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-8xl mx-auto px-6 py-8">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/settings/discount-codes')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-6 font-medium"
                >
                    <ChevronLeft size={20} />
                    Quay lại danh sách
                </button>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Chỉnh Sửa Mã Giảm Giá</h1>
                    <p className="text-slate-600">Cập nhật các thông số chương trình khuyến mãi</p>
                </div>

                {/* Message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                        <p className="font-semibold">{message.text}</p>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="bg-white rounded-3xl p-20 flex flex-col items-center justify-center border border-slate-200 shadow-sm">
                        <Loader2 size={40} className="text-blue-600 animate-spin mb-4" />
                        <p className="text-slate-500 font-medium">Đang tải thông tin mã...</p>
                    </div>
                ) : promotion ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <DiscountCodeForm
                            promotion={promotion}
                            isPage={true}
                            onSubmit={handleUpdate}
                            onClose={() => router.push('/settings/discount-codes')}
                        />
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-20 text-center border border-slate-200 shadow-sm">
                        <p className="text-slate-500">Không tìm thấy thông tin mã giảm giá.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
