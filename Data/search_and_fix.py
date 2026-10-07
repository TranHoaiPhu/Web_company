import psycopg2

conn = psycopg2.connect(
    host='136.114.209.133',
    database='trip_system',
    user='postgres',
    password='Nhom11@123'
)

cur = conn.cursor()

# Search for the broken URL pattern
broken_url_pattern = '%photo-1583396095097-dc8e0c647b63%'
cur.execute("""
    SELECT ti.id, ti.tour_id, t.name, ti.is_cover, ti.image_url 
    FROM tour_images ti 
    JOIN tours t ON ti.tour_id = t.id 
    WHERE ti.image_url LIKE %s
""", (broken_url_pattern,))

results = cur.fetchall()

if results:
    for result in results:
        image_id, tour_id, tour_name, is_cover, current_url = result
        print(f"\n🔍 Found broken image:")
        print(f"  - Image ID: {image_id}")
        print(f"  - Tour ID: {tour_id}")
        print(f"  - Tour: {tour_name}")
        print(f"  - Is Cover: {is_cover}")
        print(f"  - Current URL: {current_url}")
        
        # Replacement images for different tours
        replacements = {
            1: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1920&q=80',  # Hạ Long
            2: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=80',  # Hội An  
            3: 'https://images.unsplash.com/photo-1591634616938-1dfa7ee2e617?w=1920&q=80',  # Sa Pa
            5: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1920&q=80',  # Phú Quốc
            9: 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?w=1920&q=80',  # Nha Trang
            10: 'https://images.unsplash.com/photo-1587239191194-b8f3e6d95861?w=1920&q=80',  # Đà Lạt
            18: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=1920&q=80',  # Hà Giang
            19: 'https://images.unsplash.com/photo-1552047691-3d1fc3bbf9fa?w=1920&q=80',  # Mũi Né
            20: 'https://images.unsplash.com/photo-1583511666407-5f06533f2113?w=1920&q=80',  # Ninh Bình
            21: 'https://images.unsplash.com/photo-1578818220247-e62f5380a46c?w=1920&q=80',  # Vũng Tàu
            22: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1920&q=80',  # Mai Châu
            23: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1920&q=80',  # Côn Đảo
            26: 'https://images.unsplash.com/photo-1571552278384-2f5cd77ef008?w=1920&q=80',  # Sơn Đoòng
        }
        
        new_url = replacements.get(tour_id)
        
        if new_url:
            cur.execute("""
                UPDATE tour_images 
                SET image_url = %s 
                WHERE id = %s
            """, (new_url, image_id))
            
            print(f"  ✅ Replaced with: {new_url}")
        else:
            print(f"  ⚠️  No replacement defined for tour ID {tour_id}")
    
    conn.commit()
    print(f"\n✅ All broken images fixed!")
else:
    print("\n❌ No images found with that URL pattern")
    
    # Let's check all images to see what we have
    print("\n📋 Checking all tour images...")
    cur.execute("""
        SELECT ti.id, ti.tour_id, t.name, ti.is_cover, ti.image_url 
        FROM tour_images ti 
        JOIN tours t ON ti.tour_id = t.id 
        WHERE t.status = 'ACTIVE'
        ORDER BY ti.tour_id, ti.is_cover DESC
        LIMIT 20
    """)
    
    all_images = cur.fetchall()
    for img in all_images:
        print(f"Tour {img[1]} ({img[2]}): {img[4][:70]}...")

cur.close()
conn.close()
