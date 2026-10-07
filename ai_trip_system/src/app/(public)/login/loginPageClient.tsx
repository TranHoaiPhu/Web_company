"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    // Redirect to the new auth page with callbackUrl
    router.replace(`/auth?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }, [router, callbackUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Đang chuyển hướng...</p>
      </div>
    </div>
  );
}
