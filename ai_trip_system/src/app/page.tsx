"use client";

import IntroPage from "./(public)/intro/page";

// Main page - always show public home regardless of login status
export default function HomePage() {
  // Always show intro/public home page
  return <IntroPage />;
}
