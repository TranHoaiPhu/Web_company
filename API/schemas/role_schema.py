from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# =====================================================
# ROLE SCHEMAS
# =====================================================

class RoleBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    is_active: bool = True

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class RoleResponse(RoleBase):
    id: int
    is_system: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    permissions: Optional[List[str]] = []  # List of permission slugs

    class Config:
        from_attributes = True

# =====================================================
# PERMISSION SCHEMAS
# =====================================================

class PermissionBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    module: str

class PermissionCreate(PermissionBase):
    pass

class PermissionUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    module: Optional[str] = None
    is_active: Optional[bool] = None

class PermissionResponse(PermissionBase):
    id: int
    is_active: bool = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PermissionGrouped(BaseModel):
    module: str
    permissions: List[PermissionResponse]

# =====================================================
# ROLE_PERMISSION SCHEMAS
# =====================================================

class RolePermissionAssign(BaseModel):
    role_id: int
    permission_slugs: List[str]  # List of permission slugs to assign

class RolePermissionResponse(BaseModel):
    role_id: int
    permission_id: int
    created_at: Optional[datetime] = None

# =====================================================
# USER_ROLE SCHEMAS
# =====================================================

class UserRoleAssign(BaseModel):
    user_id: str
    role_ids: List[int]  # List of role IDs to assign to user

class UserRoleResponse(BaseModel):
    id: int
    user_id: str
    role_id: int
    assigned_by: Optional[str] = None
    assigned_at: Optional[datetime] = None

class UserWithRoles(BaseModel):
    user_id: str
    name: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None
    roles: List[RoleResponse] = []
    permissions: List[str] = []  # All permissions from all roles

# =====================================================
# RESPONSE SCHEMAS
# =====================================================

class RoleListResponse(BaseModel):
    data: List[RoleResponse]
    total: int

class PermissionListResponse(BaseModel):
    data: List[PermissionResponse]
    total: int
    grouped: Optional[List[PermissionGrouped]] = None
