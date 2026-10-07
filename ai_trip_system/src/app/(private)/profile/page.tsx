"use client";

import { FaUser, FaLock, FaSignOutAlt, FaCamera, FaTimes, FaPhone, FaMapMarkerAlt, FaEnvelope, FaPen, FaShieldAlt, FaSuitcase, FaStar } from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, ChangeEvent, Suspense } from "react";
import Image from "next/image";
import useSWR, { mutate } from "swr";
import { ToastContainer, toast } from "react-toastify";
import { getCookie, deleteCookie } from "cookies-next";
import { BOOKING_API_URL } from "@/config/api";
import authService from "@/services/auth/auth.service";
import "./profile.css";
import MyTrips from "./MyTrips";
import MyReviews from "./MyReviews";
import MyFavorites from "./MyFavorites";
import LocationPicker from "@/components/LocationPicker";
import { FaHeart } from "react-icons/fa";
import { useTranslation } from "@/lib/i18n/hooks";

// Interface matching the API response
interface UserProfile {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    status: string;
    avatar_url: string | null;
    address: string | null;
    created_at: string;
    updated_at: string;
    user_id: string;
    role: number;
}

interface ProfileResponse {
    success: boolean;
    data: UserProfile;
}

export default function ProfilePage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        }>
            <ProfileContent />
        </Suspense>
    );
}

function ProfileContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const accessToken = getCookie("token");
    const { t } = useTranslation("profile");


    const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'security' | 'my-trips'
    const [tripType, setTripType] = useState<'upcoming' | 'history' | 'cancelled'>('upcoming');
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);

    // Edit Profile State
    const [userEdit, setUserEdit] = useState<Partial<UserProfile>>({});
    const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const avatarFileRef = useRef<File | null>(null);

    // Change Password State
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        if (!accessToken) {
            router.push("/auth");
        }
    }, [accessToken, router]);

    // Handle tab from query param
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && ["profile", "my-trips", "reviews", "security", "favorites"].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const fetcher = (url: string) =>
        fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        }).then((res) => {
            if (!res.ok) throw new Error("Failed to fetch profile");
            return res.json();
        });

    const {
        data: profileRes,
        error: userError,
        isLoading: userLoading,
    } = useSWR<ProfileResponse>(
        accessToken ? `${BOOKING_API_URL}/users/profile` : null,
        fetcher
    );

    const userData = profileRes?.data;

    // --- LOGOUT ---
    const handleLogout = () => {
        deleteCookie("token");
        localStorage.removeItem("current_user_id");
        localStorage.removeItem("isLoggedIn");
        router.push("/auth");
    };

    // --- EDIT PROFILE ---
    const openEditModal = () => {
        if (userData) {
            setUserEdit({
                full_name: userData.full_name,
                phone: userData.phone,
                address: userData.address,
            });
        }
        setPreviewAvatar(null);
        avatarFileRef.current = null;
        setShowEditModal(true);
    };

    const handleAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith("image/")) return;
        avatarFileRef.current = file;
        setPreviewAvatar(URL.createObjectURL(file));
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            let avatarUrl = userData?.avatar_url;

            // 1. Upload Avatar nếu có file mới
            if (avatarFileRef.current) {
                const formData = new FormData();
                formData.append("image", avatarFileRef.current); // Backend expects 'image' field

                // Upload endpoint (thường là /upload)
                const uploadRes = await fetch(`${BOOKING_API_URL}/upload`, {
                    method: "POST",
                    body: formData,
                });

                if (!uploadRes.ok) {
                    const errData = await uploadRes.json().catch(() => ({}));
                    throw new Error(errData.message || "Failed to upload avatar");
                }
                const uploadData = await uploadRes.json();
                avatarUrl = uploadData.imageUrl;
            }

            // 2. Update Profile với thông tin mới
            const payload = {
                ...userEdit,
                avatar_url: avatarUrl
            };

            const updateRes = await fetch(`${BOOKING_API_URL}/users/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (!updateRes.ok) throw new Error("Failed to update profile");

            const resJson = await updateRes.json();
            const updatedUser = resJson.data;

            toast.success(t("messages.updateSuccess"));

            // 3. Update Global State ngay lập tức
            authService.storeUser(updatedUser);
            if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("authStateChanged"));
            }

            // 4. Update local view
            mutate(`${BOOKING_API_URL}/users/profile`);
            setShowEditModal(false);

        } catch (error) {
            console.error("Save error:", error);
            // @ts-expect-error error message access
            toast.error(error.message || t("messages.updateFailed"));
        } finally {
            setIsSaving(false);
        }
    };

    // --- CHANGE PASSWORD ---
    const handleChangePassword = async () => {
        const { oldPassword, newPassword, confirmPassword } = passwordForm;

        if (!oldPassword || !newPassword || !confirmPassword) {
            toast.error(t("messages.fillAllFields"));
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error(t("messages.passwordMismatch"));
            return;
        }

        if (newPassword.length < 6) {
            toast.error(t("messages.passwordTooShort"));
            return;
        }

        setIsChangingPassword(true);
        try {
            const res = await authService.changePassword({ oldPassword, newPassword });
            if (res.success) {
                toast.success(t("messages.passwordChanged"), { autoClose: 2000 });
                setShowPasswordModal(false);
                setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });

                // Tự động đăng xuất sau 2 giây
                setTimeout(() => {
                    handleLogout();
                }, 2000);
            } else {
                toast.error(res.message || t("messages.passwordChangeFailed"));
            }
        } catch (error: unknown) {
            console.error("Change password error:", error);
            toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || t("messages.passwordChangeError"));
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (userLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (userError) return <div>{t("messages.failedToLoad")}</div>;

    return (
        <div className="profile-page">
            <div className="profile-container">
                {/* --- SIDEBAR --- */}
                <aside className="profile-sidebar">
                    <div className="sidebar-user">
                        <div className="sidebar-avatar">
                            <Image
                                src={userData?.avatar_url || "/images/profile.svg"}
                                alt="Avatar"
                                width={80}
                                height={80}
                            />
                        </div>
                        <h3 className="sidebar-name">{userData?.full_name || t("sidebar.user")}</h3>
                        <span className="sidebar-email">{userData?.email}</span>
                    </div>
                    <nav className="sidebar-nav">
                        <button
                            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            <FaUser /> {t("sidebar.memberProfile")}
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'my-trips' ? 'active' : ''}`}
                            onClick={() => setActiveTab('my-trips')}
                        >
                            <FaSuitcase /> {t("sidebar.myTrips")}
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'reviews' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reviews')}
                        >
                            <FaStar /> {t("sidebar.myReviews")}
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'favorites' ? 'active' : ''}`}
                            onClick={() => setActiveTab('favorites')}
                        >
                            <FaHeart /> {t("sidebar.favorites")}
                        </button>
                        <button
                            className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            <FaShieldAlt /> {t("sidebar.security")}
                        </button>
                        <button className="nav-item text-red-500 hover:text-red-600" onClick={handleLogout}>
                            <FaSignOutAlt /> {t("sidebar.logout")}
                        </button>
                    </nav>
                </aside>

                {/* --- MAIN CONTENT --- */}
                <main className="profile-content">

                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="content-card">
                            <div className="card-header">
                                <h2 className="card-title"><FaUser className="text-blue-500" /> {t("info.title")}</h2>
                                <button className="btn btn-primary" onClick={openEditModal}>
                                    <FaPen /> {t("info.edit")}
                                </button>
                            </div>

                            <div className="info-list">
                                <div className="info-row">
                                    <span className="info-label">{t("info.displayName")}</span>
                                    <span className="info-value">{userData?.full_name}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Email</span>
                                    <div className="flex items-center gap-2">
                                        <span className="info-value">{userData?.email}</span>
                                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">{t("info.verified")}</span>
                                    </div>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">{t("info.phone")}</span>
                                    <span className="info-value">{userData?.phone || t("info.notUpdated")}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">{t("info.address")}</span>
                                    <span className="info-value">{userData?.address || t("info.notUpdated")}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">{t("info.joinedDate")}</span>
                                    <span className="info-value">
                                        {userData?.created_at ? new Date(userData.created_at).toLocaleDateString('vi-VN') : "-"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MY TRIPS TAB */}
                    {activeTab === 'my-trips' && (
                        <div className="content-card">
                            <div className="card-header !border-b-0 !pb-0 !mb-4">
                                <h2 className="card-title"><FaSuitcase className="text-blue-500" /> {t("trips.title")}</h2>
                            </div>

                            {/* Trip Type Tabs */}
                            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-700 rounded-lg w-fit mb-6">
                                <button
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tripType === 'upcoming' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                    onClick={() => setTripType('upcoming')}
                                >
                                    {t("trips.upcoming")}
                                </button>
                                <button
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tripType === 'history' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                    onClick={() => setTripType('history')}
                                >
                                    {t("trips.history")}
                                </button>
                                <button
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tripType === 'cancelled' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                    onClick={() => setTripType('cancelled')}
                                >
                                    {t("trips.cancelled")}
                                </button>
                            </div>

                            <MyTrips type={tripType} apiBaseUrl={BOOKING_API_URL} token={accessToken as string} />
                        </div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                        <div className="content-card">
                            <div className="card-header">
                                <h2 className="card-title"><FaShieldAlt className="text-blue-500" /> {t("security.title")}</h2>
                            </div>

                            <div className="info-list">
                                <div className="info-row">
                                    <div className="info-label">
                                        <FaEnvelope /> {t("security.loginEmail")}
                                    </div>
                                    <div className="info-value">{userData?.email}</div>
                                </div>
                                <div className="info-row">
                                    <div className="info-label">
                                        <FaLock /> {t("security.password")}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-gray-400">••••••••</span>
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => setShowPasswordModal(true)}
                                        >
                                            {t("security.changePassword")}
                                        </button>
                                    </div>
                                </div>
                                <div className="info-row">
                                    <div className="info-label">
                                        <FaPhone /> {t("security.securityPhone")}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 italic">{t("security.securityPhoneDesc")}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* REVIEWS TAB */}
                    {activeTab === 'reviews' && (
                        <div className="content-card">
                            <MyReviews apiBaseUrl={BOOKING_API_URL} token={accessToken as string} />
                        </div>
                    )}

                    {/* FAVORITES TAB */}
                    {activeTab === 'favorites' && (
                        <div className="content-card">
                            <div className="card-header mb-6">
                                <h2 className="card-title"><FaHeart className="text-red-500" /> {t("favorites.title")}</h2>
                            </div>
                            <MyFavorites />
                        </div>
                    )}

                </main>
            </div>

            {/* --- MODAL EDIT PROFILE --- */}
            {showEditModal && (
                <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
                    <div className="modal-container" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{t("modal.updateProfile")}</h3>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}><FaTimes /></button>
                        </div>

                        <div className="flex flex-col items-center mb-6">
                            <div className="relative w-24 h-24 mb-4">
                                <Image
                                    src={previewAvatar || userData?.avatar_url || "/images/profile.svg"}
                                    alt="Avatar"
                                    fill
                                    className="rounded-full object-cover border-2 border-gray-200"
                                />
                                <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600">
                                    <FaCamera size={12} />
                                    <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
                                </label>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t("info.fullName")}</label>
                            <input
                                className="form-input"
                                value={userEdit.full_name || ""}
                                onChange={e => setUserEdit({ ...userEdit, full_name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t("info.phone")}</label>
                            <input
                                className="form-input"
                                value={userEdit.phone || ""}
                                onChange={e => setUserEdit({ ...userEdit, phone: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t("info.address")}</label>
                            <div className="flex gap-2">
                                <input
                                    className="form-input"
                                    value={userEdit.address || ""}
                                    onChange={e => setUserEdit({ ...userEdit, address: e.target.value })}
                                    placeholder={t("modal.addressPlaceholder")}
                                />
                                <button
                                    type="button"
                                    className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md border border-blue-200 transition-colors"
                                    title="Chọn trên bản đồ"
                                    onClick={() => setShowMapPicker(true)}
                                >
                                    <FaMapMarkerAlt />
                                </button>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-outline" onClick={() => setShowEditModal(false)}>{t("modal.cancel")}</button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                            >
                                {isSaving ? t("modal.saving") : t("modal.save")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL CHANGE PASSWORD --- */}
            {showPasswordModal && (
                <div className="modal-backdrop" onClick={() => setShowPasswordModal(false)}>
                    <div className="modal-container" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{t("modal.changePassword")}</h3>
                            <button className="modal-close" onClick={() => setShowPasswordModal(false)}><FaTimes /></button>
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t("security.currentPassword")}</label>
                            <input
                                type="password"
                                className="form-input"
                                value={passwordForm.oldPassword}
                                onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                                placeholder={t("modal.oldPasswordPlaceholder")}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t("security.newPassword")}</label>
                            <input
                                type="password"
                                className="form-input"
                                value={passwordForm.newPassword}
                                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                placeholder={t("modal.newPasswordPlaceholder")}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t("security.confirmPassword")}</label>
                            <input
                                type="password"
                                className="form-input"
                                value={passwordForm.confirmPassword}
                                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                placeholder={t("modal.confirmPasswordPlaceholder")}
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-outline" onClick={() => setShowPasswordModal(false)}>{t("modal.cancel")}</button>
                            <button
                                className="btn btn-primary"
                                onClick={handleChangePassword}
                                disabled={isChangingPassword}
                            >
                                {isChangingPassword ? t("modal.processing") : t("security.changePassword")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- LOCATION PICKER --- */}
            {showMapPicker && (
                <LocationPicker
                    initialAddress={userEdit.address || ""}
                    onSelect={(addr) => {
                        setUserEdit({ ...userEdit, address: addr });
                        setShowMapPicker(false);
                    }}
                    onClose={() => setShowMapPicker(false)}
                />
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
            />
        </div>
    );
}
