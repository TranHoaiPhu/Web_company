'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    MapPin, CloudSun, Users, Compass,
    Star, Info, Calendar, Utensils,
    Lightbulb, Camera, Waves, Mountain,
    ChevronRight, ArrowRight, Heart, Share2
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// NEW Interface for EPIC Destination
interface DestinationDetailData {
    id: number;
    name: string;
    slug: string;
    description: string;
    tagline?: string;
    subtitle?: string;
    hero_image_url?: string;
    image_url?: string;
    climate?: string;
    suitable_for?: string;
    famous_for?: string;
    vibe?: string;
    comparison?: string;
    season_data?: any[];
    highlights_data?: any[];
    cuisine_data?: any[];
    ideal_for_data?: any[];
    tips_data?: string[];
    activities_data?: string[];
}

import httpBooking from '@/services/httpBooking';
import { API_BASE_URL } from '@/config/api';

// Helper to format image URL using proxy if needed
const getImageUrl = (url: string | null | undefined): string => {
    if (!url) return '/images/elementor-placeholder-image.webp';
    if (url.startsWith('/') || url.includes('proxy_image')) return url;
    return `${API_BASE_URL}/proxy_image/?url=${encodeURIComponent(url)}`;
};

export default function DestinationDetail() {
    const params: any = useParams();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [data, setData] = useState<DestinationDetailData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
        if (params.slug) {
            fetchDestination(params.slug);
        }
    }, [params.slug]);

    const fetchDestination = async (slug: string) => {
        try {
            setLoading(true);
            const response = await httpBooking.get(`/locations?slug=${slug}`);
            if (response.data && response.data.data && response.data.data.length > 0) {
                setData(response.data.data[0]);
            }
        } catch (error) {
            console.error('Error fetching destination:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!mounted || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold">Không tìm thấy địa điểm</h1>
                <Link href="/destinations" className="text-blue-600 hover:underline">Quay lại danh sách</Link>
            </div>
        );
    }

    // Default Fallbacks for Badge Icons (Mapping types to icons)
    const getIdealIcon = (idx: number) => {
        const icons = [<Users key="u" />, <Heart key="h" />, <Camera key="ca" />, <Compass key="co" />];
        return icons[idx % icons.length];
    };

    const getHighlightIcon = (type: string) => {
        if (type?.includes('beach')) return <Waves className="text-blue-500" />;
        if (type?.includes('nature')) return <Mountain className="text-emerald-500" />;
        if (type?.includes('checkin')) return <Camera className="text-pink-500" />;
        return <Info className="text-amber-500" />;
    };

    return (
        <div className="min-h-screen bg-white mt-20">
            {/* 1. Hero Section */}
            <section className="relative h-[85vh] w-full overflow-hidden">
                <Image
                    src={getImageUrl(data.hero_image_url || data.image_url)}
                    alt={data.name}
                    fill
                    className="object-cover transition-transform duration-1000 scale-105"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

                <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center"
                    >
                        <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-2 drop-shadow-2xl uppercase">
                            {data.name}
                        </h1>
                        {data.tagline && (
                            <h2 className="text-2xl md:text-4xl font-light tracking-[0.5em] mb-6 opacity-90 uppercase">
                                {data.tagline}
                            </h2>
                        )}
                        {data.subtitle && (
                            <p className="text-xl md:text-2xl font-medium max-w-2xl mx-auto mb-10 italic opacity-80">
                                “{data.subtitle}”
                            </p>
                        )}

                        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                            {data.climate && (
                                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                                    <span className="text-yellow-400"><CloudSun size={14} /></span>
                                    <span className="text-xs uppercase font-bold tracking-wider">Khí hậu:</span>
                                    <span className="text-sm">{data.climate}</span>
                                </div>
                            )}
                            {data.suitable_for && (
                                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                                    <span className="text-yellow-400"><Star size={14} /></span>
                                    <span className="text-xs uppercase font-bold tracking-wider">Phù hợp:</span>
                                    <span className="text-sm">{data.suitable_for}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                                <span className="text-yellow-400"><MapPin size={14} /></span>
                                <span className="text-xs uppercase font-bold tracking-wider">Trạng thái:</span>
                                <span className="text-sm">Đang mở cửa</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
                    <ChevronRight size={32} className="rotate-90 text-white opacity-50" />
                </div>
            </section>

            {/* 2. Overview Section */}
            <section className="py-20 container mx-auto px-4 max-w-6xl">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl"
                    >
                        <Image src={getImageUrl(data.image_url)} alt="Overview" fill className="object-cover" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-6"
                    >
                        <div className="bg-blue-50 text-blue-600 font-bold text-xs uppercase tracking-widest px-4 py-1 inline-block rounded-full">
                            Khám phá tổng quan
                        </div>
                        <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                            Bản sắc điểm đến <span className="text-blue-600">tuyệt mỹ</span>
                        </h2>
                        <p className="text-gray-600 leading-relaxed text-lg">
                            {data.description}
                        </p>

                        <div className="space-y-4 pt-4">
                            {data.famous_for && (
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                                        <Star className="text-blue-600" size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Nổi tiếng vì</h4>
                                        <p className="text-gray-600">{data.famous_for}</p>
                                    </div>
                                </div>
                            )}
                            {data.vibe && (
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
                                        <Compass className="text-emerald-600" size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Vibe điểm đến</h4>
                                        <p className="text-gray-600">{data.vibe}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {data.comparison && (
                            <div className="bg-gray-50 p-6 rounded-2xl border-l-4 border-blue-500 italic text-gray-700">
                                “{data.comparison}”
                            </div>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* 3. Best Time Section */}
            {data.season_data && data.season_data.length > 0 && (
                <section className="py-20 bg-slate-50">
                    <div className="container mx-auto px-4 max-w-5xl">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold mb-4">Mùa nào đẹp nhất?</h2>
                            <p className="text-gray-500">Lên kế hoạch hoàn hảo cho kỳ nghỉ của bạn</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {data.season_data.map((season, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ y: -10 }}
                                    className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                                            {season.time}
                                        </div>
                                        <div className="flex gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={16} className={`${i < (season.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{season.weather}</h3>
                                    <p className="text-gray-500 mb-6">Gợi ý hoạt động: <span className="text-blue-600 font-medium">{season.activity}</span></p>
                                    <div className={`h-2 rounded-full w-full ${idx === 0 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                    <p className="text-xs uppercase font-bold tracking-widest text-gray-400 mt-2">
                                        {idx === 0 ? 'Mùa cao điểm' : 'Mùa trải nghiệm'}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 4. Highlights Section */}
            {data.highlights_data && data.highlights_data.length > 0 && (
                <section className="py-20 container mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                        <div className="max-w-xl">
                            <h2 className="text-4xl font-bold mb-4">Đi đâu khi đến {data.name}?</h2>
                            <p className="text-gray-500">Những tọa độ check-in "làm mưa làm gió" mà bất kỳ tín đồ du lịch nào cũng phải một lần ghé qua.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {data.highlights_data.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="group cursor-pointer"
                            >
                                <div className="bg-gray-50 rounded-3xl p-8 h-full border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                                    <div className="mb-6 bg-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500 text-2xl">
                                        {getHighlightIcon(item.type)}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed mb-6">
                                        {item.desc}
                                    </p>
                                    <div className="flex items-center text-xs font-bold uppercase tracking-wider text-blue-600 group-hover:gap-2 transition-all">
                                        Chi tiết <ChevronRight size={14} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* 5. Cuisine Section */}
            {data.cuisine_data && data.cuisine_data.length > 0 && (
                <section className="py-20 bg-gray-900 text-white">
                    <div className="container mx-auto px-4">
                        <div className="mb-16">
                            <h2 className="text-4xl font-bold mb-2 uppercase">Ẩm thực {data.name}</h2>
                            <p className="text-gray-400">Đừng bỏ lỡ những hương vị đặc trưng của vùng đất này</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {data.cuisine_data.map((dish, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ y: -10 }}
                                    className="group relative h-[400px] rounded-3xl overflow-hidden shadow-2xl"
                                >
                                    <Image src={getImageUrl(dish.image)} alt={dish.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                    <div className="absolute bottom-0 left-0 p-8 w-full">
                                        <div className="flex justify-between items-end mb-2">
                                            <h3 className="text-2xl font-bold">{dish.name}</h3>
                                            {dish.price && <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded font-bold uppercase">{dish.price}</span>}
                                        </div>
                                        <p className="text-gray-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            {dish.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 6. Ideal For & 8. Activities */}
            <section className="py-24 container mx-auto px-4 max-w-6xl">
                <div className="grid md:grid-cols-2 gap-20">
                    {data.ideal_for_data && data.ideal_for_data.length > 0 && (
                        <div>
                            <h2 className="text-3xl font-bold mb-10 border-b pb-4">Địa điểm này hợp với?</h2>
                            <div className="grid grid-cols-2 gap-6">
                                {data.ideal_for_data.map((item, idx) => (
                                    <div key={idx} className="flex flex-col items-center p-6 bg-slate-50 rounded-3xl text-center hover:bg-white hover:shadow-xl transition-all border border-slate-100 cursor-default">
                                        <div className="text-4xl mb-3 text-blue-600">{getIdealIcon(idx)}</div>
                                        <span className="font-bold text-gray-800 text-sm">{item.label || item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.activities_data && data.activities_data.length > 0 && (
                        <div>
                            <h2 className="text-3xl font-bold mb-10 border-b pb-4">Trải nghiệm phải thử</h2>
                            <div className="space-y-4">
                                {data.activities_data.map((act, idx) => (
                                    <motion.div
                                        key={idx}
                                        whileHover={{ x: 10 }}
                                        className="flex items-center gap-4 p-4 rounded-2xl hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100 cursor-default group"
                                    >
                                        <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold">
                                            {idx + 1}
                                        </div>
                                        <span className="text-gray-700 font-medium group-hover:text-blue-700 transition-colors uppercase tracking-tight">{act}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* 7. Tips from Locals */}
            {data.tips_data && data.tips_data.length > 0 && (
                <section className="py-20 container mx-auto px-4 max-w-4xl">
                    <div className="bg-amber-50 rounded-[40px] p-10 md:p-16 relative overflow-hidden border border-amber-200">
                        <div className="absolute -right-20 -top-20 text-[200px] text-amber-200/20 font-black pointer-events-none">
                            !
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                    <Lightbulb size={24} fill="white" />
                                </div>
                                <h2 className="text-3xl font-bold text-amber-900">Tips from Locals</h2>
                            </div>
                            <div className="grid md:grid-cols-1 gap-6">
                                {data.tips_data.map((tip, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0" />
                                        <p className="text-amber-800 font-medium text-lg leading-relaxed">{tip}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* 9. CTA Section */}
            <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-900 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-400 rounded-full blur-[100px]" />
                </div>

                <div className="relative z-10 container mx-auto px-4 max-w-4xl">
                    <h2 className="text-4xl md:text-6xl font-black mb-6 uppercase">Khám phá {data.name}?</h2>
                    <p className="text-blue-100 text-xl md:text-2xl mb-12 opacity-80">
                        Hãy để chúng tôi đồng hành cùng chuyến đi trong mơ của bạn
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-6">
                        <button
                            onClick={() => router.push(`/tours?location=${data.id}`)}
                            className="bg-white text-blue-900 px-12 py-5 rounded-full font-black text-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3 group uppercase"
                        >
                            XEM TOURS {data.name} <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                        </button>
                        <button
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: data.name,
                                        text: data.tagline,
                                        url: window.location.href
                                    });
                                }
                            }}
                            className="bg-white/10 backdrop-blur-md border-2 border-white/30 text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-white/20 transition-all flex items-center justify-center gap-3"
                        >
                            <Share2 size={24} /> Chia sẻ địa điểm
                        </button>
                    </div>

                    <div className="mt-16 pt-12 border-t border-white/10 flex items-center justify-center gap-12 flex-wrap opacity-60">
                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-bold">50+</span>
                            <span className="text-xs uppercase font-bold tracking-widest mt-1">Tours đa dạng</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-bold">24/7</span>
                            <span className="text-xs uppercase font-bold tracking-widest mt-1">Hỗ trợ tận tâm</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-bold">100%</span>
                            <span className="text-xs uppercase font-bold tracking-widest mt-1">Bảo hiểm du lịch</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Custom Styles for special animations */}
            <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
}
