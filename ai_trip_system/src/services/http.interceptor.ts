import axios from 'axios';
import { deleteCookie } from 'cookies-next';
import Cookies from 'js-cookie';

// Chatbot service URL (local dev hoặc deploy riêng)
const CHATBOT_BASE_URL = process.env.NEXT_PUBLIC_CHATBOT_SERVICE_URL || 'https://travel-chatbot-40205731279.us-central1.run.app';

const http = axios.create({
  baseURL: `${CHATBOT_BASE_URL}/api/`,
});

// Add a request interceptor to attach token
http.interceptors.request.use(
  (config) => {
    let token = '';
    if (typeof window !== 'undefined') {
      // Ưu tiên lấy từ localStorage
      token = localStorage.getItem('token') || '';
      // Nếu không có thì lấy từ cookie (js-cookie)
      if (!token) {
        token = Cookies.get('token') || '';
        if (token) {
          console.log('Using token from cookie:', token);
        }
      }
    }
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token expiration
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Remove token and force logout
      deleteCookie('token');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        window.dispatchEvent(new Event('authStateChanged'));
      }
    }
    return Promise.reject(error);
  }
);

export default http;
