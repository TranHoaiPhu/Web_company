import axios from 'axios';
import Cookies from 'js-cookie';
import { BOOKING_API_URL } from '@/config/api';

const http = axios.create({
    baseURL: BOOKING_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Attach token
http.interceptors.request.use(
    (config) => {
        const token = Cookies.get('admin_token'); // Use a specific cookie name for admin
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: Handle errors (e.g., 401)
http.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle logout or redirect to login
            // window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

export default http;
