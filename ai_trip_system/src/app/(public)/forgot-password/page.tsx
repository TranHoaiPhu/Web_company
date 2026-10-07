"use client";
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { BOOKING_API_URL } from '@/config/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<'EMAIL' | 'OTP' | 'PASSWORD'>('EMAIL');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error('Vui lòng nhập email');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${BOOKING_API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                setStep('OTP');
            } else {
                toast.error(data.message || 'Không tìm thấy email');
            }
        } catch {
            toast.error('Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp) {
            toast.error('Vui lòng nhập mã OTP');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${BOOKING_API_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otpCode: otp })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Mã OTP hợp lệ');
                setStep('PASSWORD');
            } else {
                toast.error(data.message || 'Mã OTP không đúng');
            }
        } catch {
            toast.error('Có lỗi xảy ra khi xác thực OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword || !confirmPassword) {
            toast.error('Vui lòng nhập đầy đủ thông tin');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${BOOKING_API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otpCode: otp, newPassword })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
                router.push('/auth');
            } else {
                toast.error(data.message || 'Đổi mật khẩu thất bại');
            }
        } catch {
            toast.error('Có lỗi xảy ra khi đổi mật khẩu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        
        .forgot-password-page {
          font-family: 'Outfit', sans-serif;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .animate-slide-in {
          animation: slideIn 0.5s ease-out;
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }

        .animate-spin {
          animation: spin 0.8s linear infinite;
        }
      `}</style>

            <div className="forgot-password-page relative max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden animate-slide-in p-8 md:p-10">

                {/* Back button */}
                <Link href="/auth" className="absolute top-5 left-5 text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2 z-20 group">
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="text-sm font-medium">Quay lại</span>
                </Link>

                {/* Step indicator */}
                <div className="relative flex justify-center items-center gap-3 mb-8 z-10 pt-6">
                    <div className={`h-2.5 rounded-full transition-all duration-500 ${step === 'EMAIL' ? 'w-8 bg-indigo-600' : 'w-2.5 bg-gray-300'
                        }`}></div>
                    <div className={`h-2.5 rounded-full transition-all duration-500 ${step === 'OTP' ? 'w-8 bg-indigo-600' : 'w-2.5 bg-gray-300'
                        }`}></div>
                    <div className={`h-2.5 rounded-full transition-all duration-500 ${step === 'PASSWORD' ? 'w-8 bg-indigo-600' : 'w-2.5 bg-gray-300'
                        }`}></div>
                </div>

                {/* EMAIL STEP */}
                {step === 'EMAIL' && (
                    <div className="relative z-10 animate-fade-in">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto mb-5 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Quên mật khẩu?</h2>
                            <p className="text-gray-600 text-sm">
                                Nhập email của bạn để nhận mã xác thực đặt lại mật khẩu.
                            </p>
                        </div>

                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Email của bạn
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    placeholder="example@email.com"
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm shadow-sm hover:shadow transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 flex items-center justify-center"
                            >
                                {loading && (
                                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                                )}
                                {loading ? 'Đang gửi...' : 'Gửi mã xác thực'}
                            </button>
                        </form>
                    </div>
                )}

                {/* OTP STEP */}
                {step === 'OTP' && (
                    <div className="relative z-10 animate-fade-in">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto mb-5 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Xác thực OTP</h2>
                            <p className="text-gray-600 text-sm">
                                Mã OTP đã được gửi đến <span className="font-semibold text-indigo-600">{email}</span>
                            </p>
                        </div>

                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Mã OTP
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    disabled={loading}
                                    placeholder="Nhập mã 6 số"
                                    maxLength={6}
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 text-center text-lg font-semibold tracking-widest focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50"
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm shadow-sm hover:shadow transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 flex items-center justify-center"
                                >
                                    {loading && (
                                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                                    )}
                                    {loading ? 'Đang xác thực...' : 'Xác thực'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStep('EMAIL')}
                                    disabled={loading}
                                    className="w-full py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm border border-gray-300 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    ← Quay lại nhập email
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* PASSWORD STEP */}
                {step === 'PASSWORD' && (
                    <div className="relative z-10 animate-fade-in">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto mb-5 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Mật khẩu mới</h2>
                            <p className="text-gray-600 text-sm">
                                Nhập mật khẩu mới cho tài khoản của bạn.
                            </p>
                        </div>

                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Mật khẩu mới
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={loading}
                                    placeholder="Ít nhất 6 ký tự"
                                    minLength={6}
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Xác nhận mật khẩu
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={loading}
                                    placeholder="Nhập lại mật khẩu"
                                    minLength={6}
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm shadow-sm hover:shadow transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 flex items-center justify-center"
                            >
                                {loading && (
                                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                                )}
                                {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}