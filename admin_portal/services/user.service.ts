import httpClient from './http';

export interface User {
    id: number;
    user_id: string;
    email: string;
    full_name: string;
    phone?: string;
    role: 'CUSTOMER' | 'ADMIN';
    status: 'ACTIVE' | 'BLOCKED';
    avatar_url?: string;
    address?: string;
    created_at: string;
    updated_at: string;
}

export interface UserListResponse {
    success: boolean;
    data: {
        users: User[];
        pagination: {
            currentPage: number;
            pageSize: number;
            totalItems: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    };
}

export interface UserResponse {
    success: boolean;
    data: User;
    message?: string;
}

export interface UserStatistics {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalSpent: number;
    avgOrderValue: number;
    cancellationRate: number;
}

export interface UsersOverviewStats {
    totalUsers: number;
    totalCustomers: number;
    totalAdmins: number;
    activeUsers: number;
    blockedUsers: number;
    newUsers30Days: number;
    newUsers7Days: number;
}

export interface CreateUserPayload {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role?: 'CUSTOMER' | 'ADMIN';
    status?: 'ACTIVE' | 'BLOCKED';
    avatar_url?: string;
    address?: string;
}

export interface UpdateUserPayload {
    full_name?: string;
    phone?: string;
    avatar_url?: string;
    address?: string;
    role?: 'CUSTOMER' | 'ADMIN';
    status?: 'ACTIVE' | 'BLOCKED';
}

export interface ChangePasswordPayload {
    currentPassword?: string; // Optional for admin
    newPassword: string;
}

export interface GetUsersParams {
    page?: number;
    limit?: number;
    role?: 'CUSTOMER' | 'ADMIN' | 'MANAGEMENT';
    status?: 'ACTIVE' | 'BLOCKED';
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

class UserService {
    private basePath = '/users';

    /**
     * Get all users with filters
     */
    async getAll(params?: GetUsersParams): Promise<UserListResponse> {
        const response = await httpClient.get<UserListResponse>(this.basePath, { params });
        return response.data;
    }

    /**
     * Get user by ID
     */
    async getById(id: string | number): Promise<User> {
        const response = await httpClient.get<UserResponse>(`${this.basePath}/${id}`);
        return response.data.data;
    }

    /**
     * Get user by email
     */
    async getByEmail(email: string): Promise<User> {
        const response = await httpClient.get<UserResponse>(`${this.basePath}/email/${email}`);
        return response.data.data;
    }

    /**
     * Create new user
     */
    async create(payload: CreateUserPayload): Promise<User> {
        const response = await httpClient.post<UserResponse>(this.basePath, payload);
        return response.data.data;
    }

    /**
     * Update user
     */
    async update(id: string | number, payload: UpdateUserPayload): Promise<User> {
        const response = await httpClient.put<UserResponse>(`${this.basePath}/${id}`, payload);
        return response.data.data;
    }

    /**
     * Change user password
     */
    async changePassword(id: string | number, payload: ChangePasswordPayload): Promise<void> {
        await httpClient.put(`${this.basePath}/${id}/password`, payload);
    }

    /**
     * Update user status (block/unblock)
     */
    async updateStatus(id: string | number, status: 'ACTIVE' | 'BLOCKED'): Promise<User> {
        const response = await httpClient.put<UserResponse>(`${this.basePath}/${id}/status`, { status });
        return response.data.data;
    }

    /**
     * Delete user (hard delete)
     */
    async delete(id: string | number): Promise<void> {
        await httpClient.delete(`${this.basePath}/${id}`);
    }

    /**
     * Get user statistics
     */
    async getStatistics(id: string | number): Promise<UserStatistics> {
        const response = await httpClient.get<{ success: boolean; data: UserStatistics }>(
            `${this.basePath}/${id}/statistics`
        );
        return response.data.data;
    }

    /**
     * Get users overview statistics
     */
    async getOverviewStats(): Promise<UsersOverviewStats> {
        const response = await httpClient.get<{ success: boolean; data: UsersOverviewStats }>(
            `${this.basePath}/stats/overview`
        );
        return response.data.data;
    }

    /**
     * Get user orders
     */
    async getUserOrders(id: string | number, params?: { page?: number; limit?: number; status?: string }) {
        const response = await httpClient.get(`${this.basePath}/${id}/orders`, { params });
        return response.data;
    }
}

export const userService = new UserService();
