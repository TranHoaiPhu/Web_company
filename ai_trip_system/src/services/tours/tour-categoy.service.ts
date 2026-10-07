import httpBooking from '../httpBooking'
interface CategoryApiResponse {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    is_active: boolean;
    created_at: string;
}
export const tourCategoryService = {
    getAll(): Promise<CategoryApiResponse[]> {
        return httpBooking.get('/categories').then(res => {
            console.log('API Response category:', res.data); // Debug log
            return res.data.data; // Extract the data array
        }).catch(error => {
            console.error('Error fetching tour categories:', error);
            return [];
        });
    },
}