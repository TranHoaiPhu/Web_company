"use client";

import {
  FaWifi,
  FaCoffee,
  FaConciergeBell,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaHourglass,
  FaTimes,
} from "react-icons/fa";
import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { getCookie } from "cookies-next";
import Loading from "@/components/Loading";
import Modal from "@/components/Modal";
import Toast from "@/components/Toast";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/hooks";

interface BookingCardProps {
  idbooking: string;
  idplace: number;
  status: number;
  date: string;
  placename?: string;
  placeimage?: string;
}

interface UserInfo {
  idUser: string;
  name: string;
  username: string;
  gender: boolean;
  email: string;
  phoneNumber?: string;
}

export default function BookingCard({
  idbooking,
  idplace,
  date,
  status,
}: {
  idbooking: string;
  idplace: string;
  date: string;
  status: number;
}) {
  const { t } = useTranslation("order");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const token = getCookie("token");
  const [data, setData] = useState<BookingCardProps | null>(null);
  const [isEditingBooking, setIsEditingBooking] = useState(false);
  const [editableBookingData, setEditableBookingData] =
    useState<BookingCardProps | null>(null);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error" | "info" | "warning",
  });

  const showToast = (
    message: string,
    type: "success" | "error" | "info" | "warning"
  ) => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const fetchUserInfo = async () => {
    setLoadingUser(true);
    try {
      const response = await fetch(`https://aitripsystem-api.onrender.com/api/v1/bookings/${idbooking}/users/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }

      const userData = await response.json();
      setUserInfo(
        Array.isArray(userData) && userData.length > 0 ? userData[0] : null
      );
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    setIsLoading(false);
    if (data) {
      setEditableBookingData(data);
      console.log('Booking data loaded:', data);
    }
  }, [data]);

  const handleViewUserInfo = () => {
    setShowUserModal(true);
    if (!userInfo && !loadingUser) {
      fetchUserInfo();
    }
  };

  const handleSaveBookingChanges = async () => {
    if (!editableBookingData) return;

    setIsLoading(true);
    try {
      const response = await fetch(`https://aitripsystem-api.onrender.com/api/v1/bookings/?idbooking=${idbooking}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          idplace: editableBookingData.idplace,
          date: editableBookingData.date,
          status: editableBookingData.status
        })
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }

      const updatedData = await response.json();
      setData(updatedData);
      setIsEditingBooking(false);
    } catch (error) {
      showToast(`${t("booking.toast.saveError")}: ${error}`, "error");
    } finally {
      setIsLoading(false);
      showToast(t("booking.toast.saveSuccess"), "success");
    }
  };

  // Format the date from ISO string to a more readable format
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePlaceClick = () => {
    router.push(`/place?idPlace=${idplace}`);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 w-full max-w-md mx-auto">
        <Loading message={t("booking.loading.bookingInfo")} />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md filter backdrop-blur-sm p-4 overflow-hidden w-full md:w-4/5 mx-auto">
      {/* Content section */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3
            className="font-semibold text-lg text-blue-700 cursor-pointer hover:text-blue-900 hover:underline"
            onClick={handlePlaceClick}
          >
            {/* Using idplace directly */}
            {`${t("booking.card.placeId")} #${idplace}`}
          </h3>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${status === 1
              ? "bg-green-100 text-green-800"
              : status === 0
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
              }`}
          >
            {status === 1 ? "CONFIRMED" : status === 0 ? "PENDING" : "CANCELED"}
          </span>
        </div>

        <div className="flex items-center text-gray-700 mb-1">
          <FaMapMarkerAlt className="mr-2 text-sky-600" />
          <span className="text-sm">{t("booking.card.placeId")}: {idplace}</span>
        </div>

        <div className="flex items-center text-gray-700 mb-1">
          <FaCalendarAlt className="mr-2 text-sky-600" />
          <span className="text-sm">{formatDate(date)}</span>
        </div>

        <div className="flex items-center text-gray-700 mb-4">
          <span className="text-sm font-medium mr-2">{t("booking.card.bookingCode")}:</span>
          <span className="text-sm font-bold">{idbooking}</span>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center px-3 py-1 bg-sky-50 text-sky-700 rounded-md border border-sky-200">
            <FaWifi className="mr-2" />
            <span className="text-xs font-medium">{t("booking.card.freeWifi")}</span>
          </div>
          <div className="flex items-center px-3 py-1 bg-sky-50 text-sky-700 rounded-md border border-sky-200">
            <FaCoffee className="mr-2" />
            <span className="text-xs font-medium">{t("booking.card.breakfast")}</span>
          </div>
          <div className="flex items-center px-3 py-1 bg-sky-50 text-sky-700 rounded-md border border-sky-200">
            <FaConciergeBell className="mr-2" />
            <span className="text-xs font-medium">{t("booking.card.roomService")}</span>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center">
          {status === 1 ? (
            <>
              <FaCheckCircle className="text-green-500 mr-2" />
              <span className="text-sm text-green-600">
                {t("booking.card.confirmed")}
              </span>
            </>
          ) : status === 0 ? (
            <>
              <FaHourglass className="text-yellow-500 mr-2" />
              <span className="text-sm text-yellow-600">{t("booking.card.pending")}</span>
            </>
          ) : (
            <>
              <FaTimes className="text-red-500 mr-2" />
              <span className="text-sm text-red-600">{t("booking.card.cancelled")}</span>
            </>
          )}
        </div>

        <div className="mt-4 pt-4 flex flex-wrap gap-2">
          <button
            className="w-full sm:w-auto flex-grow sm:flex-grow-0 px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition duration-200 text-sm font-medium"
            onClick={handleViewUserInfo}
          >
            {t("booking.card.viewUserInfo")}
          </button>
          <button
            className="w-full sm:w-auto flex-grow sm:flex-grow-0 px-5 py-2.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-200 text-sm font-medium"
            onClick={() => setIsEditingBooking(true)}
          >
            {t("booking.card.edit")}
          </button>
        </div>
      </div>

      {/* Modal thông tin người dùng */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title={t("booking.modal.userInfo")}
        size="md"
      >
        {loadingUser ? (
          <div className="flex justify-center p-4">
            <Loading message={t("booking.loading.userInfo")} />
          </div>
        ) : userInfo ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-6 mb-4">
              <p className="font-medium">
                {userInfo.name || t("booking.modal.noInfo")}
              </p>
              <p className="text-sm text-gray-500">
                {userInfo.username || t("booking.modal.noInfo")}
              </p>
              <p className="text-sm text-gray-500">
                {userInfo.gender ? t("booking.modal.male") : t("booking.modal.female")}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">{t("booking.modal.email")}</p>
              <p className="font-medium">
                {userInfo.email || t("booking.modal.noInfo")}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">{t("booking.modal.phone")}</p>
              <p className="font-medium">
                {userInfo.phoneNumber || t("booking.modal.noInfo")}
              </p>
            </div>

            <button
              className="mt-4 w-full py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition duration-200"
              onClick={() => setShowUserModal(false)}
            >
              {t("booking.modal.close")}
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600">{t("booking.modal.cannotLoadUser")}</p>
            <button
              className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition duration-200"
              onClick={fetchUserInfo}
            >
              {t("booking.modal.retry")}
            </button>
          </div>
        )}
      </Modal>

      {/* Modal chỉnh sửa booking */}
      <Modal
        isOpen={isEditingBooking}
        onClose={() => setIsEditingBooking(false)}
        title={t("booking.modal.editBooking")}
        size="md"
      >
        {!editableBookingData ? (
          <div className="flex justify-center p-4">
            <Loading message={t("booking.loading.general")} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">
                {t("booking.modal.bookingDate")}
              </label>
              <input
                type="datetime-local"
                value={
                  editableBookingData.date
                    ? new Date(editableBookingData.date)
                      .toISOString()
                      .slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  setEditableBookingData({
                    ...editableBookingData,
                    date: e.target.value,
                  })
                }
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">
                {t("booking.modal.placeId")}
              </label>
              <input
                type="text"
                value={editableBookingData.idplace}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setEditableBookingData({ ...editableBookingData, idplace: value });
                }}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="flex space-x-2 mt-4">
              <button
                className="flex-1 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition duration-200"
                onClick={handleSaveBookingChanges}
              >
                {t("booking.modal.saveChanges")}
              </button>
              <button
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition duration-200"
                onClick={() => {
                  setIsEditingBooking(false);
                  setEditableBookingData(data);
                }}
              >
                {t("booking.modal.cancel")}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={hideToast}
        duration={3000}
      />
    </div>
  );
}
