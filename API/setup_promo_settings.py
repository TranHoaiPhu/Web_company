from supabase_client import supabase

def setup():
    settings = [
        {"setting_key": "new_customer_promo_code", "setting_value": "WELCOME2026", "setting_group": "promotions"},
        {"setting_key": "new_customer_promo_amount", "setting_value": "500000", "setting_group": "promotions"},
    ]
    
    for s in settings:
        res = supabase.table("system_settings").upsert(s, on_conflict="setting_key").execute()
        print(f"Upserted {s['setting_key']}: {res.data}")

if __name__ == "__main__":
    setup()
