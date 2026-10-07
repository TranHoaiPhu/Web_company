// types/schedule.d.ts

/**
 * Schedule Status Types
 */
export type ScheduleStatus = "OPEN" | "FULL" | "CANCELLED" | "COMPLETED";

/**
 * Tour Schedule Interface
 */
export interface TourSchedule {
  schedule_id: string;
  start_date: string; // ISO 8601 date string
  end_date: string; // ISO 8601 date string
  price_override: number | null;
  available_slots: number;
  booked_slots: number;
  total_slots: number;
  status: ScheduleStatus;
}

/**
 * Schedule with Tour Info (nếu cần populate thông tin tour)
 */
export interface ScheduleWithTour extends TourSchedule {
  tour_id: string;
  tour_name?: string;
  tour_slug?: string;
}

/**
 * Schedule Availability Info
 */
export interface ScheduleAvailability {
  schedule_id: string;
  is_available: boolean;
  remaining_slots: number;
  is_full: boolean;
  is_open: boolean;
}

/**
 * Schedule Filter Options
 */
export interface ScheduleFilterOptions {
  status?: ScheduleStatus | "all";
  startDateFrom?: string;
  startDateTo?: string;
  availableOnly?: boolean;
  minSlots?: number;
  tourId?: string;
}

/**
 * Schedule Create Input
 */
export interface CreateScheduleInput {
  tour_id: string;
  start_date: string;
  end_date: string;
  price_override?: number | null;
  available_slots: number;
}

/**
 * Schedule Update Input
 */
export interface UpdateScheduleInput {
  start_date?: string;
  end_date?: string;
  price_override?: number | null;
  available_slots?: number;
  status?: ScheduleStatus;
}

// Schedule Response from API


/**
 * Helper Functions
 */

/**
 * Kiểm tra schedule còn chỗ trống
 */
export function isScheduleAvailable(schedule: TourSchedule): boolean {
  return (
    schedule.status === "OPEN" &&
    schedule.available_slots > schedule.booked_slots
  );
}

/**
 * Tính số chỗ còn lại
 */
export function getRemainingSlots(schedule: TourSchedule): number {
  return Math.max(0, schedule.available_slots - schedule.booked_slots);
}

/**
 * Kiểm tra schedule đã đầy
 */
export function isScheduleFull(schedule: TourSchedule): boolean {
  return schedule.booked_slots >= schedule.available_slots;
}

/**
 * Lấy giá cuối cùng (price_override hoặc base_price)
 */
export function getFinalPrice(
  schedule: TourSchedule,
  basePrice: number
): number {
  return schedule.price_override ?? basePrice;
}

/**
 * Constants
 */
export const SCHEDULE_STATUSES: ScheduleStatus[] = [
  "OPEN",
  "FULL",
  "CANCELLED",
  "COMPLETED",
];

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  OPEN: "Đang mở",
  FULL: "Đã đầy",
  CANCELLED: "Đã hủy",
  COMPLETED: "Đã hoàn thành",
};

export const SCHEDULE_STATUS_COLORS: Record<ScheduleStatus, string> = {
  OPEN: "green",
  FULL: "red",
  CANCELLED: "gray",
  COMPLETED: "blue",
};