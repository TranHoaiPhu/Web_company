"use client";

import { useState, useEffect, useRef } from "react";
import {
    Settings,
    Home,
    Save,
    RefreshCcw,
    Eye,
    EyeOff,
    Zap,
    Gift,
    Star,
    Package,
    Clock,
    Timer,
    Info,
    DollarSign,
    Users,
    ShieldCheck,
    ChevronRight,
    Lock,
    Palette,
    Image as ImageIcon,
    Upload,
    Trash2,
    ExternalLink
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { systemService, SystemSettings } from "@/services/system.service";
import {
    Card,
    Switch,
    Button,
    Typography,
    Divider,
    Space,
    Row,
    Col,
    Spin,
    Badge,
    Input,
    InputNumber,
    Tooltip,
    Alert,
    App,
    Upload as AntUpload,
    Modal
} from "antd";
import type { UploadProps } from 'antd';
import { BOOKING_API_URL } from "@/config/api";
import Cookies from "js-cookie";

const { Title, Text } = Typography;

export default function SettingsPage() {
    const { message: messageApi, notification } = App.useApp();
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingFavicon, setUploadingFavicon] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await systemService.getSettings();
            setSettings(data);
        } catch (error) {
            console.error("Error fetching settings:", error);
            messageApi.error("Không thể tải cài đặt hệ thống");
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (key: keyof SystemSettings, checked: boolean) => {
        if (!settings) return;
        setSettings({
            ...settings,
            [key]: checked
        });
        setHasChanges(true);
    };

    const handleChange = (key: keyof SystemSettings, value: any) => {
        if (!settings) return;
        setSettings({
            ...settings,
            [key]: value
        });
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!settings) return;
        console.log("Saving settings:", settings);
        const hide = messageApi.loading("Đang lưu cài đặt hệ thống...", 0);
        try {
            setSaving(true);
            await systemService.updateSettings(settings);
            console.log("Settings saved successfully");
            messageApi.success("Cập nhật cài đặt thành công!");
            notification.success({
                message: "Thành công",
                description: "Cấu hình hệ thống đã được cập nhật.",
                placement: "topRight"
            });
            setHasChanges(false);
        } catch (error) {
            console.error("Error saving settings:", error);
            messageApi.error("Lỗi khi lưu cài đặt");
            notification.error({
                message: "Lỗi hệ thống",
                description: "Không thể lưu thay đổi. Vui lòng kiểm tra lại kết nối.",
            });
        } finally {
            setSaving(false);
            hide();
        }
    };

    const handleFileUpload = async (file: File, type: 'logo' | 'favicon') => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            messageApi.error('Chỉ chấp nhận file ảnh!');
            return;
        }

        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            messageApi.error('Ảnh phải nhỏ hơn 2MB!');
            return;
        }

        const setUploading = type === 'logo' ? setUploadingLogo : setUploadingFavicon;
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const token = Cookies.get('admin_token');
            const response = await fetch(`${BOOKING_API_URL}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            const imageUrl = data.url || data.data?.url;

            if (imageUrl) {
                const settingKey = type === 'logo' ? 'site_logo' : 'site_favicon';
                handleChange(settingKey, imageUrl);
                messageApi.success(`Đã upload ${type === 'logo' ? 'logo' : 'favicon'} thành công!`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            messageApi.error(`Lỗi khi upload ${type === 'logo' ? 'logo' : 'favicon'}`);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = (type: 'logo' | 'favicon') => {
        const settingKey = type === 'logo' ? 'site_logo' : 'site_favicon';
        handleChange(settingKey, '');
        messageApi.info(`Đã xóa ${type === 'logo' ? 'logo' : 'favicon'}`);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
                <Spin size="large" />
                <Text type="secondary">Đang tải cài đặt hệ thống...</Text>
            </div>
        );
    }

    const visibilitySettings = [
        {
            key: "show_flash_sale",
            label: "Flash Sale",
            description: "Khuyến mãi có giới hạn thời gian trên trang chủ",
            icon: <Zap size={20} className="text-orange-500" />,
        },
        {
            key: "show_featured_tours",
            label: "Tour Nổi Bật",
            description: "Danh sách các tour du lịch được đề xuất",
            icon: <Star size={20} className="text-yellow-500" />,
        },
        {
            key: "show_combo_promotion",
            label: "Combo Tiết Kiệm",
            description: "Gói tour + dịch vụ với giá ưu đãi",
            icon: <Package size={20} className="text-blue-500" />,
        },
        {
            key: "show_new_customer_promo",
            label: "Ưu Đãi Khách Mới",
            description: "Voucher dành cho khách hàng đặt tour lần đầu",
            icon: <Gift size={20} className="text-pink-500" />,
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
                
                * {
                    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
                }
                
                .setting-card {
                    background: white;
                    border: 1px solid #f1f5f9;
                    transition: all 0.2s ease;
                }
                
                .setting-card:hover {
                    border-color: #3b82f6;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
                }
                
                .save-button {
                    background: linear-gradient(135deg, #2563eb, #4f46e5);
                    border: none;
                    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
                }
                
                .save-button:hover {
                    background: linear-gradient(135deg, #1d4ed8, #4338ca);
                    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
                }
                
                .section-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
                }

                .logo-upload-zone {
                    border: 2px dashed #cbd5e1;
                    border-radius: 16px;
                    padding: 32px 24px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.25s ease;
                    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                    min-height: 180px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                .logo-upload-zone:hover {
                    border-color: #3b82f6;
                    background: linear-gradient(135deg, #eff6ff, #dbeafe);
                    transform: translateY(-2px);
                }

                .logo-preview {
                    position: relative;
                    border-radius: 16px;
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                    min-height: 180px;
                }

                .content-section {
                    background: white;
                    border-radius: 20px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02);
                    padding: 28px;
                }
            `}</style>

            {/* Preview Modal */}
            <Modal
                open={previewOpen}
                title="Xem trước"
                footer={null}
                onCancel={() => setPreviewOpen(false)}
                centered
            >
                {previewImage && (
                    <img alt="preview" style={{ width: '100%' }} src={previewImage} />
                )}
            </Modal>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/25">
                            <Settings className="text-white" size={28} />
                        </div>
                        <div>
                            <Title level={2} className="!mb-1 font-extrabold text-slate-800">
                                Cài đặt hệ thống
                            </Title>
                            <Text className="text-gray-500 text-base">
                                Quản lý giao diện, tính năng hiển thị và cấu hình hệ thống
                            </Text>
                        </div>
                    </div>

                    <Button
                        type="primary"
                        size="large"
                        icon={<Save size={18} />}
                        onClick={handleSave}
                        loading={saving}
                        disabled={!hasChanges}
                        className="save-button h-14 px-10 rounded-xl font-semibold text-base"
                    >
                        {hasChanges ? "Lưu thay đổi" : "Đã lưu"}
                    </Button>
                </div>

                {/* Main Content - 2 Column Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-8">
                        {/* Logo & Branding Section */}
                        <div className="content-section">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 bg-purple-100 rounded-xl">
                                    <Palette size={22} className="text-purple-600" />
                                </div>
                                <div>
                                    <Title level={4} className="!mb-0 font-bold text-slate-800">Giao diện & Thương hiệu</Title>
                                    <Text className="text-gray-400 text-sm">Tùy chỉnh logo và tên hiển thị</Text>
                                </div>
                            </div>

                            {/* Site Name */}
                            <div className="mb-8">
                                <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-3">Tên website</Text>
                                <Input
                                    placeholder="Tên hiển thị trên website"
                                    value={settings?.site_name || ''}
                                    onChange={(e) => handleChange('site_name', e.target.value)}
                                    size="large"
                                    className="rounded-xl h-12"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Logo Upload */}
                                <div>
                                    <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-4">Logo Website</Text>

                                    {settings?.site_logo ? (
                                        <div className="logo-preview bg-gradient-to-br from-slate-50 to-gray-100 p-6">
                                            <div className="relative w-full h-28 flex items-center justify-center mb-4">
                                                <Image
                                                    src={settings.site_logo}
                                                    alt="Logo"
                                                    width={200}
                                                    height={100}
                                                    className="object-contain max-h-24"
                                                    unoptimized
                                                />
                                            </div>
                                            <div className="flex gap-2 justify-center">
                                                <Button
                                                    size="middle"
                                                    icon={<ExternalLink size={14} />}
                                                    onClick={() => {
                                                        setPreviewImage(settings.site_logo || null);
                                                        setPreviewOpen(true);
                                                    }}
                                                    className="rounded-lg"
                                                >
                                                    Xem
                                                </Button>
                                                <Button
                                                    size="middle"
                                                    icon={<Upload size={14} />}
                                                    onClick={() => logoInputRef.current?.click()}
                                                    loading={uploadingLogo}
                                                    className="rounded-lg"
                                                >
                                                    Đổi
                                                </Button>
                                                <Button
                                                    size="middle"
                                                    danger
                                                    icon={<Trash2 size={14} />}
                                                    onClick={() => handleRemoveImage('logo')}
                                                    className="rounded-lg"
                                                >
                                                    Xóa
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className="logo-upload-zone"
                                            onClick={() => logoInputRef.current?.click()}
                                        >
                                            {uploadingLogo ? (
                                                <Spin size="large" />
                                            ) : (
                                                <>
                                                    <ImageIcon size={48} className="text-gray-300 mb-3" />
                                                    <Text className="text-gray-600 block text-sm font-medium">Click để upload logo</Text>
                                                    <Text className="text-gray-400 text-xs mt-1">PNG, JPG, SVG (tối đa 2MB)</Text>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    <input
                                        ref={logoInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload(file, 'logo');
                                            e.target.value = '';
                                        }}
                                    />

                                    <div className="mt-4">
                                        <Text className="text-xs text-gray-400 block mb-2">Hoặc nhập URL trực tiếp:</Text>
                                        <Input
                                            placeholder="https://example.com/logo.png"
                                            value={settings?.site_logo || ''}
                                            onChange={(e) => handleChange('site_logo', e.target.value)}
                                            className="rounded-lg"
                                        />
                                    </div>
                                </div>

                                {/* Favicon Upload */}
                                <div>
                                    <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-4">Favicon (Icon tab)</Text>

                                    {settings?.site_favicon ? (
                                        <div className="logo-preview bg-gradient-to-br from-slate-50 to-gray-100 p-6">
                                            <div className="relative w-full h-28 flex items-center justify-center mb-4">
                                                <Image
                                                    src={settings.site_favicon}
                                                    alt="Favicon"
                                                    width={80}
                                                    height={80}
                                                    className="object-contain"
                                                    unoptimized
                                                />
                                            </div>
                                            <div className="flex gap-2 justify-center">
                                                <Button
                                                    size="middle"
                                                    icon={<ExternalLink size={14} />}
                                                    onClick={() => {
                                                        setPreviewImage(settings.site_favicon || null);
                                                        setPreviewOpen(true);
                                                    }}
                                                    className="rounded-lg"
                                                >
                                                    Xem
                                                </Button>
                                                <Button
                                                    size="middle"
                                                    icon={<Upload size={14} />}
                                                    onClick={() => faviconInputRef.current?.click()}
                                                    loading={uploadingFavicon}
                                                    className="rounded-lg"
                                                >
                                                    Đổi
                                                </Button>
                                                <Button
                                                    size="middle"
                                                    danger
                                                    icon={<Trash2 size={14} />}
                                                    onClick={() => handleRemoveImage('favicon')}
                                                    className="rounded-lg"
                                                >
                                                    Xóa
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className="logo-upload-zone"
                                            onClick={() => faviconInputRef.current?.click()}
                                        >
                                            {uploadingFavicon ? (
                                                <Spin size="large" />
                                            ) : (
                                                <>
                                                    <ImageIcon size={48} className="text-gray-300 mb-3" />
                                                    <Text className="text-gray-600 block text-sm font-medium">Click để upload favicon</Text>
                                                    <Text className="text-gray-400 text-xs mt-1">ICO, PNG (32x32px)</Text>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    <input
                                        ref={faviconInputRef}
                                        type="file"
                                        accept="image/*,.ico"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload(file, 'favicon');
                                            e.target.value = '';
                                        }}
                                    />

                                    <div className="mt-4">
                                        <Text className="text-xs text-gray-400 block mb-2">Hoặc nhập URL trực tiếp:</Text>
                                        <Input
                                            placeholder="https://example.com/favicon.ico"
                                            value={settings?.site_favicon || ''}
                                            onChange={(e) => handleChange('site_favicon', e.target.value)}
                                            className="rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* User & Access Management */}
                        <div className="content-section">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-indigo-100 rounded-xl">
                                    <Lock size={22} className="text-indigo-600" />
                                </div>
                                <div>
                                    <Title level={4} className="!mb-0 font-bold text-slate-800">Quản lý Tài khoản & Truy cập</Title>
                                    <Text className="text-gray-400 text-sm">Phân quyền và quản lý người dùng</Text>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <Link
                                    href="/users"
                                    className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50/30 transition-all group no-underline"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                                            <Users size={22} />
                                        </div>
                                        <div>
                                            <Text className="font-bold block text-slate-800 text-base">Danh sách quản trị viên</Text>
                                            <Text className="text-sm text-gray-500">Quản lý tài khoản nhân viên hệ thống</Text>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
                                </Link>

                                <Link
                                    href="/users/permissions"
                                    className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group no-underline"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                                            <ShieldCheck size={22} />
                                        </div>
                                        <div>
                                            <Text className="font-bold block text-slate-800 text-base">Quyền & Vai trò</Text>
                                            <Text className="text-sm text-gray-500">Thiết lập và gán quyền hệ thống</Text>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-gray-300 group-hover:text-indigo-500 transition-all group-hover:translate-x-1" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                        {/* Homepage Visibility Section */}
                        <div className="content-section">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 bg-blue-100 rounded-xl">
                                    <Home size={22} className="text-blue-600" />
                                </div>
                                <div>
                                    <Title level={4} className="!mb-0 font-bold text-slate-800">Hiển thị Trang chủ</Title>
                                    <Text className="text-gray-400 text-sm">Bật/tắt các phần trên trang chủ</Text>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {visibilitySettings.map((item) => (
                                    <div
                                        key={item.key}
                                        className={`setting-card rounded-2xl p-5 flex items-center justify-between gap-4 border-2 transition-all ${settings?.[item.key] ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100 bg-gray-50/30'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <Text className="font-bold text-base block text-slate-800">{item.label}</Text>
                                                <Text className="text-sm text-gray-500">
                                                    {item.description}
                                                </Text>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 flex-shrink-0">
                                            <Text className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${settings?.[item.key] ? 'text-green-700 bg-green-100' : 'text-gray-500 bg-gray-100'}`}>
                                                {settings?.[item.key] ? "Hiện" : "Ẩn"}
                                            </Text>
                                            <Switch
                                                checked={settings?.[item.key]}
                                                onChange={(checked: boolean) => handleToggle(item.key as keyof SystemSettings, checked)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Automation & Promo Section */}
                        <div className="grid grid-cols-1 gap-8">
                            {/* Automation */}
                            <div className="content-section">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-amber-100 rounded-xl">
                                        <Clock size={22} className="text-amber-600" />
                                    </div>
                                    <div>
                                        <Title level={4} className="!mb-0 font-bold text-slate-800">Tự động hóa</Title>
                                        <Text className="text-gray-400 text-sm">Cài đặt xử lý tự động</Text>
                                    </div>
                                </div>

                                <div className={`p-5 rounded-2xl border-2 transition-all ${settings?.auto_cancel_unpaid ? 'bg-amber-50/50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-3">
                                            <Timer size={20} className={settings?.auto_cancel_unpaid ? 'text-amber-600' : 'text-gray-400'} />
                                            <Text className="font-semibold text-slate-700">Hủy đơn chưa thanh toán</Text>
                                        </div>
                                        <Switch
                                            checked={settings?.auto_cancel_unpaid}
                                            onChange={(checked: boolean) => handleToggle('auto_cancel_unpaid', checked)}
                                        />
                                    </div>

                                    <div className={`transition-opacity ${settings?.auto_cancel_unpaid ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-3">Thời hạn thanh toán</Text>
                                        <InputNumber
                                            className="w-full rounded-xl"
                                            min={5}
                                            value={settings?.auto_cancel_minutes}
                                            onChange={(val) => handleChange('auto_cancel_minutes', val)}
                                            size="large"
                                            addonAfter="phút"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* New Customer Promo */}
                            <div className="content-section">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-pink-100 rounded-xl">
                                        <Gift size={22} className="text-pink-600" />
                                    </div>
                                    <div>
                                        <Title level={4} className="!mb-0 font-bold text-slate-800">Ưu đãi Khách mới</Title>
                                        <Text className="text-gray-400 text-sm">Voucher cho khách lần đầu</Text>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-3">Mã giảm giá</Text>
                                        <Input
                                            placeholder="VD: WELCOME"
                                            value={settings?.new_customer_promo_code}
                                            onChange={(e) => handleChange('new_customer_promo_code', e.target.value)}
                                            size="large"
                                            className="font-mono font-bold text-blue-600 rounded-xl h-12"
                                        />
                                    </div>

                                    <div>
                                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-3">Số tiền giảm</Text>
                                        <InputNumber
                                            className="w-full rounded-xl"
                                            value={settings?.new_customer_promo_amount}
                                            onChange={(val) => handleChange('new_customer_promo_amount', val)}
                                            size="large"
                                            addonAfter="VNĐ"
                                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Alert */}
                <div className="mt-10">
                    <Alert
                        message={<Text strong className="text-blue-700">Lưu ý quan trọng</Text>}
                        description="Mọi thay đổi sẽ có hiệu lực ngay lập tức sau khi nhấn nút Lưu. Hãy kiểm tra kỹ cài đặt trước khi xác nhận."
                        type="info"
                        showIcon
                        className="rounded-2xl border-blue-200 bg-blue-50/50"
                    />
                </div>
            </div>
        </div>
    );
}
