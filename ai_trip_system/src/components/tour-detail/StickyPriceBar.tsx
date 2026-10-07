// components/tour-detail/StickyPriceBar.tsx
'use client';
import { TourDetail } from '@/types/tour';
import { motion, useScroll } from 'framer-motion';
import { useEffect, useState } from 'react';
export default function StickyPriceBar({ tour }: { tour: TourDetail }) {
    const { scrollY } = useScroll();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        return scrollY.onChange(y => setVisible(y > 300));
    }, [scrollY]);

    return (
        <motion.div
            className="fixed bottom-0 left-0 right-0 bg-white shadow-md p-4 flex justify-between items-center md:hidden"
            initial={{ y: '100%' }}
            animate={{ y: visible ? 0 : '100%' }}
            transition={{ duration: 0.3 }}
        >
            <div>
                <p className="font-bold">Giá từ: {tour.tour.base_price.toLocaleString()}đ</p>
                <p className="text-sm text-gray-600">Còn {tour.upcoming_schedules[0]?.available_slots} chỗ</p>
            </div>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700">Đặt ngay</button>
        </motion.div>
    );
}

