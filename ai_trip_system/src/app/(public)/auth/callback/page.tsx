"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// Component con để xử lý logic SearchParams
function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [status, setStatus] = useState("Đang xác thực...");

  useEffect(() => {
    async function handleCallback() {
      // 1. Lấy token chuẩn từ URL params
      const token = searchParams.get("access_token");
      const callbackUrl = localStorage.getItem("google_callback") || "/"; // Mặc định về trang chủ nếu ko có link cũ

      if (token) {
        try {
          setStatus("Đang đăng nhập...");
          // 2. Lưu token vào context
          login(token);

          // 3. Gọi API lấy thông tin Profile (Quan trọng)
          setStatus("Đang đồng bộ dữ liệu...");
          const profileRes = await fetch(`/api/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (profileRes.ok) {
            const profileData = await profileRes.json();
            // Lưu userId để dùng cho các logic khác
            localStorage.setItem("current_user_id", profileData.userId);
          }

          // 4. Dọn dẹp và điều hướng
          localStorage.removeItem("google_callback");
          router.push(callbackUrl);
          
        } catch (error) {
          console.error("Login error:", error);
          router.push("/login?error=auth_failed");
        }
      } else {
        // Nếu không có token -> Về trang login
        router.push("/login");
      }
    }

    handleCallback();
  }, [searchParams, login, router]);

  return (
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">{status}</p>
    </div>
  );
}

// Component chính bọc Suspense để tránh lỗi build Next.js khi dùng useSearchParams
export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Suspense fallback={<div>Loading...</div>}>
        <CallbackContent />
      </Suspense>
    </div>
  );
}