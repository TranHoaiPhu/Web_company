"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FaBolt, FaFire, FaTag, FaArrowRight } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import { tourService } from "@/services/tours/tour.service";
import { mapTourApiToBase } from "@/mapper/tour.mapper";
import type { TourApi } from "@/types/tour.api";
import type { TourBase } from "@/types/tour";

const FlashSale = () => {
    const [tours, setTours] = useState<TourBase[]>([]);
    const [timeLeft, setTimeLeft] = useState({
        hours: 12,
        minutes: 45,
        seconds: 30
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
                if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
                return prev;
            });
        }, 1000);

        const fetchSaleTours = async () => {
            try {
                const response = await tourService.getAll();
                const apiTours = response as TourApi[];
                const mapped = apiTours.map(mapTourApiToBase);
                // Filter tours with isHotDeal or significant discount
                const saleTours = mapped.filter(tour =>
                    tour.isHotDeal || (tour.originalPrice && tour.originalPrice > tour.price)
                ).slice(0, 4);
                setTours(saleTours);
            } catch (error) {
                console.error("Error fetching sale tours:", error);
            }
        };

        fetchSaleTours();
        return () => clearInterval(timer);
    }, []);

    if (tours.length === 0) return null;

    return (
        <section className="py-16 bg-gradient-to-r from-orange-50 to-red-50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-red-600 text-white p-4 rounded-2xl shadow-lg animate-bounce">
                            <FaBolt className="text-3xl" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                                FLASH <span className="text-red-600">SALE</span>
                            </h2>
                            <p className="text-gray-600 font-medium">Ưu đãi cực sốc, kết thúc sau:</p>
                        </div>
                    </div>

                    {/* Countdown */}
                    <div className="flex gap-4">
                        {[
                            { label: "Giờ", value: timeLeft.hours },
                            { label: "Phút", value: timeLeft.minutes },
                            { label: "Giây", value: timeLeft.seconds }
                        ].map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center">
                                <div className="bg-gray-900 text-white w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold shadow-xl">
                                    {item.value.toString().padStart(2, '0')}
                                </div>
                                <span className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-wider">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {tours.map((tour, idx) => {
                        const discount = tour.originalPrice ? Math.round(((tour.originalPrice - tour.price) / tour.originalPrice) * 100) : 0;

                        return (
                            <motion.div
                                key={tour.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="group bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all overflow-hidden border border-orange-100 flex flex-col"
                            >
                                {/* Image Container */}
                                <div className="relative h-48 overflow-hidden">
                                    <Image
                                        src={tour.image || "/fallback-tour.jpg"}
                                        alt={tour.name}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                                        <FaFire /> -{discount}%
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <p className="text-white font-bold text-lg line-clamp-1">{tour.name}</p>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FaTag className="text-orange-500 text-sm" />
                                        <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Hot Deal</span>
                                    </div>

                                    <div className="mt-auto">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm text-gray-400 line-through">
                                                {tour.originalPrice?.toLocaleString('vi-VN')}₫
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-2xl font-black text-red-600">
                                                {tour.price.toLocaleString('vi-VN')}₫
                                            </span>
                                            <Link
                                                href={`/tours/${tour.slug || tour.id}`}
                                                className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                                            >
                                                <FaArrowRight />
                                            </Link>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mt-4">
                                            <div className="flex justify-between text-xs font-bold mb-1">
                                                <span className="text-red-600 uppercase">Sắp cháy vé</span>
                                                <span className="text-gray-500">Đã bán 85%</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                                                    style={{ width: '85%' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default FlashSale;
