// Interface Order

export interface Order {
	id: string;
	order_code: string;
	tour_id: string;
	schedule_id: string;
	discount_code_id: string | null;
	tour_name: string;
	location_name: string;
	start_date: string;
	end_date: string;
	price_at_booking: string;
	adult_quantity: number;
	child_quantity: number;
	infant_quantity: number;
	total_participants: number;
	contact_name: string;
	contact_phone: string;
	contact_email: string;
	special_requests: string;
	subtotal: string;
	discount_amount: string;
	total_price: string;
	status: string;
	payment_status: string;
	created_at: string;
	updated_at: string;
	note: string | null;
	user_id: string;
	payment_method: string | null;
	tour_slug: string;
	cover_image: string;
}