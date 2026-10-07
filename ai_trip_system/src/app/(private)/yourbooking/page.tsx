"use client";

import AllBookings from "./AllBookings";
import { useTranslation } from "@/lib/i18n/hooks";

function AllBookingsPage() {
  const { t } = useTranslation("order");
  
  return (
    <div className="min-h-screen ">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {t("booking.title")}
          </h1>
          <p className="text-lg md:text-xl mx-4 text-gray-500/90">
            {t("booking.subtitle")}
          </p>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-4 items-center justify-center filter backdrop-blur-sm bg-white/30 rounded-lg shadow-lg max-w-7xl sm:px-6 lg:px-8">
        {/* Grid container with 12 columns */}
        <div className="grid grid-cols-12 gap-4 mt-6 ">
          {/* Empty space for 3/12 columns */}
          <div className="hidden md:block md:col-span-1 lg:col-span-2"></div>

          {/* AllBookings component in 9/12 columns (adjusted for responsive layout) */}
          <div className="col-span-12 md:col-span-10 lg:col-span-12">
            <AllBookings />
          </div>
        </div>
      </main>
    </div>
  );
}

export default AllBookingsPage;
