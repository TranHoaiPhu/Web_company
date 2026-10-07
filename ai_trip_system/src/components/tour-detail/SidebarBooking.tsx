// components/tour-detail/SidebarBooking.tsx
'use client';
import { TourSchedule } from '@/types/schedule';
import { TourDetail } from '@/types/tour';
import { useState } from 'react';

export default function SidebarBooking({ tour }: { tour: TourDetail }) {
  const [date, setDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [discountCode, setDiscountCode] = useState('');

  const total = (tour.tour.base_price * adults) + ((tour.tour.child_price || 0) * children) + ((tour.tour.infant_price || 0) * infants); // Realtime calc

  return (
    <div className="sticky top-24 bg-white p-6 rounded-2xl shadow-md">
      <h3 className="text-xl font-bold mb-4">Đặt tour</h3>
      <select value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 border rounded-xl mb-4">
        <option>Chọn ngày khởi hành</option>
        {tour.upcoming_schedules.map((sch: TourSchedule) => (
          <option key={sch.schedule_id}>{sch.start_date}</option>
        ))}
      </select>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div>
          <label>Người lớn</label>
          <input type="number" value={adults} onChange={e => setAdults(+e.target.value)} className="w-full p-2 border rounded-xl" min={1} />
        </div>
        <div>
          <label>Trẻ em</label>
          <input type="number" value={children} onChange={e => setChildren(+e.target.value)} className="w-full p-2 border rounded-xl" min={0} />
        </div>
        <div>
          <label>Em bé</label>
          <input type="number" value={infants} onChange={e => setInfants(+e.target.value)} className="w-full p-2 border rounded-xl" min={0} />
        </div>
      </div>
      <input
        placeholder="Mã giảm giá"
        value={discountCode}
        onChange={e => setDiscountCode(e.target.value)}
        className="w-full p-3 border rounded-xl mb-4"
      />
      <p className="text-xl font-bold mb-4">Tổng: {total.toLocaleString()}đ</p>
      <button disabled={!date} className="w-full bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 disabled:opacity-50">Đặt tour ngay</button>
    </div>
  );
}