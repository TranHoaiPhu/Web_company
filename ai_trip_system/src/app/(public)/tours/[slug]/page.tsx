
// app/tours/[slug]/page.tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";
import HeroSection from "@/components/tour-detail/Hero";
import GallerySection from "@/components/tour-detail/GallerySection";
import DescriptionSection from "@/components/tour-detail/DescriptionSection";
import ItineraryTimeline from "@/components/tour-detail/ItineraryTimeline";
import AmenitiesGrid from "@/components/tour-detail/AmenitiesGrid";
import ScheduleSelector from "@/components/tour-detail/ScheduleSelector";
import BookingSidebar from "@/components/tour-detail/BookingSidebar";
/* import MobileBookingBar from '@/components/tour-detail/MobileBookingBar'; */
import { tourService } from "@/services/tours/tour.service";
import { mapTourDetailApiToBase } from "@/mapper/tour.mapper";
import { TourDetailApiResponse } from "@/types/tour.api";
import { TourDetail } from "@/types/tour";
import MobileBookingBar from "@/components/tour-detail/MobileBookingBar";
import ReviewSection from "@/components/tour-detail/ReviewSection";
import TourNavigation from "@/components/tour-detail/TourNavigation";

// ===========================
// METADATA GENERATION
// ===========================
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  try {
    const { slug } = await params;
    console.log(slug);
    const response = await tourService.getById(slug);
    const apiTour = response as TourDetailApiResponse;
    const tour = mapTourDetailApiToBase(apiTour) as TourDetail;

    return {
      title: `${tour.tour.name} - Du lịch ${tour.location?.name || ""}`,
      description:
        tour.tour.short_description || tour.tour.description?.substring(0, 160),
      openGraph: {
        title: tour.tour.name,
        description: tour.tour.short_description,
        images: tour.images.map((img) => img.url),
      },
    };
  } catch {
    return {
      title: "Tour không tìm thấy",
    };
  }
}

// ===========================
// FETCH TOUR DATA
// ===========================
async function getTourData(slug: string): Promise<TourDetail | null> {
  try {
    const response = await tourService.getById(slug);
    const apiTour = response as TourDetailApiResponse;
    return mapTourDetailApiToBase(apiTour) as TourDetail;
  } catch (error) {
    console.error("Error fetching tour:", error);
    return null;
  }
}

// ===========================
// MAIN PAGE COMPONENT (Server Component)
// ===========================
export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch tour data on server
  const tour = await getTourData(slug);

  // Handle not found
  if (!tour || !tour.tour) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-70 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl" />
      </div>

      {/* Content Wrapper */}
      <div className="relative">
        {/* Hero Section with Enhanced Design */}
        <div className="relative">
          <HeroSection tour={tour} />
          {/* Curved divider */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-slate-50/80" />
        </div>

        <TourNavigation />

        {/* Main Content Area */}
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 xl:gap-10">
            {/* Main Content Column */}
            <div className="lg:col-span-8 space-y-8 lg:space-y-10">
              {/* Gallery with Modern Card */}
              {/* Gallery */}
              <Suspense
                fallback={
                  <div className="h-80 rounded-2xl bg-gray-100 animate-pulse border border-gray-200" />
                }
              >
                <div className="relative rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <GallerySection
                    images={tour.images}
                    tourName={tour.tour.name}
                  />
                </div>
              </Suspense>

              {/* Description with Glass Effect */}
              <div id="description" className="group relative scroll-mt-28">
                <div className="absolute -inset-1 rounded-3xl blur-xl opacity-0 transition-opacity duration-700" />
                <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 p-8 lg:p-10 transition-all duration-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-cyan-500 rounded-full" />
                    <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Mô Tả Tour
                    </h2>
                  </div>
                  <DescriptionSection description={tour.tour.description} />
                </div>
              </div>

              {/* Itinerary with Timeline Effect */}
              <div id="itinerary" className="group relative scroll-mt-28">
                <div className="absolute -inset-1 rounded-3xl blur-xl opacity-0 transition-opacity duration-700" />
                <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 p-8 lg:p-10 transition-all duration-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-gradient-to-b from-purple-600 to-indigo-500 rounded-full" />
                    <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Lịch Trình
                    </h2>
                  </div>
                  <ItineraryTimeline itinerary={tour.itinerary} />
                </div>
              </div>

              {/* Amenities with Grid Layout */}
              <div id="amenities" className="group relative scroll-mt-28">
                <div className="absolute -inset-1 rounded-3xl blur-xl opacity-0 transition-opacity duration-700" />
                <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 p-8 lg:p-10 transition-all duration-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-gradient-to-b from-emerald-600 to-teal-500 rounded-full" />
                    <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Tiện Ích
                    </h2>
                  </div>
                  <AmenitiesGrid amenities={tour.amenities} />
                </div>
              </div>

              {/* Schedule Selector */}
              <div id="schedule" className="group relative scroll-mt-28">
                <div className="absolute -inset-1 rounded-3xl blur-xl opacity-0 transition-opacity duration-700" />
                <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 p-8 lg:p-10 transition-all duration-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-gradient-to-b from-orange-600 to-red-500 rounded-full" />
                    <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Lịch Khởi Hành
                    </h2>
                  </div>
                  <ScheduleSelector
                    schedules={tour.upcoming_schedules}
                    basePrice={tour.tour.base_price}
                  />
                </div>
              </div>

              {/* Review Section */}
              <div id="reviews" className="scroll-mt-28">
                <ReviewSection tourId={String(tour.tour.id)} />
              </div>
            </div>

            {/* Booking Sidebar (Desktop) with Sticky Enhanced Card */}
            <aside className="hidden lg:block lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                {/* Main Booking Card */}
                <div className="group relative">
                  <div className="absolute -inset- rounded-3xl opacity-75 group-hover:opacity-100 transition-opacity duration-700 animate-pulse" />
                  <div className="relative">
                    <BookingSidebar
                      child_price={tour.tour.child_price || 0}
                      infant_price={tour.tour.infant_price || 0}
                      tourName={tour.tour.name}
                      basePrice={tour.tour.base_price}
                      schedules={tour.upcoming_schedules}
                    />
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        Hoàn Tiền 100%
                      </div>
                      <div className="text-sm text-gray-600">
                        Nếu hủy trước 7 ngày
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        Thanh Toán An Toàn
                      </div>
                      <div className="text-sm text-gray-600">
                        Bảo mật SSL 256-bit
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        Hỗ Trợ 24/7
                      </div>
                      <div className="text-sm text-gray-600">
                        Luôn sẵn sàng hỗ trợ bạn
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Mobile Booking Bar with Enhanced Design */}
      <div className="lg:hidden">
        <MobileBookingBar
          basePrice={tour.tour.base_price}
          tourName={tour.tour.name}
        />
      </div>
    </div>
  );
}

// ===========================
// OPTIONAL: REVALIDATION
// ===========================
export const revalidate = 3600; // Revalidate every hour
