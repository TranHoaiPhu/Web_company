"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL, BOOKING_API_URL } from "@/config/api";
import Link from "next/link";
import {
  GoogleOAuthProvider,
  GoogleLogin,
  CredentialResponse,
} from "@react-oauth/google";

import "./auth.css";
//import { hashPassword } from "@/";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "40205731279-0kcoulq9vgg2og2a1hj97n2rr9lupu87.apps.googleusercontent.com";

// Component cho Google Login button (dùng idToken, không redirect)
interface GoogleLoginButtonProps {
  onLoginSuccess: (idToken: string) => void;
  onLoginError: (error: string) => void;
  loading: boolean;
}

function GoogleLoginButton({
  onLoginSuccess,
  onLoginError,
  loading,
}: GoogleLoginButtonProps) {
  const handleSuccess = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      // credential chính là idToken từ Google
      onLoginSuccess(credentialResponse.credential);
    } else {
      onLoginError("Không nhận được thông tin từ Google");
    }
  };

  const handleError = () => {
    onLoginError("Đăng nhập Google không thành công. Vui lòng thử lại.");
  };

  if (loading) {
    return (
      <a
        href="#"
        className="social loading"
        onClick={(e) => e.preventDefault()}
      >
        <i
          className="lni lni-spinner-arrow"
          style={{ animation: "spin 1s linear infinite" }}
        ></i>
      </a>
    );
  }

  return (
    <div className="google-login-wrapper">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        type="icon"
        shape="circle"
        size="large"
        useOneTap={false}
      />
    </div>
  );
}

