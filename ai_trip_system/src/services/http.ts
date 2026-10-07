import axios from 'axios';
import './http.interceptor';

// Chatbot service URL (local dev hoặc deploy riêng)
const CHATBOT_BASE_URL = process.env.NEXT_PUBLIC_CHATBOT_SERVICE_URL || 'https://travel-chatbot-40205731279.us-central1.run.app';

const http = axios.create({
  baseURL: `${CHATBOT_BASE_URL}/api/`,
});

export default http;
