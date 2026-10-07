// types/amenities.d.ts

/**
 * Amenity Category Types
 */
export type AmenityCategory =
  | "accommodation"
  | "transport"
  | "meals"
  | "service"
  | "experience"
  | "extra";

/**
 * Amenity Interface
 */
export interface Amenity {
  amenity_id: string;
  name: string;
  slug: string;
  icon: string;
  category: AmenityCategory;
  price: number;
  is_included: boolean;
  is_optional: boolean;
}

/**
 * Tour Amenity Interface (amenity gắn với tour cụ thể)
 */
export interface TourAmenity extends Amenity {
  tour_id?: string;
  description?: string;
}

/**
 * Amenity Group (nhóm amenities theo category để hiển thị)
 */
export interface AmenityGroup {
  category: AmenityCategory;
  label: string;
  amenities: Amenity[];
}

/**
 * Amenity Filter Options
 */
export interface AmenityFilterOptions {
  category?: AmenityCategory | "all";
  includedOnly?: boolean;
  optionalOnly?: boolean;
  priceRange?: { min: number; max: number };
}

/**
 * Constants
 */
export const AMENITY_CATEGORIES: AmenityCategory[] = [
  "accommodation",
  "transport",
  "meals",
  "service",
  "experience",
  "extra",
];

export const AMENITY_CATEGORY_LABELS: Record<AmenityCategory, string> = {
  accommodation: "Khách sạn & Lưu trú",
  transport: "Phương tiện di chuyển",
  meals: "Ăn uống",
  service: "Dịch vụ",
  experience: "Trải nghiệm",
  extra: "Dịch vụ bổ sung",
};