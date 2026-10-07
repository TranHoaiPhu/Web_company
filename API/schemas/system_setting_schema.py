from pydantic import BaseModel
from typing import Optional, Dict, Any

class SystemSettingBase(BaseModel):
    setting_key: str
    setting_value: str
    setting_group: Optional[str] = "general"

class SystemSettingUpdate(BaseModel):
    settings: Dict[str, Any]
