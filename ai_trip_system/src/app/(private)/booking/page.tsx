/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  User,
  Users,
  Baby,
  Calendar,
  MapPin,
  Phone,
  CreditCard,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Star,
  Loader2,
  AlertTriangle,
  MapPinned,
} from "lucide-react";;
import { useSearchParams } from "next/navigation";
import { BookingSteps } from "@/components/booking/StepsSection";
import CouponSection from "@/components/booking/CouponSection";
import { bookingService } from "@/services/bookings/booking.service";
import Toast from "@/components/Toast";
import { useTranslation } from "@/lib/i18n/hooks";
import LocationSearchModal from "@/components/search/LocationSearchModal";
// ─── Types ───────────────────────────────────────────────
type Guest = { name: string; gender: string; dob: string; idCard?: string; dobError?: string };
type GuestsState = { adults: Guest[]; children: Guest[] };
type Contact = {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
};
interface Tour {
  id: string;
  name: string;
  location: string;
  duration: string;
  date: string;
  rating: number;
  reviews: number;
  priceAdult: number;
  priceChild: number;
  images: string[];
  category_id: string | null;
}

const GENDER_OPTIONS = [
  { value: "", label: "Giới tính *" },
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" },
] as const;

const PAYMENT_METHODS = [
  { id: "vnpay", name: "VNPay", icon: "💳", desc: "Thanh toán qua VNPay" },
  { id: "momo", name: "MoMo", icon: "📱", desc: "Ví điện tử MoMo" },
  {
    id: "bank",
    name: "Chuyển khoản",
    icon: "🏦",
    desc: "Chuyển khoản ngân hàng",
  },
] as const;

// ─── Utils ───
const formatPrice = (price: number) =>
  (price?.toLocaleString("vi-VN") || 0) + " ₫";

const decodeBooking = (encoded: string | null) => {
  if (!encoded) return null;
  try {
    // Handle space instead of + (common when decoding URL params)
    const base64 = encoded.replace(/ /g, "+");
    const jsonStr = decodeURIComponent(atob(base64));
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Failed to decode booking info:", error);
    return null;
  }
};

