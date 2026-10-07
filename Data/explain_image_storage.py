"""
Kiểm tra cách lưu trữ ảnh bìa tour
"""
import psycopg2

DB_CONFIG = {
    'host': '136.114.209.133',
    'port': 5432,
    'user': 'postgres',
    'password': 'Nhom11@123',
    'database': 'trip_system'
}

def show_tour_images_structure(conn):
    """Hiển thị cấu trúc bảng tour_images"""
    cursor = conn.cursor()
    
    print("="*70)
    print("CẤU TRÚC BẢNG TOUR_IMAGES")
    print("="*70)
    
    cursor.execute("""
        SELECT 
            column_name, 
            data_type, 
            character_maximum_length,
            is_nullable,
            column_default
        FROM information_schema.columns
        WHERE table_name = 'tour_images'
        ORDER BY ordinal_position
    """)
    
    print("\n📋 Các cột trong bảng:")
    for col in cursor.fetchall():
        nullable = "NULL" if col[3] == 'YES' else "NOT NULL"
        default = f" DEFAULT {col[4]}" if col[4] else ""
        max_len = f"({col[2]})" if col[2] else ""
        print(f"  • {col[0]:20s} {col[1]}{max_len:15s} {nullable}{default}")
    
    cursor.close()

def show_sample_images(conn):
    """Hiển thị mẫu dữ liệu ảnh"""
    cursor = conn.cursor()
    
    print("\n" + "="*70)
    print("VÍ DỤ DỮ LIỆU ẢNH BÌA")
    print("="*70)
    
    cursor.execute("""
        SELECT 
            ti.id,
            ti.tour_id,
            t.name as tour_name,
            ti.image_url,
            ti.alt_text,
            ti.is_cover,
            ti.display_order
        FROM tour_images ti
        JOIN tours t ON ti.tour_id = t.id
        WHERE ti.is_cover = true AND t.status = 'ACTIVE'
        ORDER BY ti.tour_id
        LIMIT 5
    """)
    
    print("\n🖼️  Ảnh bìa của 5 tours đầu tiên:")
    for img in cursor.fetchall():
        print(f"\n  📌 Tour [{img[1]}] {img[2]}")
        print(f"     ID: {img[0]}")
        print(f"     URL: {img[3]}")
        print(f"     Alt: {img[4]}")
        print(f"     Is Cover: {img[5]}")
        print(f"     Order: {img[6]}")
    
    cursor.close()

def explain_storage_system():
    """Giải thích hệ thống lưu trữ"""
    print("\n" + "="*70)
    print("GIẢI THÍCH HỆ THỐNG LƯU TRỮ ẢNH")
    print("="*70)
    
    print("""
📊 CÁCH LƯU TRỮ:

1. 📁 DATABASE (PostgreSQL):
   • Bảng: tour_images
   • Lưu: URL của ảnh (không lưu file)
   • Các field quan trọng:
     - tour_id: ID của tour
     - image_url: URL đầy đủ của ảnh (TEXT)
     - is_cover: Đánh dấu ảnh bìa (BOOLEAN)
     - display_order: Thứ tự hiển thị (INTEGER)
     - alt_text: Mô tả ảnh cho SEO

2. 🌐 FILE ẢNH THỰC TẾ:
   • Không lưu trên server dự án
   • Lưu trên CDN bên ngoài:
     
     a) Unsplash (miễn phí):
        https://images.unsplash.com/photo-xxxxx?w=1920&q=80
        ✓ Hình ảnh chất lượng cao
        ✓ Không giới hạn bandwidth
        ✓ CDN toàn cầu
     
     b) Cloudinary (có sẵn):
        https://res.cloudinary.com/dehehzz2t/image/upload/v...
        ✓ Upload tùy chỉnh
        ✓ Resize, crop tự động
        ✓ Có account: dehehzz2t

3. 🎯 ẢNH BÌA (Cover Image):
   • Mỗi tour có 1 ảnh bìa chính
   • Được đánh dấu: is_cover = true
   • Hiển thị trong:
     - Danh sách tours
     - Card preview
     - Banner
   
4. 📸 ẢNH PHỤ (Additional Images):
   • Mỗi tour có thể có nhiều ảnh
   • is_cover = false
   • display_order: 2, 3, 4...
   • Hiển thị trong:
     - Gallery chi tiết tour
     - Slider ảnh

5. 🔄 FLOW XỬ LÝ:
   Backend API → Query tour_images → Trả URL
   Frontend → Nhận URL → <img src="URL" />
   Browser → Load ảnh từ CDN

6. 📂 VỊ TRÍ TRONG SOURCE CODE:
   
   Database Schema:
   └── Data/
       ├── data_ne_cloud_v2.sql (có định nghĩa bảng)
       └── CREATE TABLE tour_images (...)
   
   Backend API:
   └── API/
       ├── controllers/place_image_ctrl.py
       └── repositories/place_image_repo.py
   
   Frontend:
   └── ai_trip_system/
       └── src/components/
           └── Các component hiển thị ảnh

7. ⚡ LỢI ÍCH CỦA CÁCH NÀY:
   ✓ Không tốn dung lượng server
   ✓ Load nhanh qua CDN
   ✓ Dễ scale
   ✓ Dễ thay đổi ảnh (chỉ update URL)
   ✓ Không cần xử lý upload file

8. 🛠️ CÁCH THÊM/SỬA ẢNH:
   
   Thêm ảnh mới:
   INSERT INTO tour_images (tour_id, image_url, is_cover, ...) 
   VALUES (3, 'https://...', true, ...);
   
   Sửa ảnh bìa:
   UPDATE tour_images 
   SET image_url = 'https://new-url...'
   WHERE tour_id = 3 AND is_cover = true;
""")

if __name__ == "__main__":
    print("="*70)
    print("  HỆ THỐNG LƯU TRỮ ẢNH TOUR")
    print("="*70)
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.set_client_encoding('UTF8')
        
        # 1. Hiển thị cấu trúc bảng
        show_tour_images_structure(conn)
        
        # 2. Hiển thị mẫu dữ liệu
        show_sample_images(conn)
        
        # 3. Giải thích chi tiết
        explain_storage_system()
        
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()
