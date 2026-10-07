import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { getCookie } from 'cookies-next';

const httpPython = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to inject token
httpPython.interceptors.request.use(
    (config) => {
        const token = getCookie('token'); // Presuming both BEs share the same token or the frontend uses the same token storage
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default httpPython;
