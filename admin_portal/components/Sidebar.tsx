"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
    LayoutDashboard,
    Users,
    Map,
    MapPin,
    ShoppingCart,
    Settings,
    LogOut,
    ChevronRight,
    Calendar,
    UserCheck,
    Tag,
    Sliders,
    UserCircle,
    Clock,
    Wrench,
    MessageSquare,
    ShieldCheck,
    Key
} from "lucide-react";
import clsx from "clsx";
import { Tooltip } from "antd";
import { AuthService } from "@/services/auth.service";
import { useLayoutContext } from "@/context/LayoutContext";
import { systemService, SystemSettings } from "@/services/system.service";
import React, { useState, useEffect } from "react";

// Define Interfaces for Menu
interface MenuItem {
    icon: any;
    label: string;
    href: string;
    permission?: string;
    children?: MenuItem[];
}

interface MenuGroup {
    name: string;
    items: MenuItem[];
}

// Define menu structure with required permissions
const menuGroups: MenuGroup[] = [
    {
        name: "CHUNG",
        items: [
            { icon: LayoutDashboard, label: "Tổng quan", href: "/", permission: "stats_view" },
        ]
    },
    {
        name: "QUẢN LÝ TOUR",
        items: [
            { icon: Map, label: "Danh sách Tour", href: "/tours", permission: "tours_view" },
            { icon: Calendar, label: "Lịch khởi hành", href: "/schedules", permission: "schedules_view" },
            { icon: Map, label: "Danh mục", href: "/categories", permission: "categories_view" },
            { icon: MapPin, label: "Địa điểm", href: "/locations", permission: "locations_view" },
        ]
    },
    {
        name: "GIAO DỊCH & HỖ TRỢ",
        items: [
            { icon: ShoppingCart, label: "Đơn hàng", href: "/orders", permission: "orders_view" },
            { icon: UserCheck, label: "Hành khách", href: "/tour-customers", permission: "customers_view" },
            { icon: MessageSquare, label: "Hỗ trợ chat", href: "/chat", permission: "chat_view" },
        ]
    },
    {
        name: "CÀI ĐẶT",
        items: [
            {
                icon: Settings, label: "Cấu hình hệ thống", href: "/settings", permission: "settings_manage",
                children: [
                    { icon: Settings, label: "Cài đặt thông số", href: "/settings/setting-overview", permission: "settings_view" },
                    { icon: Tag, label: "Khuyến mãi", href: "/settings/discount-codes", permission: "discounts_view" },
                    { icon: Sliders, label: "Banner", href: "/settings/banners", permission: "banners_view" },
                    { icon: Wrench, label: "Tiện ích", href: "/amenities" }
                ]
            },
            {
                icon: ShieldCheck, label: "Quản trị viên", href: "/users", permission: "users_view",
                children: [
                    { icon: Users, label: "Danh sách quản trị", href: "/users" },
                    { icon: Key, label: "Quyền & Vai trò", href: "/users/permissions", permission: "roles_manage" },
                ]
            },
            { icon: UserCircle, label: "Tài khoản cá nhân", href: "/account" }, // Luôn hiện
        ]
    }
];

