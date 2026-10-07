"use client";
import { useAuthCheck } from "@/hooks/useAuthCheck";

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading } = useAuthCheck();
  if (loading) return <p>Đang kiểm tra đăng nhập...</p>;

  return children;
}
