"use client";

import { useState, FormEvent } from "react";
import Loading from "@/components/Loading";
import Link from "next/link";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { API_BASE_URL } from "@/config/api";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useTranslation } from "@/lib/i18n/hooks";

interface LoginFormProps {
  callbackUrl: string;
}

export default function LoginForm({ callbackUrl }: LoginFormProps) {
  const { t } = useTranslation("auth");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, googleLogin } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!username || !password) {
      setError(t("login.requiredFields"));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ username, password }).toString(),
        }
      );

      if (!response.ok) {
        throw new Error(t("login.loginFailed"));
      }
      const data = await response.json();
      console.log("Login response data:", data);

      // Store token in cookie and update auth context
      if (data.access_token) {
        // Use the login function from auth context - this will set cookie and localStorage
        login(data.access_token);

        // Lưu user_id vào localStorage
        if (data.user_id) {
          localStorage.setItem("userId", data.user_id);
        }

        // Fetch and store user profile
        try {
          const profileRes = await fetch(`/api/profile`, {
            headers: {
              Authorization: `Bearer ${data.access_token}`,
            },
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            localStorage.setItem("current_user_id", profileData.userId);
          }
        } catch (profileErr) {
          console.error("Error fetching profile:", profileErr);
          // Continue anyway - profile is not critical for login
        }

        // Wait a bit longer to ensure all state is updated
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Force a clean redirect
        const targetUrl = callbackUrl && callbackUrl !== "/" ? callbackUrl : "/";
        window.location.href = targetUrl;
      } else {
        throw new Error(t("login.invalidLogin"));
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || t("login.genericError"));
        console.error(err);
      } else {
        setError(t("login.genericError"));
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In với SDK (idToken)
  const handleGoogleSuccess = async (idToken: string) => {
    setGoogleLoading(true);
    setError("");

    try {
      const result = await googleLogin(idToken);

      if (result.success) {
        // Wait for state to update
        await new Promise((resolve) => setTimeout(resolve, 200));

        if (result.isNewUser) {
          console.log("New user created via Google Sign-In");
        }

        // Force a clean redirect
        const targetUrl = callbackUrl && callbackUrl !== "/" ? callbackUrl : "/";
        window.location.href = targetUrl;
      } else {
        setError(result.error || t("login.googleLoginFailed"));
      }
    } catch (err) {
      console.error("Google login error:", err);
      setError(t("login.googleLoginError"));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError(t("login.googleLoginRetry"));
  };

  return (
    <div className="min-h-screen flex items-start justify-center pt-8 sm:pt-12 md:pt-16 pb-4 px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start">
          {/* Left side - Login Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-12 xl:ml-24">
            <div className="rounded-2xl shadow-xl filter backdrop-blur-md bg-yellow-50 border border-[#d1d9e0] p-4 sm:p-6 md:p-8">
              {/* Logo */}
              <div className="flex justify-center mb-4">
                <Image
                  src="/logo/travelVN.png"
                  alt="AI Travel Logo"
                  className="w-32 h-auto sm:w-40"
                  width={200}
                  height={60}
                  priority
                />
              </div>

              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                  {t("login.welcomeMessage")}
                </h2>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">
                  {t("login.enterInfo")}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="username"
                    className="block text-xs font-medium text-gray-700 mb-1"
                  >
                    {t("login.username")}
                  </label>
                  <div className="relative">
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder={t("login.usernamePlaceholder")}
                      required
                      disabled={isLoading}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                      <FaEnvelope />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium text-gray-700 mb-1"
                  >
                    {t("login.password")}
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder={t("login.passwordPlaceholder")}
                      required
                      disabled={isLoading}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                      <FaLock />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-cyan-500 text-white py-3 px-4 rounded-xl hover:bg-cyan-600 transition duration-200 font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loading message={t("login.verifying")} />
                  ) : (
                    t("login.submit")
                  )}
                </button>
              </form>

              <div className="mt-2">
                {googleLoading ? (
                  <div className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-xl">
                    <Loading message={t("login.googleLoading")} />
                  </div>
                ) : (
                  <GoogleSignInButton
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    text="signin_with"
                    theme="outline"
                    size="large"
                  />
                )}
              </div>

              <div className="mt-6 text-center text-sm">
                <p className="text-gray-600">
                  {t("login.noAccount")}{" "}
                  <Link
                    href="/register"
                    className="text-cyan-600 font-medium hover:text-cyan-500"
                  >
                    {t("login.signUp")}
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Vietnam Image */}
          <div className="hidden lg:block">
            <div className="relative">
              <Image
                src="/images/vietnam.png"
                alt="Vietnam"
                className="w-full h-auto max-w-md mx-auto"
                width={500}
                height={500}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
