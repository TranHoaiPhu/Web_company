import axios from 'axios';
import { BOOKING_API_URL } from '@/config/api';

const bookingHttp = axios.create({
  baseURL: BOOKING_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Location {
  id: string | number;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  type?: string;
}

export interface Category {
  id: string | number;
  name: string;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
  placeId?: string;
  photos?: string[]; // Photo URLs from Google Places
}

export interface PlaceCoordinates extends LocationCoordinates {
  locationId: number | string; // Parent location ID (required)
  type?: 'ATTRACTION' | 'RESTAURANT' | 'HOTEL' | 'SHOPPING' | 'ENTERTAINMENT' | 'OTHER';
}

export interface Place {
  id: number | string;
  name: string;
  slug?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  type?: string;
  locationId?: number | string;
  locationName?: string;
}

export const metaService = {
  async getLocations(): Promise<Location[]> {
    try {
      console.log('Fetching from:', `${BOOKING_API_URL}/locations/active`);
      const res = await bookingHttp.get('/locations/active');
      console.log('Locations response:', res.data);
      // BE_BookingTour trả về array trực tiếp hoặc { data: [...] }
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      console.log('Processed locations:', data);
      return data;
    } catch (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
  },

  async getCategories(): Promise<Category[]> {
    try {
      console.log('Fetching from:', `${BOOKING_API_URL}/categories`);
      const res = await bookingHttp.get('/categories');
      console.log('Categories response:', res.data);
      // BE_BookingTour trả về array trực tiếp hoặc { data: [...] }
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      console.log('Processed categories:', data);
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // Find existing location by coordinates or create new one
  async findOrCreateLocation(coords: LocationCoordinates): Promise<{ success: boolean; isNew: boolean; data: Location }> {
    try {
      const res = await bookingHttp.post('/locations/find-or-create', coords);
      console.log('findOrCreateLocation response:', res.data);
      return res.data;
    } catch (error) {
      console.error('Error finding/creating location:', error);
      throw error;
    }
  },

  // Find existing place by coordinates or create new one
  // Place must be within reasonable distance of parent location
  async findOrCreatePlace(coords: PlaceCoordinates): Promise<{ success: boolean; isNew: boolean; data: Place; error?: string }> {
    try {
      const res = await bookingHttp.post('/places/find-or-create', coords);
      console.log('findOrCreatePlace response:', res.data);
      return res.data;
    } catch (error: any) {
      console.error('Error finding/creating place:', error);
      // Return error message from backend if available
      if (error.response?.data?.error) {
        return {
          success: false,
          isNew: false,
          data: {} as Place,
          error: error.response.data.error
        };
      }
      throw error;
    }
  },

  // Get places by location ID
  async getPlacesByLocation(locationId: number | string): Promise<Place[]> {
    try {
      const res = await bookingHttp.get(`/places?location_id=${locationId}&limit=500`);
      const data = res.data?.data?.data || res.data?.data || [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching places:', error);
      return [];
    }
  }
};
