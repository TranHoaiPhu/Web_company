"""
Script fix encoding bằng cách decode Latin-1 và encode lại UTF-8
"""
import psycopg2

DB_CONFIG = {
    'host': '136.114.209.133',
    'port': 5432,
    'user': 'postgres',
    'password': 'Nhom11@123',
    'database': 'trip_system'
}

def fix_text(text):
    """Fix encoding của text bị double-encoded"""
    if not text or not any(c in text for c in ['Ã', 'á»', 'Ä', 'Æ°', 'á»']):
        return text
    try:
        # Text hiện tại đang là UTF-8 nhưng bị encode từ Latin-1
        # Decode về bytes Latin-1, rồi decode đúng UTF-8
        return text.encode('latin-1').decode('utf-8')
    except:
        return text

def fix_tours():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.set_client_encoding('UTF8')
    cursor = conn.cursor()
    
    print("🔄 Fix bảng TOURS...")
    cursor.execute("SELECT id, name, short_description, description, highlights, included_services, excluded_services, terms_conditions, cancellation_policy, transportation_type, departure_location, return_location FROM tours")
    tours = cursor.fetchall()
    
    fixed_count = 0
    for tour in tours:
        tour_id = tour[0]
        fixed_values = [fix_text(str(val) if val else None) for val in tour[1:]]
        
        cursor.execute("""
            UPDATE tours SET 
                name = %s,
                short_description = %s,
                description = %s,
                highlights = %s,
                included_services = %s,
                excluded_services = %s,
                terms_conditions = %s,
                cancellation_policy = %s,
                transportation_type = %s,
                departure_location = %s,
                return_location = %s
            WHERE id = %s
        """, (*fixed_values, tour_id))
        fixed_count += 1
    
    print(f"  ✓ Fixed {fixed_count} tours")
    conn.commit()
    cursor.close()
    conn.close()

def fix_users():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.set_client_encoding('UTF8')
    cursor = conn.cursor()
    
    print("🔄 Fix bảng USERS...")
    cursor.execute("SELECT id, full_name, address FROM users")
    users = cursor.fetchall()
    
    fixed_count = 0
    for user in users:
        cursor.execute("""
            UPDATE users SET 
                full_name = %s,
                address = %s
            WHERE id = %s
        """, (fix_text(user[1]), fix_text(user[2]) if user[2] else None, user[0]))
        fixed_count += 1
    
    print(f"  ✓ Fixed {fixed_count} users")
    conn.commit()
    cursor.close()
    conn.close()

def fix_places():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.set_client_encoding('UTF8')
    cursor = conn.cursor()
    
    print("🔄 Fix bảng PLACES...")
    cursor.execute("SELECT id, name, description, address FROM places")
    places = cursor.fetchall()
    
    fixed_count = 0
    for place in places:
        cursor.execute("""
            UPDATE places SET 
                name = %s,
                description = %s,
                address = %s
            WHERE id = %s
        """, (fix_text(place[1]), fix_text(place[2]) if place[2] else None, fix_text(place[3]) if place[3] else None, place[0]))
        fixed_count += 1
    
    print(f"  ✓ Fixed {fixed_count} places")
    conn.commit()
    cursor.close()
    conn.close()

def fix_categories():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.set_client_encoding('UTF8')
    cursor = conn.cursor()
    
    print("🔄 Fix bảng TOUR_CATEGORIES...")
    cursor.execute("SELECT id, name, description FROM tour_categories")
    cats = cursor.fetchall()
    
    fixed_count = 0
    for cat in cats:
        cursor.execute("""
            UPDATE tour_categories SET 
                name = %s,
                description = %s
            WHERE id = %s
        """, (fix_text(cat[1]), fix_text(cat[2]) if cat[2] else None, cat[0]))
        fixed_count += 1
    
    print(f"  ✓ Fixed {fixed_count} categories")
    conn.commit()
    cursor.close()
    conn.close()

def fix_locations():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.set_client_encoding('UTF8')
    cursor = conn.cursor()
    
    print("🔄 Fix bảng LOCATIONS...")
    cursor.execute("SELECT id, name, description FROM locations")
    locs = cursor.fetchall()
    
    fixed_count = 0
    for loc in locs:
        cursor.execute("""
            UPDATE locations SET 
                name = %s,
                description = %s
            WHERE id = %s
        """, (fix_text(loc[1]), fix_text(loc[2]) if loc[2] else None, loc[0]))
        fixed_count += 1
    
    print(f"  ✓ Fixed {fixed_count} locations")
    conn.commit()
    cursor.close()
    conn.close()

def fix_tour_days():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.set_client_encoding('UTF8')
    cursor = conn.cursor()
    
    print("🔄 Fix bảng TOUR_DAYS...")
    cursor.execute("SELECT id, title, description, accommodation, meals FROM tour_days")
    days = cursor.fetchall()
    
    fixed_count = 0
    for day in days:
        cursor.execute("""
            UPDATE tour_days SET 
                title = %s,
                description = %s,
                accommodation = %s,
                meals = %s
            WHERE id = %s
        """, (fix_text(day[1]), fix_text(day[2]) if day[2] else None, fix_text(day[3]) if day[3] else None, fix_text(day[4]) if day[4] else None, day[0]))
        fixed_count += 1
    
    print(f"  ✓ Fixed {fixed_count} tour days")
    conn.commit()
    cursor.close()
    conn.close()

def verify_results():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.set_client_encoding('UTF8')
    cursor = conn.cursor()
    
    print("\n" + "="*60)
    print("KIỂM TRA KẾT QUẢ SAU KHI FIX:")
    print("="*60)
    
    cursor.execute("SELECT id, name, short_description FROM tours ORDER BY id LIMIT 3")
    tours = cursor.fetchall()
    print("\n📋 Tours:")
    for tour in tours:
        print(f"  [{tour[0]}] {tour[1]}")
        if tour[2]:
            print(f"      {tour[2]}")
    
    cursor.execute("SELECT id, full_name FROM users WHERE id <= 4 ORDER BY id")
    users = cursor.fetchall()
    print("\n👤 Users:")
    for user in users:
        print(f"  [{user[0]}] {user[1]}")
    
    cursor.execute("SELECT id, name FROM places ORDER BY id LIMIT 5")
    places = cursor.fetchall()
    print("\n📍 Places:")
    for place in places:
        print(f"  [{place[0]}] {place[1]}")
    
    cursor.execute("SELECT id, name FROM tour_categories ORDER BY id")
    cats = cursor.fetchall()
    print("\n🏷️  Categories:")
    for cat in cats:
        print(f"  [{cat[0]}] {cat[1]}")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    print("="*60)
    print("  FIX ENCODING TIẾNG VIỆT - METHOD 2")
    print("="*60)
    print()
    
    try:
        fix_tours()
        fix_users()
        fix_places()
        fix_categories()
        fix_locations()
        fix_tour_days()
        
        verify_results()
        
        print("\n" + "="*60)
        print("✅ HOÀN THÀNH! Vui lòng kiểm tra lại trên website.")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()
