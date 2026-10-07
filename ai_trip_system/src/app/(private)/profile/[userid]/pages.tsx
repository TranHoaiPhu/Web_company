"use client";
import { FaChevronLeft, FaXmark, FaCamera } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, ChangeEvent } from "react";
import Image from "next/image";
import useSWR, { mutate } from "swr";
import { ToastContainer, Slide, toast } from "react-toastify";
import { getCookie } from "cookies-next";
import { use } from "react";
import { API_BASE_URL } from "@/config/api";
import {  UserBase, UserResponse } from "@/types/backend";
import { useTranslation } from "@/lib/i18n/hooks";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ userid: string }>;
}) {
  const { t } = useTranslation("profile");
  const [showEditModal, setShowEditModal] = useState(false);
  const [userEdit, setUserEdit] = useState<UserBase>();

  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [isFriendRequestSent, setIsFriendRequestSent] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const avatarFileRef = useRef<File | null>(null);
  const router = useRouter();

  const { userid: userID } = use(params);
  const accessToken = getCookie("token");
  const currentUserID = localStorage.getItem("current_user_id");

  useEffect(() => {
    if (!accessToken) {
      router.push("/login");
      return;
    }
  }, [accessToken, router]);

  const fetcher = (url: string) =>
    fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }).then((res) => res.json());

  const {
    data: userData,
    error: userError,
    isLoading: userLoading,
  } = useSWR<UserResponse>(
    `${API_BASE_URL}/users/idUser?lookup=${userID}`,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  const {
    data: friendsData,
    error: friendsError,
    isLoading: friendsLoading,
  } = useSWR<UserResponse[]>(
    `https://aitripsystem-api.onrender.com/api/v1/users/${userID}/friends`,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 3000,
    }
  );

  const {
    data: friendRequestData,
    error: friendRequestError,
    isLoading: friendRequestLoading,
  } = useSWR<UserResponse[]>(
    `https://aitripsystem-api.onrender.com/api/v1/users/${userID}/friend_requests_to`,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  useEffect(() => {
    if (friendRequestData && Array.isArray(friendRequestData)) {
      const requestExists = friendRequestData.some(
        (request) => request.iduser === currentUserID
      );
      setIsFriendRequestSent(requestExists);
    }
  }, [friendRequestData, currentUserID]);

  useEffect(() => {
    if (friendsData && Array.isArray(friendsData)) {
      const requestExists = friendsData.some(
        (request) => request.iduser === currentUserID
      );
      setIsFriend(requestExists);
    }
  }, [friendsData, currentUserID]);

  if (userError)
    return <div>Failed to load user data: {userError.message}</div>;
  if (userLoading) return <div>Loading...</div>;
  if (friendsError) return console.log(friendsError.message);
  if (friendsLoading) return console.log("Loading friend list...");
  if (friendRequestError) return console.log(friendsError.message);
  if (friendRequestLoading)
    return console.log("Loading friend request to list...");

  const friendsCount = friendsData?.length ?? 0;

  const genderOptions = [
    { label: t("gender.male"), value: 0 },
    { label: t("gender.female"), value: 1 },
    { label: t("gender.other"), value: 2 },
  ];

  const renderGender = () => {
    const gender = genderOptions.find(
      (option) => option.value === userData?.gender
    );
    return <span>{gender ? gender.label : t("gender.other")}</span>;
  };

  const handleBtnBack = () => {
    router.push("/home");
  };

  const openEditModal = () => {
    if (userData) {
      setUserEdit({ ...userData });
    }

    setPreviewAvatar(null);
    avatarFileRef.current = null;
    setShowEditModal(true);
  };

  const handleAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Check valid image
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    avatarFileRef.current = file;
    const previewUrl = URL.createObjectURL(file);
    setPreviewAvatar(previewUrl);
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserEdit((prev) => ({
      ...prev!,
      name: value,
    }));
  };

  const handleGenderChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    setUserEdit((prev) => ({
      ...prev!,
      gender: value,
    }));
  };

  const handlePhonenumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\+?\d*$/.test(value)) {
      setUserEdit((prev) => ({
        ...prev!,
        phonenumber: value,
      }));
    }
  };

  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setUserEdit((prev) => ({
      ...prev!,
      description: value,
    }));
  };

  const handleSaveBtn = async () => {
    setIsSaving(true);
    try {
      // Cập nhật avatar nếu có
      const fileUpdate = avatarFileRef.current;
      if (fileUpdate) {
        const formData = new FormData();
        formData.append("file", fileUpdate);

        const avatarRes = await fetch(
          `https://aitripsystem-api.onrender.com/api/v1/users/${userID}/avatar`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            body: formData,
          }
        );

        if (!avatarRes.ok) throw new Error("Failed to upload avatar");
      }

      // Cập nhật thông tin khác
      const payload = {
        name: userEdit?.name,
        gender: userEdit?.gender,
        phonenumber: userEdit?.phonenumber,
        description: userEdit?.description,
      };

      const infoRes = await fetch(
        `https://aitripsystem-api.onrender.com/api/v1/users/${userID}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!infoRes.ok) throw new Error("Failed to update user info.");
      toast.success(t("toast.updateSuccess"));

      await mutate(
        `https://aitripsystem-api.onrender.com/api/v1/users/idUser?lookup=${userID}`
      );
    } catch (error) {
      console.error("Lỗi khi lưu dữ liệu:", error);
    } finally {
      setIsSaving(false);
      setShowEditModal(false);
    }
  };

  const handleFriendRequestSent = async () => {
    setIsSending(true);
    try {
      if (isFriendRequestSent || isFriend) {
        const cancelRes = await fetch(
          `https://aitripsystem-api.onrender.com/api/v1/friends?id_self=${encodeURIComponent(
            currentUserID ?? ""
          )}&id_friend=${encodeURIComponent(userID ?? "")}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!cancelRes.ok) throw new Error("Failed to cancel friend request.");
        setIsFriend(false);
        setIsFriendRequestSent(false);
        await mutate(
          `https://aitripsystem-api.onrender.com/api/v1/users/${userID}/friend_requests_to`
        );
      } else {
        const payload = {
          idself: currentUserID,
          idfriend: userID,
        };

        const addFriendRes = await fetch(
          `https://aitripsystem-api.onrender.com/api/v1/friends/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(payload),
          }
        );

        if (!addFriendRes.ok) throw new Error("Failed to send friend request.");
        setIsFriendRequestSent(false);
        await mutate(
          `https://aitripsystem-api.onrender.com/api/v1/users/${userID}/friend_requests_to`
        );
      }
    } catch (error) {
      console.error("Lỗi khi gửi thông tin kết bạn:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBtnBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <FaChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold">
                {userData?.username || userData?.name}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-gray-200">
              <Image
                src={
                  userData?.avatar
                    ? `https://aitripsystem-api.onrender.com/api/v1/proxy_image/?url=${encodeURIComponent(
                        userData.avatar
                      )}`
                    : "/images/profile.svg"
                }
                priority={true}
                width={160}
                height={160}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <h2 className="text-2xl font-light">{userData?.name}</h2>
              <div className="flex gap-2 justify-center md:justify-start">
                {currentUserID == userID ? (
                  <button
                    onClick={openEditModal}
                    className="px-4 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {t("buttons.editProfile")}
                  </button>
                ) : (
                  <button
                    onClick={handleFriendRequestSent}
                    disabled={isSending}
                    className="px-4 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors cursor-pointer"
                  >
                    {isFriend
                      ? t("buttons.friends")
                      : isFriendRequestSent
                      ? t("buttons.cancelRequest")
                      : t("buttons.follow")}
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center md:justify-start gap-8 mb-4">
              <div className="text-center">
                <span className="font-semibold">{friendsCount}</span>
                <span className="text-gray-500 ml-1">{t("stats.friends")}</span>
              </div>
            </div>

            {/* Bio */}
            <div className="text-sm">
              <div className="font-semibold mb-1">{userData?.name}</div>
              {userData?.description && (
                <div className="text-gray-700 whitespace-pre-line">
                  {userData.description}
                </div>
              )}
              {userData?.phonenumber && (
                <div className="text-gray-500 mt-1">
                  📞 {userData.phonenumber}
                </div>
              )}
              <div className="text-gray-500 mt-1">👤 {renderGender()}</div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("editModal.title")}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaXmark className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-4 space-y-4">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                    <Image
                      src={
                        previewAvatar
                          ? previewAvatar
                          : userData?.avatar
                          ? `https://aitripsystem-api.onrender.com/api/v1/proxy_image/?url=${encodeURIComponent(
                              userData.avatar
                            )}`
                          : "/images/profile.svg"
                      }
                      width={96}
                      height={96}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label
                    htmlFor="avatarUpload"
                    className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors"
                  >
                    <FaCamera className="w-4 h-4 text-white" />
                  </label>
                  <input
                    id="avatarUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {t("editModal.changeAvatar")}
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("editModal.displayName")}
                </label>
                <input
                  type="text"
                  value={userEdit?.name ?? ""}
                  onChange={handleNameChange}
                  placeholder={t("editModal.namePlaceholder")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("editModal.gender")}
                </label>
                <select
                  value={userEdit?.gender ?? 2}
                  onChange={handleGenderChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("editModal.phone")}
                </label>
                <input
                  type="tel"
                  value={userEdit?.phonenumber ?? ""}
                  onChange={handlePhonenumberChange}
                  placeholder={t("editModal.phonePlaceholder")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("editModal.bio")}
                </label>
                <textarea
                  rows={4}
                  value={userEdit?.description ?? ""}
                  onChange={handleDescriptionChange}
                  placeholder={t("editModal.bioPlaceholder")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                {t("buttons.cancel")}
              </button>
              <button
                onClick={handleSaveBtn}
                disabled={isSaving}
                className={`flex-1 px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors ${
                  isSaving ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isSaving ? t("buttons.saving") : t("buttons.saveChanges")}
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Slide}
      />
    </div>
  );
}
