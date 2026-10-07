import psycopg2

# Database connection
conn = psycopg2.connect(
    host='136.114.209.133',
    database='trip_system',
    user='postgres',
    password='Nhom11@123'
)

cur = conn.cursor()

# Find the broken image
broken_url = 'https://images.unsplash.com/photo-1583396095097-dc8e0c647b63'
cur.execute("""
    SELECT ti.id, ti.tour_id, t.name, ti.is_cover 
    FROM tour_images ti 
    JOIN tours t ON ti.tour_id = t.id 
    WHERE ti.image_url = %s
""", (broken_url,))

result = cur.fetchone()

if result:
    image_id, tour_id, tour_name, is_cover = result
    print(f"\n🔍 Found broken image:")
    print(f"  - Image ID: {image_id}")
    print(f"  - Tour ID: {tour_id}")
    print(f"  - Tour Name: {tour_name}")
    print(f"  - Is Cover: {is_cover}")
    
    # Replace with a new working image based on tour name
    # Choose appropriate image for the tour
    new_image_urls = {
        1: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1920',  # Hạ Long Bay
        2: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920',  # Hội An
        3: 'https://images.unsplash.com/photo-1591634616938-1dfa7ee2e617?w=1920',  # Sa Pa
        5: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1920',  # Phú Quốc
        9: 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?w=1920',  # Nha Trang
        10: 'https://images.unsplash.com/photo-1587239191194-b8f3e6d95861?w=1920',  # Đà Lạt
        18: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1920',  # Hà Giang
        19: 'https://images.unsplash.com/photo-1552047691-3d1fc3bbf9fa?w=1920',  # Mũi Né
        20: 'https://images.unsplash.com/photo-1583511666407-5f06533f2113?w=1920',  # Ninh Bình
        21: 'https://images.unsplash.com/photo-1578818220247-e62f5380a46c?w=1920',  # Vũng Tàu
        22: 'https://images.unsplash.com/photo-1583511655826-05700d35f7c6?w=1920',  # Mai Châu
        23: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1920',  # Côn Đảo
        26: 'https://images.unsplash.com/photo-1571552278384-2f5cd77ef008?w=1920',  # Sơn Đoòng
    }
    
    new_url = new_image_urls.get(tour_id)
    
    if new_url:
        cur.execute("""
            UPDATE tour_images 
            SET image_url = %s 
            WHERE id = %s
        """, (new_url, image_id))
        
        conn.commit()
        print(f"\n✅ Updated image successfully!")
        print(f"  - New URL: {new_url}")
    else:
        print(f"\n❌ No replacement URL defined for tour ID {tour_id}")
else:
    print("\n❌ Image not found in database")

cur.close()
conn.close()
