from supabase_client import supabase

def seed_banner_permissions():
    print("Seeding banner permissions...")
    
    permissions = [
        {
            "name": "Xem quảng cáo",
            "slug": "banners_view",
            "description": "Xem danh sách và chi tiết các banner quảng cáo",
            "module": "banners",
            "is_active": True
        },
        {
            "name": "Quản lý quảng cáo",
            "slug": "banners_manage",
            "description": "Toàn quyền Thêm, Sửa, Xóa banner quảng cáo",
            "module": "banners",
            "is_active": True
        }
    ]
    
    for perm in permissions:
        # Check if exists
        existing = supabase.table("permissions").select("*").eq("slug", perm["slug"]).execute()
        
        if not existing.data:
            print(f"Adding permission: {perm['slug']}")
            supabase.table("permissions").insert(perm).execute()
        else:
            print(f"Updating permission: {perm['slug']}")
            supabase.table("permissions").update(perm).eq("slug", perm["slug"]).execute()

    # Also make sure super_admin has these permissions
    super_admin_role = supabase.table("roles").select("id").eq("slug", "super_admin").execute()
    if super_admin_role.data:
        role_id = super_admin_role.data[0]["id"]
        
        all_perms = supabase.table("permissions").select("id").filter("slug", "in", "(banners_view,banners_manage)").execute()
        
        if all_perms.data:
            role_perms = []
            for p in all_perms.data:
                role_perms.append({
                    "role_id": role_id,
                    "permission_id": p["id"]
                })
            
            for rp in role_perms:
                 # Check if role already has this permission
                 existing_rp = supabase.table("role_permissions").select("*")\
                     .eq("role_id", rp["role_id"])\
                     .eq("permission_id", rp["permission_id"]).execute()
                 
                 if not existing_rp.data:
                     supabase.table("role_permissions").insert(rp).execute()
                     print(f"Assigned permission {rp['permission_id']} to super_admin")

    print("Banner permissions seeded successfully!")

if __name__ == "__main__":
    seed_banner_permissions()