// ─── Main Component ────
export default function BookingPage() {
  const { t: tBooking } = useTranslation("booking");
  const searchParams = useSearchParams();
  const booking = useMemo(
    () => decodeBooking(searchParams.get("bookingInfo")),
    [searchParams],
  );


  // Toast state
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: "success" | "error" | "info" }>({ visible: false, message: "", type: "success" });
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 5000);
  };


  // State Submit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Lấy userId luôn cập nhật từ localStorage
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserId(localStorage.getItem("current_user_id"));
    }
  }, []);

  if (!booking) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50 text-gray-600 text-lg font-medium">
        Không tìm thấy thông tin đặt tour
      </div>
    );
  }

  const initialCounts = useMemo(
    () => ({
      adults: Number(booking.adult) || 1,
      children: Number(booking.child) || 0,
      infants: Number(booking.infant) || 0,
    }),
    [booking],
  );

  const [counts, setCounts] = useState(initialCounts);
  const [guests, setGuests] = useState<GuestsState>({
    adults: [],
    children: [],
  });
  const [contact, setContact] = useState<Contact>({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [expanded, setExpanded] = useState({
    tour: true,
    guests: true,
    contact: true,
    payment: false,
  });

  // Sync guests khi counts thay đổi — chỉ chạy khi adults/children thay đổi
  useEffect(() => {
    setGuests((prev) => ({
      adults: Array.from(
        { length: counts.adults },
        (_, i) =>
          prev.adults[i] ?? { name: "", gender: "", dob: "", idCard: "" },
      ),
      children: Array.from(
        { length: counts.children },
        (_, i) => prev.children[i] ?? { name: "", gender: "", dob: "" },
      ),
    }));
  }, [counts.adults, counts.children]);

  const tour = useMemo<Tour>(() => {
    const t = booking.tourInfoOverview ?? {};
    return {
      id: t.tour?.id || "",
      category_id: t.tour?.category_id || null,
      name: t.tour?.name || "Tour chưa xác định",
      location: t.tour?.name || "Việt Nam",
      duration: t.tour
        ? `${t.tour.duration_days}N${t.tour.duration_nights}Đ`
        : "—",
      date: booking.SelectedSchedule?.start_date || "",
      rating: t.tour?.rating ?? 4.8,
      reviews: t.tour?.review_count ?? 120,
      priceAdult: t.tour?.base_price ?? 0,
      priceChild: t.tour?.child_price ?? 0,
      images: t.images?.map((img: any) => img.image_url).filter(Boolean) || [
        "🏝️",
      ],
    };
  }, [booking]);

  // State cho discount và couponCode
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");

  // Tính tổng giá sau khi áp dụng discount
  const totalPrice = useMemo(() => {
    const base =
      counts.adults * tour.priceAdult +
      counts.children * tour.priceChild +
      counts.infants * Math.round(tour.priceChild * 0.5);
    return Math.max(0, base - discount);
  }, [
    counts.adults,
    counts.children,
    counts.infants,
    tour.priceAdult,
    tour.priceChild,
    discount,
  ]);

  const toggleSection = useCallback((key: keyof typeof expanded) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const updateGuestField = useCallback(
    (
      type: "adults" | "children",
      index: number,
      field: keyof Guest,
      value: string,
    ) => {
      setGuests((prev) => ({
        ...prev,
        [type]: prev[type].map((g, i) =>
          i === index ? { ...g, [field]: value } : g,
        ),
      }));
    },
    [],
  );

  // Hàm xử lý xác nhận đặt chỗ
  const handleConfirmBooking = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Validate thông tin
      if (!contact.name || !contact.email || !contact.phone) {
        throw new Error(tBooking("errors.incompleteContact"));
      }
      if (!paymentMethod) {
        throw new Error(tBooking("errors.noPaymentMethod"));
      }
      if (
        guests.adults.length !== counts.adults ||
        guests.children.length !== counts.children
      ) {
        throw new Error(tBooking("errors.incompleteGuests"));
      }
      // Chuẩn bị danh sách participants
      const participants = [];
      // Người lớn
      guests.adults.forEach((g: any) => {
        participants.push({
          full_name: g.name,
          participant_type: "ADULT",
          gender:
            g.gender === "male"
              ? "MALE"
              : g.gender === "female"
                ? "FEMALE"
                : "OTHER",
          date_of_birth: g.dob,
          id_number: g.idCard || undefined,
        });
      });
      // Trẻ em
      guests.children.forEach((g: any) => {
        participants.push({
          full_name: g.name,
          participant_type: "CHILD",
          gender:
            g.gender === "male"
              ? "MALE"
              : g.gender === "female"
                ? "FEMALE"
                : "OTHER",
          date_of_birth: g.dob,
        });
      });
      // Em bé
      if (counts.infants > 0) {
        for (let i = 0; i < counts.infants; i++) {
          participants.push({
            full_name: "",
            participant_type: "INFANT",
            gender: "OTHER",
            date_of_birth: "",
          });
        }
      }

      if (!userId) {
        throw new Error(
          tBooking("errors.userNotFound"),
        );
      }
      const payload1 = {
        tour_id: Number(tour.id),
        schedule_id: booking.SelectedSchedule.schedule_id || undefined,
        user_id: userId,
        contact_name: contact.name,
        contact_phone: contact.phone,
        contact_email: contact.email,
        adult_quantity: counts.adults,
        child_quantity: counts.children,
        infant_quantity: counts.infants,
        special_requests: contact.notes || undefined,
        coupon_code: appliedCoupon || undefined,
        discount_amount: appliedCoupon ? undefined : (discount > 0 ? discount : undefined),
        amenities: [],
        participants,
        payment_method: paymentMethod.toUpperCase(), // BE yêu cầu IN HOA (VNPAY, MOMO, BANK)
      };


      // In log payload để kiểm tra
      console.log("Payload gửi lên API1:", payload1);
      let result: any = null;

      // Gọi API tạo booking
      try {
        console.log("Gửi payload đến API tạo booking:", payload1);
        result = await bookingService.createBooking(payload1);
        console.log("Kết quả từ API tạo booking:", result);
        console.log("Booking created:", result);
      } catch (apiError: any) {
        console.error("Lỗi từ API tạo booking:", apiError);
        showToast(apiError.message || tBooking("errors.bookingFailed"), "error");
        throw new Error(
          apiError.message ||
          tBooking("errors.bookingFailed"),
        );

      }

      // Nếu cần thanh toán qua cổng (VNPay/MoMo)
      if (paymentMethod !== "bank") {
        console.log("Payment method:", paymentMethod);
        if (paymentMethod === "vnpay") {
          // Gọi API tạo payment URL VNPay
          try {
            const formData = new FormData();
            formData.append("amount", String(result.total_price || totalPrice || 10000));
            formData.append("order_desc", `Thanh toán đơn tour #${result.order_code}`);

            console.log("Khởi tạo thanh toán VNPay:", Object.fromEntries(formData.entries()));

            const res = await fetch("/api/vnpay/create-payment-url", {
              method: "POST",
              body: formData,
            });
            const url = await res.text();
            if (url.startsWith("http")) {
              window.location.href = url;
              return;
            } else {
              showToast("Không tạo được link thanh toán VNPay!", "error");
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (e) {
            showToast(tBooking("errors.vnpayError"), "error");
          }
        } else if (paymentMethod === "momo") {
          // Gọi API tạo payment URL MoMo (local API) giống VNPay
          try {
            console.log("Khởi tạo thanh toán MoMo cho đơn hàng:", result.order_code);
            const formData = new FormData();
            formData.append("amount", String(result.total_price || totalPrice || 10000));
            formData.append("order_id", result.order_code); // Dùng order_code để callback dễ xử lý
            formData.append("order_info", `Thanh toán đơn tour #${result.order_code}`);


            console.log("Dữ liệu gửi MoMo:", Object.fromEntries(formData.entries()));

            const res = await fetch("/api/momo/create-payment-url", {
              method: "POST",
              body: formData,
            });

            const url = await res.text();
            if (url.startsWith("http")) {
              window.location.href = url;
              return;
            } else {
              const errorData = JSON.parse(url);
              showToast(errorData.error || "Không tạo được link thanh toán MoMo!", "error");
            }
          } catch (e: any) {
            console.error("MoMo payment error:", e);
            showToast(tBooking("errors.momoError"), "error");
          }
        }
      }


      // Thành công
      showToast(
        "Đặt chỗ thành công! Cảm ơn bạn đã tin tưởng TravelVN. Chúng tôi sẽ liên hệ bạn sớm.",
        "success",
      );
      // router.push('/booking/success?bookingId=' + result.bookingId);
    } catch (err: any) {
      setSubmitError(err.message || "Có lỗi xảy ra khi xác nhận đặt chỗ");
      console.error("Booking error:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    tour.id,
    booking.SelectedSchedule?.schedule_id,
    userId,
    counts,
    guests,
    contact,
    paymentMethod,
    appliedCoupon,
    discount,
    totalPrice
  ]);

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="h-32" /> {/* spacer thay vì mt-32 */}
        <BookingSteps />
        <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <div className="grid lg:grid-cols-12 gap-6 xl:gap-8">
            <section className="lg:col-span-8 space-y-6">
              <TourSection
                expanded={expanded.tour}
                toggle={() => toggleSection("tour")}
                tour={tour}
              />
              <GuestsSection
                expanded={expanded.guests}
                toggle={() => toggleSection("guests")}
                counts={counts}
                setCounts={setCounts}
                guests={guests}
                updateGuest={updateGuestField}
                tour={tour}
              />
              <ContactSection
                expanded={expanded.contact}
                toggle={() => toggleSection("contact")}
                contact={contact}
                setContact={setContact}
              />
              <PaymentSection
                expanded={expanded.payment}
                toggle={() => toggleSection("payment")}
                method={paymentMethod}
                setMethod={setPaymentMethod}
              />
            </section>

            <aside className="lg:col-span-4 lg:sticky lg:top-6 space-y-6 lg:h-fit">
              <SummaryCard
                tour={tour}
                counts={counts}
                total={totalPrice}
                onSubmit={handleConfirmBooking}
                discount={discount}
                couponCode={appliedCoupon}
                isSubmitting={isSubmitting}
                submitError={submitError}
              />
              <CouponSection
                onApplyCoupon={(discountValue, code) => {
                  setDiscount(discountValue);
                  setAppliedCoupon(code);
                }}
                currentTotal={
                  // Truyền tổng giá gốc để tính discount, không truyền giá đã giảm
                  counts.adults * tour.priceAdult +
                  counts.children * tour.priceChild +
                  counts.infants * Math.round(tour.priceChild * 0.5)
                }
                userId={userId ? Number(userId) : undefined}
                tourId={tour.id}
                categoryId={tour.category_id ?? undefined}
              />
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}

// ─── Sub-Components ──────────────────────────────────────

type CollapsibleProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  expanded: boolean;
  toggle: () => void;
  children: React.ReactNode;
};

function CollapsibleSection({
  title,
  subtitle,
  icon,
  color,
  expanded,
  toggle,
  children,
}: CollapsibleProps) {
  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100/80 overflow-hidden transition-all">
      <button
        onClick={toggle}
        className="w-full px-5 sm:px-6 py-5 flex items-center justify-between hover:bg-gray-50/60 active:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shrink-0`}
          >
            {icon}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">{title}</h2>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
              {subtitle}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
      </button>

      <div
        className={`transition-all duration-300 ease-out ${expanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-5 sm:px-6 pb-6 pt-1">{children}</div>
      </div>
    </div>
  );
}

function TourSection({
  expanded,
  toggle,
  tour,
}: {
  expanded: boolean;
  toggle: () => void;
  tour: Tour;
}) {
  const { t: tBooking } = useTranslation("booking");
  const [slide, setSlide] = useState(0);

  return (
    <CollapsibleSection
      title={tBooking("tourInfo.title")}
      subtitle={tour.name}
      icon={<MapPin className="text-blue-600" size={22} />}
      color="bg-blue-100"
      expanded={expanded}
      toggle={toggle}
    >
      <div className="relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[16/9] bg-slate-100 group shadow-inner">
        <div
          className="flex h-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${slide * 100}%)` }}
        >
          {tour.images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Tour slide ${i + 1}`}
              className="min-w-full h-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
              onError={(e) => (e.currentTarget.src = "https://res.cloudinary.com/dehehzz2t/image/upload/v1754380108/z6875846732207_42d1b4240a1cb3a27f03f8ccf4b45030_ap9iai.jpg")}
            />
          ))}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        <div className="absolute bottom-4 left-4 px-3.5 py-1.5 bg-black/65 backdrop-blur-md rounded-full text-white text-sm font-medium flex items-center gap-1.5 shadow-lg">
          <MapPin size={15} />
          {tour.location}
        </div>

        {tour.images.length > 1 && (
          <>
            <button
              onClick={() =>
                setSlide(
                  (p) => (p - 1 + tour.images.length) % tour.images.length,
                )
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur shadow-xl flex items-center justify-center hover:bg-white">
                <ChevronUp
                  className="rotate-[-90deg] text-gray-800"
                  size={22}
                />
              </div>
            </button>
            <button
              onClick={() => setSlide((p) => (p + 1) % tour.images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur shadow-xl flex items-center justify-center hover:bg-white">
                <ChevronUp className="rotate-90 text-gray-800" size={22} />
              </div>
            </button>

            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2.5">
              {tour.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${i === slide
                    ? "bg-white scale-125 shadow-md"
                    : "bg-white/60 hover:bg-white"
                    }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-6 grid sm:grid-cols-3 gap-5 text-sm">
        <div>
          <p className="text-gray-500">Thời lượng</p>
          <p className="font-semibold text-gray-800">{tour.duration}</p>
        </div>
        <div>
          <p className="text-gray-500">Khởi hành</p>
          <p className="font-semibold text-gray-800">
            {tour.date
              ? new Date(tour.date).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Đánh giá</p>
          <p className="font-semibold flex items-center gap-1.5">
            {tour.rating}{" "}
            <Star size={16} className="text-amber-500 fill-amber-500" />
            <span className="text-gray-400 text-xs">({tour.reviews})</span>
          </p>
        </div>
      </div>
    </CollapsibleSection>
  );
}

function GuestsSection({
  expanded,
  toggle,
  counts,
  setCounts,
  guests,
  updateGuest,
  tour,
}: any) {
  const { t: tBooking } = useTranslation("booking");
  const updateCount = (type: keyof typeof counts, delta: number) => {
    setCounts((prev: any) => ({
      ...prev,
      [type]: Math.max(type === "adults" ? 1 : 0, prev[type] + delta),
    }));
  };

  return (
    <CollapsibleSection
      title={tBooking("guests.title")}
      subtitle={`${counts.adults} người lớn • ${counts.children} trẻ em • ${counts.infants} em bé`}
      icon={<Users className="text-orange-600" size={22} />}
      color="bg-orange-100"
      expanded={expanded}
      toggle={toggle}
    >
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Người lớn",
            icon: User,
            color: "blue",
            key: "adults",
            price: tour.priceAdult,
          },
          {
            label: "Trẻ em",
            icon: Baby,
            color: "pink",
            key: "children",
            price: tour.priceChild,
          },
          {
            label: "Em bé",
            icon: Baby,
            color: "purple",
            key: "infants",
            price: Math.round(tour.priceChild * 0.5),
          },
        ].map(({ label, icon: Icon, color, key, price }) => (
          <div
            key={key}
            className="border border-gray-200 rounded-xl p-4 bg-gray-50/40"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <Icon className={`text-${color}-600`} size={20} />
                <span className="font-medium">{label}</span>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {formatPrice(price)} / người
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateCount(key as any, -1)}
                className={`w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-lg font-bold hover:border-${color}-500 hover:text-${color}-600 transition-colors ${counts[key as keyof typeof counts] <= (key === "adults" ? 1 : 0) ? "opacity-40 cursor-not-allowed" : ""}`}
                disabled={
                  counts[key as keyof typeof counts] <=
                  (key === "adults" ? 1 : 0)
                }
              >
                -
              </button>
              <span className="w-10 text-center text-xl font-bold">
                {counts[key as keyof typeof counts]}
              </span>
              <button
                onClick={() => updateCount(key as any, 1)}
                className={`w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-lg font-bold hover:border-${color}-500 hover:text-${color}-600 transition-colors`}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Important Notice */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
        <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
        <div className="text-sm">
          <p className="font-medium text-blue-800 mb-1">Thông tin hành khách</p>
          <p className="text-blue-700">
            Vui lòng nhập <strong>đầy đủ và chính xác</strong> thông tin của tất cả hành khách theo giấy tờ tùy thân.
            Thông tin này sẽ được sử dụng để đặt vé, làm thủ tục và liên hệ khi cần thiết.
          </p>
        </div>
      </div>

      {/* Adult forms */}
      {counts.adults > 0 && (
        <div className="mb-8">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <User className="text-blue-600" size={20} /> Người lớn
            <span className="text-xs font-normal text-gray-500">(từ 18 tuổi trở lên)</span>
          </h3>
          <div className="space-y-4">
            {guests.adults.map((g: Guest, i: number) => (
              <GuestForm
                key={i}
                index={i}
                guest={g}
                type="adults"
                update={updateGuest}
              />
            ))}
          </div>
        </div>
      )}

      {/* Children forms */}
      {counts.children > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Baby className="text-pink-600" size={20} /> Trẻ em
            <span className="text-xs font-normal text-gray-500">(từ 2-12 tuổi)</span>
          </h3>
          <div className="space-y-4">
            {guests.children.map((g: Guest, i: number) => (
              <GuestForm
                key={i}
                index={i}
                guest={g}
                type="children"
                update={updateGuest}
                isChild
              />
            ))}
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
}

function GuestForm({ index, guest, type, update, isChild = false }: any) {
  const bg = isChild ? "bg-pink-50/60" : "bg-gray-50/60";
  const border = isChild ? "border-pink-200" : "border-gray-200";
  const focus = isChild ? "focus:ring-pink-400" : "focus:ring-blue-400";

  // Calculate age constraints
  const today = new Date();

  // For adults: must be at least 18 years old (born before today - 18 years)
  // For children: must be between 2-12 years old
  const getMaxDate = () => {
    const date = new Date();
    if (isChild) {
      // Children: at least 2 years old -> max date is today - 2 years
      date.setFullYear(date.getFullYear() - 2);
    } else {
      // Adults: at least 18 years old -> max date is today - 18 years
      date.setFullYear(date.getFullYear() - 18);
    }
    return date.toISOString().split('T')[0];
  };

  const getMinDate = () => {
    const date = new Date();
    if (isChild) {
      // Children: max 12 years old -> min date is today - 12 years
      date.setFullYear(date.getFullYear() - 12);
    } else {
      // Adults: no upper age limit, but let's set 100 years as max
      date.setFullYear(date.getFullYear() - 100);
    }
    return date.toISOString().split('T')[0];
  };

  // Validate date of birth
  const validateDob = (dob: string) => {
    if (!dob) return "";

    const birthDate = new Date(dob);
    const age = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    if (isChild) {
      if (age < 2) return "Trẻ em phải từ 2 tuổi trở lên";
      if (age > 12) return "Trẻ em phải từ 2-12 tuổi";
    } else {
      if (age < 18) return "Người lớn phải từ 18 tuổi trở lên";
    }
    return "";
  };

  const handleDobChange = (value: string) => {
    const error = validateDob(value);
    update(type, index, "dob", value);
    update(type, index, "dobError", error);
  };

  const dobError = guest.dobError || validateDob(guest.dob);
  const hasError = !!dobError && guest.dob;

  return (
    <div className={`border ${hasError ? 'border-red-300' : border} rounded-xl p-5 ${bg}`}>
      <div className="flex items-center justify-between mb-3.5">
        <p className="font-medium text-gray-700">
          {isChild ? "Trẻ em" : "Người lớn"} #{index + 1}
        </p>
        {isChild ? (
          <span className="text-xs text-pink-600 bg-pink-100 px-2 py-1 rounded-full">2-12 tuổi</span>
        ) : (
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">≥18 tuổi</span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <input
          type="text"
          placeholder="Họ và tên *"
          defaultValue={guest.name}
          onChange={(e) => update(type, index, "name", e.target.value)}
          className={`px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 ${focus} focus:border-transparent outline-none transition-all text-sm`}
        />
        <select
          defaultValue={guest.gender}
          onChange={(e) => update(type, index, "gender", e.target.value)}
          className={`px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 ${focus} focus:border-transparent outline-none transition-all text-sm bg-white`}
        >
          {GENDER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="relative">
          <input
            type="date"
            defaultValue={guest.dob}
            onChange={(e) => handleDobChange(e.target.value)}
            min={getMinDate()}
            max={getMaxDate()}
            className={`w-full px-4 py-2.5 border ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-2 ${hasError ? 'focus:ring-red-400' : focus} focus:border-transparent outline-none transition-all text-sm`}
          />
          {hasError && (
            <div className="absolute -bottom-5 left-0 text-xs text-red-500 flex items-center gap-1">
              <AlertTriangle size={12} /> {dobError}
            </div>
          )}
        </div>
        {!isChild && (
          <input
            type="text"
            placeholder="CMND/CCCD *"
            defaultValue={guest.idCard}
            onChange={(e) => update(type, index, "idCard", e.target.value)}
            className={`px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 ${focus} focus:border-transparent outline-none transition-all text-sm`}
          />
        )}
      </div>
      {hasError && <div className="h-4" />} {/* Spacer for error message */}
    </div>
  );
}

function ContactSection({ expanded, toggle, contact, setContact }: any) {
  const { t: tBooking } = useTranslation("booking");
  const [showMapPicker, setShowMapPicker] = useState(false);

  const update = (field: keyof Contact, value: string) =>
    setContact((p: Contact) => ({ ...p, [field]: value }));

  return (
    <CollapsibleSection
      title={tBooking("contact.title")}
      subtitle="Dùng để nhận xác nhận và thông báo"
      icon={<Phone className="text-green-600" size={22} />}
      color="bg-green-100"
      expanded={expanded}
      toggle={toggle}
    >
      {/* Important Notice */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
        <div className="text-sm">
          <p className="font-medium text-amber-800 mb-1">Lưu ý quan trọng</p>
          <p className="text-amber-700">
            Vui lòng nhập thông tin <strong>chính xác</strong> để chúng tôi có thể liên hệ xác nhận đơn hàng,
            gửi email hóa đơn và thông báo các cập nhật quan trọng về chuyến đi của bạn.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={contact.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Nguyễn Văn A"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={contact.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="example@gmail.com"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all"
          />
          <p className="text-xs text-gray-500 mt-1">Hóa đơn và xác nhận sẽ được gửi qua email này</p>
        </div>

        {/* Phone Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Số điện thoại <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={contact.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="090xxxxxxx"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all"
          />
          <p className="text-xs text-gray-500 mt-1">Dùng để liên hệ khi cần thiết</p>
        </div>

        {/* Address Field with Map Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Địa chỉ
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={contact.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Quận 1, TP.HCM"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowMapPicker(true)}
              className="px-3 py-2.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg border border-green-200 transition-colors flex items-center gap-2"
              title="Chọn trên bản đồ"
            >
              <MapPinned size={18} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Hoặc chọn vị trí trên bản đồ</p>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Ghi chú / Yêu cầu đặc biệt
        </label>
        <textarea
          value={contact.notes}
          onChange={(e) => update("notes", e.target.value)}
          rows={3}
          placeholder="Ví dụ: cần chỗ ngồi gần cửa sổ, ăn chay, trẻ em cần ghế..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all resize-none"
        />
      </div>

      {/* Location Picker Modal */}
      <LocationSearchModal
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        showFilters={false}
        initialLocation={contact.address ? { lat: 0, lng: 0, address: contact.address } : null}
        onSelectLocation={(loc) => {
          update("address", loc.address);
          setShowMapPicker(false);
        }}
      />
    </CollapsibleSection>
  );
}

function PaymentSection({ expanded, toggle, method, setMethod }: any) {
  const [showTestCards, setShowTestCards] = useState(false);

  return (
    <CollapsibleSection
      title="Phương thức thanh toán"
      subtitle="Chọn hình thức phù hợp nhất"
      icon={<CreditCard className="text-purple-600" size={22} />}
      color="bg-purple-100"
      expanded={expanded}
      toggle={toggle}
    >
      <div className="space-y-3 mt-3">
        {PAYMENT_METHODS.map((m) => (
          <div
            key={m.id}
            onClick={() => setMethod(m.id)}
            className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-4 ${method === m.id
              ? "border-purple-500 bg-purple-50/60 shadow-sm"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === m.id ? "border-purple-600" : "border-gray-400"
                }`}
            >
              {method === m.id && (
                <div className="w-3 h-3 rounded-full bg-purple-600" />
              )}
            </div>
            <span className="text-3xl">{m.icon}</span>
            <div>
              <p className="font-semibold text-gray-900">{m.name}</p>
              <p className="text-sm text-gray-500">{m.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Test Card Information */}
      {method === "vnpay" && (
        <div className="mt-6">
          <button
            onClick={() => setShowTestCards(!showTestCards)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <Info size={16} />
            {showTestCards ? "Ẩn thông tin thẻ test" : "Xem thông tin thẻ test (Sandbox)"}
            {showTestCards ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showTestCards && (
            <div className="mt-4 space-y-4">
              {/* Card 1 - Success */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <span className="font-semibold text-green-800">Thẻ thanh toán thành công</span>
                  <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Success</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Ngân hàng:</span>
                    <span className="ml-2 font-mono font-medium text-gray-800">NCB</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Số thẻ:</span>
                    <span className="ml-2 font-mono font-medium text-blue-600 select-all">9704198526191432198</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tên chủ thẻ:</span>
                    <span className="ml-2 font-mono font-medium text-gray-800">NGUYEN VAN A</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Ngày phát hành:</span>
                    <span className="ml-2 font-mono font-medium text-gray-800">07/15</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Mật khẩu OTP:</span>
                    <span className="ml-2 font-mono font-bold text-orange-600">123456</span>
                  </div>
                </div>
              </div>

              {/* Card 2 - Insufficient Balance */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <span className="font-semibold text-red-800">Thẻ không đủ số dư</span>
                  <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">Failed</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Ngân hàng:</span>
                    <span className="ml-2 font-mono font-medium text-gray-800">NCB</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Số thẻ:</span>
                    <span className="ml-2 font-mono font-medium text-blue-600 select-all">9704195798459170488</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tên chủ thẻ:</span>
                    <span className="ml-2 font-mono font-medium text-gray-800">NGUYEN VAN A</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Ngày phát hành:</span>
                    <span className="ml-2 font-mono font-medium text-gray-800">07/15</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 italic flex items-start gap-1.5">
                <Info size={14} className="shrink-0 mt-0.5" />
                Đây là thông tin thẻ test cho môi trường Sandbox VNPay. Không sử dụng cho giao dịch thực tế.
              </p>
            </div>
          )}
        </div>
      )}
    </CollapsibleSection>
  );
}

function SummaryCard({
  tour,
  counts,
  total,
  onSubmit,
  discount,
  isSubmitting,
  submitError,
}: any) {
  // Tính giá gốc trước khi giảm
  const originalTotal =
    tour.priceAdult * counts.adults +
    tour.priceChild * counts.children +
    Math.round(tour.priceChild * 0.5) * counts.infants;
  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100/80 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-5">
        <h3 className="text-xl font-bold">Tóm tắt thanh toán</h3>
        <p className="text-blue-100/90 text-sm mt-1">
          Chi tiết giá và thông tin đặt chỗ
        </p>
      </div>

      <div className="p-6 space-y-5">
        <div className="pb-5 border-b border-gray-100">
          <p className="font-semibold text-lg text-gray-900">{tour.name}</p>
          <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-600">
            <MapPin size={15} />
            {tour.location}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
            <Calendar size={15} />
            {tour.date ? new Date(tour.date).toLocaleDateString("vi-VN") : "—"}
          </div>
        </div>

        <div className="space-y-2.5 pb-5 border-b border-gray-100 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Người lớn × {counts.adults}</span>
            <span className="font-medium">
              {formatPrice(tour.priceAdult * counts.adults)}
            </span>
          </div>
          {counts.children > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Trẻ em × {counts.children}</span>
              <span className="font-medium">
                {formatPrice(tour.priceChild * counts.children)}
              </span>
            </div>
          )}
          {counts.infants > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Em bé × {counts.infants}</span>
              <span className="font-medium">
                {formatPrice(
                  Math.round(tour.priceChild * 0.5) * counts.infants,
                )}
              </span>
            </div>
          )}
          {/* Giá gốc trước khi giảm */}
          {discount !== 0 && (
            <div className="flex justify-between pt-2">
              <span className="text-gray-500">Giá gốc</span>

              <span
                className={`font-medium text-gray-700 ${discount !== 0 ? "line-through" : ""}`}
              >
                {formatPrice(originalTotal)}
              </span>
            </div>
          )}
          {/* Discount */}
          <div className="flex justify-between text-green-600 font-medium pt-2">
            <span>Khuyến mãi</span>
            <span>{formatPrice(discount)}</span>
          </div>
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xl font-bold text-gray-900">Tổng cộng</span>
            <span className="text-3xl font-bold text-blue-700">
              {formatPrice(total)}
            </span>
          </div>

          {/* Error message */}
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {submitError}
            </div>
          )}

          {/* Button submit */}
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className={`
            w-full py-4 rounded-xl font-semibold text-lg shadow-lg transition-all flex items-center justify-center gap-2.5
            ${isSubmitting
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-xl active:scale-[0.98]"
              }
          `}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={22} />
                Đang xử lý...
              </>
            ) : (
              <>
                <Check size={22} />
                Xác nhận & Thanh toán
              </>
            )}
          </button>

          <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-gray-700 flex items-start gap-2.5">
            <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
            <p>
              Bằng việc tiếp tục, bạn đồng ý với{" "}
              <span className="text-blue-700 underline cursor-pointer">
                Điều khoản dịch vụ
              </span>{" "}
              và{" "}
              <span className="text-blue-700 underline cursor-pointer">
                Chính sách bảo mật
              </span>{" "}
              của chúng tôi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
