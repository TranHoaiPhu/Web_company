'use client';

import { useState } from 'react';
import { Edit2, Trash2, Calendar, Percent, DollarSign, AlertCircle, Mail, Radio, Loader2, Check, X, Users } from 'lucide-react';
import { formatCurrency, formatDate, getStatusBadgeClass, getStatusDotColor, getStatusText } from './utils';
import { Can } from '../common/AccessControl';
import SendEmailModal from './SendEmailModal';
import BroadcastEmailModal from './BroadcastEmailModal';
import couponHttp from '@/services/promotion.service';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

interface DiscountCodeTableProps {
  promotions: Promotion[];
  loading: boolean;
  onDelete: (code: string) => void;
}

export default function DiscountCodeTable({
  promotions,
  loading,
  onDelete,
}: DiscountCodeTableProps) {
  const router = useRouter();
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastPromotion, setBroadcastPromotion] = useState<Promotion | null>(null);

  const handleOpenEmailModal = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setEmailModalOpen(true);
  };

  const handleOpenBroadcastModal = (promotion: Promotion) => {
    setBroadcastPromotion(promotion);
    setBroadcastModalOpen(true);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-10 bg-slate-200 rounded flex-1"></div>
                <div className="h-10 bg-slate-200 rounded w-32"></div>
                <div className="h-10 bg-slate-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (promotions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
            <AlertCircle size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Không tìm thấy mã giảm giá</h3>
          <p className="text-slate-600">Hãy tạo mã giảm giá đầu tiên của bạn</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-linear-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
        <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
          <div className="col-span-2">Mã</div>
          <div className="col-span-2">Tên</div>
          <div className="col-span-2">Giảm Giá</div>
          <div className="col-span-2">Hiệu Lực</div>
          <div className="col-span-2">Trạng Thái</div>
          <div className="col-span-2 text-right">Thao Tác</div>
        </div>
      </div>

      {/* Body */}
      <div className="divide-y divide-slate-100">
        {promotions.map((promotion) => (
          <div
            key={promotion.code}
            className="px-6 py-4 hover:bg-slate-50 transition-colors duration-150 group"
          >
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Code */}
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <code className="bg-slate-100 text-slate-900 px-2.5 py-1 rounded font-mono text-sm font-semibold">
                    {promotion.code}
                  </code>
                </div>
              </div>

              {/* Name */}
              <div className="col-span-2">
                <p className="text-slate-900 font-medium truncate" title={promotion.name}>
                  {promotion.name}
                </p>
              </div>

              {/* Discount */}
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  {promotion.discountType === 'PERCENTAGE' ? (
                    <>
                      <Percent size={16} className="text-blue-600" />
                      <span className="font-semibold text-slate-900">{promotion.discountValue}%</span>
                    </>
                  ) : (
                    <>
                      <DollarSign size={16} className="text-green-600" />
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(promotion.discountValue)}
                      </span>
                    </>
                  )}
                </div>
                {promotion.minOrderAmount && (
                  <p className="text-xs text-slate-500 mt-1">
                    Tối thiểu: {formatCurrency(promotion.minOrderAmount)}
                  </p>
                )}
              </div>

              {/* Valid */}
              <div className="col-span-2">
                <div className="flex items-start gap-2">
                  <Calendar size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    {promotion.validFrom && (
                      <p className="text-slate-600">{formatDate(promotion.validFrom)}</p>
                    )}
                    {promotion.validTo && (
                      <p className="text-slate-600">{formatDate(promotion.validTo)}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="col-span-2">
                <span className={getStatusBadgeClass(promotion.isActive, promotion.isExpired)}>
                  <span className={`w-2 h-2 rounded-full ${getStatusDotColor(promotion.isActive, promotion.isExpired)}`}></span>
                  {getStatusText(promotion.isActive, promotion.isExpired)}
                </span>
              </div>

              {/* Actions */}
              <div className="col-span-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Can permission="discounts_manage">
                    <button
                      onClick={() => handleOpenBroadcastModal(promotion)}
                      className="p-2 hover:bg-orange-50 rounded-lg transition-colors text-orange-600 hover:text-orange-700"
                      title="Gửi đến tất cả"
                    >
                      <Radio size={18} />
                    </button>
                    <button
                      onClick={() => handleOpenEmailModal(promotion)}
                      className="p-2 hover:bg-violet-50 rounded-lg transition-colors text-violet-600 hover:text-violet-700"
                      title="Gửi qua email"
                    >
                      <Mail size={18} />
                    </button>
                    <Link
                      href={`/settings/discount-codes/${promotion.id}`}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 hover:text-blue-700"
                      title="Sửa"
                    >
                      <Edit2 size={18} />
                    </Link>
                    <button
                      onClick={() => onDelete(promotion.code)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 hover:text-red-700"
                      title="Xóa"
                    >
                      <Trash2 size={18} />
                    </button>
                  </Can>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Send Email Modal */}
      {selectedPromotion && (
        <SendEmailModal
          isOpen={emailModalOpen}
          onClose={() => {
            setEmailModalOpen(false);
            setSelectedPromotion(null);
          }}
          couponId={selectedPromotion.id!}
          couponCode={selectedPromotion.code}
          couponName={selectedPromotion.name}
          couponDetails={{
            code: selectedPromotion.code,
            name: selectedPromotion.name,
            description: selectedPromotion.description,
            discount_type: selectedPromotion.discountType,
            discount_value: selectedPromotion.discountValue,
            max_discount_amount: selectedPromotion.maxDiscountAmount,
            min_order_amount: selectedPromotion.minOrderAmount,
            valid_from: selectedPromotion.validFrom,
            valid_to: selectedPromotion.validTo,
          }}
        />
      )}

      {/* Broadcast Email Modal */}
      {broadcastModalOpen && broadcastPromotion && (
        <BroadcastEmailModal
          isOpen={broadcastModalOpen}
          onClose={() => {
            setBroadcastModalOpen(false);
            setBroadcastPromotion(null);
          }}
          couponId={broadcastPromotion.id!}
          couponCode={broadcastPromotion.code}
          couponName={broadcastPromotion.name}
          couponDetails={{
            code: broadcastPromotion.code,
            name: broadcastPromotion.name,
            description: broadcastPromotion.description,
            discount_type: broadcastPromotion.discountType,
            discount_value: broadcastPromotion.discountValue,
            max_discount_amount: broadcastPromotion.maxDiscountAmount,
            min_order_amount: broadcastPromotion.minOrderAmount,
            valid_from: broadcastPromotion.validFrom,
            valid_to: broadcastPromotion.validTo,
          }}
        />
      )}
    </div>
  );
}
