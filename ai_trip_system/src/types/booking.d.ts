import { Schedule, TourFromScheduleData } from "./tour.api"; 
// types/booking.ts
export interface BookingTourInfo {
  tourInfoOverview: TourFromScheduleData, 
  SelectedSchedule: Schedule, 
  coponCode?: string;
  adult: number;
  child: number;
  infant?: number;
}

export interface BookingScheduleInfo {
  id: number;
  startDate: string; // ISO date
  endDate: string;
  departureLocation: string;
  returnLocation: string;
  availableSlots: number;
  bookedSlots: number;
}

export interface BookingInitialData {
  tour: BookingTourInfo;
  schedule: BookingScheduleInfo;
  adults?: number;
  children?: number;
  infants?: number;
}

export interface CreateBookingPayload {
  // =========================
  // Core booking info
  // =========================
  tour_id: number;
  schedule_id?: number;

  //  Tạm thời BE yêu cầu, thực tế nên lấy từ auth
  user_id: string;

  // =========================
  // Contact info (người đại diện booking)
  // =========================
  contact_name: string;
  contact_phone: string;
  contact_email: string;

  // =========================
  // Quantities (BE sẽ tính lại từ participants)
  // =========================
  adult_quantity: number;   //  BE override
  child_quantity: number;   //  BE override
  infant_quantity: number;  //  BE override

  // =========================
  // Optional info
  // =========================
  special_requests?: string;

  // =========================
  // Promotion (BE sẽ validate & tính lại)
  // =========================
  coupon_code?: string;
  discount_amount?: number; //  client hint only, BE override


  // =========================
  // Participants (NGUỒN SỰ THẬT THỰC)
  // =========================
  participants: Array<{
    full_name: string;
    participant_type: string, // 'ADULT' | 'CHILD' | 'INFANT';
    gender: string, //'MALE' | 'FEMALE' | 'OTHER';
    date_of_birth: string; // ISO yyyy-mm-dd

    id_number?: string;
    nationality?: string;

    phone?: string;
    email?: string;
  }>;
}
