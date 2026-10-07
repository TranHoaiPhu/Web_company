/* eslint-disable @typescript-eslint/no-explicit-any */
// services/booking.service.ts
import httpBooking from '../httpBooking';
import { CreateBookingPayload } from '@/types/booking';
export const bookingService = {
  async createBooking(payload: CreateBookingPayload) {
    try {
      const response = await httpBooking.post('/bookings/with-participants', payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Không thể tạo đặt chỗ. Vui lòng thử lại.'
      );
    }
  },

  // Nếu cần gọi thanh toán sau (VNPay, MoMo redirect)
  async initiatePayment(bookingId: string, method: string) {
    // Ví dụ redirect đến gateway
    const res = await httpBooking.post(`/api/payments/initiate`, { bookingId, method });
    return res.data;
  },
};