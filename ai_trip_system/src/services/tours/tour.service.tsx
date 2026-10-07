// endpoint: /tours/list
import { TourApi, TourDetailApiResponse } from '@/types/tour.api';
import httpBooking from '../httpBooking'

export interface SearchByLocationParams {
    lat: number;
    lng: number;
    radius?: number; // km, default 50km
    limit?: number;
    page?: number;
    participants?: number;  // Filter by available slots
    startDate?: string;     // Filter by schedule start date (YYYY-MM-DD)
    endDate?: string;       // Filter by schedule end date (YYYY-MM-DD)
}

export interface SearchByLocationResponse {
    success: boolean;
    searchParams: {
        latitude: number;
        longitude: number;
        radius: number;
        unit: string;
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    data: TourWithDistance[];
}

export interface TourWithDistance extends Omit<TourApi, 'slug' | 'name'> {
    distance?: number; // km từ điểm tìm kiếm
    distanceText?: string; // e.g., "2.5 km" hoặc "500 m"
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    isHotDeal?: boolean;
    slug?: string;
    name?: string;
    // Additional fields from nearby API
    durationDays?: number;
    durationNights?: number;
}

export const tourService = {
    getAll(): Promise<TourApi[]> {
        return httpBooking.get('/tours/list').then(res => {
            console.log('API Response:', res.data); // Debug log
            return res.data.data; // Extract the data array
        }).catch(error => {
            console.error('Error fetching tours:', error);
            return [];
        }

        )
    },

    getList(params: {
        page?: number;
        limit?: number;
        categoryId?: string;
        locationId?: string | number | null;
        isFeatured?: boolean;
        isHotDeal?: boolean;
        minPrice?: number;
        maxPrice?: number;
        sortBy?: string;
        search?: string;
        participants?: number;  // Filter by available slots
        startDate?: string;     // Filter by schedule start date (YYYY-MM-DD)
        endDate?: string;       // Filter by schedule end date (YYYY-MM-DD)
    }): Promise<{
        success: boolean;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        data: TourApi[];
    }> {
        return httpBooking.get('/tours/list', { params }).then(res => res.data);
    },

    getById(slug: string): Promise<TourDetailApiResponse> {
        return httpBooking.get(`/tours/${slug}`).then(res => {
            console.log('API Response:', res.data); // Debug log
            return res.data; // Extract the data array
        }).catch(error => {
            console.error('Error fetching tour by ID:', error);
            throw error;
        });
    },

    getReviews(tourId: string, params?: { page?: number; limit?: number; sort?: string }): Promise<unknown> {
        return httpBooking.get(`/reviews/tour/${tourId}`, { params }).then(res => res.data);
    },

    submitReview(tourId: string, data: { orderId: number; rating: number; title: string; comment: string; images?: string[] }): Promise<unknown> {
        return httpBooking.post(`/reviews/tour/${tourId}`, data).then(res => res.data);
    },

    // Tìm tour theo vị trí (lat, lng) với khoảng cách - sử dụng endpoint /tours/nearby
    async searchByLocation(params: SearchByLocationParams): Promise<SearchByLocationResponse> {
        const { lat, lng, radius = 50, limit = 20, page = 1, participants, startDate, endDate } = params;

        try {
            // Build query params
            const queryParams: Record<string, string | number> = {
                latitude: lat,
                longitude: lng,
                radius,
                limit,
                page
            };

            // Add filter params if provided
            if (participants && participants > 0) {
                queryParams.participants = participants;
            }
            if (startDate) {
                queryParams.startDate = startDate;
            }
            if (endDate) {
                queryParams.endDate = endDate;
            }

            // Gọi API endpoint /tours/nearby
            const response = await httpBooking.get('/tours/nearby', {
                params: queryParams
            });

            console.log('Nearby tours response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error searching nearby tours:', error);
            // Fallback: Lấy tất cả tour và filter theo khoảng cách ở client
            console.log('Fallback: Filtering tours by location on client side');
            return this.searchByLocationClientSide(params);
        }
    },

    // Client-side search (fallback khi backend không có data với tọa độ)
    async searchByLocationClientSide(params: SearchByLocationParams): Promise<SearchByLocationResponse> {
        const { lat, lng, radius = 50, limit = 20, page = 1 } = params;

        // Lấy tất cả tour
        const allTours = await this.getAll();

        // Lấy chi tiết từng tour để có location
        const toursWithDistance: TourWithDistance[] = [];

        for (const tour of allTours) {
            try {
                const detail = await this.getById(tour.id);
                const tourLocation = detail.data.location;

                if (tourLocation?.latitude && tourLocation?.longitude) {
                    const distance = this.calculateDistance(
                        lat, lng,
                        tourLocation.latitude, tourLocation.longitude
                    );

                    if (distance <= radius) {
                        toursWithDistance.push({
                            ...tour,
                            distance: Math.round(distance * 10) / 10,
                            distanceText: distance < 1
                                ? `${Math.round(distance * 1000)} m`
                                : `${Math.round(distance * 10) / 10} km`,
                            coordinates: {
                                latitude: tourLocation.latitude,
                                longitude: tourLocation.longitude,
                            },
                        });
                    }
                }
            } catch (error) {
                console.error(`Error fetching tour ${tour.id}:`, error);
            }
        }

        // Sort theo khoảng cách
        const sortedTours = toursWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));

        // Pagination
        const total = sortedTours.length;
        const startIndex = (page - 1) * limit;
        const paginatedTours = sortedTours.slice(startIndex, startIndex + limit);

        return {
            success: true,
            searchParams: {
                latitude: lat,
                longitude: lng,
                radius,
                unit: 'km'
            },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            data: paginatedTours
        };
    },

    // Haversine formula để tính khoảng cách giữa 2 điểm (km)
    calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radius of Earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}

// endpoint: /tours/:id