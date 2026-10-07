import httpTour from './http-tour';

export interface Banner {
    id?: number;
    title: string;
    subtitle?: string;
    description?: string;
    image_url: string;
    mobile_image_url?: string;
    alt_text?: string;
    location?: string;
    tag?: string;
    link_url?: string;
    link_text?: string;
    tour_id?: string;
    display_order: number;
    status: 'ACTIVE' | 'INACTIVE' | 'SCHEDULED';
    start_date?: string;
    end_date?: string;
    background_color?: string;
    text_color?: string;
    is_active: boolean;
    view_count?: number;
    click_count?: number;
    created_at?: string;
    updated_at?: string;
}

export const bannerService = {
    // Get all banners
    async getAll(params?: any) {
        const response = await httpTour.get('/banners', { params });
        return response.data;
    },

    // Get banner by ID
    async getById(id: number) {
        const response = await httpTour.get(`/banners/${id}`);
        return response.data;
    },

    // Create banner
    async create(data: Banner) {
        const response = await httpTour.post('/banners', data);
        return response.data;
    },

    // Update banner
    async update(id: number, data: Partial<Banner>) {
        const response = await httpTour.put(`/banners/${id}`, data);
        return response.data;
    },

    // Delete banner
    async delete(id: number) {
        const response = await httpTour.delete(`/banners/${id}`);
        return response.data;
    },

    // Track view
    async trackView(id: number) {
        const response = await httpTour.patch(`/banners/${id}/view`);
        return response.data;
    },

    // Track click
    async trackClick(id: number) {
        const response = await httpTour.patch(`/banners/${id}/click`);
        return response.data;
    }
};

export default bannerService;
