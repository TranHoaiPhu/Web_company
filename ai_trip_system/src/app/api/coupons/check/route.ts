import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code } = body;

  // Mock logic for coupon validation
  if (code === 'DISCOUNT10') {
    return NextResponse.json({
      valid: true,
      discount: {
        id: '1',
        code: 'DISCOUNT10',
        name: '10% Off',
        description: 'Get 10% off your order',
        discount_type: 'PERCENTAGE',
        discount_value: '10',
        max_discount_amount: '100',
        min_order_amount: '0',
        max_uses: 100,
        max_uses_per_user: 1,
        used_count: 0,
        valid_from: new Date().toISOString(),
        valid_to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        is_public: true,
        applicable_tour_ids: null,
        applicable_category_ids: null,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      message: 'Coupon applied successfully!'
    });
  }

  return NextResponse.json({
    valid: false,
    discount: null,
    message: 'Mã không hợp lệ hoặc đã hết hạn'
  }, { status: 404 });
}
