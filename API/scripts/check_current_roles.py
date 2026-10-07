from supabase_client import supabase
import json

def get_current_data():
    roles = supabase.table("roles").select("*").execute().data
    user_roles = supabase.table("user_roles").select("*").execute().data
    role_perms = supabase.table("role_permissions").select("*").execute().data
    
    print("--- ROLES ---")
    print(json.dumps(roles, indent=2))
    print("\n--- USER_ROLES ---")
    print(json.dumps(user_roles, indent=2))
    print("\n--- ROLE_PERMISSIONS ---")
    print(json.dumps(role_perms, indent=2))

if __name__ == "__main__":
    get_current_data()
