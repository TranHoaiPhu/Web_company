'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';
import { systemService, SystemSettings } from '@/services/system.service';
import { Lock, User, AlertCircle, Loader2, Eye, EyeOff, Shield, Plane, ArrowRight, Sparkles } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [siteSettings, setSiteSettings] = useState<SystemSettings | null>(null);
    const router = useRouter();

    useEffect(() => {
        setIsMounted(true);
        // Fetch site settings for logo
        systemService.getSettings()
            .then(data => setSiteSettings(data))
            .catch(err => console.log('Could not load site settings:', err));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await AuthService.login(username, password);
            if (result.success) {
                router.replace('/');
                router.refresh();
            } else {
                setError(result.message || 'Tên đăng nhập hoặc mật khẩu không đúng');
            }
        } catch (err: any) {
            setError('Đã xảy ra lỗi kết nối. Vui lòng kiểm tra lại server.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isMounted) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden font-sans">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Dynamic Gradient Blobs */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] animate-blob"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/20 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-sky-300/15 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>

                {/* Sophisticated Pattern */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234338ca' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2v-4h4v-2H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
                </div>
            </div>

            <div className={`relative z-10 w-full max-w-[440px] px-6 transition-all duration-1000 transform ${isMounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                {/* Branding / Header */}
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-4 mb-0">
                        {siteSettings?.site_logo ? (
                            <Image
                                src={siteSettings.site_logo}
                                alt="Logo"
                                width={80}
                                height={80}
                                className="object-contain drop-shadow-lg rounded-xl"
                                style={{ width: '80px', height: '80px' }}
                                unoptimized
                            />
                        ) : (
                            <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/30">
                                <Plane size={28} className="text-white" />
                            </div>
                        )}
                        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
                            {siteSettings?.site_name ? (
                                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{siteSettings.site_name}</span>
                            ) : (
                                <>Admin<span className="text-blue-600">Portal</span></>
                            )}
                        </h1>
                    </div>
                    <p className="text-slate-500 font-medium">Hệ thống quản lý du lịch thông minh</p>
                </div>

                {/* Main Login Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white p-8 sm:p-10 relative overflow-hidden">
                    {/* Decorative Top Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 animate-shake">
                            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                            <p className="text-sm text-red-700 font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Tên đăng nhập</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600 text-slate-400">
                                    <User size={20} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 block w-full pl-11 p-4 transition-all duration-300 placeholder:text-slate-400"
                                    placeholder="yourname@admin.com"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-bold text-slate-700">Mật khẩu</label>
                                <button type="button" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">Quên mật khẩu?</button>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600 text-slate-400">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 block w-full pl-11 pr-12 p-4 transition-all duration-300 placeholder:text-slate-400"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me */}
                        <label className="flex items-center gap-3 cursor-pointer group w-fit">
                            <div className="relative flex items-center">
                                <input type="checkbox" className="peer appearance-none w-5 h-5 border-2 border-slate-200 rounded-lg checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer" />
                                <Shield className="absolute w-3 h-3 text-white left-1 pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">Duy trì đăng nhập</span>
                        </label>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full group relative flex items-center justify-center gap-2 bg-slate-900 text-white p-4 rounded-2xl font-bold transition-all duration-300 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none shadow-xl shadow-slate-200 hover:shadow-slate-300"
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <span>Đăng nhập ngay</span>
                                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Bottom Info */}
                    <div className="mt-8 flex items-center justify-center gap-2 text-slate-400">
                        <Sparkles size={14} />
                        <span className="text-xs font-semibold uppercase tracking-widest"></span>
                    </div>
                </div>

                {/* Footer Credits */}
                <p className="mt-8 text-center text-slate-400 text-sm font-medium">
                    <span className="text-slate-600 font-bold">v1.0.0</span>
                </p>
            </div>

            <style jsx global>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
                    20%, 40%, 60%, 80% { transform: translateX(2px); }
                }
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}</style>
        </div>
    );
}