export default function Sidebar() {
    const pathname = usePathname();
    const { sidebarCollapsed, hasPermission, isLoadingPermissions } = useLayoutContext();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [siteSettings, setSiteSettings] = useState<SystemSettings | null>(null);

    useEffect(() => {
        // Fetch site settings for logo
        systemService.getSettings()
            .then(data => setSiteSettings(data))
            .catch(err => console.log('Could not load site settings:', err));
    }, []);

    // Filter menu groups based on permissions
    const filteredMenuGroups = menuGroups.map(group => ({
        ...group,
        items: group.items.filter(item => {
            const canViewItem = hasPermission(item.permission || "");
            if (!canViewItem) return false;

            // If item has children, filter them too
            if (item.children) {
                const visibleChildren = item.children.filter(child => hasPermission(child.permission || ""));
                return visibleChildren.length > 0;
            }
            return true;
        })
    })).filter(group => group.items.length > 0);

    if (isLoadingPermissions) {
        return (
            <aside className={clsx(
                "fixed left-0 top-0 z-40 h-screen transition-all bg-white border-r border-gray-200",
                sidebarCollapsed ? "w-20" : "w-64"
            )}>
                <div className="p-8 animate-pulse space-y-4">
                    <div className="h-10 bg-gray-100 rounded-lg"></div>
                    <div className="h-64 bg-gray-50 rounded-lg"></div>
                </div>
            </aside>
        );
    }

    return (
        <aside
            className={clsx(
                "fixed left-0 top-0 z-40 h-screen transition-all duration-300 bg-white border-r border-gray-200 shadow-sm",
                sidebarCollapsed ? "w-20" : "w-64"
            )}
        >
            <div className="flex h-full flex-col px-4 py-6 overflow-y-auto no-scrollbar">
                {/* Logo Section */}
                <Link href="/" className="flex items-center gap-3 px-2 mb-8 transition-transform hover:scale-105">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
                        {siteSettings?.site_logo ? (
                            <Image
                                src={siteSettings.site_logo}
                                alt="Logo"
                                width={60}
                                height={60}
                                className="object-contain"
                                unoptimized
                            />
                        ) : (
                            <div className="w-full h-full bg-slate-50 rounded-xl flex items-center justify-center">
                                <LayoutDashboard size={22} className="text-slate-600" />
                            </div>
                        )}
                    </div>
                    {!sidebarCollapsed && (
                        <span className="text-xl font-bold text-slate-800 tracking-tight">
                            {siteSettings?.site_name || 'TravelVN'}
                        </span>
                    )}
                </Link>

                {/* Menu Groups */}
                <div className="space-y-8 flex-1">
                    {filteredMenuGroups.map((group) => (
                        <div key={group.name}>
                            {!sidebarCollapsed && (
                                <h3 className="px-2 mb-4 text-xs font-bold text-slate-400 tracking-widest uppercase">
                                    {group.name}
                                </h3>
                            )}
                            <ul className="space-y-1">
                                {group.items.map((item) => {
                                    const hasChildren = item.children && item.children.length > 0;
                                    const isChildActive = hasChildren && item.children?.some(child =>
                                        pathname === child.href || (child.href !== '/' && pathname.startsWith(child.href + '/'))
                                    );
                                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/')) || isChildActive;
                                    const isExpanded = expandedItems.includes(item.label) || isChildActive;

                                    return (
                                        <li key={item.label}>
                                            {hasChildren ? (
                                                <>
                                                    <Tooltip title={sidebarCollapsed ? item.label : ""} placement="right">
                                                        <button
                                                            onClick={() => setExpandedItems(isExpanded ? expandedItems.filter(i => i !== item.label) : [...expandedItems, item.label])}
                                                            className={clsx(
                                                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
                                                                isActive ? "bg-slate-50 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                                                                sidebarCollapsed && "justify-center"
                                                            )}
                                                        >
                                                            <item.icon size={20} className={clsx("transition-colors", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                                                            {!sidebarCollapsed && (
                                                                <>
                                                                    <span className={clsx("flex-1 text-sm text-left", isActive ? "font-bold" : "font-semibold")}>{item.label}</span>
                                                                    <ChevronRight
                                                                        size={16}
                                                                        className={clsx("transition-transform duration-200 text-slate-400", isExpanded && "rotate-90")}
                                                                    />
                                                                </>
                                                            )}
                                                        </button>
                                                    </Tooltip>

                                                    {!sidebarCollapsed && isExpanded && (
                                                        <ul className="mt-1 ml-9 border-l border-slate-100 space-y-1">
                                                            {item.children?.filter(child => hasPermission(child.permission || "")).map(child => {
                                                                const isThisChildActive = pathname === child.href || (child.href !== '/' && pathname.startsWith(child.href + '/'));

                                                                return (
                                                                    <li key={child.label}>
                                                                        <Link
                                                                            href={child.href}
                                                                            className={clsx(
                                                                                "flex items-center gap-3 px-4 py-2 text-sm transition-all rounded-lg mx-2",
                                                                                isThisChildActive
                                                                                    ? "text-blue-600 font-bold bg-blue-50 shadow-sm"
                                                                                    : "text-slate-500 font-semibold hover:text-slate-900 hover:bg-slate-50"
                                                                            )}
                                                                        >
                                                                            <div className={clsx(
                                                                                "w-1.5 h-1.5 rounded-full transition-all",
                                                                                isThisChildActive ? "bg-blue-600 scale-125" : "bg-slate-300 group-hover:bg-slate-400"
                                                                            )} />
                                                                            {child.label}
                                                                        </Link>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    )}
                                                </>
                                            ) : (
                                                <Tooltip title={sidebarCollapsed ? item.label : ""} placement="right">
                                                    <Link
                                                        href={item.href}
                                                        className={clsx(
                                                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
                                                            sidebarCollapsed && "justify-center",
                                                            isActive
                                                                ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-100"
                                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                        )}
                                                    >
                                                        <item.icon size={20} className={clsx("transition-colors", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                                                        {!sidebarCollapsed && (
                                                            <span className={clsx("text-sm transition-all", isActive ? "font-bold" : "font-semibold")}>
                                                                {item.label}
                                                            </span>
                                                        )}
                                                    </Link>
                                                </Tooltip>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Logout Footer */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <Tooltip title={sidebarCollapsed ? "Đăng xuất" : ""} placement="right">
                        <button
                            onClick={() => AuthService.logout()}
                            className={clsx(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all group",
                                sidebarCollapsed && "justify-center"
                            )}
                        >
                            <LogOut size={20} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                            {!sidebarCollapsed && <span className="text-sm font-semibold">Đăng xuất</span>}
                        </button>
                    </Tooltip>
                </div>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </aside>
    );
}