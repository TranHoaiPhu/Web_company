import httpBooking from "./http-tour";

export interface Location {
    id: number;
    name: string;
    address?: string;
    slug: string;
    type: string;
    parent_id?: number;
    description?: string;
    latitude?: number;
    longitude?: number;
    image_url?: string;
    hero_image_url?: string;
    is_active: boolean;
    tagline?: string;
    subtitle?: string;
    climate?: string;
    suitable_for?: string;
    famous_for?: string;
    vibe?: string;
    comparison?: string;
    season_data?: any[];
    highlights_data?: any[];
    cuisine_data?: any[];
    ideal_for_data?: any[];
    tips_data?: any[];
    activities_data?: any[];
    created_at?: string;
    updated_at?: string;
    parent?: Location;
}

export interface LocationListResponse {
    data: Location[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface LocationCreateInput {
    name: string;
    type: string;
    parent_id?: number | null;
    description?: string;
    latitude?: number;
    longitude?: number;
    image_url?: string;
    hero_image_url?: string;
    is_active?: boolean;
    tagline?: string;
    subtitle?: string;
    climate?: string;
    suitable_for?: string;
    famous_for?: string;
    vibe?: string;
    comparison?: string;
    season_data?: any[];
    highlights_data?: any[];
    cuisine_data?: any[];
    ideal_for_data?: any[];
    tips_data?: any[];
    activities_data?: any[];
}

export interface FindOrCreateInput {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
    placeId?: string;
    photos?: string[];
}

class LocationService {
    async getLocations(params?: {
        page?: number;
        pageSize?: number;
        search?: string;
        type?: string;
        parent_id?: number;
        is_active?: boolean;
    }): Promise<LocationListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.type) queryParams.append('type', params.type);
        if (params?.parent_id) queryParams.append('parent_id', params.parent_id.toString());
        if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());

        const response = await httpBooking.get(`/locations?${queryParams.toString()}`);
        return response.data;
    }

    async getLocationById(id: number): Promise<Location> {
        const response = await httpBooking.get(`/locations/${id}`);
        return response.data;
    }

    async getLocationTree(): Promise<Location[]> {
        const response = await httpBooking.get('/locations/tree');
        return response.data;
    }

    async getActiveLocations(): Promise<Location[]> {
        const response = await httpBooking.get('/locations/active');
        return response.data;
    }

    async createLocation(data: LocationCreateInput): Promise<Location> {
        const response = await httpBooking.post('/locations', data);
        return response.data;
    }

    async updateLocation(id: number, data: Partial<LocationCreateInput>): Promise<Location> {
        const response = await httpBooking.put(`/locations/${id}`, data);
        return response.data;
    }

    async deleteLocation(id: number): Promise<{ success: boolean; data: Location }> {
        const response = await httpBooking.delete(`/locations/${id}`);
        return response.data;
    }

    async findOrCreateByCoordinates(data: FindOrCreateInput): Promise<{
        success: boolean;
        isNew: boolean;
        data: Location;
    }> {
        const response = await httpBooking.post('/locations/find-or-create', data);
        return response.data;
    }
}

export const locationService = new LocationService();
