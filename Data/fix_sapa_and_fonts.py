"""
Fix hình ảnh Sa Pa và quét toàn bộ lỗi font tiếng Việt
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
        return text.encode('latin-1').decode('utf-8')
    except:
        return text

def update_sapa_image(conn):
    """Cập nhật hình ảnh cho tour Sa Pa"""
    cursor = conn.cursor()
    print("\n🖼️  Cập nhật hình ảnh tour Sa Pa...")
    
    # Hình ảnh Sa Pa chất lượng cao
    sapa_image = 'https://images.unsplash.com/photo-1583396095097-dc8e0c647b63?w=1920&q=80'
    
    # Update tour images
    cursor.execute("""
        UPDATE tour_images 
        SET image_url = %s, alt_text = 'Sa Pa - Fansipan'
        WHERE tour_id = 3
    """, (sapa_image,))
    
    print(f"  ✓ Đã cập nhật hình ảnh Sa Pa")
    conn.commit()
    cursor.close()

def fix_all_encoding(conn):
    """Fix encoding cho TẤT CẢ bảng - chạy nhiều lần để đảm bảo"""
    cursor = conn.cursor()
    print("\n🔧 Fix encoding toàn bộ database...")
    
    # 1. TOURS
    print("  → Tours...")
    cursor.execute("SELECT id, name, short_description, description, highlights, included_services, excluded_services, terms_conditions, cancellation_policy, transportation_type, departure_location, return_location FROM tours")
    for tour in cursor.fetchall():
        cursor.execute("""
            UPDATE tours SET 
                name = %s, short_description = %s, description = %s,
                highlights = %s, included_services = %s, excluded_services = %s,
                terms_conditions = %s, cancellation_policy = %s,
                transportation_type = %s, departure_location = %s, return_location = %s
            WHERE id = %s
        """, (
            fix_text(tour[1]), 
            fix_text(tour[2]) if tour[2] else None,
            fix_text(tour[3]) if tour[3] else None,
            fix_text(tour[4]) if tour[4] else None,
            fix_text(tour[5]) if tour[5] else None,
            fix_text(tour[6]) if tour[6] else None,
            fix_text(tour[7]) if tour[7] else None,
            fix_text(tour[8]) if tour[8] else None,
            fix_text(tour[9]) if tour[9] else None,
            fix_text(tour[10]) if tour[10] else None,
            fix_text(tour[11]) if tour[11] else None,
            tour[0]
        ))
    
    # 2. USERS
    print("  → Users...")
    cursor.execute("SELECT id, full_name, address FROM users")
    for user in cursor.fetchall():
        cursor.execute("UPDATE users SET full_name = %s, address = %s WHERE id = %s",
                      (fix_text(user[1]), fix_text(user[2]) if user[2] else None, user[0]))
    
    # 3. PLACES
    print("  → Places...")
    cursor.execute("SELECT id, name, description, address FROM places")
    for place in cursor.fetchall():
        cursor.execute("UPDATE places SET name = %s, description = %s, address = %s WHERE id = %s",
                      (fix_text(place[1]), fix_text(place[2]) if place[2] else None, 
                       fix_text(place[3]) if place[3] else None, place[0]))
    
    # 4. TOUR_CATEGORIES
    print("  → Categories...")
    cursor.execute("SELECT id, name, description FROM tour_categories")
    for cat in cursor.fetchall():
        cursor.execute("UPDATE tour_categories SET name = %s, description = %s WHERE id = %s",
                      (fix_text(cat[1]), fix_text(cat[2]) if cat[2] else None, cat[0]))
    
    # 5. LOCATIONS
    print("  → Locations...")
    cursor.execute("SELECT id, name, description FROM locations")
    for loc in cursor.fetchall():
        cursor.execute("UPDATE locations SET name = %s, description = %s WHERE id = %s",
                      (fix_text(loc[1]), fix_text(loc[2]) if loc[2] else None, loc[0]))
    
    # 6. TOUR_DAYS
    print("  → Tour Days...")
    cursor.execute("SELECT id, title, description, accommodation, meals FROM tour_days")
    for day in cursor.fetchall():
        cursor.execute("UPDATE tour_days SET title = %s, description = %s, accommodation = %s, meals = %s WHERE id = %s",
                      (fix_text(day[1]), fix_text(day[2]) if day[2] else None,
                       fix_text(day[3]) if day[3] else None, fix_text(day[4]) if day[4] else None, day[0]))
    
    # 7. AMENITIES
    print("  → Amenities...")
    cursor.execute("SELECT id, name, description FROM amenities")
    for item in cursor.fetchall():
        cursor.execute("UPDATE amenities SET name = %s, description = %s WHERE id = %s",
                      (fix_text(item[1]), fix_text(item[2]) if item[2] else None, item[0]))
    
    # 8. BANNER_SLIDES
    print("  → Banner Slides...")
    cursor.execute("SELECT id, title, subtitle, description, location, tag, alt_text FROM banner_slides")
    for item in cursor.fetchall():
        cursor.execute("""UPDATE banner_slides SET 
            title = %s, subtitle = %s, description = %s, location = %s, tag = %s, alt_text = %s 
            WHERE id = %s""",
            (fix_text(item[1]), fix_text(item[2]) if item[2] else None,
             fix_text(item[3]) if item[3] else None, fix_text(item[4]) if item[4] else None,
             fix_text(item[5]) if item[5] else None, fix_text(item[6]) if item[6] else None, item[0]))
    
    # 9. TOUR_IMAGES
    print("  → Tour Images...")
    cursor.execute("SELECT id, alt_text FROM tour_images WHERE alt_text IS NOT NULL")
    for item in cursor.fetchall():
        cursor.execute("UPDATE tour_images SET alt_text = %s WHERE id = %s",
                      (fix_text(item[1]), item[0]))
    
    # 10. DISCOUNT_CODES
    print("  → Discount Codes...")
    cursor.execute("SELECT id, name, description FROM discount_codes")
    for item in cursor.fetchall():
        cursor.execute("UPDATE discount_codes SET name = %s, description = %s WHERE id = %s",
                      (fix_text(item[1]), fix_text(item[2]) if item[2] else None, item[0]))
    
    conn.commit()
    print("  ✓ Hoàn thành fix encoding")
    cursor.close()

def verify_all_active_tours(conn):
    """Kiểm tra chi tiết tất cả tours ACTIVE"""
    cursor = conn.cursor()
    
    print("\n" + "="*70)
    print("KIỂM TRA TẤT CẢ TOURS ACTIVE:")
    print("="*70)
    
    cursor.execute("""
        SELECT t.id, t.name, t.short_description, t.base_price,
               t.duration_days, t.duration_nights, l.name as location,
               t.is_featured, ti.image_url
        FROM tours t
        LEFT JOIN locations l ON t.location_id = l.id
        LEFT JOIN tour_images ti ON t.id = ti.tour_id AND ti.is_cover = true
        WHERE t.status = 'ACTIVE'
        ORDER BY t.is_featured DESC, t.id
    """)
    
    tours = cursor.fetchall()
    
    for idx, tour in enumerate(tours, 1):
        featured = "⭐" if tour[7] else "  "
        print(f"\n{featured} [{tour[0]:2d}] {tour[1]}")
        print(f"     📍 {tour[6]} | ⏰ {tour[4]}N{tour[5]}Đ | 💰 {float(tour[3]):,.0f}đ")
        print(f"     📝 {tour[2][:70]}...")
        
        # Kiểm tra hình ảnh
        if tour[8]:
            print(f"     🖼️  {tour[8][:50]}...")
        else:
            print(f"     ⚠️  THIẾU HÌNH ẢNH!")
        
        # Kiểm tra font lỗi
        has_error = False
        for field in [tour[1], tour[2], tour[6]]:
            if field and any(c in str(field) for c in ['Ã', 'á»', 'Ä', 'Æ°']):
                has_error = True
                break
        
        if has_error:
            print(f"     ❌ CÒN LỖI FONT!")
    
    print("\n" + "="*70)
    print(f"✅ TỔNG: {len(tours)} tours ACTIVE")
    print("="*70)
    
    cursor.close()

if __name__ == "__main__":
    print("="*70)
    print("  FIX HÌNH ẢNH SA PA & QUÉT LỖI FONT TOÀN BỘ")
    print("="*70)
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.set_client_encoding('UTF8')
        
        # 1. Update hình ảnh Sa Pa
        update_sapa_image(conn)
        
        # 2. Fix encoding TOÀN BỘ - chạy 3 lần để chắc chắn
        for i in range(3):
            print(f"\n🔄 Lần {i+1}/3 - Fix encoding...")
            fix_all_encoding(conn)
        
        # 3. Verify kết quả
        verify_all_active_tours(conn)
        
        conn.close()
        
        print("\n✅ HOÀN THÀNH!")
        print("   ✓ Đã fix hình ảnh Sa Pa")
        print("   ✓ Đã quét và fix tất cả lỗi font")
        print("\n💡 Reload website (Ctrl+F5) để xem kết quả!")
        
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()
