"use client";

import { motion } from "framer-motion";
import { FaTicketAlt, FaGift, FaRocket, FaCopy, FaCheck } from "react-icons/fa";
import { SystemSettings } from "@/services/system/system.service";
import { useState } from "react";
import { toast } from "react-toastify";

interface NewCustomerPromoProps {
    settings: SystemSettings;
}

const NewCustomerPromo = ({ settings }: NewCustomerPromoProps) => {
    const [copied, setCopied] = useState(false);
    const promoCode = settings.new_customer_promo_code || "WELCOME2026";
    const promoAmount = settings.new_customer_promo_amount ?
        Number(settings.new_customer_promo_amount).toLocaleString('vi-VN') :
        "500.000";

    const handleCopy = () => {
        navigator.clipboard.writeText(promoCode);
        setCopied(true);
        toast.success("Đã sao chép mã khuyến mãi!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <section className="py-20 bg-slate-900 overflow-hidden relative">
            {/* Background patterns */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/20 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-[40px] p-10 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 shadow-2xl">
                    <div className="text-center lg:text-left">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-bold mb-6"
                        >
                            <FaRocket className="animate-pulse" />
                            SPECIAL OFFER
                        </motion.div>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                            Lần đầu đặt Tour tại <span className="text-yellow-400">TravelVN</span>?
                        </h2>
                        <p className="text-xl text-blue-100 mb-8 max-w-xl">
                            Nhận ngay mã giảm giá <span className="font-bold text-white uppercase underline decoration-yellow-400">{promoCode}</span> trị giá <span className="text-yellow-400 font-bold">{promoAmount}₫</span> cho đơn hàng đầu tiên.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <button
                                onClick={handleCopy}
                                className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-yellow-400 hover:text-gray-900 transition-all shadow-xl flex items-center justify-center gap-2 min-w-[200px]"
                            >
                                {copied ? (
                                    <>
                                        <FaCheck className="text-green-500" />
                                        Đã sao chép
                                    </>
                                ) : (
                                    <>
                                        <FaCopy />
                                        Sao chép mã
                                    </>
                                )}
                            </button>
                            <button className="bg-white/10 backdrop-blur-md text-white border-2 border-white/30 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all">
                                Tìm hiểu thêm
                            </button>
                        </div>
                    </div>

                    {/* Ticket UI */}
                    <motion.div
                        initial={{ rotate: -5, y: 50, opacity: 0 }}
                        whileInView={{ rotate: 5, y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        className="relative w-full max-w-sm"
                    >
                        <div className="bg-white rounded-3xl p-8 shadow-2xl text-gray-900 relative overflow-hidden">
                            {/* Ticket cutouts */}
                            <div className="absolute top-1/2 -left-4 w-8 h-8 bg-purple-600 rounded-full -translate-y-1/2" />
                            <div className="absolute top-1/2 -right-4 w-8 h-8 bg-purple-600 rounded-full -translate-y-1/2" />
                            <div className="absolute top-1/2 left-4 right-4 border-t-2 border-dashed border-gray-200" />

                            <div className="flex justify-between items-center mb-8">
                                <FaTicketAlt className="text-4xl text-blue-600" />
                                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Travel Voucher</span>
                            </div>

                            <div className="mb-12">
                                <p className="text-gray-500 font-medium">Giảm giá trực tiếp</p>
                                <h3 className="text-4xl font-black text-gray-900">-{promoAmount}₫</h3>
                            </div>

                            <div className="flex flex-col items-center">
                                <button
                                    onClick={handleCopy}
                                    className="bg-gray-100 px-6 py-4 rounded-2xl border-2 border-dashed border-blue-200 w-full text-center group relative overflow-hidden transition-all hover:bg-blue-50"
                                >
                                    <span className="text-sm text-gray-400 block mb-1">Nhấn để sao chép</span>
                                    <span className="text-2xl font-black text-blue-600 group-hover:tracking-widest transition-all">{promoCode}</span>

                                    {copied && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="absolute inset-0 bg-blue-600/10 flex items-center justify-center backdrop-blur-[2px]"
                                        >
                                            <FaCheck className="text-blue-600 text-xl" />
                                        </motion.div>
                                    )}
                                </button>
                                <div className="flex items-center gap-2 mt-4 text-xs font-bold text-gray-400 uppercase">
                                    <FaGift /> Quà tặng thành viên mới
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default NewCustomerPromo;

