import { Coupon } from '@/types/coupon';
import httpBooking from '../httpBooking';
import {
  ValidateCouponParams,
  ValidateCouponResponse
} from '@/types/coupon';

export const couponService = {
  async getAll(): Promise<Coupon[]> {
    try {
      const res = await httpBooking.get('/coupons');
      return res.data?.data ?? res.data ?? [];
    } catch (error) {
      console.error('Error fetching coupons:', error);
      return [];
    }
  },

  async validate(
    params: ValidateCouponParams
  ): Promise<ValidateCouponResponse> {
    try {
      const res = await httpBooking.post('/coupons/check', params);
      console.log('Coupon validation response:', res.data); // Debug log
      return res.data?.data ?? res.data;
    } catch (error) {
      console.error('Error validating coupon:', error);
      throw error;
    }
  }
};
