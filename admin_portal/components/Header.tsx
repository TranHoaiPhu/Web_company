"use client";

import React, { useEffect, useState } from "react";
import { Bell, Search, Moon, ChevronDown, Menu } from "lucide-react";
import { useLayoutContext } from "@/context/LayoutContext";
import { Avatar, Badge, Input, Dropdown, MenuProps, Skeleton } from "antd";
import { AuthService } from "@/services/auth.service";
import { UserRoleService, UserWithRoles } from "@/services/role.service";

export default function Header() {
    const { sidebarCollapsed, toggleSidebarCollapsed, userProfile, isLoadingPermissions } = useLayoutContext();
    const [userData, setUserData] = useState<UserWithRoles | null>(null);
    const [loading, setLoading] = useState(true);

    const jwtUser = AuthService.getCurrentUser();

    useEffect(() => {
        const fetchUserData = async () => {
            if (!jwtUser) {
                setLoading(false);
                return;
            }

            try {
                // Get user ID from token (sub or iduser or user_id)
                const userId = jwtUser.user_id || jwtUser.sub || String(jwtUser.id);
                const data = await UserRoleService.getUserRoles(userId);
                setUserData(data);
            } catch (error) {
                console.error("Error fetching user data for header:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [jwtUser]);

    const userMenu: MenuProps['items'] = [
        { key: 'profile', label: 'Thông tin cá nhân' },
        { key: 'settings', label: 'Cài đặt' },
        { type: 'divider' },
        { key: 'logout', label: 'Đăng xuất', danger: true, onClick: () => AuthService.logout() },
    ];

    // Determine display name
    const displayName = userProfile?.full_name || userData?.name || jwtUser?.email?.split('@')[0] || "Admin";

    // Determine display role
    let displayRole = "Thành viên";
    if (jwtUser?.role === '0' || jwtUser?.role === 0) {
        displayRole = "Hệ thống Admin";
    } else if (userData?.roles && userData.roles.length > 0) {
        displayRole = userData.roles[0].name;
    }

    // Default avatar
    const avatarUrl = userProfile?.avatar_url || userData?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop";

    return (
        <header
            className={`fixed top-0 right-0 z-30 flex items-center h-16 transition-all duration-300 bg-white border-b border-gray-200 px-6 py-4 shadow-sm`}
            style={{ left: sidebarCollapsed ? '80px' : '256px' }}
        >
            <div className="flex items-center justify-between w-full">
                {/* Left Section: Search Bar */}
                <div className="flex items-center gap-4 flex-1">
                    <button
                        onClick={toggleSidebarCollapsed}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="relative group max-w-md w-full hidden sm:block">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Type to search..."
                            className="block w-full pl-10 pr-3 py-2 bg-slate-50 border border-transparent rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded border border-slate-300">⌘ K</span>
                        </div>
                    </div>
                </div>

                {/* Right Section: Actions & Profile */}
                <div className="flex items-center gap-4 sm:gap-6">
                    {/* Theme Toggle */}
                    <button className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500">
                        <Moon size={20} />
                    </button>

                    {/* Notifications */}
                    <button className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>

                    {/* User Profile */}
                    <Dropdown menu={{ items: userMenu }} placement="bottomRight" trigger={['click']}>
                        <div className="flex items-center gap-3 cursor-pointer p-1 hover:bg-slate-50 rounded-xl transition-all">
                            {isLoadingPermissions ? (
                                <div className="text-right hidden sm:block min-w-[80px]">
                                    <Skeleton.Input active size="small" style={{ width: 80, height: 14, marginBottom: 4 }} />
                                    <Skeleton.Input active size="small" style={{ width: 60, height: 10 }} />
                                </div>
                            ) : (
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-slate-800 leading-tight">{displayName}</p>
                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{displayRole}</p>
                                </div>
                            )}
                            <div className="relative">
                                {isLoadingPermissions ? (
                                    <Skeleton.Avatar active size={40} shape="circle" />
                                ) : (
                                    <Avatar
                                        src={avatarUrl}
                                        size={40}
                                        className="border border-slate-200 shadow-sm"
                                    />
                                )}
                                <ChevronDown size={12} className="absolute -right-1 -bottom-1 bg-white rounded-full shadow-sm text-slate-400 p-0.5 border border-slate-100" />
                            </div>
                        </div>
                    </Dropdown>
                </div>
            </div>
        </header>
    );
}