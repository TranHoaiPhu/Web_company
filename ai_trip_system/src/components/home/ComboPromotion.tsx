"use client";

import { motion } from "framer-motion";
import { FaHotel, FaPlane, FaBus, FaCompass, FaChevronRight } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";

const ComboPromotion = () => {
    const combos = [
        {
            title: "Combo Phú Quốc",
            description: "Vé máy bay khứ hồi + Resort 5 sao + Buffet sáng",
            price: "4.990.000",
            image: "https://images.unsplash.com/photo-1589779261502-340f1a942850?auto=format&fit=crop&q=80&w=800",
            saving: "30%",
            icons: [<FaPlane key="p" />, <FaHotel key="h" />]
        },
        {
            title: "Combo Đà Lạt",
            description: "Xe Limousine + Khách sạn view thung lũng + Tour ngoại ô",
            price: "2.450.000",
            image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&q=80&w=800",
            saving: "25%",
            icons: [<FaBus key="b" />, <FaHotel key="h" />, <FaCompass key="c" />]
        }
    ];

    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Combo Tiết Kiệm ✨</h2>
                    <p className="text-gray-600 text-lg">Du lịch trọn gói, không lo về giá</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {combos.map((combo, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative group h-[300px] rounded-3xl overflow-hidden shadow-2xl cursor-pointer"
                        >
                            <Image
                                src={combo.image}
                                alt={combo.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

                            <div className="absolute inset-0 p-8 flex flex-col justify-center max-w-lg">
                                <div className="flex gap-3 mb-4">
                                    {combo.icons.map((icon, i) => (
                                        <div key={i} className="bg-white/20 backdrop-blur-md p-2 rounded-lg text-white">
                                            {icon}
                                        </div>
                                    ))}
                                    <div className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm font-bold flex items-center">
                                        Tiết kiệm {combo.saving}
                                    </div>
                                </div>

                                <h3 className="text-3xl font-bold text-white mb-2">{combo.title}</h3>
                                <p className="text-gray-200 mb-6">{combo.description}</p>

                                <div className="flex items-center gap-6">
                                    <div>
                                        <span className="text-gray-400 text-sm block">Giá chỉ từ</span>
                                        <span className="text-2xl font-bold text-orange-400">{combo.price}₫</span>
                                    </div>
                                    <Link href="/tours" className="flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-orange-500 hover:text-white transition-all group/btn">
                                        Đặt ngay
                                        <FaChevronRight className="group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ComboPromotion;
