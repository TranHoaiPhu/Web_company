import axios from 'axios';
import Cookies from 'js-cookie';
import { BOOKING_API_URL } from '@/config/api';

const httpTour = axios.create({
    baseURL: BOOKING_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Attach token
httpTour.interceptors.request.use(
    (config) => {
        const token = Cookies.get('admin_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: Handle errors
httpTour.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized - potentially redirect to login
        }
        return Promise.reject(error);
    }
);

export default httpTour;
