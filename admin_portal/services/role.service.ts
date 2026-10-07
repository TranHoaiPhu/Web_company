import httpPython from './http-python';

// =====================================================
// INTERFACES
// =====================================================

export interface Role {
    id: number;
    name: string;
    slug: string;
    description?: string;
    is_system: boolean;
    is_active: boolean;
    permissions: string[];
    created_at?: string;
    updated_at?: string;
}

export interface Permission {
    id: number;
    name: string;
    slug: string;
    description?: string;
    module: string;
    is_active: boolean;
    created_at?: string;
}

export interface PermissionGrouped {
    module: string;
    permissions: Permission[];
}

export interface UserWithRoles {
    user_id: string;
    name?: string;
    email?: string;
    avatar?: string;
    roles: Role[];
    permissions: string[];
}

// =====================================================
// ROLE API
// =====================================================

export const RoleService = {
    // Get all roles
    async getRoles(): Promise<{ data: Role[]; total: number }> {
        const response = await httpPython.get('/roles-management/roles');
        return response.data;
    },

    // Get role by ID
    async getRoleById(roleId: number): Promise<Role> {
        const response = await httpPython.get(`/roles-management/roles/${roleId}`);
        return response.data;
    },

    // Create new role
    async createRole(data: { name: string; slug: string; description?: string }): Promise<Role> {
        const response = await httpPython.post('/roles-management/roles', data);
        return response.data;
    },

    // Update role
    async updateRole(roleId: number, data: { name?: string; slug?: string; description?: string }): Promise<Role> {
        const response = await httpPython.put(`/roles-management/roles/${roleId}`, data);
        return response.data;
    },

    // Delete role
    async deleteRole(roleId: number): Promise<{ message: string }> {
        const response = await httpPython.delete(`/roles-management/roles/${roleId}`);
        return response.data;
    },

    // Get role permissions
    async getRolePermissions(roleId: number): Promise<{ role: Role; permissions: Permission[]; permission_slugs: string[] }> {
        const response = await httpPython.get(`/roles-management/roles/${roleId}/permissions`);
        return response.data;
    },

    // Assign permissions to role
    async assignPermissionsToRole(roleId: number, permissionSlugs: string[]): Promise<{ message: string; permissions: Permission[] }> {
        const response = await httpPython.post(`/roles-management/roles/${roleId}/permissions`, {
            role_id: roleId,
            permission_slugs: permissionSlugs
        });
        return response.data;
    },

    // Get users with specific role
    async getUsersWithRole(roleId: number): Promise<{ role: Role; user_ids: string[]; total: number }> {
        const response = await httpPython.get(`/roles-management/roles/${roleId}/users`);
        return response.data;
    }
};

// =====================================================
// PERMISSION API
// =====================================================

export const PermissionService = {
    // Get all permissions
    async getPermissions(grouped = false): Promise<{ data: Permission[]; total: number; grouped?: PermissionGrouped[] }> {
        const response = await httpPython.get('/roles-management/permissions', {
            params: { grouped }
        });
        return response.data;
    },

    // Create permission (rarely needed)
    async createPermission(data: { name: string; slug: string; description?: string; module: string }): Promise<Permission> {
        const response = await httpPython.post('/roles-management/permissions', data);
        return response.data;
    }
};

// =====================================================
// USER-ROLE API
// =====================================================

export const UserRoleService = {
    // Get user roles
    async getUserRoles(userId: string): Promise<UserWithRoles> {
        const response = await httpPython.get(`/roles-management/users/${userId}/roles`);
        return response.data;
    },

    // Assign roles to user
    async assignRolesToUser(userId: string, roleIds: number[], assignedBy?: string): Promise<UserWithRoles> {
        const response = await httpPython.post(`/roles-management/users/${userId}/roles`,
            { user_id: userId, role_ids: roleIds },
            { params: { assigned_by: assignedBy } }
        );
        return response.data;
    },

    // Add single role to user
    async addRoleToUser(userId: string, roleId: number, assignedBy?: string): Promise<{ message: string }> {
        const response = await httpPython.post(
            `/roles-management/users/${userId}/roles/${roleId}`,
            null,
            { params: { assigned_by: assignedBy } }
        );
        return response.data;
    },

    // Remove role from user
    async removeRoleFromUser(userId: string, roleId: number): Promise<{ message: string }> {
        const response = await httpPython.delete(`/roles-management/users/${userId}/roles/${roleId}`);
        return response.data;
    },

    // Check user permission
    async checkUserPermission(userId: string, permission: string): Promise<{ has_permission: boolean }> {
        const response = await httpPython.get(`/roles-management/users/${userId}/check-permission`, {
            params: { permission }
        });
        return response.data;
    }
};

// Export all services
export default {
    RoleService,
    PermissionService,
    UserRoleService
};

