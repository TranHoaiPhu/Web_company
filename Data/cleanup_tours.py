"""
Dọn dẹp database - Xóa các tour test và giữ lại tour chất lượng
"""
import psycopg2

DB_CONFIG = {
    'host': '136.114.209.133',
    'port': 5432,
    'user': 'postgres',
    'password': 'Nhom11@123',
    'database': 'trip_system'
}

# Danh sách ID tour test cần xóa
TEST_TOUR_IDS = [4, 6, 7, 8, 11, 12, 13, 14, 15, 16, 17, 24, 25]

def cleanup_test_tours(conn):
    """Ẩn các tour test bằng cách set status = INACTIVE"""
    cursor = conn.cursor()
    
    print("\n🔒 Ẩn các tour test không cần thiết...")
    
    # Set status = INACTIVE cho các tour test
    cursor.execute("""
        UPDATE tours 
        SET status = 'INACTIVE', is_featured = false
        WHERE id IN (%s)
    """ % ','.join(map(str, TEST_TOUR_IDS)))
    
    affected = cursor.rowcount
    
    conn.commit()
    print(f"  ✓ Đã ẩn {affected} tour test")
    cursor.close()

def update_tour_status(conn):
    """Cập nhật status cho các tour chính thức"""
    cursor = conn.cursor()
    
    print("\n📝 Cập nhật status tours...")
    
    # Set tất cả tour còn lại thành ACTIVE
    cursor.execute("""
        UPDATE tours 
        SET status = 'ACTIVE', 
            is_featured = CASE 
                WHEN id IN (1, 2, 3, 26, 27, 28) THEN true 
                ELSE false 
            END
        WHERE id NOT IN (%s)
    """ % ','.join(map(str, TEST_TOUR_IDS)))
    
    conn.commit()
    print("  ✓ Đã cập nhật status")
    cursor.close()

def show_final_tours(conn):
    """Hiển thị danh sách tour cuối cùng"""
    cursor = conn.cursor()
    
    print("\n" + "="*70)
    print("DANH SÁCH TOURS CHÍNH THỨC:")
    print("="*70)
    
    cursor.execute("""
        SELECT t.id, t.name, t.base_price, t.duration_days, t.duration_nights,
               t.status, t.is_featured, l.name as location
        FROM tours t
        LEFT JOIN locations l ON t.location_id = l.id
        ORDER BY t.is_featured DESC, t.id
    """)
    
    tours = cursor.fetchall()
    
    featured_count = 0
    total_count = 0
    
    for tour in tours:
        total_count += 1
        featured = "⭐" if tour[6] else "  "
        if tour[6]:
            featured_count += 1
        
        print(f"\n{featured} [{tour[0]:2d}] {tour[1]}")
        print(f"     📍 {tour[7]} | ⏰ {tour[3]}N{tour[4]}Đ | 💰 {float(tour[2]):,.0f}đ | {tour[5]}")
    
    print("\n" + "="*70)
    print(f"✅ TỔNG: {total_count} tours (⭐ {featured_count} featured)")
    print("="*70)
    
    cursor.close()

if __name__ == "__main__":
    print("="*70)
    print("  DỌN DẸP DATABASE - XÓA TOUR TEST")
    print("="*70)
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.set_client_encoding('UTF8')
        
        # 1. Xóa tour test
        cleanup_test_tours(conn)
        
        # 2. Cập nhật status
        update_tour_status(conn)
        
        # 3. Hiển thị kết quả
        show_final_tours(conn)
        
        conn.close()
        
        print("\n✅ HOÀN THÀNH! Database đã được dọn dẹp.")
        print("💡 Tất cả tour đều có encoding UTF-8 chuẩn!")
        
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()
