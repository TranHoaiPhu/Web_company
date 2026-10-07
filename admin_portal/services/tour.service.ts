/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { BOOKING_API_URL } from '@/config/api';

const bookingHttp = axios.create({
    baseURL: BOOKING_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Transform API response to match Tour interface
function transformTourData(apiTour: any): Tour {
    return {
        id: String(apiTour.id),
        name: apiTour.name || apiTour.title || '',
        slug: apiTour.slug || '',
        shortDescription: apiTour.short_description || apiTour.description || '',
        description: apiTour.description || apiTour.fullDescription || '',
        basePrice: parseFloat(apiTour.base_price || apiTour.price || 0),
        childPrice: parseFloat(apiTour.child_price || apiTour.childPrice || 0),
        infantPrice: parseFloat(apiTour.infant_price || apiTour.infantPrice || 0),
        durationDays: apiTour.duration_days ?? apiTour.durationDays ?? 0,
        durationNights: apiTour.duration_nights ?? apiTour.durationNights ?? 0,
        maxParticipants: apiTour.max_participants || apiTour.maxGuests || 20,
        minParticipants: apiTour.min_participants || apiTour.minParticipants || 1,
        difficultyLevel: apiTour.difficulty || apiTour.difficultyLevel || 'EASY',
        transportationType: apiTour.transportation_type || apiTour.transportationType || '',
        status: apiTour.status || 'DRAFT',
        isFeatured: !!(apiTour.is_featured ?? apiTour.featured),
        isHotDeal: !!(apiTour.is_hot_deal ?? apiTour.isHotDeal),
        locationId: apiTour.location_id || apiTour.locationId || '',
        categoryId: apiTour.category_id || apiTour.categoryId || '',
        locationName: apiTour.location_name || apiTour.location || '',
        categoryName: apiTour.category_name || apiTour.category || '',
        coverImage: apiTour.cover_image || apiTour.image || null,
        rating: parseFloat(apiTour.rating) || 0,
        reviewCount: parseInt(apiTour.review_count || apiTour.reviews) || 0,
        bookingCount: parseInt(apiTour.booking_count || apiTour.bookingCount) || 0,
        viewCount: parseInt(apiTour.view_count || apiTour.viewCount) || 0,
        highlights: apiTour.highlights || '',
        includedServices: apiTour.included_services || apiTour.includedServices || '',
        excludedServices: apiTour.excluded_services || apiTour.excludedServices || '',
        cancellationPolicy: apiTour.cancellation_policy || apiTour.cancellationPolicy || '',
        termsConditions: apiTour.terms_conditions || apiTour.termsConditions || '',
        departureLocation: apiTour.departure_location || apiTour.departureLocation || '',
        returnLocation: apiTour.return_location || apiTour.returnLocation || '',
    };
}

export interface Tour {
    id: string;
    name: string;
    slug: string;
    shortDescription?: string;
    description?: string;
    basePrice: number;
    childPrice?: number;
    infantPrice?: number;
    durationDays: number;
    durationNights: number;
    maxParticipants: number;
    minParticipants?: number;
    difficultyLevel?: 'EASY' | 'MEDIUM' | 'DIFFICULT';
    transportationType?: string;
    status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
    isFeatured: boolean;
    isHotDeal: boolean;
    locationId?: string | number;
    categoryId?: string | number;
    locationName?: string;
    categoryName?: string;
    coverImage?: string;
    rating?: number;
    reviewCount?: number;
    bookingCount?: number;
    viewCount?: number;
    createdAt?: string;
    highlights?: string;
    includedServices?: string;
    excludedServices?: string;
    cancellationPolicy?: string;
    termsConditions?: string;
    departureLocation?: string;
    returnLocation?: string;
}

export interface TourFilters {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    categoryId?: string | number;
    locationId?: string | number;
    sortBy?: string;
    isFeatured?: boolean;
    isHotDeal?: boolean;
    minPrice?: number;
    maxPrice?: number;
    difficulty?: string;
}

export interface TourResponse {
    success: boolean;
    data: Tour[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const tourService = {
    getTours: async (filters: TourFilters = {}): Promise<any> => {
        try {
            // Updated to use the comprehensive /tours endpoint instead of /tours/list
            const response = await bookingHttp.get('/tours', { params: filters });
            console.log('Raw API response from /tours:', response.data);

            // Transform data if it's an array
            if (response.data && Array.isArray(response.data.data)) {
                const transformedData = response.data.data.map((tour: any) => transformTourData(tour));
                return {
                    ...response.data,
                    data: transformedData
                };
            }
            return response.data;
        } catch (error) {
            console.error('Error fetching tours:', error);
            throw error;
        }
    },

    getTour: async (id: string): Promise<{ success: boolean; data: { tour: Tour;[key: string]: any } }> => {
        try {
            const response = await bookingHttp.get(`/tours/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching tour:', error);
            throw error;
        }
    },

    createTour: async (data: Partial<Tour>): Promise<{ success: boolean; data: Tour }> => {
        try {
            const response = await bookingHttp.post('/tours', data);
            return response.data;
        } catch (error) {
            console.error('Error creating tour:', error);
            throw error;
        }
    },

    updateTour: async (id: string, data: Partial<Tour>): Promise<{ success: boolean; data: Tour }> => {
        try {
            const response = await bookingHttp.put(`/tours/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating tour:', error);
            throw error;
        }
    },

    deleteTour: async (id: string): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await bookingHttp.delete(`/tours/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting tour:', error);
            throw error;
        }
    },

    // Advanced search with multiple criteria
    searchTours: async (filters: TourFilters): Promise<any> => {
        return tourService.getTours(filters);
    },

    // ============ TOUR AMENITIES ============
    getTourAmenities: async (tourId: string): Promise<any> => {
        try {
            const response = await bookingHttp.get(`/tours/${tourId}/amenities`);
            return response.data;
        } catch (error) {
            console.error('Error fetching tour amenities:', error);
            throw error;
        }
    },

    addTourAmenity: async (tourId: string, data: { amenity_id: number; is_included?: boolean; is_optional?: boolean; price?: number }): Promise<any> => {
        try {
            // Use single endpoint for adding one amenity at a time
            const response = await bookingHttp.post(`/tours/${tourId}/amenities/single`, data);
            return response.data;
        } catch (error) {
            console.error('Error adding tour amenity:', error);
            throw error;
        }
    },

    removeTourAmenity: async (tourId: string, amenityId: number): Promise<any> => {
        try {
            const response = await bookingHttp.delete(`/tours/${tourId}/amenities/${amenityId}`);
            return response.data;
        } catch (error) {
            console.error('Error removing tour amenity:', error);
            throw error;
        }
    },

    // ============ TOUR SCHEDULES ============
    getTourSchedules: async (tourId: string): Promise<any> => {
        try {
            const response = await bookingHttp.get(`/tours/${tourId}/schedules`);
            return response.data;
        } catch (error) {
            console.error('Error fetching tour schedules:', error);
            throw error;
        }
    },

    addTourSchedule: async (tourId: string, data: {
        start_date: string;
        end_date: string;
        price_override?: number;
        total_slots: number;
        status?: string;
    }): Promise<any> => {
        try {
            // Use single endpoint for adding one schedule at a time
            const response = await bookingHttp.post(`/tours/${tourId}/schedules/single`, data);
            return response.data;
        } catch (error) {
            console.error('Error adding tour schedule:', error);
            throw error;
        }
    },

    updateTourSchedule: async (tourId: string, scheduleId: number, data: any): Promise<any> => {
        try {
            const response = await bookingHttp.put(`/tours/${tourId}/schedules/${scheduleId}`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating tour schedule:', error);
            throw error;
        }
    },

    deleteTourSchedule: async (tourId: string, scheduleId: number): Promise<any> => {
        try {
            const response = await bookingHttp.delete(`/tours/${tourId}/schedules/${scheduleId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting tour schedule:', error);
            throw error;
        }
    },

    // ============ TOUR DAYS (ITINERARY) ============
    getTourDays: async (tourId: string): Promise<any> => {
        try {
            const response = await bookingHttp.get(`/tours/${tourId}/itinerary`);
            return response.data;
        } catch (error) {
            console.error('Error fetching tour days:', error);
            throw error;
        }
    },

    addTourDay: async (tourId: string, data: {
        day_number: number;
        title: string;
        description?: string;
        accommodation?: string;
        meals?: string;
    }): Promise<any> => {
        try {
            // Use single endpoint for adding one day at a time
            const response = await bookingHttp.post(`/tours/${tourId}/itinerary/single`, data);
            return response.data;
        } catch (error) {
            console.error('Error adding tour day:', error);
            throw error;
        }
    },

    updateTourDay: async (tourId: string, dayId: number, data: any): Promise<any> => {
        try {
            console.log(`DEBUG: Updating tour day. TourId: ${tourId}, DayId: ${dayId}`);
            console.log('DEBUG: Update data:', data);
            const response = await bookingHttp.put(`/tours/${tourId}/itinerary/${dayId}`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating tour day:', error);
            throw error;
        }
    },

    deleteTourDay: async (tourId: string, dayId: number): Promise<any> => {
        try {
            const response = await bookingHttp.delete(`/tours/${tourId}/itinerary/${dayId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting tour day:', error);
            throw error;
        }
    },

    // ============ ALL AMENITIES (for selection) ============
    getAllAmenities: async (): Promise<any> => {
        try {
            const response = await bookingHttp.get('/amenities');
            return response.data;
        } catch (error) {
            console.error('Error fetching all amenities:', error);
            throw error;
        }
    },

    // ============ TOUR IMAGES ============
    getTourImages: async (tourId: string): Promise<any> => {
        try {
            const response = await bookingHttp.get(`/tours/${tourId}/images`);
            return response.data;
        } catch (error) {
            console.error('Error fetching tour images:', error);
            throw error;
        }
    },

    addTourImage: async (tourId: string, data: { url: string; alt?: string; is_cover?: boolean; display_order?: number }): Promise<any> => {
        try {
            // Backend expects { images: [{ url, alt, isCover, order }] }
            const payload = {
                images: [{
                    url: data.url,
                    alt: data.alt,
                    isCover: data.is_cover,
                    order: data.display_order
                }]
            };
            const response = await bookingHttp.post(`/tours/${tourId}/images`, payload);
            return response.data;
        } catch (error) {
            console.error('Error adding tour image:', error);
            throw error;
        }
    },

    deleteTourImage: async (tourId: string, imageId: number): Promise<any> => {
        try {
            const response = await bookingHttp.delete(`/tours/${tourId}/images/${imageId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting tour image:', error);
            throw error;
        }
    },

    // ============ ALL PLACES (for selection in itinerary) ============
    getAllPlaces: async (): Promise<any> => {
        try {
            const response = await bookingHttp.get('/places?limit=500');
            // API trả về { success: true, data: [...], pagination: {...} }
            return response.data?.data || response.data || [];
        } catch (error) {
            console.error('Error fetching all places:', error);
            throw error;
        }
    },

    // ============ CREATE COMPLETE TOUR (with all related data) ============
    createCompleteTour: async (data: any): Promise<any> => {
        try {
            console.log('Creating complete tour with data:', data);
            const response = await bookingHttp.post('/tours/complete', data);
            console.log('Complete tour response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error creating complete tour:', error);
            throw error;
        }
    },

    // ============ SEARCH NEARBY TOURS (by distance) ============
    searchNearbyTours: async (params: {
        latitude: number;
        longitude: number;
        radius?: number;  // km, default 50
        limit?: number;
        page?: number;
    }): Promise<any> => {
        try {
            const response = await bookingHttp.get('/tours/nearby', { params });
            console.log('Nearby tours response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error searching nearby tours:', error);
            throw error;
        }
    },
};
