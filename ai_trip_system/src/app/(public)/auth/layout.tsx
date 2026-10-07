import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng nhập / Đăng ký - TravelVN",
  description: "Đăng nhập hoặc đăng ký tài khoản để khám phá Việt Nam cùng TravelVN",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
