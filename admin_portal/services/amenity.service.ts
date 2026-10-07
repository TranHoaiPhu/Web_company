import bookingHttp from './http-tour';

export interface Amenity {
    id: number;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    category?: string;
    isActive: boolean;
    createdAt?: string;
}

export interface CreateAmenityPayload {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    category?: string;
}

export interface UpdateAmenityPayload {
    name?: string;
    slug?: string;
    description?: string;
    icon?: string;
    category?: string;
    isActive?: boolean;
}

export const amenityService = {
    // Lấy tất cả amenities
    getAll: async (params?: { category?: string; is_active?: string }): Promise<Amenity[]> => {
        try {
            const response = await bookingHttp.get('/amenities', { params });
            return response.data?.data || [];
        } catch (error) {
            console.error('Error fetching amenities:', error);
            throw error;
        }
    },

    // Lấy amenity theo ID
    getById: async (id: number): Promise<Amenity> => {
        try {
            const response = await bookingHttp.get(`/amenities/${id}`);
            return response.data?.data;
        } catch (error) {
            console.error('Error fetching amenity:', error);
            throw error;
        }
    },

    // Tạo amenity mới
    create: async (data: CreateAmenityPayload): Promise<Amenity> => {
        try {
            const response = await bookingHttp.post('/amenities', data);
            return response.data?.data;
        } catch (error) {
            console.error('Error creating amenity:', error);
            throw error;
        }
    },

    // Cập nhật amenity
    update: async (id: number, data: UpdateAmenityPayload): Promise<Amenity> => {
        try {
            const response = await bookingHttp.put(`/amenities/${id}`, data);
            return response.data?.data;
        } catch (error) {
            console.error('Error updating amenity:', error);
            throw error;
        }
    },

    // Xóa amenity
    delete: async (id: number): Promise<void> => {
        try {
            await bookingHttp.delete(`/amenities/${id}`);
        } catch (error) {
            console.error('Error deleting amenity:', error);
            throw error;
        }
    },

    // Kiểm tra số tour đang sử dụng amenity
    checkUsage: async (id: number): Promise<{ count: number; tours: { id: number; name: string; slug: string }[] }> => {
        try {
            const response = await bookingHttp.get(`/amenities/${id}/usage`);
            return response.data?.data || { count: 0, tours: [] };
        } catch (error) {
            console.error('Error checking amenity usage:', error);
            throw error;
        }
    },
};