// Inner component that uses Google OAuth hooks
function AuthPageContent({ useSDK }: { useSDK: boolean }) {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode");
  const [isRightPanelActive, setIsRightPanelActive] = useState(
    initialMode === "register",
  );
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { login, googleLogin } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  // Login states
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Register states
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [registerError, setRegisterError] = useState("");
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);

  const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!loginUsername || !loginPassword) {
      setLoginError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    setIsLoginLoading(true);
    setLoginError("");

    try {
      /*  const response = await fetch(`${BOOKING_API_URL}/auth/login`, {
         method: "POST",
         headers: {
           "Content-Type": "application/x-www-form-urlencoded",
         },
         body: new URLSearchParams({
           email: loginUsername,
           password: loginPassword,
         }).toString(),
       }); */

      // Dung BE_booking_tour
      /*  const response = await fetch(`${BOOKING_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: dataAuth
      });


 */

      const response = await fetch(`${BOOKING_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginUsername,
          password: loginPassword,
        }),
      });

      if (!response.ok) {
        throw new Error(
          "Đăng nhập không thành công. Vui lòng kiểm tra thông tin đăng nhập.",
        );
      }
      const data = await response.json();
      console.log("DEBUG: Login Response Data:", data);

      if (data.access_token) {
        // Pass user data to login if available in the response
        const userData = data.data?.user;
        login(data.access_token, userData);

        if (data.user_id) {
          localStorage.setItem("userId", data.user_id);
        }

        const profileRes = await fetch(`${BOOKING_API_URL}/api/profile`, {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          localStorage.setItem("current_user_id", profileData.userId);
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
        router.replace(callbackUrl === "/" ? "/" : callbackUrl);
      } else {
        throw new Error("Thông tin đăng nhập không hợp lệ.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setLoginError(err.message || "Đã có lỗi xảy ra.");
      } else {
        setLoginError("Đã có lỗi xảy ra.");
      }
    } finally {
      setIsLoginLoading(false);
    }
  };

  ///  

  const handleRegisterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { username, email, password, confirmPassword } = registerData;

    // 1. Validation Logic
    if (!username || !email || !password || !confirmPassword) {
      setRegisterError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    if (!email.includes("@")) {
      setRegisterError("Email không hợp lệ.");
      return;
    }

    if (password.length < 6) {
      setRegisterError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setRegisterError("Mật khẩu không khớp. Vui lòng kiểm tra lại.");
      return;
    }

    setIsRegisterLoading(true);
    setRegisterError("");

    try {
      // 2. Register with Python API (Main System)
      const pythonResponse = await fetch(
        `${API_BASE_URL}/auth/register?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: { "Accept": "application/json" },
        }
      );

      if (!pythonResponse.ok) {
        const errorData = await pythonResponse.json().catch(() => ({}));
        if (pythonResponse.status === 409) {
          throw new Error("Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.");
        }
        throw new Error(errorData.detail || "Đăng ký trên hệ thống chính thất bại.");
      }

      // 3. Sync with Booking API (Node.js)
      try {
        await fetch(`${BOOKING_API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            password,
            email: email
          }),
        });
      } catch (syncError) {
        console.warn("Booking system sync failed:", syncError);
      }

      // 4. Finalize Registration
      setIsRightPanelActive(false);
      setRegisterData({ username: "", email: "", password: "", confirmPassword: "" });

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Đã có lỗi xảy ra.";
      setRegisterError(errorMessage);
    } finally {
      setIsRegisterLoading(false);
    }
  };

  // Handle Google login success (nhận idToken từ GoogleLogin component)
  const handleGoogleSuccess = async (idToken: string) => {
    setGoogleLoading(true);
    setLoginError("");
    try {
      // 1. Authenticate with Google ID Token
      const result = await googleLogin(idToken, false);
      if (!result.success || !result.data?.accessToken) {
        throw new Error(result.error || "Đăng nhập Google không thành công");
      }
      const {
        accessToken,
        user: profile,
        isNewUser,
        tempPassword,
        hashedTempPassword,
      } = result.data;
      console.log("Full Result Data:", result.data);
      console.log("Google Login Result:", {
        isNewUser,
        hasTempPassword: !!tempPassword,
      });

      // 2. Store user ID in localStorage
      if (profile.user_id) {
        localStorage.setItem("current_user_id", profile.user_id);
      }

      // 3. Fetch and store current user profile
      await fetchAndStoreUserProfile(accessToken);

      // 4. Sync user data to Python API (only for new users)
      if (isNewUser) {
        console.log("New user detected, syncing and showing modal...");
        await syncUserToPythonAPI(profile, accessToken, hashedTempPassword);

        // 5. Show temporary password page for new users
        if (tempPassword) {
          console.log("Storing auth data and navigating to account-created");
          sessionStorage.setItem("temp_auth_data", JSON.stringify({
            tempPassword: tempPassword,
            email: profile.email || "",
            fullName: profile.full_name || "Người dùng",
          }));
          router.push("/auth/account-created");
          return;
        } else {
          console.warn("isNewUser is true but tempPassword is missing!");
        }
      }

      // 6. Redirect to callback URL (for existing users)
      console.log("Redirecting to callback URL");
      await new Promise((resolve) => setTimeout(resolve, 100));
      router.replace(callbackUrl === "/" ? "/" : callbackUrl);
    } catch (err) {
      console.error("Google login error:", err);
      setLoginError(
        err instanceof Error
          ? err.message
          : "Đã có lỗi xảy ra khi đăng nhập với Google",
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  /**
   * Fetch user profile and store current_user_id
   */
  async function fetchAndStoreUserProfile(accessToken: string): Promise<void> {
    try {
      const profileRes = await fetch(`/api/profile`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        localStorage.setItem("current_user_id", profileData.userId);
      } else {
        console.warn("Failed to fetch user profile");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }

  /**
   * Sync user data to Python Trip Planner API
   */
  async function syncUserToPythonAPI(
    profile: {
      user_id: string;
      full_name?: string;
      email?: string;
      phone?: string;
      avatar_url?: string;
    },
    accessToken: string,
    hashedPassword?: string,
  ): Promise<void> {
    const pythonApiUrl = `${API_BASE_URL}/users/sync`;

    const syncPayload = {
      user_id: profile.user_id,
      name: profile.full_name || "Google User",
      username: profile.user_id,
      gender: 0,
      email: profile.email,
      phonenumber: profile.phone || "",
      avatar: profile.avatar_url || "",
      theme: 0,
      language: 0,
      description: "Auto-synced from Authentication",
      password: hashedPassword || `GG_${profile.user_id.substring(0, 8)}`,
    };

    try {
      console.log("Syncing user profile to Trip Planner API...");

      const syncResponse = await fetch(pythonApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(syncPayload),
      });

      if (syncResponse.ok) {
        console.log("✅ Profile successfully synced to Python API");
      } else {
        const errorData = await syncResponse.json().catch(() => ({}));
        console.warn(
          `⚠️ Profile sync failed (${syncResponse.status}):`,
          errorData,
        );
      }
    } catch (syncError) {
      console.error("❌ Error during profile synchronization:", syncError);
      // Don't throw - allow login to continue even if sync fails
    }
  }

  // Render Google button based on SDK availability
  const renderGoogleButton = () => {
    if (useSDK) {
      return (
        <GoogleLoginButton
          loading={googleLoading}
          onLoginSuccess={handleGoogleSuccess}
          onLoginError={(error) => {
            setLoginError(error);
            setGoogleLoading(false);
          }}
        />
      );
    }
    // Fallback: hiển thị thông báo khi chưa config
    return (
      <a
        href="#"
        className="social"
        onClick={(e) => {
          e.preventDefault();
          setLoginError(
            "Google Sign-In chưa được cấu hình. Vui lòng liên hệ admin.",
          );
        }}
      >
        <i className="lni lni-google"></i>
      </a>
    );
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="auth-page">

      {/* Nút quay về Home */}
      <Link href="/" className="home-button">
        <i className="lni lni-arrow-left"></i> Trang chủ
      </Link>

      <video autoPlay loop muted playsInline className="back-video">
        <source
          src="https://res.cloudinary.com/dwqxjee2k/video/upload/v1769194812/Introduce_g9uahj.mp4"
          type="video/mp4"
        />
      </video>

      <div
        className={`container ${isRightPanelActive ? "right-panel-active" : ""}`}
        id="container"
      >
        {/* Register Form */}
        <div className="form-container register-container">
          <form onSubmit={handleRegisterSubmit}>
            <h1>Đăng ký</h1>

            {registerError && (
              <div className="error-message">{registerError}</div>
            )}

            <input
              type="text"
              name="username"
              placeholder="Tên đăng nhập"
              value={registerData.username}
              onChange={handleRegisterChange}
              disabled={isRegisterLoading}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={registerData.email}
              onChange={handleRegisterChange}
              disabled={isRegisterLoading}
            />
            <input
              type="password"
              name="password"
              placeholder="Mật khẩu"
              value={registerData.password}
              onChange={handleRegisterChange}
              disabled={isRegisterLoading}
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Xác nhận mật khẩu"
              value={registerData.confirmPassword}
              onChange={handleRegisterChange}
              disabled={isRegisterLoading}
            />

            <button type="submit" disabled={isRegisterLoading}>
              {isRegisterLoading ? "Đang xử lý..." : "Đăng ký"}
            </button>

            <span>hoặc đăng ký với</span>
            <div className="social-container">
              {renderGoogleButton()}
              <a href="#" className="social">
                <i className="lni lni-facebook-fill"></i>
              </a>
              <a href="#" className="social">
                <i className="lni lni-linkedin-original"></i>
              </a>
            </div>

            {/* Mobile switch */}
            <div className="mobile-switch">
              <span>Đã có tài khoản?</span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setIsRightPanelActive(false);
                }}
              >
                Đăng nhập
              </a>
            </div>
          </form>
        </div>

        {/* Login Form */}
        <div className="form-container login-container">
          <form onSubmit={handleLoginSubmit}>
            <h1>Đăng nhập</h1>

            {loginError && <div className="error-message">{loginError}</div>}

            <input
              type="text"
              placeholder="Tên đăng nhập"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              disabled={isLoginLoading}
            />
            <input
              type="password"
              placeholder="Mật khẩu"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              disabled={isLoginLoading}
            />

            <div className="content">
              <div className="checkbox">
                <input
                  type="checkbox"
                  name="checkbox"
                  id="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="checkbox">Ghi nhớ đăng nhập</label>
              </div>
              <div className="pass-link">
                <Link href="/forgot-password">Quên mật khẩu?</Link>
              </div>
            </div>

            <button type="submit" disabled={isLoginLoading}>
              {isLoginLoading ? "Đang xử lý..." : "Đăng nhập"}
            </button>

            <span>hoặc đăng nhập với</span>
            <div className="social-container">
              {renderGoogleButton()}
              <a href="#" className="social">
                <i className="lni lni-facebook-fill"></i>
              </a>
              <a href="#" className="social">
                <i className="lni lni-linkedin-original"></i>
              </a>
            </div>

            {/* Mobile switch */}
            <div className="mobile-switch">
              <span>Chưa có tài khoản?</span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setIsRightPanelActive(true);
                }}
              >
                Đăng ký
              </a>
            </div>
          </form>
        </div>

        {/* Overlay */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1 className="title">
                Xin chào <br /> bạn!
              </h1>
              <p>
                Nếu bạn đã có tài khoản, đăng nhập ngay để khám phá Việt Nam
              </p>
              <button
                className="ghost"
                type="button"
                onClick={() => setIsRightPanelActive(false)}
              >
                Đăng nhập
                <i className="lni lni-arrow-left login"></i>
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1 className="title">
                Bắt đầu <br /> hành trình
              </h1>
              <p>
                Nếu bạn chưa có tài khoản, hãy đăng ký để khám phá cùng TravelVN
              </p>
              <button
                className="ghost"
                type="button"
                onClick={() => setIsRightPanelActive(true)}
              >
                Đăng ký
                <i className="lni lni-arrow-right register"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main export with GoogleOAuthProvider wrapper
export default function AuthPage() {
  if (!GOOGLE_CLIENT_ID) {
    // Fallback nếu không có Google Client ID - không dùng SDK
    return <AuthPageContent useSDK={false} />;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthPageContent useSDK={true} />
    </GoogleOAuthProvider>
  );
}
