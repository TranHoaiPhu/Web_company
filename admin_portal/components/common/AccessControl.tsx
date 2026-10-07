"use client";

import React from 'react';
import { useLayoutContext } from '@/context/LayoutContext';

interface CanProps {
    permission: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * Component để kiểm soát hiển thị dựa trên quyền hạn.
 * Nếu user có quyền 'permission', hiển thị 'children'.
 * Nếu không, hiển thị 'fallback' (mặc định là null).
 * 
 * Ví dụ: 
 * <Can permission="users_create">
 *   <Button>Thêm người dùng</Button>
 * </Can>
 */
export const Can: React.FC<CanProps> = ({ permission, children, fallback = null }) => {
    const { hasPermission, isLoadingPermissions } = useLayoutContext();

    if (isLoadingPermissions) return null;

    if (hasPermission(permission)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};

/**
 * Hook để kiểm tra quyền trong logic JavaScript (không phải UI)
 */
export const usePermission = () => {
    const { hasPermission, isAdmin, permissions, isLoadingPermissions } = useLayoutContext();
    return { hasPermission, isAdmin, permissions, isLoadingPermissions };
};
