import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register for an account",
  description:
    "This is the registration page for new users to create an account.",
};

export default function RegisterPage() {
  redirect("/auth?mode=register");
}
