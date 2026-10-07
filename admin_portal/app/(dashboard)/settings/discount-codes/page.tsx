'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import DiscountCodeTable from '@/components/discount-codes/DiscountCodeTable';
import couponHttp from '@/services/promotion.service';
import { Can } from '@/components/common/AccessControl';

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

export default function DiscountCodesPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [filteredPromotions, setFilteredPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Map API response to frontend interface
  const mapPromotion = (item: any): Promotion => ({
    id: item.id,
    code: item.code,
    name: item.name,
    description: item.description,
    discountType: item.discount_type,
    discountValue: typeof item.discount_value === 'string' ? parseFloat(item.discount_value) : item.discount_value,
    maxDiscountAmount: item.max_discount_amount ? parseFloat(item.max_discount_amount.toString()) : undefined,
    minOrderAmount: item.min_order_amount ? parseFloat(item.min_order_amount.toString()) : 0,
    maxUses: item.max_uses,
    maxUsesPerUser: item.max_uses_per_user || 1,
    validFrom: item.valid_from,
    validTo: item.valid_to,
    isActive: item.is_active,
    isPublic: item.is_public,
    applicableTourIds: item.applicable_tour_ids,
    applicableCategoryIds: item.applicable_category_ids,
    isExpired: new Date(item.valid_to) < new Date()
  });

  // Fetch promotions
  const fetchPromotions = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await couponHttp.get('/');
      if (Array.isArray(response.data)) {
        setPromotions(response.data.map(mapPromotion));
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Không thể tải mã giảm giá' });
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter promotions
  useEffect(() => {
    let filtered = promotions;

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(p => {
        if (statusFilter === 'ACTIVE') return p.isActive && !p.isExpired;
        if (statusFilter === 'INACTIVE') return !p.isActive || p.isExpired;
        return true;
      });
    }

    setFilteredPromotions(filtered);
  }, [searchQuery, statusFilter, promotions]);

  // Initial load
  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  // Handle delete
  const handleDelete = async (code: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa mã giảm giá này?')) return;

    try {
      const promotion = promotions.find(p => p.code === code);
      if (!promotion?.id) {
        setMessage({ type: 'error', text: 'Không tìm thấy mã giảm giá' });
        return;
      }

      await couponHttp.delete(`/${promotion.id}`);
      setPromotions(promotions.filter(p => p.code !== code));
      setMessage({ type: 'success', text: 'Xóa mã giảm giá thành công!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi khi xóa mã giảm giá' });
      console.error('Error deleting promotion:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-8xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Quản Lý Mã Giảm Giá</h1>
          <p className="text-slate-600">Tạo và quản lý các mã khuyến mãi cho khách hàng</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center justify-between ${message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-sm font-bold opacity-50 hover:opacity-100">&times;</button>
          </div>
        )}

        {/* Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Can permission="discounts_manage">
              <Link
                href="/settings/discount-codes/new"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-100"
              >
                <Plus size={20} />
                Tạo Mã Mới
              </Link>
            </Can>
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600">
              Tổng cộng: <span className="text-slate-900 font-bold">{promotions.length}</span> mã
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-72 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm mã hoặc tên chương trình..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
              />
            </div>

            <div className="relative min-w-52">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full pl-11 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer font-medium text-slate-700"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Ngừng hoạt động</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <DiscountCodeTable
            promotions={filteredPromotions}
            loading={loading}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
