"""
Script cập nhật tour hiện tại và thêm 10 tour mới
ĐẢM BẢO: Tất cả dữ liệu tiếng Việt UTF-8 chuẩn
"""
import psycopg2
from datetime import datetime

DB_CONFIG = {
    'host': '136.114.209.133',
    'port': 5432,
    'user': 'postgres',
    'password': 'Nhom11@123',
    'database': 'trip_system'
}

# Cập nhật các tour hiện tại
UPDATED_TOURS = [
    {
        'id': 1,
        'name': 'Hạ Long - Yên Tử 3N2Đ',
        'short_description': 'Khám phá vịnh Hạ Long - Di sản thiên nhiên thế giới và chốn tâm linh linh thiêng Yên Tử',
        'description': 'Tour kết hợp trọn vẹn giữa vẻ đẹp kỳ vĩ của vịnh Hạ Long với nét thiêng liêng của chùa Yên Tử. Du khách sẽ được ngắm nhìn hàng nghìn đảo đá vôi, hang động huyền bí và hành hương lên đỉnh Yên Tử - nơi Phật hoàng Trần Nhân Tông xuất gia.',
        'highlights': '- Vịnh Hạ Long - Di sản UNESCO\n- Hang Sửng Sốt, Hang Đầu Gỗ\n- Chèo kayak khám phá làng chài\n- Đỉnh Yên Tú - 1068m\n- Chùa Đồng, chùa Hoa Yên',
        'included_services': '- Vé tham quan\n- Khách sạn 4 sao\n- 3 bữa chính\n- Hướng dẫn viên\n- Bảo hiểm du lịch',
        'image_url': 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1920&q=80'
    },
    {
        'id': 2,
        'name': 'Hội An - Đà Nẵng 4N3Đ',
        'short_description': 'Phố cổ Hội An đèn lồng rực rỡ và thành phố đáng sống Đà Nẵng với bãi biển Mỹ Khê',
        'description': 'Hành trình khám phá miền Trung với phố cổ Hội An - Di sản văn hóa thế giới, Cầu Vàng nổi tiếng, và thành phố biển Đà Nẵng hiện đại. Trải nghiệm ẩm thực đường phố, tham quan Hội quán, và thư giãn tại bãi biển Mỹ Khê xinh đẹp.',
        'highlights': '- Phố cổ Hội An về đêm\n- Cầu Vàng Đà Nẵng\n- Bãi biển Mỹ Khê\n- Bà Nà Hills\n- Chùa Linh Ứng\n- Ngũ Hành Sơn',
        'included_services': '- Khách sạn 4 sao view biển\n- 3 bữa chính/ngày\n- Vé tham quan\n- Xe riêng điều hòa\n- HDV tiếng Việt',
        'image_url': 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1920&q=80'
    },
    {
        'id': 3,
        'name': 'Sa Pa - Fansipan 3N2Đ',
        'short_description': 'Chinh phục nóc nhà Đông Dương - Fansipan 3143m và thưởng ngoạn ruộng bậc thang Sa Pa',
        'description': 'Hành trình chinh phục đỉnh Fansipan - nóc nhà Đông Dương cao 3143m bằng cáp treo hiện đại. Khám phá vẻ đẹp hùng vĩ của ruộng bậc thang Sa Pa, thăm bản làng dân tộc thiểu số, và trải nghiệm văn hóa độc đáo của vùng cao Tây Bắc.',
        'highlights': '- Đỉnh Fansipan 3143m\n- Ruộng bậc thang mùa lúa chín\n- Bản Cát Cát, Tả Van\n- Thác Bạc, Cầu Mây\n- Chợ tình Sa Pa\n- Núi Hàm Rồng',
        'included_services': '- Vé cáp treo Fansipan\n- Khách sạn view thung lũng\n- Bữa ăn đặc sản Tây Bắc\n- Xe đưa đón\n- Hướng dẫn viên địa phương',
        'image_url': 'https://images.unsplash.com/photo-1583396095097-dc8e0c647b63?w=1920&q=80'
    }
]

