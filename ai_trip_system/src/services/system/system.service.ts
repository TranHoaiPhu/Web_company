import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

const httpPython = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

export interface SystemSettings {
    show_flash_sale: boolean;
    show_combo_promotion: boolean;
    show_new_customer_promo: boolean;
    show_featured_tours: boolean;
    new_customer_promo_code?: string;
    new_customer_promo_amount?: string | number;
    [key: string]: unknown;
}

const systemService = {
    async getSettings(): Promise<SystemSettings> {
        try {
            const response = await httpPython.get('/system-settings/');
            return response.data.data;
        } catch (error) {
            console.error('Error fetching system settings:', error);
            // Default settings if API fails
            return {
                show_flash_sale: true,
                show_combo_promotion: false,
                show_new_customer_promo: true,
                show_featured_tours: true,
            };
        }
    },

    async updateSettings(settings: Partial<SystemSettings>): Promise<unknown> {
        const response = await httpPython.put('/system-settings/', { settings });
        return response.data;
    }
};

export default systemService;
