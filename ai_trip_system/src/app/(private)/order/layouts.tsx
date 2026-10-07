/* import { redirect } from "next/navigation";
import Cookies from "js-cookie";

export default function PrivateLayout({ children }) {
  // Kiểm tra token trong cookie
  const token = typeof window !== "undefined" ? Cookies.get("token") : null;
  if (!token) {
    redirect("/");
  }
  return <>{children}</>;
} */