# 10 tour mới
NEW_TOURS = [
    {
        'name': 'Phú Quốc 4N3Đ - Thiên Đường Biển Đảo',
        'slug': 'phu-quoc-4n3d',
        'location_id': 8,  # Phú Quốc
        'category_id': 1,  # Du lịch biển đảo
        'short_description': 'Đảo Ngọc Phú Quốc với bãi biển đẹp nhất Việt Nam, làn nước trong xanh và hải sản tươi ngon',
        'description': 'Tour Phú Quốc 4 ngày 3 đêm khám phá thiên đường biển đảo với Vinpearl Safari, VinWonders, bãi Sao, Bãi Dài, Sunset Sanato. Thưởng thức hải sản tươi sống, tham quan vườn tiêu, nhà thùng sản xuất nước mắm truyền thống.',
        'highlights': '- VinWonders Phú Quốc\n- Vinpearl Safari\n- Bãi Sao, Bãi Dài\n- Sunset Sanato\n- Chợ đêm Dinh Cậu\n- Hòn Thơm, cáp treo Hòn Thơm',
        'included_services': '- Resort 5 sao gần biển\n- Bữa sáng buffet\n- Vé tham quan\n- Xe đưa đón sân bay\n- Tour thuyền 4 đảo',
        'duration_days': 4,
        'duration_nights': 3,
        'base_price': 6500000,
        'child_price': 4500000,
        'difficulty': 'EASY',
        'transportation_type': 'Máy bay + Xe du lịch',
        'image_url': 'https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?w=1920&q=80'
    },
    {
        'name': 'Nha Trang 3N2Đ - Vịnh Biển Xanh',
        'slug': 'nha-trang-3n2d',
        'location_id': 6,  # Nha Trang
        'category_id': 1,
        'short_description': 'Thành phố biển Nha Trang với bãi biển dài, đảo Hòn Mun, VinWonders và tắm bùn khoáng',
        'description': 'Khám phá thành phố biển Nha Trang xinh đẹp với tour 4 đảo, VinWonders Nha Trang, tắm bùn khoáng I-Resort, và tham quan Viện Hải Dương học. Thưởng thức hải sản tươi ngon và tham gia các hoạt động thể thao biển sôi động.',
        'highlights': '- Tour 4 đảo Nha Trang\n- VinWonders Nha Trang\n- Tắm bùn khoáng\n- Hòn Mun lặn ngắm san hô\n- Tháp Bà Ponagar\n- Chợ đêm Nha Trang',
        'included_services': '- Khách sạn 4 sao view biển\n- 2 bữa chính/ngày\n- Vé VinWonders\n- Vé tắm bùn\n- Xe và tàu tham quan',
        'duration_days': 3,
        'duration_nights': 2,
        'base_price': 4200000,
        'child_price': 2800000,
        'difficulty': 'EASY',
        'transportation_type': 'Máy bay + Tàu cao tốc',
        'image_url': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=80'
    },
    {
        'name': 'Đà Lạt 3N2Đ - Thành Phố Ngàn Hoa',
        'slug': 'da-lat-3n2d',
        'location_id': 9,  # Đà Lạt
        'category_id': 4,  # Nghỉ dưỡng
        'short_description': 'Đà Lạt lãng mạn với khí hậu mát mẻ, thác Datanla, hồ Tuyền Lâm và vườn hoa đầy màu sắc',
        'description': 'Tour Đà Lạt 3 ngày 2 đêm khám phá thành phố ngàn hoa với hồ Xuân Hương, Quảng trường Lâm Viên, thác Datanla, vườn dâu tây và café view đẹp. Trải nghiệm không khí se lạnh độc đáo giữa miền nhiệt đới.',
        'highlights': '- Hồ Xuân Hương, Lâm Viên\n- Thác Datanla\n- Vườn hoa Đà Lạt\n- Nhà thờ Con Gà\n- Hồ Tuyền Lâm\n- Vườn dâu tây tự hái',
        'included_services': '- Khách sạn 3 sao trung tâm\n- Bữa sáng\n- Xe tham quan\n- Vé tham quan\n- HDV kinh nghiệm',
        'duration_days': 3,
        'duration_nights': 2,
        'base_price': 3500000,
        'child_price': 2200000,
        'difficulty': 'EASY',
        'transportation_type': 'Xe du lịch',
        'image_url': 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1920&q=80'
    },
    {
        'name': 'Hà Giang 4N3Đ - Cao Nguyên Đá',
        'slug': 'ha-giang-4n3d',
        'location_id': 2,  # Miền Bắc
        'category_id': 3,  # Mạo hiểm
        'short_description': 'Vòng cung Hà Giang với đèo Mã Pì Lèng hùng vĩ, Đồng Văn, Lũng Cú cực Bắc Tổ quốc',
        'description': 'Hành trình khám phá cao nguyên đá Đồng Văn - Di sản địa chất thế giới. Chinh phục đèo Mã Pì Lèng, cột cờ Lũng Cú, phố cổ Đồng Văn và trải nghiệm văn hóa các dân tộc thiểu số Tây Bắc.',
        'highlights': '- Đèo Mã Pì Lèng\n- Cột cờ Lũng Cú\n- Phố cổ Đồng Văn\n- Dinh độc lập Vương Chí Sình\n- Sông Nho Quế\n- Làng văn hóa Lô Lô Chải',
        'included_services': '- Homestay và khách sạn\n- 3 bữa chính/ngày\n- Xe limousine\n- Hướng dẫn viên\n- Bảo hiểm',
        'duration_days': 4,
        'duration_nights': 3,
        'base_price': 4800000,
        'child_price': 3200000,
        'difficulty': 'CHALLENGING',
        'transportation_type': 'Xe limousine',
        'image_url': 'https://images.unsplash.com/photo-1509233725247-49e657c54213?w=1920&q=80'
    },
    {
        'name': 'Mũi Né - Phan Thiết 2N1Đ',
        'slug': 'mui-ne-phan-thiet-2n1d',
        'location_id': 4,  # Miền Nam
        'category_id': 1,
        'short_description': 'Đồi cát bay Mũi Né, suối tiên, làng chài và hải sản tươi ngon ven biển Phan Thiết',
        'description': 'Tour ngắn ngày khám phá Mũi Né - Phan Thiết với đồi cát bay, đồi cát vàng, suối tiên độc đáo, làng chài xưa cũ. Trải nghiệm lướt ván trên cát, xem bình minh trên biển và thưởng thức hải sản tươi sống.',
        'highlights': '- Đồi cát bay Mũi Né\n- Suối tiên - suối hồng\n- Làng chài Mũi Né\n- Bình minh trên biển\n- Tháp Chàm Poshanu\n- Công viên Bàu Trắng',
        'included_services': '- Resort 3-4 sao view biển\n- Bữa sáng buffet\n- Xe tham quan\n- Vé các điểm\n- Hướng dẫn viên',
        'duration_days': 2,
        'duration_nights': 1,
        'base_price': 2200000,
        'child_price': 1500000,
        'difficulty': 'EASY',
        'transportation_type': 'Xe du lịch',
        'image_url': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1920&q=80'
    },
    {
        'name': 'Ninh Bình 2N1Đ - Vịnh Hạ Long Trên Cạn',
        'slug': 'ninh-binh-2n1d',
        'location_id': 2,
        'category_id': 2,  # Văn hóa
        'short_description': 'Tràng An, Tam Cốc - Bích Động, Bái Đính, Hang Múa và cố đô Hoa Lư cổ kính',
        'description': 'Khám phá Ninh Bình - Di sản thiên nhiên và văn văn hóa thế giới với Tràng An, chùa Bái Đính lớn nhất Việt Nam, Tam Cốc - Bích Động thơ mộng, Hang Múa toàn cảnh và di tích lịch sử Hoa Lư.',
        'highlights': '- Quần thể Tràng An UNESCO\n- Chùa Bái Đính\n- Tam Cốc - Bích Động\n- Hang Múa view 360°\n- Cố đô Hoa Lư\n- Vườn chim Thung Nham',
        'included_services': '- Khách sạn 3 sao\n- 2 bữa chính\n- Thuyền thăm Tràng An\n- Xe đưa đón\n- Vé tham quan',
        'duration_days': 2,
        'duration_nights': 1,
        'base_price': 2500000,
        'child_price': 1700000,
        'difficulty': 'EASY',
        'transportation_type': 'Xe + Thuyền',
        'image_url': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1920&q=80'
    },
    {
        'name': 'Vũng Tàu 2N1Đ - Biển Gần Sài Gòn',
        'slug': 'vung-tau-2n1d',
        'location_id': 4,
        'category_id': 1,
        'short_description': 'Bãi Sau, Bãi Trước, tượng Chúa Kitô, hải đăng Vũng Tàu và hải sản phong phú',
        'description': 'Tour cuối tuần gần Sài Gòn với bãi biển Vũng Tàu, tượng Chúa Kitô sừng sững, hải đăng cổ, Bạch Dinh và thưởng thức hải sản tươi ngon. Lý tưởng cho các gia đình muốn nghỉ dưỡng ngắn ngày.',
        'highlights': '- Tượng Chúa Kitô\n- Hải đăng Vũng Tàu\n- Bãi Sau, Bãi Trước\n- Bạch Dinh\n- Núi Miếu\n- Chợ hải sản đêm',
        'included_services': '- Khách sạn view biển\n- Bữa sáng\n- Xe đưa đón từ SG\n- Hướng dẫn viên\n- Bảo hiểm',
        'duration_days': 2,
        'duration_nights': 1,
        'base_price': 1800000,
        'child_price': 1200000,
        'difficulty': 'EASY',
        'transportation_type': 'Xe du lịch',
        'image_url': 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1920&q=80'
    },
    {
        'name': 'Mai Châu - Pù Luông 3N2Đ',
        'slug': 'mai-chau-pu-luong-3n2d',
        'location_id': 2,
        'category_id': 5,  # Miền núi
        'short_description': 'Thung lũng Mai Châu và khu bảo tồn Pù Luông hoang sơ với nhà sàn, ruộng bậc thang',
        'description': 'Trải nghiệm cuộc sống bản làng với nhà sàn người Thái, ruộng bậc thang tuyệt đẹp, suối nước trong xanh. Tham gia hoạt động dân gian, thưởng thức đặc sản vùng cao và hòa mình vào thiên nhiên trong lành.',
        'highlights': '- Thung lũng Mai Châu\n- Khu bảo tồn Pù Luông\n- Ruộng bậc thang\n- Nhà sàn người Thái\n- Làng Lác, Poom Coọng\n- Xe đạp khám phá làng',
        'included_services': '- Nhà sàn truyền thống\n- 3 bữa ăn đặc sản\n- Xe đưa đón từ HN\n- HDV địa phương\n- Xe đạp tự do',
        'duration_days': 3,
        'duration_nights': 2,
        'base_price': 2900000,
        'child_price': 1900000,
        'difficulty': 'MODERATE',
        'transportation_type': 'Xe + Xe đạp',
        'image_url': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1920&q=80'
    },
    {
        'name': 'Côn Đảo 3N2Đ - Đảo Thiêng',
        'slug': 'con-dao-3n2d',
        'location_id': 4,
        'category_id': 2,
        'short_description': 'Côn Đảo hoang sơ với di tích lịch sử, bãi biển hoang sơ và rừng nguyên sinh',
        'description': 'Hành trình khám phá Côn Đảo - hòn đảo thiêng liêng với di tích nhà tù, mộ cô Sáu, bãi biển đẹp nguyên sơ, rừng quốc gia và đón bình minh trên biển. Tour phù hợp người yêu thiên nhiên và lịch sử.',
        'highlights': '- Nhà tù Côn Đảo\n- Mộ Cô Sáu\n- Bãi Đầm Trầu\n- Vườn quốc gia Côn Đảo\n- Lặn ngắm san hô\n- Bãi Nhát đón bình minh',
        'included_services': '- Resort 4 sao\n- 2 bữa chính/ngày\n- Vé máy bay từ TPHCM\n- Xe tham quan đảo\n- Vé tham quan',
        'duration_days': 3,
        'duration_nights': 2,
        'base_price': 7500000,
        'child_price': 5500000,
        'difficulty': 'MODERATE',
        'transportation_type': 'Máy bay + Xe',
        'image_url': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80'
    },
    {
        'name': 'Sơn Đoòng - Hang Động Lớn Nhất Thế Giới 5N4Đ',
        'slug': 'son-doong-5n4d',
        'location_id': 3,  # Miền Trung
        'category_id': 3,
        'short_description': 'Khám phá hang Sơn Đoòng - hang động lớn nhất thế giới tại Phong Nha - Kẻ Bàng',
        'description': 'Tour thám hiểm đẳng cấp thế giới chinh phục hang Sơn Đoòng - hang động lớn nhất hành tinh với rừng nguyên sinh bên trong, sông ngầm, thạch nhũ khổng lồ. Đây là trải nghiệm hiếm có chỉ có tại Việt Nam. Giới hạn 1000 khách/năm.',
        'highlights': '- Hang Sơn Đoòng\n- Vườn quốc gia Phong Nha\n- Rừng nguyên sinh trong hang\n- Sông ngầm\n- Watch Out For Dinosaurs\n- Great Wall of Vietnam',
        'included_services': '- Camp trong hang động\n- 3 bữa/ngày\n- Thiết bị chuyên nghiệp\n- Hướng dẫn viên quốc tế\n- Bảo hiểm tối đa',
        'duration_days': 5,
        'duration_nights': 4,
        'base_price': 72000000,
        'child_price': None,
        'difficulty': 'DIFFICULT',
        'transportation_type': 'Trekking',
        'image_url': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80'
    }
]

