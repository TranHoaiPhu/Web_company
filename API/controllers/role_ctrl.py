from fastapi import APIRouter, HTTPException, Query
from repositories import role_repo
from schemas.role_schema import (
    RoleCreate, RoleUpdate, RoleResponse, RoleListResponse,
    PermissionCreate, PermissionResponse, PermissionListResponse,
    RolePermissionAssign, UserRoleAssign, UserWithRoles
)
from typing import List, Optional

router = APIRouter()

# =====================================================
# ROLE ENDPOINTS
# =====================================================

@router.get("/roles", response_model=RoleListResponse)
def get_all_roles():
    """Lấy danh sách tất cả vai trò"""
    try:
        roles = role_repo.get_all_roles()
        # Add permissions to each role
        for role in roles:
            role["permissions"] = role_repo.get_permission_slugs_of_role(role["id"])
        
        return {
            "data": roles,
            "total": len(roles)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/roles/{role_id}")
def get_role_by_id(role_id: int):
    """Lấy chi tiết một vai trò"""
    try:
        role = role_repo.get_role_by_id(role_id)
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        role["permissions"] = role_repo.get_permission_slugs_of_role(role_id)
        return role
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/roles")
def create_role(role: RoleCreate):
    """Tạo vai trò mới"""
    try:
        # Check if slug already exists
        existing = role_repo.get_role_by_slug(role.slug)
        if existing:
            raise HTTPException(status_code=400, detail="Role slug already exists")
        
        new_role = role_repo.create_role(role)
        if not new_role:
            raise HTTPException(status_code=500, detail="Failed to create role")
        
        new_role["permissions"] = []
        return new_role
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/roles/{role_id}")
def update_role(role_id: int, role: RoleUpdate):
    """Cập nhật vai trò"""
    try:
        existing = role_repo.get_role_by_id(role_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Role not found")
        
        # Cannot update system role's core properties
        if existing.get("is_system") and role.slug:
            raise HTTPException(status_code=400, detail="Cannot change system role slug")
        
        updated = role_repo.update_role(role_id, role)
        updated["permissions"] = role_repo.get_permission_slugs_of_role(role_id)
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/roles/{role_id}")
def delete_role(role_id: int):
    """Xóa vai trò"""
    try:
        result = role_repo.delete_role(role_id)
        if result.get("error"):
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# PERMISSION ENDPOINTS
# =====================================================

@router.get("/permissions")
def get_all_permissions(grouped: bool = Query(False, description="Group by module")):
    """Lấy danh sách tất cả quyền"""
    try:
        permissions = role_repo.get_all_permissions()
        
        if grouped:
            grouped_data = role_repo.get_permissions_grouped_by_module()
            return {
                "data": permissions,
                "total": len(permissions),
                "grouped": grouped_data
            }
        
        return {
            "data": permissions,
            "total": len(permissions)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/permissions")
def create_permission(permission: PermissionCreate):
    """Tạo quyền mới (thường không cần dùng, quyền được định nghĩa sẵn)"""
    try:
        existing = role_repo.get_permission_by_slug(permission.slug)
        if existing:
            raise HTTPException(status_code=400, detail="Permission slug already exists")
        
        return role_repo.create_permission(permission)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# ROLE-PERMISSION ENDPOINTS
# =====================================================

@router.get("/roles/{role_id}/permissions")
def get_role_permissions(role_id: int):
    """Lấy danh sách quyền của một vai trò"""
    try:
        role = role_repo.get_role_by_id(role_id)
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        permissions = role_repo.get_permissions_of_role(role_id)
        return {
            "role": role,
            "permissions": permissions,
            "permission_slugs": [p["slug"] for p in permissions]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/roles/{role_id}/permissions")
def assign_permissions_to_role(role_id: int, data: RolePermissionAssign):
    """Gán quyền cho vai trò (thay thế toàn bộ quyền hiện tại)"""
    try:
        role = role_repo.get_role_by_id(role_id)
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        permissions = role_repo.assign_permissions_to_role(role_id, data.permission_slugs)
        return {
            "message": "Permissions assigned successfully",
            "role_id": role_id,
            "permissions": permissions,
            "permission_slugs": [p["slug"] for p in permissions]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# USER-ROLE ENDPOINTS
# =====================================================

@router.get("/users/{user_id}/roles")
def get_user_roles(user_id: str):
    """Lấy danh sách vai trò và quyền của user"""
    try:
        roles = role_repo.get_roles_of_user(user_id)
        all_permissions = role_repo.get_all_permissions_of_user(user_id)
        
        return {
            "user_id": user_id,
            "roles": roles,
            "permissions": all_permissions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/{user_id}/roles")
def assign_roles_to_user(user_id: str, data: UserRoleAssign, assigned_by: str = Query(None)):
    """Gán vai trò cho user (thay thế toàn bộ vai trò hiện tại)"""
    try:
        roles = role_repo.assign_roles_to_user(user_id, data.role_ids, assigned_by)
        all_permissions = role_repo.get_all_permissions_of_user(user_id)
        
        return {
            "message": "Roles assigned successfully",
            "user_id": user_id,
            "roles": roles,
            "permissions": all_permissions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/{user_id}/roles/{role_id}")
def add_role_to_user(user_id: str, role_id: int, assigned_by: str = Query(None)):
    """Thêm một vai trò cho user"""
    try:
        role = role_repo.get_role_by_id(role_id)
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        result = role_repo.add_role_to_user(user_id, role_id, assigned_by)
        return {
            "message": "Role added to user",
            "data": result
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/users/{user_id}/roles/{role_id}")
def remove_role_from_user(user_id: str, role_id: int):
    """Xóa một vai trò khỏi user"""
    try:
        return role_repo.remove_role_from_user(user_id, role_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# PERMISSION CHECK ENDPOINTS
# =====================================================

@router.get("/users/{user_id}/check-permission")
def check_user_permission(user_id: str, permission: str = Query(...)):
    """Kiểm tra user có quyền cụ thể không"""
    try:
        has_permission = role_repo.check_user_permission(user_id, permission)
        return {
            "user_id": user_id,
            "permission": permission,
            "has_permission": has_permission
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/roles/{role_id}/users")
def get_users_with_role(role_id: int):
    """Lấy danh sách user có vai trò cụ thể"""
    try:
        role = role_repo.get_role_by_id(role_id)
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        user_ids = role_repo.get_users_with_role(role_id)
        return {
            "role": role,
            "user_ids": user_ids,
            "total": len(user_ids)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
