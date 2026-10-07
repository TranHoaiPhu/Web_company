// types/tour.ts

import { Amenity } from "./amenities";

/**
 * Tour Category Types (dựa trên tour_categories table)
 */
export type TourCategory =
  | "Du lịch biển đảo"
  | "Du lịch văn hóa"
  | "Du lịch mạo hiểm"
  | "Du lịch nghỉ dưỡng"
  | "Du lịch miền núi"
  | "Khác";

/**
 * Tour Badge Types (dùng để hiển thị tag nổi bật)
 */
export type TourBadge =
  | "Best Seller"
  | "Top Rated"
  | "New"
  | "Luxury"
  | "Budget"
  | "Family Friendly"
  | "Adventure"
  | "Eco Tour"
  | "Hot Deal";

/**
 * Difficulty Level (từ enum difficulty_level)
 */
export type DifficultyLevel =
  | "EASY"
  | "MODERATE"
  | "CHALLENGING"
  | "DIFFICULT";

/**
 * Tour Status (từ enum tour_status)
 */
export type TourStatus = "ACTIVE" | "INACTIVE" | "DRAFT";

/**
 * Main Tour Interface (dùng cho danh sách tour)
 */
export interface TourBase {
  id: string
  name: string
  title: string
  slug: string
  shortDescription: string
  description: string
  location: string
  category: string
  duration: string
  price: number
  originalPrice: number
  rating: number
  reviewCount: number
  image: string
  featured: boolean
  isHotDeal: boolean
  badges?: string[]
  availableSpots?: number | null
  maxParticipants?: number
  reviews: number
  bookingCount?: number
}

/**
 * Location Interface
 */
export interface TourLocation {
  id: string
  name: string
  slug: string
  latitude: number | null
  longitude: number | null
}

/**
 * Category Interface
 */
export interface TourCategoryData {
  id: string
  name: string
  slug: string
  icon: string
}

/**
 * Tour Image Interface
 */
export interface TourImage {
  url: string
  alt: string
  is_cover: boolean
  order: number
}

/**
 * Place Interface
 */
export interface Place {
  id: string
  name: string
  slug: string
  address: string
  latitude: number | null
  longitude: number | null
  image_url: string
  type: string
  rating: number
}

/**
 * Day Place Interface
 */
export interface DayPlace {
  place: Place
  visit_order: number
  duration_minutes: number
  notes: string | null
}

/**
 * Tour Day Interface (Itinerary Day)
 */
export interface TourDay {
  day_number: number
  title: string
  description: string
  accommodation: string
  meals: string
  places: DayPlace[]
}

/**
 * Amenity Interface
 */
export interface TourAmenity {
  amenity_id: string
  name: string
  slug: string
  icon: string
  category: string
  price: number
  is_included: boolean
  is_optional: boolean
}

/**
 * Tour Schedule Interface
 */
export interface TourSchedule {
  schedule_id: string
  start_date: string
  end_date: string
  price_override: number | null
  available_slots: number
  booked_slots: number
  status: "OPEN" | "FULL" | "CANCELLED" | "COMPLETED",
  total_slots: number
}

/**
 * Tour Detail Interface (từ API /tours/:id)
 */
export interface TourDetail {
  tour: {
    id: string
    name: string
    slug: string
    short_description: string
    description: string
    highlights: string | null
    included_services: string | null
    excluded_services: string | null
    cancellation_policy: string | null
    terms_conditions: string | null
    duration_days: number
    duration_nights: number
    base_price: number
    child_price: number | null
    infant_price: number | null
    difficulty: DifficultyLevel
    transportation_type: string | null
    departure_location: string | null
    return_location: string | null
    is_featured: boolean
    is_hot_deal: boolean
    rating: number
    review_count: number
    view_count: number
    booking_count: number
  }
  location: TourLocation
  category: TourCategoryData
  cover_image: string
  images: TourImage[]
  itinerary: ItineraryDay[]
  amenities: Amenity[]
  upcoming_schedules: TourSchedule[]
}

/**
 * Tour Preview (dùng cho list tour, card, search result)
 */
export type TourPreview = Pick<
  TourBase,
  | "id"
  | "name"
  | "slug"
  | "shortDescription"
  | "location"
  | "category"
  | "duration"
  | "price"
  | "rating"
  | "reviewCount"
  | "image"
  | "featured"
  | "isHotDeal"
> & {
  coverImage: string
  lowestPrice: number
  badges?: TourBadge[]
}

/**
 * Input khi tạo tour mới (admin)
 */
export type CreateTourInput = {
  name: string
  slug: string
  short_description: string
  description: string
  highlights?: string
  included_services?: string
  excluded_services?: string
  cancellation_policy?: string
  terms_conditions?: string
  duration_days: number
  duration_nights: number
  base_price: number
  child_price?: number
  infant_price?: number
  difficulty: DifficultyLevel
  transportation_type?: string
  departure_location?: string
  return_location?: string
  is_featured: boolean
  is_hot_deal: boolean
  locationId: string
  categoryId: string
  imageUrls?: string[]
}

/**
 * Filter/Search options cho trang danh sách tour
 */
export interface TourFilterOptions {
  category?: TourCategory | "all"
  locationSlug?: string
  priceRange?: { min: number; max: number }
  durationDays?: number[]
  difficulty?: DifficultyLevel[]
  featuredOnly?: boolean
  hotDealOnly?: boolean
  availableOnly?: boolean
  sortBy?: "price-asc" | "price-desc" | "rating-desc" | "popular" | "newest"
  searchQuery?: string
  page?: number
  limit?: number
}

export const TOUR_DIFFICULTIES: DifficultyLevel[] = [
  "EASY",
  "MODERATE",
  "CHALLENGING",
  "DIFFICULT",
]

export const DEFAULT_TOUR_FILTER: TourFilterOptions = {
  category: "all",
  sortBy: "popular",
  page: 1,
  limit: 12,
}