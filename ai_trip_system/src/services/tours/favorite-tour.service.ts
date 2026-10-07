import httpPython from '../httpPython';

export interface FavoriteTour {
    id_user: string;
    id_tour: number;
    created_at: string;
}

const favoriteTourService = {
    async getMyFavorites(): Promise<FavoriteTour[]> {
        const response = await httpPython.get('/favorite-tours/my');
        return response.data;
    },

    async addFavorite(idTour: number): Promise<FavoriteTour> {
        const response = await httpPython.post('/favorite-tours/add', { id_tour: idTour });
        return response.data;
    },

    async removeFavorite(idTour: number): Promise<{ message: string }> {
        const response = await httpPython.delete(`/favorite-tours/remove/${idTour}`);
        return response.data;
    },

    async checkFavorite(idTour: number): Promise<{ is_favorite: boolean }> {
        const response = await httpPython.get(`/favorite-tours/check/${idTour}`);
        return response.data;
    }
};

export default favoriteTourService;
