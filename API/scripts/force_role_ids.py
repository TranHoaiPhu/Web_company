from supabase_client import supabase

def fix_roles():
    print("Fixing roles...")
    
    # 1. Get current roles
    roles = supabase.table("roles").select("*").execute().data
    role_map = {r['id']: r for r in roles}
    
    # Identify the admin role (either by slug 'super_admin' or 'admin_temp')
    admin_role = None
    for r in roles:
        if r['slug'] in ['super_admin', 'admin_temp']:
            admin_role = r
            break
            
    if not admin_role:
        print("Admin role not found. Searching for 'Super Admin' name...")
        for r in roles:
            if 'Super Admin' in r['name']:
                admin_role = r
                break
    
    if not admin_role:
        print("COULD NOT FIND ADMIN ROLE. ABORTING.")
        return

    admin_id = admin_role['id']
    print(f"Admin is currently ID {admin_id} ({admin_role['slug']})")

    # 2. Insert ID 0 if not exists
    if 0 not in role_map:
        print("Inserting Admin at ID 0...")
        new_admin = {
            "id": 0,
            "name": "Super Admin",
            "slug": "super_admin",
            "description": "Toàn quyền quản trị hệ thống",
            "is_active": True,
            "is_system": True
        }
        try:
            supabase.table("roles").insert(new_admin).execute()
        except Exception as e:
            print(f"Insert ID 0 failed: {e}")
            # If it failed because of UNIQUE name/slug, we need to rename the old one FIRST
            print("Renaming old admin to free up UNIQUE names...")
            supabase.table("roles").update({"name": "Admin Old", "slug": "admin_old"}).eq("id", admin_id).execute()
            supabase.table("roles").insert(new_admin).execute()
            print("Inserted Admin at ID 0 successfully after renaming old.")
    else:
        print("ID 0 already exists.")

    # 3. Migrate references from old admin to ID 0
    if admin_id != 0:
        print(f"Migrating references from {admin_id} to 0...")
        # Permissions
        perms = supabase.table("role_permissions").select("*").eq("role_id", admin_id).execute().data
        if perms:
            new_perms = []
            for p in perms:
                # Check if 0 already has this perm
                exists = supabase.table("role_permissions").select("*").eq("role_id", 0).eq("permission_id", p["permission_id"]).execute().data
                if not exists:
                    new_perms.append({"role_id": 0, "permission_id": p["permission_id"]})
            if new_perms:
                supabase.table("role_permissions").insert(new_perms).execute()
        
        # User roles
        user_roles = supabase.table("user_roles").select("*").eq("role_id", admin_id).execute().data
        if user_roles:
            new_ur = []
            for ur in user_roles:
                # Check if 0 already assigned
                exists = supabase.table("user_roles").select("*").eq("role_id", 0).eq("user_id", ur["user_id"]).execute().data
                if not exists:
                    new_ur.append({"role_id": 0, "user_id": ur["user_id"], "assigned_by": ur["assigned_by"]})
            if new_ur:
                supabase.table("user_roles").insert(new_ur).execute()
        
        # Delete old admin
        print(f"Deleting old admin (ID {admin_id})...")
        supabase.table("roles").delete().eq("id", admin_id).execute()

    # 4. Handle Customer at ID 1
    roles = supabase.table("roles").select("*").execute().data
    role_map = {r['id']: r for r in roles}
    
    if 1 in role_map:
        r1 = role_map[1]
        if r1['slug'] == 'customer':
            print("Customer already at ID 1.")
        else:
            print(f"ID 1 is occupied by {r1['name']}. Moving them...")
            supabase.table("roles").update({"id": 1001}).eq("id", 1).execute() # This might not work if ID is PK
            # So we better delete and re-insert if it's not a critical role.
            # But wait, updating PK in Supabase client might not be supported.
            # Let's try to just rename it to Customer if it's some temp stuff.
            supabase.table("roles").update({
                "name": "Khách hàng",
                "slug": "customer",
                "description": "Người dùng thông thường / Khách du lịch",
                "is_active": True,
                "is_system": False
            }).eq("id", 1).execute()
            print("Updated ID 1 to Customer.")
    else:
        print("Inserting Customer at ID 1...")
        supabase.table("roles").insert({
            "id": 1,
            "name": "Khách hàng",
            "slug": "customer",
            "description": "Người dùng thông thường",
            "is_active": True,
            "is_system": False
        }).execute()
        print("Inserted Customer at ID 1.")

    print("DONE.")

if __name__ == "__main__":
    fix_roles()
