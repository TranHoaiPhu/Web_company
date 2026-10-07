'use client';

import { TourSchedule } from '@/types/schedule';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Users, UserMinus, Shield, CreditCard, Phone } from 'lucide-react';
import { scheduleService } from '@/services/tours/schedule.service';
import { TourFromScheduleData } from '@/types/tour.api';

interface BookingSidebarProps {
  tourName: string;
  basePrice: number;
  schedules: TourSchedule[];
  child_price: number;
  infant_price: number;
}

const DEFAULT_ADULTS = 2;
const DEFAULT_CHILDREN = 0;

export default function BookingSidebar({
  tourName,
  basePrice,
  schedules,
  child_price,
}: BookingSidebarProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const [adults, setAdults] = useState(DEFAULT_ADULTS);
  const [children, setChildren] = useState(DEFAULT_CHILDREN);
  const [selectedSchedule, setSelectedSchedule] = useState(
    schedules[0]?.schedule_id || ''
  );
  const [tourInfo, setTourInfo] = useState<TourFromScheduleData>();
  const [isLoading, setIsLoading] = useState(false);

  // Fix infinite loop: add dependency array
  useEffect(() => {
    if (!selectedSchedule) return;

    const fetchTourInfo = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching tour info for schedule:', selectedSchedule);
        const res = await scheduleService.getTourByScheduleId(
          selectedSchedule.toString()
        );
        // Debug log
        // eslint-disable-next-line no-console
        console.log('BookingSidebar - API Response:', res);
        setTourInfo(res.data);
      } catch (error) {
        console.error('Failed to fetch tour info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTourInfo();
  }, [selectedSchedule]);

  // Memoize calculations
  const totalPrice = useMemo(() => {
    return adults * basePrice + children * child_price;
  }, [adults, children, basePrice, child_price]);

  const childrenPrice = useMemo(() => {
    return children * child_price;
  }, [children, child_price]);

  const adultsPrice = useMemo(() => {
    return adults * basePrice;
  }, [adults, basePrice]);

  // Infant calculation removed as it was unused and 0 multiplier makes it 0.
  // If needed in future, can be re-added.

  // Memoize selected schedule object
  const selectedScheduleObj = useMemo(() => {
    return schedules.find((s) => s.schedule_id === selectedSchedule);
  }, [schedules, selectedSchedule]);

  const handleBooking = useCallback(() => {
    if (!isLoggedIn) {
      const callbackUrl = window.location.pathname + window.location.search;
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }


    // Debug: log tourInfo khi nhấn đặt tour
    // eslint-disable-next-line no-console
    console.log('BookingSidebar - tourInfo (on booking):', tourInfo);

    if (!tourInfo?.tour || !selectedScheduleObj) {
      console.error('Missing tour information');
      return;
    }

    const bookingInfo = {
      tourInfoOverview: tourInfo,
      SelectedSchedule: selectedScheduleObj,
      adult: adults,
      child: children,
      infant: 0,
    };

    const bookingInfoStr = btoa(
      encodeURIComponent(JSON.stringify(bookingInfo))
    );
    router.push(`/booking?bookingInfo=${encodeURIComponent(bookingInfoStr)}`);
  }, [
    isLoggedIn,
    tourInfo,
    selectedScheduleObj,
    adults,
    children,
    router,
  ]);

  const handleContact = useCallback(() => {
    // Add your contact logic here
    console.log('Contact button clicked');
  }, []);

  const handleScheduleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedSchedule(e.target.value);
    },
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-24 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        <div className="text-sm font-medium mb-2 opacity-90">Đặt Tour</div>
        <h3 className="text-xl font-bold">{tourName}</h3>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Schedule Selection */}
        <ScheduleSelector
          schedules={schedules}
          selectedSchedule={selectedSchedule}
          onChange={handleScheduleChange}
        />

        {/* Passengers */}
        <div className="space-y-4">
          <Counter
            label="Người lớn"
            icon={<Users className="w-5 h-5 text-blue-600" />}
            value={adults}
            min={1}
            onChange={setAdults}
          />
          <Counter
            label="Trẻ em"
            icon={<UserMinus className="w-5 h-5 text-blue-600" />}
            value={children}
            min={0}
            onChange={setChildren}
          />
        </div>

        {/* Price Breakdown */}
        <PriceBreakdown
          adults={adults}
          adultsPrice={adultsPrice}
          childrenPrice={childrenPrice}
          totalPrice={totalPrice}
          // eslint-disable-next-line react/no-children-prop
          children={children}
        />

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleBooking}
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang tải...' : 'Đặt tour ngay'}
          </button>
          <button
            onClick={handleContact}
            className="w-full py-4 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
          >
            <Phone className="w-5 h-5" />
            Liên hệ tư vấn
          </button>
        </div>

        {/* Trust Badges */}
        <TrustBadges />
      </div>
    </motion.div>
  );
}

