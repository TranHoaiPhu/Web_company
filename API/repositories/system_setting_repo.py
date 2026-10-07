from supabase_client import supabase
from typing import Dict, Any

def get_all_settings():
    response = supabase.table("system_settings").select("setting_key, setting_value").execute()
    
    settings = {}
    for row in response.data:
        val = row["setting_value"]
        if val.lower() == "true":
            settings[row["setting_key"]] = True
        elif val.lower() == "false":
            settings[row["setting_key"]] = False
        else:
            settings[row["setting_key"]] = val
            
    return settings

def update_settings(settings: Dict[str, Any]):
    for key, value in settings.items():
        supabase.table("system_settings").upsert({
            "setting_key": key,
            "setting_value": str(value).lower() if isinstance(value, bool) else str(value)
        }, on_conflict="setting_key").execute()
    
    return {"message": "Settings updated successfully"}
