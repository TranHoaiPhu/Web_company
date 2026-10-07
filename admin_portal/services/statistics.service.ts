import bookingHttp from './http-tour';

// Types for Dashboard Overview
export interface DashboardSummary {
    totalRevenue: number;
    revenueChange: number | null;
    totalOrders: number;
    ordersChange: number | null;
    totalCustomers: number;
    customersChange: number | null;
    avgOrderValue: number;
    avgOrderValueChange: number | null;
}

export interface RevenueByTime {
    date: string;
    revenue: number;
    orders: number;
}

export interface OrderByStatus {
    status: string;
    count: number;
    percentage: number;
}

export interface RevenueByCategory {
    categoryId: string;
    categoryName: string;
    revenue: number;
    percentage: number;
}

export interface TopTour {
    tourId: string;
    tourName: string;
    bookingCount: number;
    revenue: number;
    avgRating: number;
}

export interface CustomerMetrics {
    totalParticipants: {
        adult: number;
        child: number;
        infant: number;
    };
    avgParticipantsPerOrder: number;
}

export interface DashboardOverviewData {
    period: {
        startDate: string;
        endDate: string;
        previousPeriod: {
            startDate: string;
            endDate: string;
        } | null;
    };
    summary: DashboardSummary;
    revenueByTime: RevenueByTime[];
    ordersByStatus: OrderByStatus[];
    revenueByCategory: RevenueByCategory[];
    topTours: TopTour[];
    revenueByLocation: { locationId: string; locationName: string; revenue: number; percentage: number }[];
    paymentMethods: { method: string; count: number; amount: number; percentage: number }[];
    customerMetrics: CustomerMetrics;
}

// Types for Dashboard Schedules
export interface ScheduleSummary {
    totalSchedules: number;
    openSchedules: number;
    fullSchedules: number;
    cancelledSchedules: number;
    avgOccupancyRate: number;
}

export interface OccupancyByTour {
    tourId: string;
    tourName: string;
    scheduleCount: number;
    avgOccupancy: number;
    totalSlots: number;
    bookedSlots: number;
}

export interface ScheduleByStatus {
    status: string;
    count: number;
    percentage: number;
}

export interface UpcomingSchedule {
    scheduleId: string;
    tourName: string;
    startDate: string;
    endDate: string;
    totalSlots: number;
    bookedSlots: number;
    availableSlots: number;
    occupancyRate: number;
    status: string;
}

export interface OccupancyTrend {
    week: string;
    avgOccupancy: number;
}

export interface DashboardSchedulesData {
    summary: ScheduleSummary;
    occupancyByTour: OccupancyByTour[];
    schedulesByStatus: ScheduleByStatus[];
    upcomingSchedules: UpcomingSchedule[];
    occupancyTrend: OccupancyTrend[];
}

export const statisticsService = {
    // Get Dashboard Overview
    getDashboardOverview: async (params?: {
        startDate?: string;
        endDate?: string;
        compareWithPrevious?: boolean;
        groupBy?: 'day' | 'week' | 'month';
    }): Promise<DashboardOverviewData> => {
        try {
            const response = await bookingHttp.get('/statistics/dashboard/overview', { params });
            return response.data?.data;
        } catch (error) {
            console.error('Error fetching dashboard overview:', error);
            throw error;
        }
    },

    // Get Dashboard Schedules
    getDashboardSchedules: async (params?: {
        startDate?: string;
        endDate?: string;
        tourId?: string;
        status?: string;
    }): Promise<DashboardSchedulesData> => {
        try {
            const response = await bookingHttp.get('/statistics/dashboard/schedules', { params });
            return response.data?.data;
        } catch (error) {
            console.error('Error fetching dashboard schedules:', error);
            throw error;
        }
    },
};
