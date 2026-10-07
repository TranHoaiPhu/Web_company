import axios from 'axios';
import Cookies from 'js-cookie';

const BOOKING_API_URL = process.env.NEXT_PUBLIC_BOOKING_API_URL || "https://booking-tour-api-v5tqubp6lq-uc.a.run.app/api";

const couponHttp = axios.create({
    baseURL: `${BOOKING_API_URL}/coupons`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Attach token if needed
couponHttp.interceptors.request.use(
    (config) => {
        const token = Cookies.get('admin_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default couponHttp;
