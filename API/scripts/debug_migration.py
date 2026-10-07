from supabase_client import supabase

def debug():
    print("--- ROLES BEFORE ---")
    roles = supabase.table('roles').select('id, name, slug').execute().data
    for r in roles:
        print(f"ID: {r['id']}, Name: {r['name']}, Slug: {r['slug']}")
    
    # Try to rename id=1
    print("\nAttempting to rename ID 1 slug to 'admin_temp'...")
    res = supabase.table('roles').update({"slug": "admin_temp"}).eq("id", 1).execute()
    print(f"Update Result: {res.data}")
    
    print("\n--- ROLES AFTER RENAME ---")
    roles = supabase.table('roles').select('id, name, slug').execute().data
    for r in roles:
        print(f"ID: {r['id']}, Name: {r['name']}, Slug: {r['slug']}")

    # Try to insert ID 0
    print("\nAttempting to insert ID 0 slug 'super_admin'...")
    new_admin = {"id": 0, "name": "Super Admin", "slug": "super_admin", "is_system": True}
    res = supabase.table('roles').insert(new_admin).execute()
    print(f"Insert Result: {res.data}")

if __name__ == "__main__":
    debug()
