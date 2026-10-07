'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import DiscountCodeForm from '@/components/discount-codes/DiscountCodeForm';
import couponHttp from '@/services/promotion.service';

export default function NewDiscountCodePage() {
    const router = useRouter();
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleCreate = async (data: any) => {
        try {
            const payload = {
                code: data.code,
                name: data.name,
                description: data.description,
                discount_type: data.discountType,
                discount_value: data.discountValue,
                max_discount_amount: data.max_discount_amount || data.maxDiscountAmount,
                min_order_amount: data.min_order_amount || data.minOrderAmount,
                max_uses: data.maxUses,
                max_uses_per_user: data.maxUsesPerUser,
                valid_from: data.validFrom,
                valid_to: data.validTo,
                is_active: data.isActive,
                is_public: data.isPublic,
                applicable_tour_ids: data.applicableTourIds,
                applicable_category_ids: data.applicableCategoryIds,
            };

            const response = await couponHttp.post('/', payload);
            if (response.data) {
                setMessage({ type: 'success', text: 'Tạo mã giảm giá thành công!' });
                setTimeout(() => {
                    router.push('/settings/discount-codes');
                }, 1500);
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Lỗi khi tạo mã giảm giá' });
            console.error('Error creating promotion:', error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-6 font-medium"
                >
                    <ChevronLeft size={20} />
                    Quay lại danh sách
                </button>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Tạo Mã Giảm Giá Mới</h1>
                    <p className="text-slate-600">Thiết lập chương trình khuyến mãi mới cho khách hàng</p>
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

                {/* Form Container */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <DiscountCodeForm
                        isPage={true}
                        onSubmit={handleCreate}
                        onClose={() => router.push('/settings/discount-codes')}
                    />
                </div>
            </div>
        </div>
    );
}
