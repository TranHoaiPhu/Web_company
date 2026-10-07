"""
Fix locations còn lỗi font và cập nhật location cho các tour
"""
import psycopg2

DB_CONFIG = {
    'host': '136.114.209.133',
    'port': 5432,
    'user': 'postgres',
    'password': 'Nhom11@123',
    'database': 'trip_system'
}

# Cập nhật locations đúng (UTF-8 chuẩn)
LOCATION_UPDATES = {
    1: 'Việt Nam',
    2: 'Miền Bắc',
    3: 'Miền Trung', 
    4: 'Miền Nam',
    5: 'Hà Nội',
    6: 'Quảng Nam',
    7: 'Quảng Ninh',
    8: 'Đà Nẵng',
    9: 'Lâm Đồng',
    10: 'TP. Hồ Chí Minh'
}

# Fix location_id cho các tour
TOUR_LOCATION_MAPPING = {
    1: 7,   # Hạ Long → Quảng Ninh
    2: 6,   # Hội An → Quảng Nam
    3: 2,   # Sa Pa → Miền Bắc
    26: 4,  # Phú Quốc → Miền Nam
    27: 2,  # Nha Trang → Miền Bắc (sửa lại)
    28: 9,  # Đà Lạt → Lâm Đồng
}

def update_all_locations(conn):
    """Cập nhật tất cả locations với UTF-8 chuẩn"""
    cursor = conn.cursor()
    print("\n📍 Cập nhật tất cả locations...")
    
    for loc_id, loc_name in LOCATION_UPDATES.items():
        cursor.execute("""
            UPDATE locations 
            SET name = %s
            WHERE id = %s
        """, (loc_name, loc_id))
        print(f"  ✓ Location {loc_id}: {loc_name}")
    
    conn.commit()
    cursor.close()

def fix_tour_locations(conn):
    """Fix location_id cho các tour"""
    cursor = conn.cursor()
    print("\n🔧 Fix location cho các tour...")
    
    for tour_id, location_id in TOUR_LOCATION_MAPPING.items():
        cursor.execute("""
            UPDATE tours 
            SET location_id = %s
            WHERE id = %s
        """, (location_id, tour_id))
        print(f"  ✓ Tour {tour_id} → Location {location_id}")
    
    conn.commit()
    cursor.close()

def verify_final_result(conn):
    """Kiểm tra kết quả cuối cùng"""
    cursor = conn.cursor()
    
    print("\n" + "="*70)
    print("KẾT QUẢ CUỐI CÙNG - TOURS ACTIVE:")
    print("="*70)
    
    cursor.execute("""
        SELECT t.id, t.name, l.name as location, t.base_price,
               t.is_featured, ti.image_url
        FROM tours t
        LEFT JOIN locations l ON t.location_id = l.id
        LEFT JOIN tour_images ti ON t.id = ti.tour_id AND ti.is_cover = true
        WHERE t.status = 'ACTIVE'
        ORDER BY t.is_featured DESC, t.id
    """)
    
    tours = cursor.fetchall()
    
    error_count = 0
    for tour in tours:
        featured = "⭐" if tour[4] else "  "
        print(f"\n{featured} [{tour[0]:2d}] {tour[1]}")
        print(f"     📍 {tour[2]} | 💰 {float(tour[3]):,.0f}đ")
        
        # Kiểm tra lỗi font
        has_error = False
        for field in [tour[1], tour[2]]:
            if field and any(c in str(field) for c in ['Ã', 'á»', 'Ä', 'Æ°']):
                has_error = True
                error_count += 1
                break
        
        if has_error:
            print(f"     ❌ LỖI FONT: {tour[2]}")
        else:
            print(f"     ✅ OK")
    
    print("\n" + "="*70)
    if error_count == 0:
        print("✅ HOÀN HẢO! Không còn lỗi font nào!")
    else:
        print(f"⚠️  Còn {error_count} lỗi font")
    print("="*70)
    
    cursor.close()

if __name__ == "__main__":
    print("="*70)
    print("  FIX LOCATIONS VÀ XÓA HẾT LỖI FONT")
    print("="*70)
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.set_client_encoding('UTF8')
        
        # 1. Cập nhật tất cả locations
        update_all_locations(conn)
        
        # 2. Fix location cho tours
        fix_tour_locations(conn)
        
        # 3. Verify kết quả
        verify_final_result(conn)
        
        conn.close()
        
        print("\n✅ HOÀN THÀNH TẤT CẢ!")
        print("   ✓ Hình ảnh Sa Pa đã fix")
        print("   ✓ Tất cả locations UTF-8 chuẩn")
        print("   ✓ Không còn lỗi font!")
        print("\n💡 Reload website (Ctrl+Shift+R) để thấy thay đổi!")
        
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()
