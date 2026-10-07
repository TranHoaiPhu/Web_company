import httpBooking from '../httpBooking';

export interface User {
  id: number;
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
    isNewUser?: boolean;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
}

export interface GoogleLoginPayload {
  idToken?: string;
  accessToken?: string;
}

const authService = {
  // Traditional login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await httpBooking.post('/auth/login', credentials);
    return response.data;
  },

  // Register
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await httpBooking.post('/auth/register', credentials);
    return response.data;
  },

  // Google login - gửi idToken hoặc accessToken lên backend
  async googleLogin(payload: GoogleLoginPayload): Promise<AuthResponse> {
    const response = await httpBooking.post('/auth/google', payload);
    return response.data;
  },

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await httpBooking.post('/auth/refresh-token', { refreshToken });
    return response.data.data;
  },

  // Change password
  async changePassword(passwords: { oldPassword: string; newPassword: string }): Promise<AuthResponse> {
    const { accessToken } = this.getStoredTokens();
    const response = await httpBooking.post('/auth/change-password', passwords, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  },

  // Get current user
  async getCurrentUser(token: string): Promise<User> {
    const response = await httpBooking.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  },

  // Store tokens
  storeTokens(accessToken: string, refreshToken: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
  },

  // Get stored tokens
  getStoredTokens() {
    if (typeof window !== 'undefined') {
      return {
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken'),
      };
    }
    return { accessToken: null, refreshToken: null };
  },

  // Clear tokens
  clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  // Store user
  storeUser(user: User) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  // Get stored user
  getStoredUser(): User | null {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }
};

export default authService;
