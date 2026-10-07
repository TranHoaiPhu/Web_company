"use client";

import { useState, useEffect } from "react";
import "./temp-password.css";

interface TempPasswordModalProps {
    tempPassword: string;
    email: string;
    fullName: string;
    onClose: () => void;
}

export default function TempPasswordModal({
    tempPassword,
    email,
    fullName,
    onClose,
}: TempPasswordModalProps) {
    const [copied, setCopied] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [countdown, setCountdown] = useState(15);

    useEffect(() => {
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
    }, []);

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
        <div className="temp-password-overlay">
            <div className="temp-password-modal">
                {/* Decorative elements */}
                <div className="modal-decoration">
                    <div className="floating-circle circle-1"></div>
                    <div className="floating-circle circle-2"></div>
                    <div className="floating-circle circle-3"></div>
                </div>

                {/* Success Icon */}
                <div className="success-icon-wrapper">
                    <div className="success-icon-ring"></div>
                    <div className="success-icon">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                </div>

                {/* Header */}
                <div className="modal-header">
                    <h2>Đăng nhập thành công! 🎉</h2>
                    <p className="welcome-text">
                        Chào mừng <span className="highlight-name">{fullName || "bạn"}</span> đến với TravelVN
                    </p>
                </div>

                {/* Google Badge */}
                <div className="google-badge">
                    <svg viewBox="0 0 24 24" className="google-icon">
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
                    <span>Tài khoản Google</span>
                </div>

                {/* Email Display */}
                <div className="email-display">
                    <i className="lni lni-envelope"></i>
                    <span>{email}</span>
                </div>

                {/* Password Section */}
                <div className="password-section">
                    <div className="password-label">
                        <i className="lni lni-key"></i>
                        <span>Mật khẩu tạm thời của bạn</span>
                    </div>

                    <div className="password-box">
                        <div className="password-value">
                            <span className={showPassword ? "visible" : "masked"}>
                                {maskedPassword}
                            </span>
                        </div>
                        <div className="password-actions">
                            <button
                                className="action-btn eye-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                            >
                                <i className={`lni ${showPassword ? "lni-eye-off" : "lni-eye"}`}></i>
                            </button>
                            <button
                                className={`action-btn copy-btn ${copied ? "copied" : ""}`}
                                onClick={handleCopyPassword}
                                title="Sao chép mật khẩu"
                            >
                                <i className={`lni ${copied ? "lni-checkmark" : "lni-copy"}`}></i>
                            </button>
                        </div>
                    </div>

                    {copied && (
                        <div className="copy-success">
                            <i className="lni lni-checkmark-circle"></i>
                            Đã sao chép vào clipboard!
                        </div>
                    )}
                </div>

                {/* Warning Note */}
                <div className="warning-note">
                    <div className="warning-icon">
                        <i className="lni lni-warning"></i>
                    </div>
                    <div className="warning-content">
                        <strong>Lưu ý quan trọng:</strong>
                        <p>
                            Đây là mật khẩu tạm thời được tạo tự động. Vui lòng lưu lại và đổi mật khẩu
                            trong phần <strong>Cài đặt tài khoản</strong> để bảo mật tốt hơn.
                        </p>
                    </div>
                </div>

                {/* Continue Button */}
                <button
                    className="continue-btn"
                    onClick={onClose}
                    disabled={countdown > 0}
                >
                    {countdown > 0 ? (
                        <>
                            <span className="countdown-ring">
                                <svg viewBox="0 0 36 36">
                                    <path
                                        className="circle-bg"
                                        d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                        className="circle"
                                        strokeDasharray={`${(countdown / 15) * 100}, 100`}
                                        d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                <span className="countdown-number">{countdown}</span>
                            </span>
                            Vui lòng đọc thông tin...
                        </>
                    ) : (
                        <>
                            <i className="lni lni-arrow-right"></i>
                            Tiếp tục khám phá TravelVN
                        </>
                    )}
                </button>

                {/* Trust badges */}
                <div className="trust-badges">
                    <div className="badge">
                        <i className="lni lni-shield"></i>
                        <span>Bảo mật</span>
                    </div>
                    <div className="badge">
                        <i className="lni lni-lock"></i>
                        <span>Mã hóa</span>
                    </div>
                    <div className="badge">
                        <i className="lni lni-checkmark-circle"></i>
                        <span>Xác thực</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
