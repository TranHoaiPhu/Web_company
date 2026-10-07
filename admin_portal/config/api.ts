// Base URL cho API backend chính (FastAPI - Cloud Run)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://ai-trip-api-40205731279.us-central1.run.app/api/v1";

// Booking Tour API (Node.js - Cloud Run)
export const BOOKING_API_URL = process.env.NEXT_PUBLIC_BOOKING_API_URL || "https://booking-tour-api-v5tqubp6lq-uc.a.run.app/api";

// Chatbot service URL
export const CHATBOT_SERVICE_URL = process.env.NEXT_PUBLIC_CHATBOT_SERVICE_URL || "http://localhost:5000";

// Google Maps API Key
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
