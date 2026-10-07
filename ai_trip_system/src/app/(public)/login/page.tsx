import LoginPageClient from "./loginPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login to your account",
  description: "This is the login page for users to access their accounts.",
};

export default function LoginPage() {
  return <LoginPageClient />;
}
