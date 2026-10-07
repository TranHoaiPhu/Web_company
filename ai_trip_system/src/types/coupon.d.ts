export interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discount_value: string;
  max_discount_amount: string;
  min_order_amount: string;
  max_uses: number;
  max_uses_per_user: number;
  used_count: number;
  valid_from: string; // ISO date string
  valid_to: string;   // ISO date string
  is_active: boolean;
  is_public: boolean;
  applicable_tour_ids: string[] | null;
  applicable_category_ids: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ValidateCouponParams {
  code: string;
  user_id?: number;
  order_amount: number;
  tour_id?: number;
  category_id?: number | null;
}

export interface ValidateCouponResponse {
  valid: boolean;
  discount: Coupon | null ; 
  message?: string;
}
