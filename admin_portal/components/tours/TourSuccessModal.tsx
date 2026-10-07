"use client";

import React from 'react';
import {
    CheckCircle,
    ArrowRight,
    ExternalLink,
    Copy,
    Share2,
    Trophy,
    PartyPopper,
    Calendar,
    Eye
} from 'lucide-react';
import Link from 'next/link';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    tourId: string | number;
    tourName: string;
}

export default function TourSuccessModal({ isOpen, onClose, tourId, tourName }: SuccessModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg overflow-hidden rounded-[40px] bg-white p-10 text-center shadow-2xl animate-in zoom-in-95 fade-in duration-500">
                {/* Success Decoration */}
                <div className="absolute -left-10 -top-10 h-40 w-40 bg-indigo-50 rounded-full blur-3xl opacity-50" />
                <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-purple-50 rounded-full blur-3xl opacity-50" />

                {/* Icon */}
                <div className="relative mb-8 flex justify-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-200 animate-bounce">
                        <CheckCircle className="h-12 w-12 text-white" strokeWidth={3} />
                    </div>
                    <PartyPopper className="absolute -right-2 top-0 h-8 w-8 text-yellow-500 animate-pulse" />
                </div>

                {/* Text */}
                <div className="relative z-10 mb-8 space-y-4">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Tuyệt vời quá!</h2>
                    <p className="text-lg font-medium text-slate-500">
                        Tour <span className="text-indigo-600 font-bold">"{tourName}"</span> đã được tạo hoàn tất và sẵn sàng đón khách.
                    </p>
                </div>

                {/* Info Card */}
                <div className="relative z-10 mb-10 overflow-hidden rounded-3xl bg-slate-50 p-6 border border-slate-100">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
                                <Calendar className="h-6 w-6" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID TOUR</p>
                                <p className="font-mono text-lg font-black text-slate-700">#{tourId}</p>
                            </div>
                        </div>
                        <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition hover:bg-indigo-100">
                            <Copy className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="relative z-10 grid gap-4">
                    <Link
                        href="/tours"
                        className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 font-bold text-white shadow-xl transition hover:bg-slate-800 hover:scale-105 active:scale-95"
                        onClick={onClose}
                    >
                        Về danh sách tour
                        <ArrowRight className="h-5 w-5" />
                    </Link>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => window.open(`http://localhost:3000/tours/${tourId}`, '_blank')}
                            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-100 bg-white py-4 font-bold text-slate-600 transition hover:border-indigo-100 hover:text-indigo-600 hover:bg-indigo-50"
                        >
                            <Eye className="h-5 w-5" />
                            Xem trên web
                        </button>
                        <button className="flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-100 bg-white py-4 font-bold text-slate-600 transition hover:border-purple-100 hover:text-purple-600 hover:bg-purple-50">
                            <Share2 className="h-5 w-5" />
                            Chia sẻ
                        </button>
                    </div>
                </div>

                {/* Bottom Quote */}
                <div className="mt-8 text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                    <Trophy className="h-3 w-3" />
                    Sẵn sàng cho một chuyến đi mới
                </div>
            </div>
        </div>
    );
}
