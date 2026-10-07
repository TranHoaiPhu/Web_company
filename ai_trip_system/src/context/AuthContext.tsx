"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { setCookie, deleteCookie } from "cookies-next";
import authService, { User } from "@/services/auth/auth.service";

// Define the shape of our context
interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  loading: boolean;
  login: (token: string, userData?: User) => void;
  logout: () => void;
  socialLogin: (provider: string) => void;
  googleLogin: (tokenOrId: string, isAccessToken?: boolean) => Promise<{
    success: boolean;
    isNewUser?: boolean;
    error?: string;
    data?: {
      user: User;
      accessToken: string;
      refreshToken: string;
      isNewUser?: boolean;
      tempPassword?: string;
      hashedTempPassword?: string;
    }
  }>;
  session: unknown | null;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  loading: false,
  login: () => { },
  logout: () => { },
  socialLogin: () => { },
  googleLogin: async () => ({ success: false }),
  session: null,
});

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  // Define a type for session if you expect a user property
  interface SessionType {
    user?: {
      name?: string;
      email?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }
  const session: SessionType | null = null;

  // Simple login function for traditional login
  const login = (token: string, userData?: User) => {
    // Set cookie with proper options
    setCookie("token", token, {
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
      sameSite: "lax",
    });

    // Store in localStorage (only if in browser)
    if (typeof window !== "undefined") {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("accessToken", token);
      if (userData) {
        authService.storeUser(userData);
      }
    }

    // Update state immediately
    setIsLoggedIn(true);
    if (userData) {
      setUser(userData);
    }

    // Dispatch custom event to notify other components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("authStateChanged"));
    }
  };

  // Function to handle social login
  const socialLogin = (provider: string) => {
    console.log("Use googleLogin() for Google Sign-In:", provider);
  };

  // Google login function - gửi idToken hoặc accessToken lên backend
  const googleLogin = async (tokenOrId: string, isAccessToken: boolean = false): Promise<{
    success: boolean;
    isNewUser?: boolean;
    error?: string;
    data?: {
      user: User;
      accessToken: string;
      refreshToken: string;
      isNewUser?: boolean;
      tempPassword?: string;
      hashedTempPassword?: string;
    };
  }> => {
    setLoading(true);
    try {
      // Nếu là accessToken từ useGoogleLogin, gửi accessToken
      // Nếu là credential từ GoogleLogin button, gửi idToken
      const payload = isAccessToken
        ? { accessToken: tokenOrId }
        : { idToken: tokenOrId };

      const response = await authService.googleLogin(payload);

      if (response.success) {
        const { user: userData, accessToken, refreshToken, isNewUser } = response.data;

        // Store tokens
        authService.storeTokens(accessToken, refreshToken);
        authService.storeUser(userData);

        // Set cookie for middleware
        setCookie("token", accessToken, { maxAge: 60 * 60 * 24, path: '/' });

        // Store login state
        if (typeof window !== "undefined") {
          localStorage.setItem("isLoggedIn", "true");
        }

        // Update state
        setUser(userData);
        setIsLoggedIn(true);

        // Dispatch event
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("authStateChanged"));
        }

        return { success: true, isNewUser, data: response.data };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error: unknown) {
      console.error("Google login error:", error);
      const errorMessage = error instanceof Error ? error.message : "Google login failed";
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Clear cookie
    deleteCookie("token");

    // Clear all stored data
    authService.clearTokens();

    // Clear localStorage (only if in browser)
    if (typeof window !== "undefined") {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("username");
    }

    // Update state
    setUser(null);
    setIsLoggedIn(false);

    // Dispatch custom event to notify other components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("authStateChanged"));
    }
  };

  // Initialize state from localStorage or session
  useEffect(() => {
    // First check NextAuth session
    if (session && (session as SessionType).user) {
      setIsLoggedIn(true);
      setIsInitialized(true);
      return;
    }

    // If no NextAuth session, check localStorage (for traditional login)
    if (typeof window !== "undefined") {
      const checkAuthStatus = () => {
        const storedLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        // Also check if token cookie is missing (forced logout)
        const tokenExists = document.cookie.includes('token=');
        setIsLoggedIn(storedLoggedIn && tokenExists);

        // Load stored user
        const storedUser = authService.getStoredUser();
        console.log("DEBUG: AuthContext Check - storedUser:", storedUser);
        if (storedUser && storedLoggedIn && tokenExists) {
          setUser(storedUser);
        } else if (!storedLoggedIn || !tokenExists) {
          setUser(null);
        }

        setIsInitialized(true);
      };

      // Initial check
      checkAuthStatus();

      // Listen for storage changes (when login happens in another tab or component)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "isLoggedIn" || e.key === "access_token") {
          checkAuthStatus();
        }
      };

      window.addEventListener("storage", handleStorageChange);

      // Also listen for custom events (for same-tab updates)
      const handleAuthChange = () => {
        checkAuthStatus();
      };

      window.addEventListener("authStateChanged", handleAuthChange);

      return () => {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener("authStateChanged", handleAuthChange);
      };
    }
  }, [session]);

  // Don't render children until auth is initialized to prevent hydration mismatch
  if (!isInitialized) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        loading,
        login,
        logout,
        socialLogin,
        googleLogin,
        session,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}
