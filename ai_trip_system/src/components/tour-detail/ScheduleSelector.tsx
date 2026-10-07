// components/tour-detail/ScheduleSelector.tsx
'use client';
import { TourSchedule } from '@/types/schedule';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Clock, TrendingDown, CheckCircle2 } from 'lucide-react';

export default function ScheduleSelector({
  schedules,
  basePrice,
}: {
  schedules: TourSchedule[];
  basePrice: number;
}) {
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-5">
        {schedules.map((sch, index) => {
          const price = sch.price_override || basePrice;
          const available = sch.available_slots;
          const bookedPercent = (sch.booked_slots / (sch.total_slots)) * 100;
          const isSelected = selectedSchedule === sch.schedule_id;
          const hasDiscount = sch.price_override && sch.price_override < basePrice;

          return (
            <motion.div
              key={sch.schedule_id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedSchedule(sch.schedule_id)}
              className="group relative cursor-pointer"
            >
              <div className={`relative rounded-3xl transition-all duration-300 ${
                isSelected
                  ? 'bg-gradient-to-br from-blue-50 to-teal-50 border-2 border-blue-400 shadow-2xl shadow-blue-200/50'
                  : 'bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:border-blue-400 shadow-lg hover:shadow-xl'
              }`}>
                {/* Discount Badge */}
                {hasDiscount && (
                  <div className="absolute -top-3 -right-3 z-10">
                    <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                      <TrendingDown className="w-4 h-4" />
                      <span className="text-sm font-bold">
                        -{Math.round(((basePrice - price) / basePrice) * 100)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Selected Badge */}
                {isSelected && (
                  <div className="absolute -top-3 -left-3 z-10">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-2 rounded-full shadow-lg">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                )}

                <div className="p-6 md:p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Date Info */}
                    <div className="flex-1 space-y-4">
                      {/* Main Date */}
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                          isSelected 
                            ? 'bg-gradient-to-br from-blue-600 to-blue-800' 
                            : 'bg-gradient-to-br from-gray-600 to-gray-700'
                        }`}>
                          <Calendar className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                            {new Date(sch.start_date).toLocaleDateString('vi-VN', {
                              weekday: 'long',
                            })}
                          </h3>
                          <p className="text-lg font-semibold text-gray-700">
                            {new Date(sch.start_date).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Duration & Availability */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">
                            {new Date(sch.start_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                            {' → '}
                            {new Date(sch.end_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Còn {available} chỗ
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Đã đặt: {sch.booked_slots}</span>
                          <span>Tổng: {sch.total_slots} chỗ</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${bookedPercent}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                            className={`h-3 rounded-full ${
                              available < 5 
                                ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                                : 'bg-gradient-to-r from-blue-500 to-blue-700'
                            }`}
                          />
                        </div>
                        {available < 5 && (
                          <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            Sắp hết chỗ!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* No schedules fallback */}
      {schedules.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl border-2 border-dashed border-gray-300">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">Chưa có lịch khởi hành</p>
          <p className="text-gray-500 text-sm mt-2">Vui lòng liên hệ để biết thêm thông tin</p>
        </div>
      )}
    </section>
  );
}