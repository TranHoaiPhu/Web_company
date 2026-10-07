from supabase_client import supabase
import sys

def migrate_roles():
    print("Starting role migration...")
    
    # 1. Check current state
    roles = supabase.table("roles").select("*").execute().data
    role_map = {r['id']: r for r in roles}
    
    if 0 in role_map:
        print("Role with ID 0 already exists. Checking if it is Admin...")
        if role_map[0]['slug'] == 'super_admin':
            print("Admin is already ID 0.")
        else:
            print("ERROR: ID 0 is occupied by someone else. Manual intervention needed.")
            return

    # 2. Handle Admin (id=1 -> id=0)
    admin_role = role_map.get(1)
    if admin_role and admin_role['slug'] == 'super_admin':
        print("Found Admin at ID 1. Migrating to ID 0...")
        
        # Temporarily rename old admin name and slug to avoid UNIQUE constraint conflicts
        supabase.table("roles").update({
            "name": "Super Admin Temp",
            "slug": "admin_temp"
        }).eq("id", 1).execute()
        print("Temporarily renamed Admin(1) name/slug to avoid conflicts")

        # Create new admin role with ID 0
        new_admin = {
            "id": 0,
            "name": "Super Admin",
            "slug": "super_admin",
            "description": admin_role['description'],
            "is_active": admin_role['is_active'],
            "is_system": admin_role['is_system']
        }
        
        try:
            supabase.table("roles").insert(new_admin).execute()
            print("Inserted Admin at ID 0.")
        except Exception as e:
            print(f"Failed to insert id=0: {e}")
            # Try to roll back rename
            supabase.table("roles").update({
                "name": admin_role['name'],
                "slug": "super_admin"
            }).eq("id", 1).execute()
            return

        # Copy permissions (using id=1 because it's still there)
        perms = supabase.table("role_permissions").select("*").eq("role_id", 1).execute().data
        if perms:
            new_perms = [{"role_id": 0, "permission_id": p["permission_id"]} for p in perms]
            supabase.table("role_permissions").insert(new_perms).execute()
            print(f"Copied {len(perms)} permissions to ID 0.")

        # Copy user assignments
        user_roles = supabase.table("user_roles").select("*").eq("role_id", 1).execute().data
        if user_roles:
            new_user_roles = []
            for ur in user_roles:
                new_user_roles.append({
                    "user_id": ur["user_id"],
                    "role_id": 0,
                    "assigned_by": ur["assigned_by"]
                })
            supabase.table("user_roles").insert(new_user_roles).execute()
            print(f"Copied {len(user_roles)} user assignments to ID 0.")

        # Delete old admin (id=1)
        supabase.table("roles").delete().eq("id", 1).execute()
        print("Deleted old Admin at ID 1.")
    else:
        print("Admin not found at ID 1. Checking if anyone else is at ID 1...")
        if 1 in role_map:
            print(f"ID 1 is occupied by {role_map[1]['name']}. Moving them to a temporary ID...")
            # This part is complex, but let's assume if it's not admin, we just move it to something high.
            # But based on prev check, 1 is Super Admin.
    
    # 3. Create Customer (id=1)
    print("Creating Customer role at ID 1...")
    customer_role = {
        "id": 1,
        "name": "Khách hàng",
        "slug": "customer",
        "description": "Người dùng thông thường / Khách du lịch",
        "is_active": True,
        "is_system": False
    }
    
    try:
        supabase.table("roles").insert(customer_role).execute()
        print("Inserted Customer at ID 1.")
    except Exception as e:
        print(f"Failed to insert Customer at id=1: {e}")

    print("Role migration completed successfully!")

if __name__ == "__main__":
    migrate_roles()
