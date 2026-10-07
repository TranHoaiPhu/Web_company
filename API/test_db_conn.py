from supabase_client import supabase
print("Testing Supabase connection...")
try:
    res = supabase.table("system_settings").select("count").execute()
    print(f"Success! Count: {res.data}")
except Exception as e:
    print(f"Failed: {e}")
