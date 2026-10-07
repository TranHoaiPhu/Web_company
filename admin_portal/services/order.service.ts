/* eslint-disable @typescript-eslint/no-explicit-any */
import http from './http-tour';

export interface Order {
    id: string;
    order_code: string;
    user_id: string;
    user_name?: string;
    user_email?: string;
    user_phone?: string;
    tour_id: string;
    tour_name: string;
    tour_slug?: string;
    tour_image?: string;
    schedule_id: string;
    schedule_start?: string;
    schedule_end?: string;
    available_slots?: number;
    booked_slots?: number;
    location_name?: string;
    adult_quantity: number;
    child_quantity: number;
    infant_quantity: number;
    total_participants: number;
    contact_name: string;
    contact_phone: string;
    contact_email: string;
    subtotal: number | string;
    discount_amount: number | string;
    total_price: number | string;
    status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED' | 'REFUNDED';
    payment_status: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
    special_requests?: string;
    note?: string;
    created_at: string;
    updated_at?: string;
}

export interface OrderFilters {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    payment_status?: string;
    user_id?: string;
    start_date?: string;
    end_date?: string;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
}

export interface OrderListResponse {
    success: boolean;
    data: {
        orders: Order[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
            has_more: boolean;
        };
        filters: Record<string, any>;
    };
}

export const orderService = {
    getOrders: async (filters: OrderFilters = {}): Promise<OrderListResponse> => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, String(value));
            }
        });
        const response = await http.get(`orders?${params.toString()}`);
        console.log(response.data);
        return response.data;
    },

    getOrder: async (code: string): Promise<{ success: boolean; data: Order }> => {
        const response = await http.get(`orders/${code}`);
        return response.data;
    },

    getOrderParticipants: async (orderId: string): Promise<{ success: boolean; data: { participants: any[]; total: number } }> => {
        const response = await http.get(`orders/${orderId}/participants`);
        return response.data;
    },

    updateOrder: async (id: string, data: Partial<Order>): Promise<{ success: boolean; data: Order }> => {
        const response = await http.put(`orders/${id}`, data);
        return response.data;
    },

    deleteOrder: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await http.delete(`orders/${id}`);
        return response.data;
    },
};
