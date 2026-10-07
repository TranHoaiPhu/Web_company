"use client";

import BookingCard from "./Card";
import React from "react";
import { useEffect, useCallback } from "react";
import { useState } from "react";
import { getCookie } from "cookies-next";
import Filter, { FilterOptions } from "./Filter";
import Loading from "@/components/Loading";
import useScrollReveal from "@/hooks/useScrollReveal";
import { useAuthCheck } from "@/hooks/useAuthCheck";

// Updated interface to match the API response
interface Booking {
  idplace: string;
  date: string;
  status: number;
  idbooking: string;
}

function BookingCardReveal({
  booking,
  index,
}: {
  booking: Booking;
  index: number;
}) {
  const [ref, isVisible] = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-transform duration-500 ease-in-out will-change-transform ${
        isVisible ? "animate-fadeInUp opacity-100" : "opacity-0 translate-y-8"
      }`}
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
    >
      <BookingCard
        idbooking={booking.idbooking}
        idplace={booking.idplace}
        date={booking.date}
        status={booking.status}
      />
    </div>
  );
}

// Hàm chuyển đổi định dạng ngày thành dd/mm/yyyy hh:mm:ss
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);

    // Kiểm tra nếu không phải date hợp lệ
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

export default function AllBookings() {
  const { user, loading } = useAuthCheck();
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const token = getCookie("token");

  const fetchBookings = useCallback(
    async (filters: FilterOptions) => {
      setIsLoading(true);

      try {
        let url = `https://aitripsystem-api.onrender.com/api/v1/users/${user?.userId}/bookings`;
        console.log(user?.userId);

        // Nếu có filter
        if (filters.select !== "all" && filters.lookup) {
          url = `https://aitripsystem-api.onrender.com/api/v1/bookings/${
            filters.select
          }?lookup=${encodeURIComponent(filters.lookup)}`;
          let lookup = filters.lookup;
          if (filters.select === "date") {
            lookup = formatDate(filters.lookup);
          }
          url = `https://aitripsystem-api.onrender.com/api/v1/bookings/${
            filters.select
          }?lookup=${encodeURIComponent(lookup)}`;
        }

        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          try {
            const errorJson = JSON.parse(errorText);
            console.error("Error details:", errorJson);
          } catch {
            // Not JSON
          }
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setBookings(data);
      } catch (err) {
        console.error("Error fetching bookings:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [token, user?.userId]
  );

  useEffect(() => {
    // Chỉ gọi khi user đã được load xong
    if (user && user.userId) {
      fetchBookings({ select: "all", lookup: "" });
    }
  }, [fetchBookings, user]); // Thêm user vào dependency array

  const handleFilterChange = (filters: FilterOptions) => {
    fetchBookings(filters);
  };

  return (
    <div className="space-y-4">
      <Filter onFilterChange={handleFilterChange} />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loading message="Đang xác thực người dùng..." />
        </div>
      ) : !user ? (
        <div className="bg-white p-6 rounded-lg text-gray-500 text-center border border-gray-200 shadow-sm">
          <p>Bạn cần đăng nhập để xem đặt chỗ</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loading message="Đang tải dữ liệu đặt chỗ..." />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white p-6 rounded-lg text-gray-500 text-center border border-gray-200 shadow-sm">
          <p>Không tìm thấy đặt chỗ nào</p>
        </div>
      ) : (
        <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
          {bookings.slice(0, 10).map((booking, index) => (
            <BookingCardReveal
              key={booking.idbooking}
              booking={booking}
              index={index}
            />
          ))}

          {bookings.length > 10 && (
            <div className="text-center py-3 text-sky-700 font-semibold bg-sky-50 rounded-lg border border-sky-100 shadow-sm">
              Hiển thị 10/{bookings.length} đặt chỗ.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
