/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useCallback } from 'react';
import { Tag, CheckCircle2, XCircle, Loader2, X, Info } from 'lucide-react';
import { couponService } from '@/services/coupons/coupon.service';
import { ValidateCouponParams } from '@/types/coupon';

const formatPrice = (amount: number): string => {
  return amount.toLocaleString('vi-VN') + ' ₫';
};

interface CouponSectionProps {
  onApplyCoupon: (discountAmount: number, couponCode: string) => void;
  currentTotal: number;
  userId?: number | string;
  tourId?: number | string;
  categoryId?: number | string;
}

export default function CouponSection({
  onApplyCoupon,
  currentTotal,
  userId,
  tourId,
  categoryId,
}: CouponSectionProps) {
  const [couponCode, setCouponCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<
    | { type: 'idle' }
    | { type: 'success'; message: string; discount: number }
    | { type: 'error'; message: string }
  >({ type: 'idle' });

  const handleApply = useCallback(async () => {
    const trimmedCode = couponCode.trim().toUpperCase();

    if (!trimmedCode) {
      setStatus({ type: 'error', message: 'Vui lòng nhập mã giảm giá' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: 'idle' });

    try {
      const payload: ValidateCouponParams = {
        code: trimmedCode,
        user_id: userId ? Number(userId) : undefined,
        order_amount: currentTotal,
        tour_id: tourId ? Number(tourId) : undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
      };

      const response = await couponService.validate(payload);

      if (!response?.valid) {
        const errorMsg =
          response?.message ||
          'Mã giảm giá không hợp lệ hoặc đã hết hạn';

        setStatus({
          type: 'error',
          message: errorMsg,
        });
        setIsLoading(false);
        return;
      }

      const coupon = response.discount;

      if (!coupon) {
        throw new Error('Không tìm thấy thông tin giảm giá từ server');
      }

      let discountAmount = 0;

      if (coupon.discount_type === 'FIXED_AMOUNT') {
        discountAmount = Number(coupon.discount_value);
      } else if (coupon.discount_type === 'PERCENTAGE') {
        discountAmount = Math.round((currentTotal * Number(coupon.discount_value)) / 100);
      }

      if (coupon.max_discount_amount && Number(coupon.max_discount_amount) > 0) {
        discountAmount = Math.min(discountAmount, Number(coupon.max_discount_amount));
      }

      if (coupon.min_order_amount && currentTotal < Number(coupon.min_order_amount)) {
        setStatus({
          type: 'error',
          message: `Đơn hàng phải từ ${formatPrice(Number(coupon.min_order_amount))} trở lên`,
        });
        setIsLoading(false);
        return;
      }

      setStatus({
        type: 'success',
        message: response.message || `Đã áp dụng: ${trimmedCode}`,
        discount: discountAmount,
      });

      onApplyCoupon(discountAmount, trimmedCode);
    } catch (err: any) {
      console.error('Coupon validation error:', err);

      let userMessage = 'Có lỗi xảy ra khi kết nối server. Vui lòng thử lại sau.';
      if (err?.response?.data?.error) {
        userMessage = err.response.data.error;
      } else if (err?.response?.data?.message) {
        userMessage = err.response.data.message;
      } else if (err?.message) {
        userMessage = err.message;
      }

      setStatus({
        type: 'error',
        message: userMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [couponCode, currentTotal, userId, tourId, categoryId, onApplyCoupon]);

  const handleRemoveCoupon = useCallback(() => {
    setCouponCode('');
    setStatus({ type: 'idle' });
    onApplyCoupon(0, '');
  }, [onApplyCoupon]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2.5">
          <Tag className="text-indigo-600" size={20} />
          Mã giảm giá / Voucher
        </h3>
      </div>

      <div className="p-6 space-y-5">
        {/* Input group */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value.toUpperCase());
              if (status.type !== 'idle') setStatus({ type: 'idle' });
            }}
            onKeyDown={handleKeyDown}
            placeholder="Nhập mã giảm giá (ví dụ: TOUR20)"
            className={`
              flex-1 px-4 py-3.5 border border-gray-300 rounded-xl 
              focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 
              outline-none transition-all text-sm uppercase tracking-wide 
              placeholder:text-gray-400
              ${status.type === 'success' ? 'bg-green-50/30 border-green-200' : ''}
              disabled:opacity-60 disabled:cursor-not-allowed
            `}
            disabled={isLoading || status.type === 'success'}
          />

          <div className="flex-col gap-2 sm:gap-3">
            <button
              onClick={handleApply}
              disabled={isLoading || status.type === 'success' || !couponCode.trim()}
              className={`
                min-w-[110px] px-4 py-3.5 rounded-xl font-medium text-sm transition-all 
                flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]
                ${
                  isLoading
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : status.type === 'success'
                    ? 'bg-green-600 text-white cursor-default shadow-green-100'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white'
                }
                disabled:opacity-60
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Đang kiểm tra
                </>
              ) : status.type === 'success' ? (
                <>
                  <CheckCircle2 size={18} />
                  Đã áp dụng
                </>
              ) : (
                'Áp dụng'
              )}
            </button>
          </div>

        
        </div>


          <div>
                 {/* Nút hủy áp dụng */}
            {status.type === 'success' && (
              <button
                onClick={handleRemoveCoupon}
                className="min-w-[100px] px-4 py-3.5 rounded-xl font-medium text-sm transition-all 
                  flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 
                  text-gray-700 border border-gray-300 active:scale-[0.98]"
              >
                <X size={16} />
                Hủy áp dụng
              </button>
            )}
          </div>

        {/* Thông báo trạng thái */}
        {status.type !== 'idle' && (
          <div
            className={`
              p-4 rounded-xl flex items-start gap-3 text-sm border transition-all duration-200
              ${status.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'}
            `}
          >
            {status.type === 'success' ? (
              <CheckCircle2 className="text-green-600 mt-0.5 shrink-0" size={20} />
            ) : (
              <XCircle className="text-red-600 mt-0.5 shrink-0" size={20} />
            )}

            <div className="flex-1 space-y-1">
              <p className="font-semibold">
                {status.type === 'success' ? 'Thành công!' : 'Lỗi!'}
              </p>
              <p className="leading-relaxed">{status.message}</p>

              {status.type === 'success' && status.discount > 0 && (
                <p className="font-bold text-green-700 mt-1">
                  Giảm {formatPrice(status.discount)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Gợi ý điều kiện */}
        <div className="text-xs text-gray-500 space-y-1.5 pt-2 border-t border-gray-100">
          <p className="flex items-center gap-1.5">
            <Info size={14} className="text-gray-400" />
            Mã chỉ áp dụng cho một số tour hoặc danh mục nhất định
          </p>
          <p>• Không áp dụng đồng thời với các chương trình khuyến mãi khác</p>
          <p>• Vui lòng kiểm tra điều kiện sử dụng của từng mã</p>
        </div>
      </div>
    </div>
  );
}