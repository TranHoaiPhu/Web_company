"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
import useSWR, { mutate } from "swr";
import { toast, ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaChevronLeft, FaPalette, FaLanguage } from "react-icons/fa";
import { useTranslation } from "@/lib/i18n/hooks";

interface UserResponse {
  iduser: string;
  name: string;
  username: string;
  email: string;
  phonenumber?: string;
  gender: number;
  avatar?: string;
  theme: number;
  language: number;
}

export default function SettingsPage() {
  const { t } = useTranslation("profile");
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    theme: 0,
    language: 0,
  });

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
    `https://aitripsystem-api.onrender.com/api/v1/users/idUser?lookup=${currentUserID}`,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  useEffect(() => {
    if (userData) {
      setSettings({
        theme: userData.theme,
        language: userData.language,
      });
    }
  }, [userData]);

  const handleBtnBack = () => {
    router.push("/home");
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const payload = {
        name: userData?.name,
        username: userData?.username,
        email: userData?.email,
        gender: userData?.gender,
        phonenumber: userData?.phonenumber,
        theme: settings.theme,
        language: settings.language,
      };

      const response = await fetch(
        `https://aitripsystem-api.onrender.com/api/v1/users/${currentUserID}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Failed to update settings");

      toast.success(t("settings.toast.saveSuccess"));

      await mutate(
        `https://aitripsystem-api.onrender.com/api/v1/users/idUser?lookup=${currentUserID}`
      );
    } catch (error) {
      console.error("Lỗi khi lưu cài đặt:", error);
      toast.error(t("settings.toast.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const themeOptions = [
    { label: t("settings.theme.light"), value: 0 },
    { label: t("settings.theme.dark"), value: 1 },
    { label: t("settings.theme.auto"), value: 2 },
  ];

  const languageOptions = [
    { label: "Tiếng Việt", value: 0 },
    { label: "English", value: 1 },
  ];

  if (userError) return <div>{t("settings.error")}: {userError.message}</div>;
  if (userLoading) return <div>{t("settings.loading")}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBtnBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">{t("settings.title")}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Appearance Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <FaPalette className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-medium">{t("settings.appearance")}</h2>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("settings.themeLabel")}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {themeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setSettings((prev) => ({
                            ...prev,
                            theme: option.value,
                          }))
                        }
                        className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                          settings.theme === option.value
                            ? "bg-blue-50 border-blue-500 text-blue-700"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Language Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <FaLanguage className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-medium">{t("settings.language")}</h2>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("settings.languageLabel")}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {languageOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setSettings((prev) => ({
                            ...prev,
                            language: option.value,
                          }))
                        }
                        className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                          settings.language === option.value
                            ? "bg-green-50 border-green-500 text-green-700"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className={`px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors ${
                isSaving ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSaving ? t("settings.saving") : t("settings.save")}
            </button>
          </div>
        </div>
      </div>

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
