// types/tour.api.ts
import { TourSchedule } from "./schedule.d";
/**
 * Tour API response for list endpoint
 */
export interface TourApi {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  duration_days: number;
  duration_nights: number;
  base_price: number;
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_hot_deal: boolean;
  title?: string;
  location?: string;
  category?: string;
  duration?: string;
  price?: number;
  originalPrice?: number;
  image?: string;
  featured?: boolean;
  badges?: string[];
  availableSpots?: number | null;
  maxGuests?: number;
  maxParticipants?: number;
  reviews?: number;
  // New fields from API
  shortDescription?: string;
  durationDays?: number;
  durationNights?: number;
  basePrice?: number;
  childPrice?: number | null;
  infantPrice?: number | null;
  isFeatured?: boolean;
  isHotDeal?: boolean;
  locationName?: string;
  categoryName?: string;
  coverImage?: string | null;
}

/**
 * Tour Detail API Response structure (from /tours/:id or /tours/:slug)
 */
export interface TourDetailApiResponse {
  success: boolean;
  data: {
    tour: {
      id: string;
      name: string;
      slug: string;
      short_description: string;
      description: string;
      highlights: string | null;
      included_services: string | null;
      excluded_services: string | null;
      cancellation_policy: string | null;
      terms_conditions: string | null;
      duration_days: number;
      duration_nights: number;
      base_price: number;
      child_price: number | null;
      infant_price: number | null;
      difficulty: "EASY" | "MODERATE" | "CHALLENGING" | "DIFFICULT";
      transportation_type: string | null;
      departure_location: string | null;
      return_location: string | null;
      is_featured: boolean;
      is_hot_deal: boolean;
      rating: number;
      review_count: number;
      view_count: number;
      booking_count: number;
    };
    location: {
      id: string;
      name: string;
      slug: string;
      latitude: number | null;
      longitude: number | null;
    };
    category: {
      id: string;
      name: string;
      slug: string;
      icon: string;
    };
    cover_image: string;
    images: {
      url: string;
      alt: string;
      is_cover: boolean;
      order: number;
    }[];
    itinerary: ItineraryDay[];
    amenities: Amenity[];
    upcoming_schedules: TourSchedule[];
  };
}

/**
 * Tour List API Response structure (from /tours/list)
 */
export interface TourListApiResponse {
  success: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: TourApi[];
}


export interface TourFromScheduleApiResponse {
  success: boolean;
  data: TourFromScheduleData;
}


export interface TourFromScheduleData {
  schedule: Schedule;
  tour: Tour;
  location: Location;
  category: Category;
  images: Image[];
  itinerary: ItineraryDay[];
  amenities: Amenity[];
}

export interface Schedule {
  id: number;
  tour_id: number;
  start_date: string; // ISO date
  end_date: string;   // ISO date
  price_override: number | null;
  available_slots: number;
  booked_slots: number;
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED';
  notes: string | null;
}

export interface Tour {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  highlights: string | null;
  included_services: string | null;
  excluded_services: string | null;
  terms_conditions: string | null;
  cancellation_policy: string | null;

  duration_days: number;
  duration_nights: number;

  base_price: number;
  child_price: number | null;
  infant_price: number | null;

  max_participants: number;
  min_participants: number;

  difficulty: 'EASY' | 'MODERATE' | 'HARD';
  transportation_type: string | null;
  departure_location: string | null;
  return_location: string | null;

  view_count: number;
  booking_count: number;
  rating: number;
  review_count: number;

  status: 'ACTIVE' | 'INACTIVE';
  is_featured: boolean;
  is_hot_deal: boolean;

  created_at: string;
  updated_at: string;
}


export interface Location {
  id: number;
  name: string;
  slug: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
}


export interface Image {
  image_url?: string;
  alt_text?: string;
  is_cover?: boolean;
  display_order?: number;
}

export interface ItineraryDay {
  day: number;
  title?: string;
  description?: string;
}

export interface Amenity {
  id?: number;
  name?: string;
  icon?: string;
}
