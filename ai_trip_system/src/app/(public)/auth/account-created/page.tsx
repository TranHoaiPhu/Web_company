"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TempPasswordPage() {
    const router = useRouter();
    const [data, setData] = useState<{
        tempPassword: string;
        email: string;
        fullName: string;
    } | null>(null);

    const [copied, setCopied] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [countdown, setCountdown] = useState(15);

    useEffect(() => {
        // Read data from sessionStorage
        const storedData = sessionStorage.getItem("temp_auth_data");
        if (storedData) {
            setData(JSON.parse(storedData));
        } else {
            // If no data, redirect back to login
            router.replace("/auth");
        }

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router]);

    const handleContinue = () => {
        sessionStorage.removeItem("temp_auth_data");
        router.replace("/");
    };

    if (!data) return null;

    const { tempPassword, email, fullName } = data;

    const handleCopyPassword = async () => {
        try {
            await navigator.clipboard.writeText(tempPassword);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const maskedPassword = showPassword
        ? tempPassword
        : tempPassword.substring(0, 3) + "•".repeat(tempPassword.length - 3);

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden p-5">
            {/* Background decoration with blur effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none mt-10">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br from-pink-400 to-red-500 rounded-full opacity-30 blur-3xl animate-blob"></div>
                <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full opacity-30 blur-3xl animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-green-400 to-teal-500 rounded-full opacity-30 blur-3xl animate-blob animation-delay-4000"></div>
            </div>

            {/* Main content container */}
            <div className="relative z-10 w-full max-w-2xl flex flex-col gap-6 mt-25">
                {/* Header Section */}
                <div className="text-center mb-2">
                    <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">

                    </h1>
                </div>

                {/* Card Section */}
                <div className="bg-white/98 backdrop-blur-md rounded-3xl p-10 flex flex-col gap-6 animate-slide-up">
                    {/* Success Icon */}
                    <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full opacity-20 animate-ping"></div>
                        <div className="relative w-full h-full bg-green-500 rounded-full flex items-center justify-center animate-bounce-in">
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-10 h-10"
                            >
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Đăng nhập thành công!
                        </h2>
                        <p className="text-base text-gray-600">
                            Chào mừng{" "}
                            <span className="text-indigo-600 font-semibold">
                                {fullName || "bạn"}
                            </span>{" "}
                            đến với TravelVN
                        </p>
                    </div>

                    {/* Google Badge */}
                    <div className="flex items-center justify-center gap-3 px-6 py-3 bg-gray-50 rounded-xl border border-gray-200 mx-auto max-w-fit">
                        <svg viewBox="0 0 24 24" className="w-5 h-5">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">
                            Tài khoản Google
                        </span>
                    </div>

                    {/* Email Display */}
                    <div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                        <i className="lni lni-envelope text-xl text-indigo-600"></i>
                        <span className="text-sm font-medium text-gray-700 break-all">
                            {email}
                        </span>
                    </div>

                    {/* Password Section */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <i className="lni lni-key text-lg text-indigo-600"></i>
                            <span>Mật khẩu tạm thời của bạn</span>
                        </div>

                        <div className="flex items-center gap-3 px-4 py-4 bg-white border-2 border-indigo-200 rounded-xl transition-all duration-300 focus-within:border-indigo-600 focus-within:shadow-lg focus-within:shadow-indigo-100">
                            <div className="flex-1 min-w-0">
                                <span
                                    className={`text-lg font-semibold text-gray-900 font-mono tracking-wider block overflow-hidden text-ellipsis ${showPassword ? "" : "tracking-[0.25em]"
                                        }`}
                                >
                                    {maskedPassword}
                                </span>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button
                                    className="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 hover:bg-indigo-600 hover:text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                >
                                    <i
                                        className={`lni text-lg ${showPassword ? "lni-eye-off" : "lni-eye"
                                            }`}
                                    ></i>
                                </button>
                                <button
                                    className={`w-10 h-10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center ${copied
                                        ? "bg-green-500 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-indigo-600 hover:text-white"
                                        }`}
                                    onClick={handleCopyPassword}
                                    title="Sao chép mật khẩu"
                                >
                                    <i
                                        className={`lni text-lg ${copied ? "lni-checkmark" : "lni-copy"
                                            }`}
                                    ></i>
                                </button>
                            </div>
                        </div>

                        {copied && (
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg text-green-800 text-sm font-medium animate-slide-in">
                                <i className="lni lni-checkmark-circle text-base"></i>
                                Đã sao chép vào clipboard!
                            </div>
                        )}
                    </div>

                    {/* Warning Note */}
                    <div className="flex gap-3 p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-300">
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                            <i className="lni lni-warning text-xl text-amber-600"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                            <strong className="block text-sm text-amber-900 mb-1.5">
                                Lưu ý quan trọng:
                            </strong>
                            <p className="text-xs text-amber-800 leading-relaxed">
                                Đây là mật khẩu tạm thời được tạo tự động. Vui lòng lưu lại và đổi
                                mật khẩu trong phần{" "}
                                <strong>Cài đặt tài khoản</strong> để bảo mật tốt hơn.
                            </p>
                        </div>
                    </div>

                    {/* Continue Button */}
                    <button
                        className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-base font-semibold flex items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none mt-2"
                        onClick={handleContinue}
                        disabled={countdown > 0}
                    >
                        {countdown > 0 ? (
                            <>
                                <span className="relative w-8 h-8 flex-shrink-0">
                                    <svg
                                        viewBox="0 0 36 36"
                                        className="w-full h-full -rotate-90"
                                    >
                                        <path
                                            className="stroke-white/30"
                                            strokeWidth="3"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path
                                            className="stroke-white transition-all duration-300"
                                            strokeWidth="3"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeDasharray={`${(countdown / 15) * 100}, 100`}
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                    </svg>
                                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-white">
                                        {countdown}
                                    </span>
                                </span>
                                Vui lòng đọc thông tin...
                            </>
                        ) : (
                            <>
                                <i className="lni lni-arrow-right text-lg"></i>
                                Tiếp tục khám phá TravelVN
                            </>
                        )}
                    </button>

                    {/* Trust badges */}
                    <div className="flex justify-center gap-4 pt-2 flex-wrap">
                        <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                            <i className="lni lni-shield text-base text-indigo-600"></i>
                            <span className="text-xs text-gray-600 font-medium">Bảo mật</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                            <i className="lni lni-lock text-base text-indigo-600"></i>
                            <span className="text-xs text-gray-600 font-medium">Mã hóa</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                            <i className="lni lni-checkmark-circle text-base text-indigo-600"></i>
                            <span className="text-xs text-gray-600 font-medium">Xác thực</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center py-4">
                    <p className="text-sm text-white/90 drop-shadow">

                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes blob {
                    0%,
                    100% {
                        transform: translate(0, 0) scale(1);
                    }
                    33% {
                        transform: translate(30px, -30px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                }

                .animate-blob {
                    animation: blob 8s ease-in-out infinite;
                }

                .animation-delay-2000 {
                    animation-delay: 2s;
                }

                .animation-delay-4000 {
                    animation-delay: 4s;
                }

                @keyframes bounce-in {
                    0% {
                        transform: scale(0);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.1);
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                .animate-bounce-in {
                    animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }

                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-slide-up {
                    animation: slide-up 0.5s ease-out;
                }

                @keyframes slide-in {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-slide-in {
                    animation: slide-in 0.3s ease;
                }
            `}</style>
        </div>
    );
}