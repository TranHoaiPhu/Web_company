'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Search, Mail, User, Loader2, Check, AlertCircle, Eye, UserPlus, FileEdit } from 'lucide-react';
import { BOOKING_API_URL } from '@/config/api';
import Cookies from 'js-cookie';
import couponHttp from '@/services/promotion.service';

interface UserResult {
    id: number;
    user_id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    phone?: string;
}

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

interface SendEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    couponId: number;
    couponCode: string;
    couponName: string;
    couponDetails?: CouponDetails;
}

export default function SendEmailModal({
    isOpen,
    onClose,
    couponId,
    couponCode,
    couponName,
    couponDetails,
}: SendEmailModalProps) {
    const [activeTab, setActiveTab] = useState<'recipient' | 'content' | 'preview'>('recipient');
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<UserResult[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [couponData, setCouponData] = useState<CouponDetails | null>(couponDetails || null);

    // Email content state
    const [emailSubject, setEmailSubject] = useState('');
    const [emailHeading, setEmailHeading] = useState('Mã Giảm Giá Đặc Biệt!');
    const [emailGreeting, setEmailGreeting] = useState('Chúng tôi gửi tặng bạn một mã giảm giá đặc biệt để sử dụng cho chuyến du lịch tiếp theo. Đừng bỏ lỡ cơ hội tiết kiệm này!');
    const [emailCta, setEmailCta] = useState('Khám phá tour ngay');

    // Initialize email subject when coupon data is available
    useEffect(() => {
        if (couponData) {
            const discount = couponData.discount_type === 'PERCENTAGE'
                ? `${couponData.discount_value}%`
                : formatCurrency(couponData.discount_value);
            setEmailSubject(`[TravelVN] Mã giảm giá ${discount} dành riêng cho bạn!`);
        }
    }, [couponData]);

    // Fetch coupon details if not provided
    useEffect(() => {
        if (isOpen && !couponDetails) {
            const fetchCouponDetails = async () => {
                try {
                    const response = await couponHttp.get(`/${couponId}`);
                    if (response.data) {
                        setCouponData({
                            code: response.data.code,
                            name: response.data.name,
                            description: response.data.description,
                            discount_type: response.data.discount_type,
                            discount_value: parseFloat(response.data.discount_value),
                            max_discount_amount: response.data.max_discount_amount ? parseFloat(response.data.max_discount_amount) : undefined,
                            min_order_amount: response.data.min_order_amount ? parseFloat(response.data.min_order_amount) : undefined,
                            valid_from: response.data.valid_from,
                            valid_to: response.data.valid_to,
                        });
                    }
                } catch (error) {
                    console.error('Error fetching coupon details:', error);
                }
            };
            fetchCouponDetails();
        }
    }, [isOpen, couponId, couponDetails]);

    // Search users
    const searchUsers = useCallback(async (query: string) => {
        if (!query || query.length < 2) {
            setUsers([]);
            return;
        }

        setLoading(true);
        try {
            const token = Cookies.get('admin_token');
            const response = await fetch(
                `${BOOKING_API_URL}/users?search=${encodeURIComponent(query)}&limit=10`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const data = await response.json();
            if (data.success && data.data?.users) {
                setUsers(data.data.users);
            } else {
                setUsers([]);
            }
        } catch (error) {
            console.error('Error searching users:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            searchUsers(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, searchUsers]);

    // Format helpers
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    const formatDiscount = () => {
        if (!couponData) return '';
        if (couponData.discount_type === 'PERCENTAGE') {
            return `${couponData.discount_value}%`;
        }
        return formatCurrency(couponData.discount_value);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Send email
    const handleSendEmail = async () => {
        if (!selectedUser) return;

        setSending(true);
        setMessage(null);

        try {
            const response = await couponHttp.post('/send-email', {
                coupon_id: couponId,
                user_email: selectedUser.email,
                user_name: selectedUser.full_name,
                custom_subject: emailSubject,
                custom_heading: emailHeading,
                custom_greeting: emailGreeting,
                custom_cta: emailCta,
            });

            if (response.data?.success) {
                setMessage({ type: 'success', text: `Đã gửi mã "${couponCode}" đến ${selectedUser.email}` });
                setTimeout(() => {
                    onClose();
                    setSelectedUser(null);
                    setSearchQuery('');
                    setMessage(null);
                }, 2000);
            } else {
                throw new Error(response.data?.error || 'Gửi email thất bại');
            }
        } catch (error: unknown) {
            console.error('Error sending email:', error);
            const errorMessage = error instanceof Error ? error.message : 'Lỗi khi gửi email';
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setSending(false);
        }
    };

    // Reset on close
    const handleClose = () => {
        setSelectedUser(null);
        setSearchQuery('');
        setUsers([]);
        setMessage(null);
        setActiveTab('recipient');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center mt-16">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="relative z-20 bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5 shrink-0 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Mail size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Gửi mã giảm giá</h3>
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
                        onClick={() => setActiveTab('recipient')}
                        className={`flex-1 px-4 py-3.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'recipient'
                            ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50/50'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <UserPlus size={16} />
                        Người nhận
                    </button>
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`flex-1 px-4 py-3.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'content'
                            ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50/50'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <FileEdit size={16} />
                        Nội dung
                    </button>
                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`flex-1 px-4 py-3.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'preview'
                            ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50/50'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <Eye size={16} />
                        Xem trước
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    {activeTab === 'recipient' ? (
                        // Recipient Tab
                        <div className="p-6">
                            {/* Coupon Info */}
                            <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 mb-6">
                                <p className="text-sm text-violet-600 font-medium mb-1">Đang gửi mã:</p>
                                <p className="font-semibold text-slate-900">{couponName}</p>
                                <code className="inline-block mt-2 px-3 py-1 bg-violet-100 text-violet-700 rounded-lg font-mono text-sm font-bold">
                                    {couponCode}
                                </code>
                            </div>

                            {/* Search Input */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Tìm khách hàng
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Nhập tên hoặc email để tìm kiếm..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50 transition-all text-sm"
                                    />
                                    {loading && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-500 animate-spin" size={18} />
                                    )}
                                </div>
                            </div>

                            {/* Search Results */}
                            {users.length > 0 && !selectedUser && (
                                <div className="mb-4 max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                                    {users.map((user) => (
                                        <button
                                            key={user.id}
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setSearchQuery('');
                                                setUsers([]);
                                            }}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-violet-50 transition-colors text-left"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    user.full_name?.charAt(0)?.toUpperCase() || 'U'
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 truncate">{user.full_name}</p>
                                                <p className="text-sm text-slate-500 truncate">{user.email}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* No results */}
                            {searchQuery.length >= 2 && !loading && users.length === 0 && !selectedUser && (
                                <div className="mb-4 p-4 text-center text-slate-500 bg-slate-50 rounded-xl">
                                    <User size={24} className="mx-auto mb-2 text-slate-400" />
                                    <p className="text-sm">Không tìm thấy người dùng</p>
                                </div>
                            )}

                            {/* Selected User */}
                            {selectedUser && (
                                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-medium">
                                                {selectedUser.avatar_url ? (
                                                    <img src={selectedUser.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    selectedUser.full_name?.charAt(0)?.toUpperCase() || 'U'
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">{selectedUser.full_name}</p>
                                                <p className="text-sm text-slate-600">{selectedUser.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedUser(null)}
                                            className="p-2 hover:bg-green-100 rounded-lg transition-colors text-slate-500"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Message */}
                            {message && (
                                <div className={`mb-4 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-red-50 text-red-800 border border-red-200'
                                    }`}>
                                    {message.type === 'success' ? (
                                        <Check size={20} className="text-emerald-600" />
                                    ) : (
                                        <AlertCircle size={20} className="text-red-600" />
                                    )}
                                    <p className="text-sm font-medium">{message.text}</p>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'content' ? (
                        // Content Tab - Edit Email Content
                        <div className="p-6 space-y-5">
                            {/* Email Subject */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Tiêu đề email
                                </label>
                                <input
                                    type="text"
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    placeholder="Nhập tiêu đề email..."
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50 transition-all text-sm"
                                />
                            </div>

                            {/* Email Heading */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Tiêu đề chính (trong email)
                                </label>
                                <input
                                    type="text"
                                    value={emailHeading}
                                    onChange={(e) => setEmailHeading(e.target.value)}
                                    placeholder="VD: Mã Giảm Giá Đặc Biệt!"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50 transition-all text-sm"
                                />
                            </div>

                            {/* Greeting Message */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Lời chào / Nội dung chính
                                </label>
                                <textarea
                                    value={emailGreeting}
                                    onChange={(e) => setEmailGreeting(e.target.value)}
                                    placeholder="Nhập nội dung lời chào..."
                                    rows={4}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50 transition-all text-sm resize-none"
                                />
                            </div>

                            {/* CTA Button Text */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Nút kêu gọi hành động (CTA)
                                </label>
                                <input
                                    type="text"
                                    value={emailCta}
                                    onChange={(e) => setEmailCta(e.target.value)}
                                    placeholder="VD: Khám phá tour ngay"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50 transition-all text-sm"
                                />
                            </div>

                            {/* Reset to default */}
                            <button
                                onClick={() => {
                                    const discount = formatDiscount();
                                    setEmailSubject(`[TravelVN] Mã giảm giá ${discount} dành riêng cho bạn!`);
                                    setEmailHeading('Mã Giảm Giá Đặc Biệt!');
                                    setEmailGreeting('Chúng tôi gửi tặng bạn một mã giảm giá đặc biệt để sử dụng cho chuyến du lịch tiếp theo. Đừng bỏ lỡ cơ hội tiết kiệm này!');
                                    setEmailCta('Khám phá tour ngay');
                                }}
                                className="text-sm text-violet-600 hover:text-violet-700 hover:underline font-medium"
                            >
                                ↺ Đặt lại nội dung mặc định
                            </button>
                        </div>
                    ) : (
                        // Preview Tab - Email Template Preview
                        <div className="p-6 bg-slate-100">
                            {/* Subject Preview */}
                            <div className="mb-4 bg-white rounded-lg p-3 border border-slate-200">
                                <p className="text-xs text-slate-500 mb-1">Tiêu đề email:</p>
                                <p className="text-sm font-medium text-slate-800">{emailSubject}</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-md mx-auto">
                                {/* Email Header */}
                                <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-8 text-center">
                                    <h2 className="text-xl font-bold text-white mb-1">{emailHeading}</h2>
                                    <p className="text-white/80 text-sm">Dành riêng cho bạn từ TravelVN</p>
                                </div>

                                {/* Email Body */}
                                <div className="p-6">
                                    {/* Greeting */}
                                    <p className="text-slate-700 mb-4">
                                        Xin chào <strong>{selectedUser?.full_name || 'Quý khách'}</strong>,
                                    </p>
                                    <p className="text-slate-600 text-sm mb-6 whitespace-pre-line">
                                        {emailGreeting}
                                    </p>

                                    {/* Coupon Card */}
                                    <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-dashed border-violet-300 rounded-xl p-6 text-center mb-6">
                                        <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Mã giảm giá của bạn</p>
                                        <div className="inline-block bg-white px-4 py-2 rounded-lg shadow-sm mb-3">
                                            <code className="text-2xl font-bold text-violet-600 tracking-wider">
                                                {couponCode}
                                            </code>
                                        </div>
                                        <p className="text-2xl font-bold text-slate-800 mb-1">
                                            Giảm {formatDiscount()}
                                        </p>
                                        {couponData?.max_discount_amount && (
                                            <p className="text-sm text-slate-500">
                                                (Tối đa {formatCurrency(couponData.max_discount_amount)})
                                            </p>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="bg-slate-50 rounded-xl p-4 mb-6">
                                        <h4 className="font-semibold text-slate-800 mb-3 text-sm">Chi tiết ưu đãi</h4>
                                        <div className="space-y-2 text-sm">
                                            {couponData?.name && (
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Tên chương trình:</span>
                                                    <span className="text-slate-800 font-medium">{couponData.name}</span>
                                                </div>
                                            )}
                                            {couponData?.min_order_amount && (
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Đơn tối thiểu:</span>
                                                    <span className="text-slate-800 font-medium">{formatCurrency(couponData.min_order_amount)}</span>
                                                </div>
                                            )}
                                            {couponData?.valid_from && couponData?.valid_to && (
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Có hiệu lực:</span>
                                                    <span className="text-slate-800 font-medium text-right">
                                                        {formatDate(couponData.valid_from)} - {formatDate(couponData.valid_to)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <div className="text-center">
                                        <div className="inline-block bg-gradient-to-r from-violet-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold text-sm">
                                            {emailCta}
                                        </div>
                                    </div>
                                </div>

                                {/* Email Footer */}
                                <div className="bg-slate-100 px-6 py-4 text-center border-t border-slate-200">
                                    <p className="text-xs text-slate-500">© {new Date().getFullYear()} TravelVN. All rights reserved.</p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Bạn nhận được email này vì đã đăng ký nhận thông tin ưu đãi
                                    </p>
                                </div>
                            </div>

                            {/* Preview Note */}
                            <p className="text-center text-sm text-slate-500 mt-4">
                                💡 Đây là bản xem trước email sẽ được gửi đến người nhận
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                    <div className="text-sm text-slate-500">
                        {selectedUser && (
                            <span>
                                Gửi đến: <strong className="text-slate-700">{selectedUser.email}</strong>
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleClose}
                            className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSendEmail}
                            disabled={!selectedUser || sending}
                            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {sending ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Đang gửi...
                                </>
                            ) : (
                                <>
                                    <Mail size={18} />
                                    Gửi email
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
