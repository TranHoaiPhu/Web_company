import Cookies from 'js-cookie';
import { BOOKING_API_URL } from '@/config/api';
import { API_BASE_URL } from '@/config/api';
interface DecodedToken {
    id: number;
    user_id: string;
    sub?: string;
    email: string;
    role: string | number;
    role_id?: number;
    exp: number;
    iat: number;
}

export const AuthService = {
    /**
     * Login using BE_BookingTour API
     */
    /* login: async (email: string, password: string) => {
        const response = await fetch(`${BOOKING_API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { success: false, message: errorData.message || 'Đăng nhập thất bại' };
        }

        const data = await response.json();
        const accessToken = data.data?.accessToken;

        if (accessToken) {
            // Decode token to check role
            try {
                const payload = JSON.parse(atob(accessToken.split('.')[1])) as DecodedToken;

                // Check if user is admin (role_id = 2 in Node.js, role = 0 in Python)
                const isAdmin = payload.role_id === 2 || payload.role === '0' || payload.role === 'ADMIN';

                if (!isAdmin) {
                    return { success: false, message: 'Chỉ admin mới có quyền truy cập' };
                }
            } catch (e) {
                console.error('Token decode error:', e);
                return { success: false, message: 'Token không hợp lệ' };
            }

            // Set cookie (token expires in 1 day by default from BE)
            Cookies.set('admin_token', accessToken, { expires: 1, sameSite: 'strict' });
            return { success: true };
        }
        return { success: false, message: 'Đăng nhập thất bại' };
    }, */


    login: async (username: string, password: string) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ username, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { success: false, message: errorData.detail || 'Login failed' };
        }

        const data = await response.json();
        const { access_token } = data;

        if (access_token) {
            // Decode token to check role
            try {
                const payload = JSON.parse(atob(access_token.split('.')[1]));
                const isAdmin = payload.role === 0;

                if (!isAdmin) {
                    // If not admin, check if user has any RBAC roles
                    // First, set token temporarily to make the API call
                    Cookies.set('admin_token', access_token, { expires: 30 / 1440, sameSite: 'strict' });

                    try {
                        // Check if user has any RBAC roles assigned
                        const userId = payload.iduser || payload.user_id || payload.sub;
                        const rolesUrl = `${API_BASE_URL}/roles-management/users/${userId}/roles`;

                        const rolesResponse = await fetch(rolesUrl, {
                            headers: {
                                'Authorization': `Bearer ${access_token}`,
                                'Content-Type': 'application/json',
                            }
                        });

                        if (rolesResponse.ok) {
                            const rolesData = await rolesResponse.json();
                            const hasRoles = rolesData.roles && rolesData.roles.length > 0;

                            if (hasRoles) {
                                // User has RBAC roles, allow access
                                return { success: true };
                            }
                        } else {
                            const errorText = await rolesResponse.text();
                            console.log('Roles error:', errorText);
                        }

                        // No RBAC roles, deny access
                        Cookies.remove('admin_token');
                        return { success: false, message: 'Bạn chưa được gán vai trò quản lý' };
                    } catch (roleError) {
                        console.error('Error checking RBAC roles:', roleError);
                        Cookies.remove('admin_token');
                        return { success: false, message: 'Không thể kiểm tra quyền truy cập' };
                    }
                }
            } catch (e) {
                return { success: false, message: 'Invalid token' };
            }

            // Admin user - allow access
            Cookies.set('admin_token', access_token, { expires: 30 / 1440, sameSite: 'strict' });
            return { success: true };
        }
        return { success: false, message: 'Login failed' };
    },


    /**
     * Logout and redirect to login page
     */
    logout: () => {
        Cookies.remove('admin_token');
        window.location.href = '/login';
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated: () => {
        return !!Cookies.get('admin_token');
    },

    /**
     * Get current logged-in user from JWT token
     * Returns decoded token payload with user info
     */
    getCurrentUser: (): DecodedToken | null => {
        const token = Cookies.get('admin_token');
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split('.')[1])) as DecodedToken;

            // Check if token is expired
            if (payload.exp && payload.exp * 1000 < Date.now()) {
                Cookies.remove('admin_token');
                return null;
            }

            return payload;
        } catch (e) {
            console.error('Error decoding token:', e);
            return null;
        }
    },

    /**
     * Get access token
     */
    getToken: () => {
        return Cookies.get('admin_token');
    }
};
