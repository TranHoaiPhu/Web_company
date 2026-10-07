import httpPython from './http-python';

export interface SystemSettings {
    show_flash_sale: boolean;
    show_combo_promotion: boolean;
    show_new_customer_promo: boolean;
    show_featured_tours: boolean;
    auto_cancel_unpaid: boolean;
    auto_cancel_minutes: number;
    new_customer_promo_code?: string;
    new_customer_promo_amount?: string | number;
    site_logo?: string;
    site_favicon?: string;
    site_name?: string;
    [key: string]: any;
}


class SystemService {
    private basePath = '/system-settings';

    async getSettings(): Promise<SystemSettings> {
        const response = await httpPython.get(`${this.basePath}/`);
        return response.data.data;
    }

    async updateSettings(settings: Partial<SystemSettings>): Promise<any> {
        const response = await httpPython.put(`${this.basePath}/`, { settings });
        return response.data;
    }
}

export const systemService = new SystemService();