def update_existing_tours(conn):
    """Cập nhật các tour hiện tại"""
    cursor = conn.cursor()
    print("\n🔄 Cập nhật các tour hiện tại...")
    
    for tour in UPDATED_TOURS:
        cursor.execute("""
            UPDATE tours SET
                name = %s,
                short_description = %s,
                description = %s,
                highlights = %s,
                included_services = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (
            tour['name'],
            tour['short_description'],
            tour['description'],
            tour['highlights'],
            tour['included_services'],
            tour['id']
        ))
        
        # Cập nhật hình ảnh cover
        cursor.execute("""
            UPDATE tour_images SET
                image_url = %s,
                alt_text = %s
            WHERE tour_id = %s AND is_cover = true
        """, (
            tour['image_url'],
            tour['name'],
            tour['id']
        ))
        
        print(f"  ✓ Cập nhật tour ID {tour['id']}: {tour['name']}")
    
    conn.commit()
    cursor.close()

def add_new_tours(conn):
    """Thêm 10 tour mới"""
    cursor = conn.cursor()
    print("\n➕ Thêm 10 tour mới...")
    
    for idx, tour in enumerate(NEW_TOURS, 1):
        # Insert tour
        cursor.execute("""
            INSERT INTO tours (
                name, slug, location_id, category_id,
                short_description, description, highlights, included_services,
                duration_days, duration_nights, base_price, child_price,
                difficulty, transportation_type, status, is_featured,
                max_participants, min_participants, created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                'ACTIVE', %s, 20, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            ) RETURNING id
        """, (
            tour['name'], tour['slug'], tour['location_id'], tour['category_id'],
            tour['short_description'], tour['description'], tour['highlights'],
            tour['included_services'], tour['duration_days'], tour['duration_nights'],
            tour['base_price'], tour.get('child_price'), tour['difficulty'],
            tour['transportation_type'], idx <= 3  # 3 tour đầu là featured
        ))
        
        tour_id = cursor.fetchone()[0]
        
        # Insert hình ảnh cover
        cursor.execute("""
            INSERT INTO tour_images (
                tour_id, image_url, alt_text, is_cover, display_order, created_at
            ) VALUES (%s, %s, %s, true, 1, CURRENT_TIMESTAMP)
        """, (tour_id, tour['image_url'], tour['name']))
        
        print(f"  ✓ Thêm tour {idx}: {tour['name']} (ID: {tour_id})")
    
    conn.commit()
    cursor.close()

def verify_all_tours(conn):
    """Kiểm tra tất cả tours"""
    cursor = conn.cursor()
    print("\n" + "="*70)
    print("DANH SÁCH TOÀN BỘ TOURS SAU KHI CẬP NHẬT:")
    print("="*70)
    
    cursor.execute("""
        SELECT id, name, short_description, base_price, status, is_featured
        FROM tours
        ORDER BY id
    """)
    
    tours = cursor.fetchall()
    for tour in tours:
        featured = "⭐" if tour[5] else "  "
        print(f"\n{featured} [{tour[0]}] {tour[1]}")
        print(f"     💰 {tour[3]:,.0f}đ | 📊 {tour[4]}")
        print(f"     📝 {tour[2][:80]}...")
    
    print("\n" + "="*70)
    print(f"✅ TỔNG CỘNG: {len(tours)} TOURS")
    print("="*70)
    
    cursor.close()

if __name__ == "__main__":
    print("="*70)
    print("  CẬP NHẬT VÀ THÊM TOURS MỚI - ENCODING UTF-8 CHUẨN")
    print("="*70)
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.set_client_encoding('UTF8')
        
        # 1. Cập nhật tours hiện tại
        update_existing_tours(conn)
        
        # 2. Thêm 10 tours mới
        add_new_tours(conn)
        
        # 3. Verify kết quả
        verify_all_tours(conn)
        
        conn.close()
        
        print("\n✅ HOÀN THÀNH! Tất cả dữ liệu đều dùng UTF-8 chuẩn.")
        print("💡 Reload website để xem kết quả!")
        
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()
