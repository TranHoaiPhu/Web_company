// types/itinerary.d.ts

/**
 * Place Type (loại địa điểm)
 */
export type PlaceType =
  | "ATTRACTION"
  | "RESTAURANT"
  | "HOTEL"
  | "ACTIVITY"
  | "SHOPPING"
  | "VIEWPOINT"
  | "CULTURAL"
  | "NATURE";

/**
 * Place Interface (địa điểm trong lịch trình)
 */
export interface Place {
  id: string;
  name: string;
  slug: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string;
  type: PlaceType;
  rating: number;
}

/**
 * Day Place Interface (địa điểm trong 1 ngày cụ thể)
 */
export interface DayPlace {
  place: Place;
  visit_order: number;
  duration_minutes: number;
  notes: string | null;
}

/**
 * Itinerary Day Interface (ngày trong lịch trình)
 */
export interface ItineraryDay {
  day_number: number;
  title: string;
  description: string;
  accommodation: string;
  meals: string;
  places: DayPlace[];
}

/**
 * Full Itinerary Interface (toàn bộ lịch trình tour)
 */
export interface TourItinerary {
  tour_id: string;
  days: ItineraryDay[];
  total_days: number;
}

/**
 * Itinerary Summary (tóm tắt lịch trình)
 */
export interface ItinerarySummary {
  total_days: number;
  total_places: number;
  place_types: PlaceType[];
  accommodations: string[];
  highlights: string[];
}

/**
 * Create Itinerary Day Input
 */
export interface CreateItineraryDayInput {
  tour_id: string;
  day_number: number;
  title: string;
  description: string;
  accommodation?: string;
  meals?: string;
}

/**
 * Add Place to Day Input
 */
export interface AddPlaceToDayInput {
  day_id: string;
  place_id: string;
  visit_order: number;
  duration_minutes: number;
  notes?: string;
}

/**
 * Update Itinerary Day Input
 */
export interface UpdateItineraryDayInput {
  title?: string;
  description?: string;
  accommodation?: string;
  meals?: string;
}

/**
 * Helper Functions
 */

/**
 * Tính tổng thời gian tham quan trong 1 ngày
 */
export function getTotalDuration(day: ItineraryDay): number {
  return day.places.reduce((total, place) => total + place.duration_minutes, 0);
}

/**
 * Format thời gian (phút -> giờ và phút)
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins} phút`;
  if (mins === 0) return `${hours} giờ`;
  return `${hours} giờ ${mins} phút`;
}

/**
 * Lấy danh sách địa điểm từ itinerary
 */
export function getAllPlaces(itinerary: ItineraryDay[]): Place[] {
  return itinerary.flatMap(day => day.places.map(dp => dp.place));
}

/**
 * Nhóm địa điểm theo loại
 */
export function groupPlacesByType(places: Place[]): Record<PlaceType, Place[]> {
  return places.reduce((acc, place) => {
    if (!acc[place.type]) {
      acc[place.type] = [];
    }
    acc[place.type].push(place);
    return acc;
  }, {} as Record<PlaceType, Place[]>);
}

/**
 * Constants
 */
export const PLACE_TYPES: PlaceType[] = [
  "ATTRACTION",
  "RESTAURANT",
  "HOTEL",
  "ACTIVITY",
  "SHOPPING",
  "VIEWPOINT",
  "CULTURAL",
  "NATURE",
];

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  ATTRACTION: "Điểm tham quan",
  RESTAURANT: "Nhà hàng",
  HOTEL: "Khách sạn",
  ACTIVITY: "Hoạt động",
  SHOPPING: "Mua sắm",
  VIEWPOINT: "Điểm ngắm cảnh",
  CULTURAL: "Văn hóa",
  NATURE: "Thiên nhiên",
};

export const PLACE_TYPE_ICONS: Record<PlaceType, string> = {
  ATTRACTION: "map-marker-alt",
  RESTAURANT: "utensils",
  HOTEL: "hotel",
  ACTIVITY: "running",
  SHOPPING: "shopping-bag",
  VIEWPOINT: "camera",
  CULTURAL: "landmark",
  NATURE: "tree",
};

export const PLACE_TYPE_COLORS: Record<PlaceType, string> = {
  ATTRACTION: "blue",
  RESTAURANT: "orange",
  HOTEL: "purple",
  ACTIVITY: "green",
  SHOPPING: "pink",
  VIEWPOINT: "cyan",
  CULTURAL: "red",
  NATURE: "emerald",
};