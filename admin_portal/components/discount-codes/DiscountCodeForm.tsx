'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Tag, Percent, DollarSign, Shuffle } from 'lucide-react';

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

interface DiscountCodeFormProps {
  promotion?: Promotion | null;
  onSubmit: (data: Omit<Promotion, 'id' | 'isExpired'>) => Promise<void>;
  onClose: () => void;
  isPage?: boolean;
  title?: string;
  description?: string;
}

export default function DiscountCodeForm({
  promotion,
  onSubmit,
  onClose,
  isPage = false,
  title,
  description,
}: DiscountCodeFormProps) {
  const [formData, setFormData] = useState<Omit<Promotion, 'id' | 'isExpired'>>({
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    maxDiscountAmount: undefined,
    minOrderAmount: undefined,
    maxUses: undefined,
    maxUsesPerUser: 1,
    validFrom: '',
    validTo: '',
    isActive: true,
    isPublic: true,
    applicableTourIds: [],
    applicableCategoryIds: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize form with promotion data
  useEffect(() => {
    if (promotion) {
      setFormData({
        code: promotion.code,
        name: promotion.name,
        description: promotion.description || '',
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        maxDiscountAmount: promotion.maxDiscountAmount,
        minOrderAmount: promotion.minOrderAmount,
        maxUses: promotion.maxUses,
        maxUsesPerUser: promotion.maxUsesPerUser,
        validFrom: promotion.validFrom,
        validTo: promotion.validTo,
        isActive: promotion.isActive,
        isPublic: promotion.isPublic !== false,
        applicableTourIds: promotion.applicableTourIds || [],
        applicableCategoryIds: promotion.applicableCategoryIds || [],
      });
    }
  }, [promotion]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Mã là bắt buộc';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Tên là bắt buộc';
    }
    if (formData.discountValue <= 0) {
      newErrors.discountValue = 'Giá trị giảm giá phải lớn hơn 0';
    }
    if (formData.discountType === 'PERCENTAGE' && formData.discountValue > 100) {
      newErrors.discountValue = 'Phần trăm không thể vượt quá 100%';
    }
    if (!formData.validFrom) {
      newErrors.validFrom = 'Ngày bắt đầu là bắt buộc';
    }
    if (!formData.validTo) {
      newErrors.validTo = 'Ngày kết thúc là bắt buộc';
    }
    if (formData.validFrom && formData.validTo) {
      if (new Date(formData.validFrom) >= new Date(formData.validTo)) {
        newErrors.validTo = 'Ngày kết thúc phải sau ngày bắt đầu';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateRandomCode = () => {
    const prefixes = ['PROMO', 'SALE', 'DISCOUNT', 'SPECIAL'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    const code = `${prefix}${randomPart}${timestamp}`;

    setFormData(prev => ({ ...prev, code }));

    if (errors.code) {
      const newErrors = { ...errors };
      delete newErrors.code;
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';

    if (['discountValue', 'maxDiscountAmount', 'minOrderAmount', 'maxUses', 'maxUsesPerUser'].includes(name)) {
      setFormData(prev => ({
        ...prev,
        [name]: value ? parseFloat(value) : undefined
      }));
    } else if (isCheckbox) {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const formBody = (
    <div className="space-y-7">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Code */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <Tag size={16} /> Mã Giảm Giá
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              disabled={!!promotion}
              placeholder="VD: SUMMER2024"
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all disabled:bg-slate-50 disabled:text-slate-600 uppercase"
            />
            {!promotion && (
              <button
                type="button"
                onClick={generateRandomCode}
                className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
              >
                <Shuffle size={18} /> Random
              </button>
            )}
          </div>
          {errors.code && <p className="text-red-600 text-sm mt-1">{errors.code}</p>}
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Tên Mã</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="VD: Giảm giá hè 2024"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
          />
          {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Discount Type */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Loại Giảm Giá</label>
          <select
            name="discountType"
            value={formData.discountType}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all cursor-pointer bg-white"
          >
            <option value="PERCENTAGE">Phần trăm (%)</option>
            <option value="FIXED_AMOUNT">Số tiền cố định</option>
          </select>
        </div>

        {/* Discount Value */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
            {formData.discountType === 'PERCENTAGE' ? <Percent size={16} /> : <DollarSign size={16} />}
            Giá Trị {formData.discountType === 'PERCENTAGE' ? '(%)' : ''}
          </label>
          <input
            type="number"
            name="discountValue"
            value={formData.discountValue}
            onChange={handleChange}
            placeholder="0"
            step={formData.discountType === 'PERCENTAGE' ? '1' : '1000'}
            min="0"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
          />
          {errors.discountValue && <p className="text-red-600 text-sm mt-1">{errors.discountValue}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Min Order Amount */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Đơn Hàng Tối Thiểu</label>
          <input
            type="number"
            name="minOrderAmount"
            value={formData.minOrderAmount || ''}
            onChange={handleChange}
            placeholder="0"
            min="0"
            step="1000"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
          />
        </div>

        {/* Max Discount Amount */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Giảm Tối Đa (tùy chọn)</label>
          <input
            type="number"
            name="maxDiscountAmount"
            value={formData.maxDiscountAmount || ''}
            onChange={handleChange}
            placeholder="Không giới hạn"
            min="0"
            step="1000"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">Mô Tả</label>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          placeholder="Nhập mô tả chi tiết về mã giảm giá..."
          rows={3}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Valid From */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <Calendar size={16} /> Ngày Bắt Đầu
          </label>
          <input
            type="datetime-local"
            name="validFrom"
            value={formData.validFrom ? new Date(formData.validFrom).toISOString().slice(0, 16) : ''}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
          />
          {errors.validFrom && <p className="text-red-600 text-sm mt-1">{errors.validFrom}</p>}
        </div>

        {/* Valid To */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <Calendar size={16} /> Ngày Kết Thúc
          </label>
          <input
            type="datetime-local"
            name="validTo"
            value={formData.validTo ? new Date(formData.validTo).toISOString().slice(0, 16) : ''}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
          />
          {errors.validTo && <p className="text-red-600 text-sm mt-1">{errors.validTo}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Max Uses */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Số Lượng Có Thể Dùng</label>
          <input
            type="number"
            name="maxUses"
            value={formData.maxUses || ''}
            onChange={handleChange}
            placeholder="Không giới hạn"
            min="1"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
          />
        </div>

        {/* Max Uses Per User */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Lần/Người</label>
          <input
            type="number"
            name="maxUsesPerUser"
            value={formData.maxUsesPerUser || 1}
            onChange={handleChange}
            min="1"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
          />
        </div>

        <div className="flex items-center gap-8 pt-6">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-900">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-5 h-5 rounded border-slate-300 accent-blue-600"
            />
            Kích hoạt
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-900">
            <input
              type="checkbox"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleChange}
              className="w-5 h-5 rounded border-slate-300 accent-blue-600"
            />
            Công khai
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end pt-8 border-t border-slate-100 mt-10">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all disabled:opacity-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-100"
        >
          {submitting ? 'Đang lưu...' : (promotion ? 'Cập Nhật' : 'Tạo Mã')}
        </button>
      </div>
    </div>
  );

  if (isPage) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="px-8 py-6 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900">{title || (promotion ? 'Cập Nhật Mã' : 'Tạo Mã Mới')}</h2>
          {description && <p className="text-slate-500 text-sm mt-1">{description}</p>}
        </div>
        <form onSubmit={handleSubmit} className="p-8">
          {formBody}
        </form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {promotion ? 'Cập Nhật Mã Giảm Giá' : 'Tạo Mã Giảm Giá Mới'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8">
          {formBody}
        </form>
      </div>
    </div>
  );
}
