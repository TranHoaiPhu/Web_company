"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { AuthService } from '@/services/auth.service';
import { UserRoleService } from '@/services/role.service';
import { userService, User } from '@/services/user.service';

interface LayoutContextProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isHeaderVisible: boolean;
  setHeaderVisible: (visible: boolean) => void;
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  // RBAC additions
  permissions: string[];
  isAdmin: boolean;
  hasPermission: (permission: string) => boolean;
  isLoadingPermissions: boolean;
  refreshPermissions: () => Promise<void>;
  userProfile: User | null;
}

const LayoutContext = createContext<LayoutContextProps | undefined>(undefined);

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isHeaderVisible, setHeaderVisible] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // RBAC state
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [userProfile, setUserProfile] = useState<User | null>(null);

  const fetchPermissions = useCallback(async () => {
    setIsLoadingPermissions(true);
    const user = AuthService.getCurrentUser();

    if (!user) {
      setPermissions([]);
      setIsAdmin(false);
      setUserProfile(null);
      setIsLoadingPermissions(false);
      return;
    }

    // System Admin (role 0) bypasses all checks
    if (user.role === 0 || user.role === '0') {
      setIsAdmin(true);
      setPermissions(['*']); // Special notation for everything

      // Still fetch profile for Admin
      try {
        const userId = user.user_id || user.sub || String(user.id);
        const profile = await userService.getById(Number(userId));
        setUserProfile(profile);
      } catch (e) {
        console.error("Admin profile fetch error:", e);
      }

      setIsLoadingPermissions(false);
      return;
    }

    try {
      const userId = user.user_id || user.sub || String(user.id);

      // Fetch permissions
      const rbacData = await UserRoleService.getUserRoles(userId);
      setPermissions(rbacData.permissions || []);
      setIsAdmin(false);

      // Fetch full profile for real name
      try {
        const profile = await userService.getById(Number(userId));
        setUserProfile(profile);
      } catch (profileError) {
        console.error("Error fetching user profile:", profileError);
      }
    } catch (error) {
      console.error("Error fetching permissions for LayoutContext:", error);
      setPermissions([]);
    } finally {
      setIsLoadingPermissions(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const toggleSidebarCollapsed = () => setSidebarCollapsed((prev) => !prev);

  const hasPermission = useCallback((permission: string) => {
    if (isAdmin) return true;
    return permissions.includes(permission);
  }, [isAdmin, permissions]);

  return (
    <LayoutContext.Provider
      value={{
        isSidebarOpen,
        toggleSidebar,
        isHeaderVisible,
        setHeaderVisible,
        sidebarCollapsed,
        toggleSidebarCollapsed,
        // RBAC values
        permissions,
        isAdmin,
        hasPermission,
        isLoadingPermissions,
        refreshPermissions: fetchPermissions,
        userProfile
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayoutContext = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutContext must be used within a LayoutProvider');
  }
  return context;
};
