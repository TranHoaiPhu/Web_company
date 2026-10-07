import httpBooking from '../httpBooking';

export interface PublicStats {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalTours: number;
    activeTours: number;
    topLocations: Array<{
        id: string;
        name: string;
        tourCount: number;
        bookingCount: number;
    }>;
    revenueByMonth: Array<{
        month: string;
        orders: number;
        revenue: number;
    }>;
}

const statisticsService = {
    /**
     * Get public statistics for homepage
     * Hits /statistics/dashboard which is currently open (public)
     */
    async getPublicStats(): Promise<PublicStats | null> {
        try {
            const response = await httpBooking.get('/statistics/dashboard');
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error('Error fetching public statistics:', error);
            return null;
        }
    },

    /**
     * Get dashboard overview (can be used if needed)
     */
    async getDashboardOverview() {
        try {
            const response = await httpBooking.get('/statistics/dashboard/overview');
            if (response.data && response.data.success) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error('Error fetching dashboard overview:', error);
            return null;
        }
    }
};

export default statisticsService;
