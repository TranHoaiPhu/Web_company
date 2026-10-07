/* eslint-disable @typescript-eslint/no-explicit-any */
import http from './http-tour';

export interface Schedule {
    id: string | number;
    tour_id: string | number;
    tour_name?: string;
    tour_slug?: string;
    location_name?: string;
    location_slug?: string;
    start_date: string;
    end_date: string;
    price_override?: number | string;
    total_slots: number;
    available_slots: number;
    booked_slots: number;
    occupancy_rate?: number | string;
    status: 'OPEN' | 'CLOSED' | 'FULL';
    notes?: string;
    booking_count?: number;
    customer_count?: number;
    revenue?: number | string;
    created_at?: string;
    updated_at?: string;
}

export interface ScheduleFilters {
    page?: number;
    limit?: number;
    search?: string;
    tour_id?: string | number;
    status?: string;
    from_date?: string;
    to_date?: string;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
}

export interface ScheduleListResponse {
    success: boolean;
    data: {
        schedules: Schedule[];
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

export interface ScheduleDetailResponse {
    success: boolean;
    data: {
        schedule: Schedule;
        tour?: any;
        statistics?: {
            total_orders: number;
            paid_orders: number;
            unpaid_orders: number;
            total_adults: number;
            total_children: number;
            total_infants: number;
            total_revenue_potential: number;
            total_revenue_confirmed: number;
            occupancy_rate: number;
            payment_completion_rate: number;
        };
        customers?: any[];
    };
}

export const scheduleService = {
    getSchedules: async (filters: ScheduleFilters = {}): Promise<ScheduleListResponse> => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, String(value));
            }
        });
        const response = await http.get(`tour-schedules?${params.toString()}`);
        return response.data;
    },

    getSchedule: async (id: string | number): Promise<{ success: boolean; data: Schedule }> => {
        const response = await http.get(`tour-schedules/${id}/tour`);
        return response.data;
    },

    getScheduleOverview: async (id: string | number): Promise<{ success: boolean; data: any }> => {
        const response = await http.get(`tour-schedules/overview/${id}`);
        return response.data;
    },

    getScheduleStatistics: async (id: string | number): Promise<{ success: boolean; data: any }> => {
        const response = await http.get(`tour-schedules/statistics/${id}`);
        return response.data;
    },

    getScheduleCustomers: async (id: string | number, filters: any = {}): Promise<{ success: boolean; data: any }> => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, String(value));
            }
        });
        const response = await http.get(`tour-schedules/customers/${id}?${params.toString()}`);
        return response.data;
    },

    getScheduleParticipants: async (id: string | number, filters: any = {}): Promise<{ success: boolean; data: any }> => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, String(value));
            }
        });
        const response = await http.get(`tour-schedules/participants/${id}?${params.toString()}`);
        return response.data;
    },

    createSchedule: async (data: Partial<Schedule>): Promise<{ success: boolean; data: Schedule }> => {
        const response = await http.post('tour-schedules', data);
        return response.data;
    },

    updateSchedule: async (id: string | number, data: Partial<Schedule>): Promise<{ success: boolean; data: Schedule }> => {
        const response = await http.put(`tour-schedules/${id}`, data);
        return response.data;
    },

    deleteSchedule: async (id: string | number): Promise<{ success: boolean; message: string }> => {
        const response = await http.delete(`tour-schedules/${id}`);
        return response.data;
    },
};
