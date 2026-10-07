"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCookie } from "cookies-next";
import { BOOKING_API_URL } from "@/config/api";
export function useAuthCheck(redirectTo: string = "/login") {
  const [user, setUser] = useState<{ userId: string; role: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Prevent multiple checks
    if (hasChecked.current) {
      return;
    }

    const check = async () => {
      // Check localStorage first for faster response
      const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem("isLoggedIn") === "true";
      const token = getCookie("token");

      if (!token || !isLoggedIn) {
        hasChecked.current = true;
        setLoading(false);
        router.replace(
          `${redirectTo}?callbackUrl=${encodeURIComponent(pathname)}`
        );
        return;
      }

      try {
        const res = await fetch(`${BOOKING_API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
          hasChecked.current = true;
        } else {
          // Token invalid, clear auth state
          if (typeof window !== 'undefined') {
            localStorage.removeItem("isLoggedIn");
          }
          hasChecked.current = true;
          router.replace(
            `${redirectTo}?callbackUrl=${encodeURIComponent(pathname)}`
          );
        }
      } catch (error) {
        console.error("Auth check error:", error);
        hasChecked.current = true;
        router.replace(
          `${redirectTo}?callbackUrl=${encodeURIComponent(pathname)}`
        );
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [pathname, router, redirectTo]);

  return { user, loading };
}