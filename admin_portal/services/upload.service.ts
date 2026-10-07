import axios from 'axios';
import { BOOKING_API_URL } from '@/config/api';

const bookingHttp = axios.create({
    baseURL: BOOKING_API_URL,
});

export const uploadService = {
    uploadImage: async (file: File): Promise<string> => {
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await bookingHttp.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data && response.data.success) {
                return response.data.imageUrl;
            }
            throw new Error(response.data?.message || 'Upload failed');
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }
};
