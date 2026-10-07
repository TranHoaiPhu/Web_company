/* eslint-disable @typescript-eslint/no-explicit-any */
import httpTour from './http-tour';

export interface Category {
	id: string;
	name: string;
	slug: string;
	description?: string;
	icon?: string;
	is_active?: boolean;
	created_at?: string;
}

export interface CategoryResponse {
	success: boolean;
	data: Category[];
}

export interface CategoryDetailResponse {
	success: boolean;
	data: Category;
}

export const categoryService = {
	async getCategories(params: Record<string, any> = {}): Promise<CategoryResponse> {
		const searchParams = new URLSearchParams();
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== '') {
				searchParams.append(key, String(value));
			}
		});
		const res = await httpTour.get(`categories?${searchParams.toString()}`);
		return res.data;
	},

	async getCategory(id: string): Promise<CategoryDetailResponse> {
		const res = await httpTour.get(`categories/${id}`);
		return res.data;
	},

	async createCategory(data: Partial<Category>): Promise<CategoryDetailResponse> {
		const res = await httpTour.post('categories', data);
		return res.data;
	},

	async updateCategory(id: string, data: Partial<Category>): Promise<CategoryDetailResponse> {
		const res = await httpTour.put(`categories/${id}`, data);
		return res.data;
	},

	async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
		const res = await httpTour.delete(`categories/${id}`);
		return res.data;
	},
};
