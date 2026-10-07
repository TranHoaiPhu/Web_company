'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Loader2, Check, AlertCircle, Eye, FileEdit, Radio, Users } from 'lucide-react';
import couponHttp from '@/services/promotion.service';

interface CouponDetails {
    code: string;
    name: string;
    description?: string;
    discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discount_value: number;
    max_discount_amount?: number;
    min_order_amount?: number;
    valid_from: string;
    valid_to: string;
}

interface BroadcastEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    couponId: number;
    couponCode: string;
    couponName: string;
    couponDetails: CouponDetails;
}

export default function BroadcastEmailModal({
    isOpen,
    onClose,
    couponId,
    couponCode,
    couponName,
    couponDetails,
}: BroadcastEmailModalProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'content' | 'preview'>('info');
    const [broadcasting, setBroadcasting] = useState(false);
    const [broadcastResult, setBroadcastResult] = useState<{ success: boolean; stats?: { total: number; success: number; failed: number }; error?: string } | null>(null);

    // Email content state
    const [emailSubject, setEmailSubject] = useState('');
    const [emailHeading, setEmailHeading] = useState('Mã Giảm Giá Đặc Biệt!');
    const [emailGreeting, setEmailGreeting] = useState('Chúng tôi gửi tặng bạn một mã giảm giá đặc biệt để sử dụng cho chuyến du lịch tiếp theo. \nĐừng bỏ lỡ cơ hội tiết kiệm này!');
    const [emailCta, setEmailCta] = useState('Khám phá tour ngay');

    // Initialize email content
    useEffect(() => {
        if (couponDetails) {
            const discount = couponDetails.discount_type === 'PERCENTAGE'
                ? `${couponDetails.discount_value}%`
                : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(couponDetails.discount_value);

            setEmailSubject(`[TravelVN] Mã giảm giá ${discount} dành riêng cho bạn!`);
        }
    }, [couponDetails]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    const formatDiscount = () => {
        if (couponDetails.discount_type === 'PERCENTAGE') {
            return `${couponDetails.discount_value}%`;
        }
        return formatCurrency(couponDetails.discount_value);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleBroadcast = async () => {
        setBroadcasting(true);
        setBroadcastResult(null);

        try {
            const response = await couponHttp.post('/broadcast', {
                coupon_id: couponId,
                custom_subject: emailSubject,
                custom_heading: emailHeading,
                custom_greeting: emailGreeting,
                custom_cta: emailCta,
            });

            if (response.data?.success) {
                setBroadcastResult({
                    success: true,
                    stats: response.data.stats,
                });
            } else {
                throw new Error(response.data?.error || 'Gửi broadcast thất bại');
            }
        } catch (error: any) {
            console.error('Error broadcasting:', error);
            setBroadcastResult({
                success: false,
                error: error.response?.data?.error || error.message || 'Lỗi khi gửi broadcast'
            });
        } finally {
            setBroadcasting(false);
        }
    };

    const handleClose = () => {
        if (broadcasting) return;
        setBroadcastResult(null);
        setActiveTab('info');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center mt-16">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="relative z-20 bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 shrink-0 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Radio size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Broadcast Mã Giảm Giá</h3>
                                <p className="text-sm text-white/80">Mã: {couponCode}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X size={20} className="text-white" />
                        </button>
                    </div>
                </div>

                {/* Tab Buttons */}
                <div className="relative z-10 flex border-b border-slate-200 shrink-0 bg-white">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`flex-1 px-4 py-3.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'info'
                            ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <Users size={16} />
                        Thông tin gửi
                    </button>
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`flex-1 px-4 py-3.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'content'
                            ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <FileEdit size={16} />
                        Nội dung email
                    </button>
                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`flex-1 px-4 py-3.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'preview'
                            ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <Eye size={16} />
                        Xem trước
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    {broadcastResult ? (
                        <div className="p-12 text-center">
                            {broadcastResult.success ? (
                                <>
                                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                                        <Check size={40} className="text-green-600" />
                                    </div>
                                    <h4 className="text-2xl font-bold text-slate-900 mb-2">Gửi Broadcast Thành Công!</h4>
                                    <p className="text-slate-500 mb-8">Mã giảm giá đã được xếp hàng và đang được gửi đi.</p>

                                    <div className="max-w-xs mx-auto bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">Tổng số:</span>
                                                <span className="font-bold text-slate-900">{broadcastResult.stats?.total}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">Thành công:</span>
                                                <span className="font-bold text-green-600">{broadcastResult.stats?.success}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">Thất bại:</span>
                                                <span className="font-bold text-red-600">{broadcastResult.stats?.failed}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleClose}
                                        className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                                    >
                                        Đóng cửa sổ
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                                        <X size={40} className="text-red-600" />
                                    </div>
                                    <h4 className="text-2xl font-bold text-slate-900 mb-2">Gửi Broadcast Thất Bại</h4>
                                    <p className="text-red-600 mb-8">{broadcastResult.error}</p>
                                    <button
                                        onClick={() => setBroadcastResult(null)}
                                        className="px-8 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
                                    >
                                        Thử lại
                                    </button>
                                </>
                            )}
                        </div>
                    ) : activeTab === 'info' ? (
                        <div className="p-8">
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                                        <AlertCircle size={24} className="text-amber-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-amber-900 mb-1">Xác nhận gửi cho tất cả người dùng</h4>
                                        <p className="text-amber-800 leading-relaxed">
                                            Bạn đang chuẩn bị gửi mã giảm giá <strong>{couponCode}</strong> cho toàn bộ khách hàng đang hoạt động trong hệ thống.
                                            Hãy kiểm tra kỹ nội dung email trước khi nhấn nút gửi.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500">Mã khuyến mãi</p>
                                    <p className="text-xl font-bold text-slate-900">{couponCode}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500">Giá trị giảm</p>
                                    <p className="text-xl font-bold text-orange-600">{formatDiscount()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500">Tên chương trình</p>
                                    <p className="text-slate-900">{couponName}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500">Hạn sử dụng</p>
                                    <p className="text-slate-900">{formatDate(couponDetails.valid_from)} - {formatDate(couponDetails.valid_to)}</p>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'content' ? (
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Tiêu đề email</label>
                                <input
                                    type="text"
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Tiêu đề chính (trong email)</label>
                                <input
                                    type="text"
                                    value={emailHeading}
                                    onChange={(e) => setEmailHeading(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Lời chào / Nội dung chính</label>
                                <textarea
                                    value={emailGreeting}
                                    onChange={(e) => setEmailGreeting(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nút kêu gọi (CTA)</label>
                                <input
                                    type="text"
                                    value={emailCta}
                                    onChange={(e) => setEmailCta(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 bg-slate-100">
                            {/* Subject Preview */}
                            <div className="mb-4 bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
                                <p className="text-xs text-slate-500 mb-1">Tiêu đề email:</p>
                                <p className="text-sm font-medium text-slate-800">{emailSubject}</p>
                            </div>

                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md mx-auto">
                                <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-10 text-center">
                                    <h2 className="text-2xl font-bold text-white mb-2">{emailHeading}</h2>
                                    <p className="text-white/80 text-sm">Từ TravelVN với ❤️</p>
                                </div>

                                <div className="p-8">
                                    <p className="text-slate-700 mb-4">Xin chào <strong>Nguyễn Văn A</strong>,</p>
                                    <p className="text-slate-600 text-sm leading-relaxed mb-8 whitespace-pre-line">{emailGreeting}</p>

                                    <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-dashed border-violet-200 rounded-2xl p-8 text-center mb-8">
                                        <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Mã giảm giá của bạn</p>
                                        <div className="inline-block bg-white px-6 py-3 rounded-xl shadow-sm mb-4">
                                            <code className="text-3xl font-bold text-violet-600 tracking-wider font-mono">{couponCode}</code>
                                        </div>
                                        <p className="text-3xl font-bold text-slate-800 mb-1">Giảm {formatDiscount()}</p>
                                        {couponDetails.max_discount_amount && (
                                            <p className="text-sm text-slate-500">(Tối đa {formatCurrency(couponDetails.max_discount_amount)})</p>
                                        )}
                                    </div>

                                    <div className="bg-slate-50 rounded-2xl p-5 mb-8">
                                        <h4 className="font-bold text-slate-800 mb-4 text-sm">Chi tiết ưu đãi</h4>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Chương trình:</span>
                                                <span className="text-slate-800 font-bold">{couponName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Đơn tối thiểu:</span>
                                                <span className="text-slate-800 font-bold">{formatCurrency(couponDetails.min_order_amount || 0)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Có hiệu lực:</span>
                                                <span className="text-slate-800 font-bold text-right">
                                                    {formatDate(couponDetails.valid_from)} - {formatDate(couponDetails.valid_to)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <div className="inline-block bg-gradient-to-r from-violet-600 to-purple-600 text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-violet-200">
                                            {emailCta}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-100 px-6 py-6 text-center border-t border-slate-200">
                                    <p className="text-xs text-slate-400">© {new Date().getFullYear()} TravelVN. All rights reserved.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4 shrink-0">
                    {!broadcastResult && (
                        <>
                            <button
                                onClick={handleClose}
                                disabled={broadcasting}
                                className="px-6 py-3 text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition-colors disabled:opacity-50"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleBroadcast}
                                disabled={broadcasting}
                                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold shadow-lg shadow-orange-100 hover:shadow-orange-200 transition-all flex items-center gap-2 disabled:opacity-70"
                            >
                                {broadcasting ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <Radio size={20} />
                                        Gửi Broadcast Ngay
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
