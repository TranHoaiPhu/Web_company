/**
 * Cấu hình API endpoints
 * Sử dụng environment variable hoặc Cloud Run URL mặc định
 */

// Base URL cho API backend chính (FastAPI - Cloud Run)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://ai-trip-api-40205731279.us-central1.run.app/api/v1";

// Booking Tour API (Node.js - Cloud Run)
export const BOOKING_API_URL = process.env.NEXT_PUBLIC_BOOKING_API_URL || "https://booking-tour-api-40205731279.us-central1.run.app/api";

// Chatbot service URL
export const CHATBOT_SERVICE_URL = process.env.NEXT_PUBLIC_CHATBOT_SERVICE_URL || "https://travel-chatbot-40205731279.us-central1.run.app";

const apiConfig = {
  API_BASE_URL,
  BOOKING_API_URL,
  CHATBOT_SERVICE_URL,
};

export default apiConfig;
