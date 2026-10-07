"use client";
import React, { useState } from 'react';
import Modal from '../Modal';
import { toast } from 'react-toastify';
import { BOOKING_API_URL } from '@/config/api';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<'EMAIL' | 'OTP' | 'PASSWORD'>('EMAIL');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleClose = () => {
        setStep('EMAIL');
        setEmail('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
    };

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
                handleClose();
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
        <Modal isOpen={isOpen} onClose={handleClose}>
            <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        
        .forgot-password-modal {
          font-family: 'Outfit', sans-serif;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-slide-in {
          animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-pulse-bg {
          animation: pulse 4s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-spin {
          animation: spin 0.8s linear infinite;
        }
      `}</style>

            <div className="forgot-password-modal relative max-w-md w-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl shadow-2xl overflow-hidden animate-slide-in p-8 md:p-12">

                {/* Animated background overlay */}
                <div className="absolute inset-0 animate-pulse-bg opacity-30 pointer-events-none">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl opacity-10 translate-x-1/2 translate-y-1/2"></div>
                </div>

                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all duration-300 hover:rotate-90 hover:scale-110 z-10 group"
                    aria-label="Đóng"
                >
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Step indicator */}
                <div className="relative flex justify-center items-center gap-3 mb-8 z-10">
                    <div className={`h-3 rounded-full transition-all duration-500 ${step === 'EMAIL' ? 'w-8 bg-white shadow-lg shadow-white/50' : 'w-3 bg-white/30'
                        }`}></div>
                    <div className={`h-3 rounded-full transition-all duration-500 ${step === 'OTP' ? 'w-8 bg-white shadow-lg shadow-white/50' : 'w-3 bg-white/30'
                        }`}></div>
                    <div className={`h-3 rounded-full transition-all duration-500 ${step === 'PASSWORD' ? 'w-8 bg-white shadow-lg shadow-white/50' : 'w-3 bg-white/30'
                        }`}></div>
                </div>

                {/* EMAIL STEP */}
                {step === 'EMAIL' && (
                    <div className="relative z-10 animate-fade-in">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 mx-auto mb-6 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 animate-float shadow-xl">
                                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Quên mật khẩu?</h2>
                            <p className="text-white/85 text-sm leading-relaxed font-light">
                                Nhập email của bạn để nhận mã xác thực đặt lại mật khẩu.
                            </p>
                        </div>

                        <form onSubmit={handleSendOtp} className="space-y-5">
                            <div>
                                <label className="block text-white/90 text-xs font-medium mb-2 uppercase tracking-wider">
                                    Email của bạn
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    placeholder="example@email.com"
                                    className="w-full px-4 py-3.5 bg-white/95 border-2 border-white/30 rounded-xl text-gray-800 placeholder-gray-400 focus:bg-white focus:border-white/80 focus:outline-none focus:ring-4 focus:ring-white/20 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="relative w-full py-4 bg-white text-indigo-600 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none overflow-hidden group"
                            >
                                <span className="absolute inset-0 w-0 bg-indigo-50 transition-all duration-500 ease-out group-hover:w-full"></span>
                                <span className="relative flex items-center justify-center">
                                    {loading && (
                                        <span className="inline-block w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mr-2"></span>
                                    )}
                                    {loading ? 'Đang gửi...' : 'Gửi mã xác thực'}
                                </span>
                            </button>
                        </form>
                    </div>
                )}

                {/* OTP STEP */}
                {step === 'OTP' && (
                    <div className="relative z-10 animate-fade-in">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 mx-auto mb-6 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 animate-float shadow-xl">
                                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Xác thực OTP</h2>
                            <p className="text-white/85 text-sm leading-relaxed font-light">
                                Mã OTP đã được gửi đến <span className="font-semibold bg-white/20 px-2 py-0.5 rounded">{email}</span>
                            </p>
                        </div>

                        <form onSubmit={handleVerifyOtp} className="space-y-5">
                            <div>
                                <label className="block text-white/90 text-xs font-medium mb-2 uppercase tracking-wider">
                                    Mã OTP
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    disabled={loading}
                                    placeholder="Nhập mã 6 số"
                                    maxLength={6}
                                    className="w-full px-4 py-3.5 bg-white/95 border-2 border-white/30 rounded-xl text-gray-800 placeholder-gray-400 text-center text-lg font-semibold tracking-widest focus:bg-white focus:border-white/80 focus:outline-none focus:ring-4 focus:ring-white/20 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="relative w-full py-4 bg-white text-indigo-600 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none overflow-hidden group"
                                >
                                    <span className="absolute inset-0 w-0 bg-indigo-50 transition-all duration-500 ease-out group-hover:w-full"></span>
                                    <span className="relative flex items-center justify-center">
                                        {loading && (
                                            <span className="inline-block w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mr-2"></span>
                                        )}
                                        {loading ? 'Đang xác thực...' : 'Xác thực'}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStep('EMAIL')}
                                    disabled={loading}
                                    className="w-full py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl font-medium text-sm border border-white/30 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
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
                            <div className="w-20 h-20 mx-auto mb-6 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 animate-float shadow-xl">
                                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Mật khẩu mới</h2>
                            <p className="text-white/85 text-sm leading-relaxed font-light">
                                Nhập mật khẩu mới cho tài khoản của bạn.
                            </p>
                        </div>

                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <div>
                                <label className="block text-white/90 text-xs font-medium mb-2 uppercase tracking-wider">
                                    Mật khẩu mới
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={loading}
                                    placeholder="Ít nhất 6 ký tự"
                                    minLength={6}
                                    className="w-full px-4 py-3.5 bg-white/95 border-2 border-white/30 rounded-xl text-gray-800 placeholder-gray-400 focus:bg-white focus:border-white/80 focus:outline-none focus:ring-4 focus:ring-white/20 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-white/90 text-xs font-medium mb-2 uppercase tracking-wider">
                                    Xác nhận mật khẩu
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={loading}
                                    placeholder="Nhập lại mật khẩu"
                                    minLength={6}
                                    className="w-full px-4 py-3.5 bg-white/95 border-2 border-white/30 rounded-xl text-gray-800 placeholder-gray-400 focus:bg-white focus:border-white/80 focus:outline-none focus:ring-4 focus:ring-white/20 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="relative w-full py-4 bg-white text-indigo-600 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none overflow-hidden group"
                            >
                                <span className="absolute inset-0 w-0 bg-indigo-50 transition-all duration-500 ease-out group-hover:w-full"></span>
                                <span className="relative flex items-center justify-center">
                                    {loading && (
                                        <span className="inline-block w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mr-2"></span>
                                    )}
                                    {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                                </span>
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ForgotPasswordModal;