/* ---------- Sub Components ---------- */

interface ScheduleSelectorProps {
  schedules: TourSchedule[];
  selectedSchedule: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

function ScheduleSelector({
  schedules,
  selectedSchedule,
  onChange,
}: ScheduleSelectorProps) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
        <Calendar className="w-5 h-5 text-blue-600" />
        Ngày khởi hành
      </label>
      <select
        value={selectedSchedule}
        onChange={onChange}
        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {schedules.map((schedule) => (
          <option key={schedule.schedule_id} value={schedule.schedule_id}>
            {new Date(schedule.start_date).toLocaleDateString('vi-VN')} •{' '}
            {schedule.available_slots} chỗ
          </option>
        ))}
      </select>
    </div>
  );
}

interface CounterProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  onChange: (v: number) => void;
}

function Counter({ label, icon, value, min, onChange }: CounterProps) {
  const handleDecrement = useCallback(() => {
    onChange(Math.max(min, value - 1));
  }, [value, min, onChange]);

  const handleIncrement = useCallback(() => {
    onChange(value + 1);
  }, [value, onChange]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Math.max(min, Number(e.target.value) || min);
      onChange(newValue);
    },
    [min, onChange]
  );

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium text-gray-700">{label}</span>
      </div>
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
        <button
          onClick={handleDecrement}
          className="px-3 py-2 text-gray-600 hover:bg-gray-100"
          aria-label={`Giảm ${label}`}
        >
          −
        </button>
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          className="w-16 text-center text-sm font-semibold border-none focus:ring-0"
          aria-label={label}
        />
        <button
          onClick={handleIncrement}
          className="px-3 py-2 text-gray-600 hover:bg-gray-100"
          aria-label={`Tăng ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

interface PriceBreakdownProps {
  adults: number;
  children: number;
  adultsPrice: number;
  childrenPrice: number;
  totalPrice: number;
}

function PriceBreakdown({
  adults,
  children,
  adultsPrice,
  childrenPrice,
  totalPrice,
}: PriceBreakdownProps) {
  return (
    <div className="border-t border-b border-gray-200 py-4 space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          Người lớn ({adults})
        </span>
        <span className="font-semibold">
          {adultsPrice.toLocaleString('vi-VN')} ₫
        </span>
      </div>
      {children > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            Trẻ em ({children})
          </span>
          <span className="font-semibold">
            {childrenPrice.toLocaleString('vi-VN')} ₫
          </span>
        </div>
      )}
      <div className="flex justify-between text-lg pt-2">
        <span className="font-bold text-gray-900">Tổng cộng</span>
        <span className="font-bold text-blue-600">
          {totalPrice.toLocaleString('vi-VN')} ₫
        </span>
      </div>
    </div>
  );
}

function TrustBadges() {
  return (
    <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4" />
        <span>Thanh toán an toàn</span>
      </div>
      <span>•</span>
      <div className="flex items-center gap-2">
        <CreditCard className="w-4 h-4" />
        <span>Bảo mật thông tin</span>
      </div>
    </div>
  );
}