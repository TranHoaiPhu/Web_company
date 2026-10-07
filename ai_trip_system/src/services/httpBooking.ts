import axios from 'axios';

// Booking Tour API URL (Node.js Cloud Run)
const BOOKING_API_URL = process.env.NEXT_PUBLIC_BOOKING_API_URL || 'https://booking-tour-api-40205731279.us-central1.run.app/api';

import { getCookie } from 'cookies-next';

const httpBooking = axios.create({
    baseURL: BOOKING_API_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to inject token from cookies
httpBooking.interceptors.request.use(
    (config) => {
        const token = getCookie('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor for error handling
httpBooking.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only log errors in development mode and for non-404 errors
        if (process.env.NODE_ENV === 'development' && error.response?.status !== 404) {
            console.error('Booking API Error:', error.response?.data || error.message);
        }
        // For 404 errors, we check if there's a specific error message from the backend
        if (error.response?.status === 404 && !error.response?.data?.error) {
            return Promise.reject({ status: 404, message: 'Endpoint not found or service unavailable' });
        }
        return Promise.reject(error);
    }
);

export default httpBooking;
