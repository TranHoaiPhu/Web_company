"""
Fix ảnh bìa cho tour Sa Pa (tour 3)
"""
import psycopg2

DB_CONFIG = {
    'host': '136.114.209.133',
    'port': 5432,
    'user': 'postgres',
    'password': 'Nhom11@123',
    'database': 'trip_system'
}

def fix_sapa_cover_image(conn):
    """Thêm/cập nhật ảnh bìa cho tour Sa Pa"""
    cursor = conn.cursor()
    
    print("\n🔍 Kiểm tra ảnh tour Sa Pa (ID: 3)...")
    
    # Kiểm tra ảnh hiện tại
    cursor.execute("""
        SELECT id, image_url, is_cover 
        FROM tour_images 
        WHERE tour_id = 3
    """)
    
    existing = cursor.fetchall()
    print(f"  → Tìm thấy {len(existing)} ảnh")
    
    for img in existing:
        print(f"     ID {img[0]}: {img[1][:50]}... (Cover: {img[2]})")
    
    # Ảnh Sa Pa đẹp
    sapa_image = 'https://images.unsplash.com/photo-1583396095097-dc8e0c647b63?w=1920&q=80'
    
    if existing:
        # Update ảnh đầu tiên thành cover
        cursor.execute("""
            UPDATE tour_images 
            SET image_url = %s, 
                alt_text = 'Sa Pa - Fansipan 3143m',
                is_cover = true,
                display_order = 1
            WHERE tour_id = 3 AND id = %s
        """, (sapa_image, existing[0][0]))
        
        # Set các ảnh khác thành not cover
        if len(existing) > 1:
            cursor.execute("""
                UPDATE tour_images 
                SET is_cover = false
                WHERE tour_id = 3 AND id != %s
            """, (existing[0][0],))
        
        print(f"\n  ✓ Đã cập nhật ảnh bìa (ID: {existing[0][0]})")
    else:
        # Insert ảnh mới
        cursor.execute("""
            INSERT INTO tour_images (
                tour_id, image_url, alt_text, is_cover, display_order, created_at
            ) VALUES (
                3, %s, 'Sa Pa - Fansipan 3143m', true, 1, CURRENT_TIMESTAMP
            )
        """, (sapa_image,))
        
        print(f"\n  ✓ Đã thêm ảnh bìa mới")
    
    conn.commit()
    
    # Verify
    cursor.execute("""
        SELECT id, image_url, is_cover, display_order
        FROM tour_images 
        WHERE tour_id = 3
        ORDER BY is_cover DESC, display_order
    """)
    
    print("\n📸 Ảnh sau khi cập nhật:")
    for img in cursor.fetchall():
        cover_mark = "🎯" if img[2] else "  "
        print(f"  {cover_mark} ID {img[0]}: Order {img[3]} - {img[1][:60]}...")
    
    cursor.close()

def verify_all_tour_images(conn):
    """Kiểm tra ảnh của tất cả tours"""
    cursor = conn.cursor()
    
    print("\n" + "="*70)
    print("KIỂM TRA ẢNH TẤT CẢ TOURS:")
    print("="*70)
    
    cursor.execute("""
        SELECT t.id, t.name, COUNT(ti.id) as img_count,
               MAX(CASE WHEN ti.is_cover THEN ti.image_url END) as cover_url
        FROM tours t
        LEFT JOIN tour_images ti ON t.id = ti.tour_id
        WHERE t.status = 'ACTIVE'
        GROUP BY t.id, t.name
        ORDER BY t.id
    """)
    
    tours = cursor.fetchall()
    
    for tour in tours:
        has_cover = "✅" if tour[3] else "❌"
        print(f"\n{has_cover} [{tour[0]:2d}] {tour[1]}")
        print(f"     📊 Số ảnh: {tour[2]}")
        if tour[3]:
            print(f"     🎯 Cover: {tour[3][:60]}...")
        else:
            print(f"     ⚠️  THIẾU ẢNH BÌA!")
    
    print("\n" + "="*70)
    
    cursor.close()

if __name__ == "__main__":
    print("="*70)
    print("  FIX ẢNH BÌA TOUR SA PA")
    print("="*70)
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.set_client_encoding('UTF8')
        
        # Fix ảnh Sa Pa
        fix_sapa_cover_image(conn)
        
        # Verify tất cả tours
        verify_all_tour_images(conn)
        
        conn.close()
        
        print("\n✅ HOÀN THÀNH!")
        print("💡 Reload website để thấy ảnh bìa Sa Pa!")
        
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()
