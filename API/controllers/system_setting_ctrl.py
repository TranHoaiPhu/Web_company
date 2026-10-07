from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from schemas import system_setting_schema
from repositories import system_setting_repo
from controllers.auth_ctrl import require_role

router = APIRouter()

@router.get("/")
def get_all_settings():
    """Get all system settings."""
    try:
        return {
            "success": True,
            "data": system_setting_repo.get_all_settings()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching settings: {str(e)}"
        )

@router.put("/")
def update_settings(
    settings_data: system_setting_schema.SystemSettingUpdate,
    current_user=Depends(require_role([0])) # Only super admin can update
):
    """Update multiple system settings."""
    try:
        return {
            "success": True,
            **system_setting_repo.update_settings(settings_data.settings)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating settings: {str(e)}"
        )
