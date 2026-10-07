import { TourApi, TourDetailApiResponse } from "@/types/tour.api"
import { TourBase, TourDetail } from "@/types/tour"
import { DifficultyLevel } from "@/types/tour"
import { Amenity } from "@/types/amenities"

export const mapTourApiToBase = (item: TourApi): TourBase => ({
  id: item.id,
  name: item.name || item.title || '',
  title: item.name || item.title || '',
  slug: item.slug || item.name?.toLowerCase().replace(/\s+/g, "-") || '',
  shortDescription: item.shortDescription || item.short_description || item.description?.slice(0, 120) + "..." || '',
  description: item.description || item.shortDescription || item.short_description || '',
  location: item.locationName || item.location || '',
  category: item.categoryName || item.category || '',
  duration: item.duration || `${item.durationDays || item.duration_days || 0} ngày ${item.durationNights || item.duration_nights || 0} đêm`,
  price: item.childPrice || item.price || item.basePrice || item.base_price || 0,
  originalPrice: item.basePrice || item.base_price || item.originalPrice || 0,
  rating: item.rating ?? 0,
  reviewCount: item.review_count ?? item.reviews ?? 0,
  image: item.coverImage || item.image || "",
  featured: item.isFeatured ?? item.featured ?? item.is_featured ?? false,
  isHotDeal: item.isHotDeal ?? item.is_hot_deal ?? item.badges?.includes("HOT") ?? false,
  badges: item.badges,
  availableSpots: item.availableSpots ?? null,
  maxParticipants: item.maxParticipants ?? 0,
  reviews: item.review_count ?? item.reviews ?? 0
})

export const mapTourDetailApiToBase = (apiResponse: TourDetailApiResponse): TourDetail => {
  // Validate response structure
  if (!apiResponse || !apiResponse.data) {
    throw new Error('Invalid API response: missing data');
  }

  const { data } = apiResponse;

  if (!data.tour) {
    throw new Error('Invalid API response: missing tour data');
  }

  return {
    tour: {
      id: data.tour.id,
      name: data.tour.name,
      slug: data.tour.slug,
      short_description: data.tour.short_description,
      description: data.tour.description,
      highlights: data.tour.highlights,
      included_services: data.tour.included_services,
      excluded_services: data.tour.excluded_services,
      cancellation_policy: data.tour.cancellation_policy,
      terms_conditions: data.tour.terms_conditions,
      duration_days: data.tour.duration_days,
      duration_nights: data.tour.duration_nights,
      base_price: data.tour.base_price,
      child_price: data.tour.child_price,
      infant_price: data.tour.infant_price,
      difficulty: data.tour.difficulty as DifficultyLevel,
      transportation_type: data.tour.transportation_type,
      departure_location: data.tour.departure_location,
      return_location: data.tour.return_location,
      is_featured: data.tour.is_featured,
      is_hot_deal: data.tour.is_hot_deal,
      rating: data.tour.rating,
      review_count: data.tour.review_count,
      view_count: data.tour.view_count ?? 0,
      booking_count: data.tour.booking_count ?? 0,
    },
    location: data.location,
    category: data.category,
    cover_image: data.cover_image,
    images: data.images,
    itinerary: data.itinerary,
    amenities: data.amenities.map((item) => item as Amenity) as Amenity[],
    upcoming_schedules: data.upcoming_schedules,
  };
}


/// convert TourFromScheduleDate 