"""
Fix toàn bộ dữ liệu còn lại bao gồm amenities, banner_slides, tour_images, discount_codes
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
    if not text or not any(c in text for c in ['Ã', 'á»', 'Ä', 'Æ°', 'á»', 'Ä']):
        return text
    try:
        return text.encode('latin-1').decode('utf-8')
    except:
        return text

def fix_all_remaining_tables():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.set_client_encoding('UTF8')
    cursor = conn.cursor()
    
    # Fix AMENITIES
    print("🔄 Fix bảng AMENITIES...")
    cursor.execute("SELECT id, name, description FROM amenities")
    items = cursor.fetchall()
    for item in items:
        cursor.execute("UPDATE amenities SET name = %s, description = %s WHERE id = %s",
                      (fix_text(item[1]), fix_text(item[2]) if item[2] else None, item[0]))
    print(f"  ✓ Fixed {len(items)} amenities")
    
    # Fix BANNER_SLIDES
    print("🔄 Fix bảng BANNER_SLIDES...")
    cursor.execute("SELECT id, title, subtitle, description, location, tag, alt_text FROM banner_slides")
    items = cursor.fetchall()
    for item in items:
        cursor.execute("""UPDATE banner_slides SET 
            title = %s, subtitle = %s, description = %s, 
            location = %s, tag = %s, alt_text = %s 
            WHERE id = %s""",
            (fix_text(item[1]), fix_text(item[2]) if item[2] else None, 
             fix_text(item[3]) if item[3] else None, fix_text(item[4]) if item[4] else None,
             fix_text(item[5]) if item[5] else None, fix_text(item[6]) if item[6] else None, item[0]))
    print(f"  ✓ Fixed {len(items)} banner slides")
    
    # Fix TOUR_IMAGES
    print("🔄 Fix bảng TOUR_IMAGES...")
    cursor.execute("SELECT id, alt_text FROM tour_images WHERE alt_text IS NOT NULL")
    items = cursor.fetchall()
    for item in items:
        cursor.execute("UPDATE tour_images SET alt_text = %s WHERE id = %s",
                      (fix_text(item[1]), item[0]))
    print(f"  ✓ Fixed {len(items)} tour images")
    
    # Fix DISCOUNT_CODES
    print("🔄 Fix bảng DISCOUNT_CODES...")
    cursor.execute("SELECT id, name, description FROM discount_codes")
    items = cursor.fetchall()
    for item in items:
        cursor.execute("UPDATE discount_codes SET name = %s, description = %s WHERE id = %s",
                      (fix_text(item[1]), fix_text(item[2]) if item[2] else None, item[0]))
    print(f"  ✓ Fixed {len(items)} discount codes")
    
    # Fix ORDER_AMENITIES
    print("🔄 Fix bảng ORDER_AMENITIES...")
    cursor.execute("SELECT id, amenity_name FROM order_amenities")
    items = cursor.fetchall()
    for item in items:
        cursor.execute("UPDATE order_amenities SET amenity_name = %s WHERE id = %s",
                      (fix_text(item[1]), item[0]))
    print(f"  ✓ Fixed {len(items)} order amenities")
    
    conn.commit()
    
    # Verify lại tất cả
    print("\n" + "="*60)
    print("KIỂM TRA TOÀN BỘ DATABASE:")
    print("="*60)
    
    cursor.execute("SELECT id, name FROM tours ORDER BY id LIMIT 5")
    print("\n📋 Tours:")
    for row in cursor.fetchall():
        print(f"  [{row[0]}] {row[1]}")
    
    cursor.execute("SELECT id, name FROM amenities ORDER BY id LIMIT 5")
    print("\n🛏️  Amenities:")
    for row in cursor.fetchall():
        print(f"  [{row[0]}] {row[1]}")
    
    cursor.execute("SELECT id, title FROM banner_slides ORDER BY id LIMIT 3")
    print("\n🎨 Banner Slides:")
    for row in cursor.fetchall():
        print(f"  [{row[0]}] {row[1]}")
    
    cursor.execute("SELECT id, name FROM locations ORDER BY id LIMIT 5")
    print("\n🌍 Locations:")
    for row in cursor.fetchall():
        print(f"  [{row[0]}] {row[1]}")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    print("="*60)
    print("  FIX CÁC BẢNG CÒN LẠI")
    print("="*60)
    print()
    
    try:
        fix_all_remaining_tables()
        
        print("\n" + "="*60)
        print("✅ ĐÃ FIX XONG TẤT CẢ CÁC BẢNG!")
        print("="*60)
        print("\n💡 Giờ bạn có thể:")
        print("   1. Reload lại website")
        print("   2. Kiểm tra hiển thị tiếng Việt")
        print("   3. Nếu vẫn lỗi, có thể cần clear cache trình duyệt")
        
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()
