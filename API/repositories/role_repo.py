from supabase_client import supabase
from schemas.role_schema import RoleCreate, RoleUpdate, PermissionCreate, UserRoleAssign
from typing import List, Optional
from utils.db_utils import with_retry

# =====================================================
# ROLE REPOSITORY
# =====================================================

@with_retry()
def get_all_roles():
    """Lấy tất cả các vai trò"""
    response = supabase.table("roles").select("*").order("id").execute()
    return response.data

def get_role_by_id(role_id: int):
    """Lấy vai trò theo ID"""
    response = supabase.table("roles").select("*").eq("id", role_id).execute()
    return response.data[0] if response.data else None

def get_role_by_slug(slug: str):
    """Lấy vai trò theo slug"""
    response = supabase.table("roles").select("*").eq("slug", slug).execute()
    return response.data[0] if response.data else None

def create_role(role: RoleCreate):
    """Tạo vai trò mới"""
    db_role = {
        "name": role.name,
        "slug": role.slug,
        "description": role.description,
        "is_active": role.is_active,
        "is_system": False
    }
    response = supabase.table("roles").insert(db_role).execute()
    return response.data[0] if response.data else None

def update_role(role_id: int, role: RoleUpdate):
    """Cập nhật vai trò"""
    update_data = {k: v for k, v in role.model_dump(exclude_unset=True).items() if v is not None}
    if not update_data:
        return get_role_by_id(role_id)
    
    response = supabase.table("roles").update(update_data).eq("id", role_id).execute()
    return response.data[0] if response.data else None

def delete_role(role_id: int):
    """Xóa vai trò (không thể xóa vai trò hệ thống)"""
    # Check if this is a system role
    role = get_role_by_id(role_id)
    if role and role.get("is_system"):
        return {"error": "Cannot delete system role"}
    
    supabase.table("roles").delete().eq("id", role_id).execute()
    return {"message": "Role deleted successfully"}

# =====================================================
# PERMISSION REPOSITORY
# =====================================================

def get_all_permissions():
    """Lấy tất cả các quyền"""
    response = supabase.table("permissions").select("*").order("module,id").execute()
    return response.data

def get_permissions_grouped_by_module():
    """Lấy tất cả quyền, nhóm theo module"""
    permissions = get_all_permissions()
    grouped = {}
    for perm in permissions:
        module = perm.get("module", "other")
        if module not in grouped:
            grouped[module] = []
        grouped[module].append(perm)
    return [{"module": k, "permissions": v} for k, v in grouped.items()]

def get_permission_by_id(permission_id: int):
    """Lấy quyền theo ID"""
    response = supabase.table("permissions").select("*").eq("id", permission_id).execute()
    return response.data[0] if response.data else None

def get_permission_by_slug(slug: str):
    """Lấy quyền theo slug"""
    response = supabase.table("permissions").select("*").eq("slug", slug).execute()
    return response.data[0] if response.data else None

def create_permission(permission: PermissionCreate):
    """Tạo quyền mới"""
    db_perm = {
        "name": permission.name,
        "slug": permission.slug,
        "description": permission.description,
        "module": permission.module,
        "is_active": True
    }
    response = supabase.table("permissions").insert(db_perm).execute()
    return response.data[0] if response.data else None

# =====================================================
# ROLE_PERMISSION REPOSITORY
# =====================================================

def get_permissions_of_role(role_id: int):
    """Lấy danh sách quyền của một vai trò"""
    response = supabase.table("role_permissions")\
        .select("permission_id, permissions(*)").eq("role_id", role_id).execute()
    
    permissions = []
    for item in response.data:
        if item.get("permissions"):
            permissions.append(item["permissions"])
    return permissions

def get_permission_slugs_of_role(role_id: int) -> List[str]:
    """Lấy danh sách slug quyền của một vai trò"""
    permissions = get_permissions_of_role(role_id)
    return [p.get("slug") for p in permissions if p.get("slug")]

def assign_permissions_to_role(role_id: int, permission_slugs: List[str]):
    """Gán quyền cho vai trò (thay thế toàn bộ)"""
    # Xóa quyền cũ
    supabase.table("role_permissions").delete().eq("role_id", role_id).execute()
    
    if not permission_slugs:
        return []
    
    # Lấy ID của các permission từ slug
    all_permissions = get_all_permissions()
    perm_map = {p["slug"]: p["id"] for p in all_permissions}
    
    # Thêm quyền mới
    new_records = []
    for slug in permission_slugs:
        if slug in perm_map:
            new_records.append({
                "role_id": role_id,
                "permission_id": perm_map[slug]
            })
    
    if new_records:
        supabase.table("role_permissions").insert(new_records).execute()
    
    return get_permissions_of_role(role_id)

# =====================================================
# USER_ROLE REPOSITORY
# =====================================================

@with_retry()
def get_roles_of_user(user_id: str):
    """Lấy danh sách vai trò của user"""
    response = supabase.table("user_roles")\
        .select("role_id, roles(*)").eq("user_id", user_id).execute()
    
    roles = []
    for item in response.data:
        if item.get("roles"):
            role = item["roles"]
            role["permissions"] = get_permission_slugs_of_role(role["id"])
            roles.append(role)
    return roles

@with_retry()
def get_all_permissions_of_user(user_id: str) -> List[str]:
    """Lấy tất cả quyền của user từ tất cả các vai trò"""
    roles = get_roles_of_user(user_id)
    permissions = set()
    for role in roles:
        for perm in role.get("permissions", []):
            permissions.add(perm)
    return list(permissions)

def assign_roles_to_user(user_id: str, role_ids: List[int], assigned_by: str = None):
    """Gán vai trò cho user (thay thế toàn bộ)"""
    # Xóa vai trò cũ
    supabase.table("user_roles").delete().eq("user_id", user_id).execute()
    
    if not role_ids:
        return []
    
    # Thêm vai trò mới
    new_records = []
    for role_id in role_ids:
        new_records.append({
            "user_id": user_id,
            "role_id": role_id,
            "assigned_by": assigned_by
        })
    
    if new_records:
        supabase.table("user_roles").insert(new_records).execute()
    
    return get_roles_of_user(user_id)

def add_role_to_user(user_id: str, role_id: int, assigned_by: str = None):
    """Thêm một vai trò cho user"""
    # Check if already assigned
    existing = supabase.table("user_roles")\
        .select("*").eq("user_id", user_id).eq("role_id", role_id).execute()
    
    if existing.data:
        return existing.data[0]
    
    new_record = {
        "user_id": user_id,
        "role_id": role_id,
        "assigned_by": assigned_by
    }
    response = supabase.table("user_roles").insert(new_record).execute()
    return response.data[0] if response.data else None

def remove_role_from_user(user_id: str, role_id: int):
    """Xóa một vai trò khỏi user"""
    supabase.table("user_roles").delete()\
        .eq("user_id", user_id).eq("role_id", role_id).execute()
    return {"message": "Role removed from user"}

def get_users_with_role(role_id: int):
    """Lấy danh sách user có một vai trò cụ thể"""
    response = supabase.table("user_roles").select("user_id").eq("role_id", role_id).execute()
    return [item["user_id"] for item in response.data]

def check_user_permission(user_id: str, permission_slug: str) -> bool:
    """Kiểm tra user có quyền cụ thể không"""
    permissions = get_all_permissions_of_user(user_id)
    return permission_slug in permissions

def check_user_has_any_permission(user_id: str, permission_slugs: List[str]) -> bool:
    """Kiểm tra user có ít nhất một trong các quyền"""
    permissions = get_all_permissions_of_user(user_id)
    return any(p in permissions for p in permission_slugs)
