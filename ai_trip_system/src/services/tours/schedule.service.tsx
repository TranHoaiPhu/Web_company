import httpBooking from "../httpBooking";
import { TourFromScheduleApiResponse, } from "@/types/tour.api";
export const scheduleService = {
  getTourByScheduleId(scheduleId: string): Promise<TourFromScheduleApiResponse> {
    return httpBooking
      .get(`/tour-schedules/${scheduleId}/tour`)
      .then((res) => {
        console.log("API Response schedule:", res.data); // Debug log
        return res.data; // Extract the data array
      })
      .catch((error) => {
        console.error("Error fetching schedule by ID:", error);
        throw error;
      });
  },
};


