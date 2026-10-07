"""
Script để fix encoding tiếng Việt trong PostgreSQL Cloud SQL
"""
import psycopg2
from psycopg2 import sql

# Thông tin kết nối
DB_CONFIG = {
    'host': '136.114.209.133',
    'port': 5432,
    'user': 'postgres',
    'password': 'Nhom11@123',
    'database': 'trip_system'
}

def fix_encoding():
    try:
        # Kết nối database
        print("Đang kết nối tới Cloud SQL...")
        conn = psycopg2.connect(**DB_CONFIG)
        conn.set_client_encoding('UTF8')
        cursor = conn.cursor()
        
        print("✓ Kết nối thành công!")
        print("\n" + "="*60)
        
        # Đọc file SQL
        print("\nĐọc file fix_encoding.sql...")
        with open('d:/web/SE317.Q12/Data/fix_encoding.sql', 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Split thành các câu lệnh riêng
        sql_statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip() and not stmt.strip().startswith('--')]
        
        print(f"Tìm thấy {len(sql_statements)} câu lệnh SQL\n")
        
        # Thực thi từng câu lệnh
        for idx, statement in enumerate(sql_statements, 1):
            if not statement:
                continue
                
            # Lấy tên bảng từ UPDATE statement
            table_name = ""
            if 'UPDATE' in statement.upper():
                parts = statement.split()
                for i, part in enumerate(parts):
                    if part.upper() == 'UPDATE' and i + 1 < len(parts):
                        table_name = parts[i + 1]
                        break
            
            print(f"[{idx}/{len(sql_statements)}] Đang xử lý {table_name if table_name else 'query'}...", end=' ')
            
            try:
                cursor.execute(statement)
                affected = cursor.rowcount
                print(f"✓ ({affected} rows affected)")
            except Exception as e:
                print(f"✗ Lỗi: {str(e)[:100]}")
                continue
        
        # Commit changes
        print("\n" + "="*60)
        print("Đang commit changes...")
        conn.commit()
        print("✓ Đã commit thành công!")
        
        # Kiểm tra kết quả
        print("\n" + "="*60)
        print("KIỂM TRA KẾT QUẢ:")
        print("="*60)
        
        cursor.execute("SELECT id, name, short_description FROM tours ORDER BY id LIMIT 3")
        tours = cursor.fetchall()
        print("\n📋 Dữ liệu Tours sau khi fix:")
        for tour in tours:
            print(f"  ID {tour[0]}: {tour[1]}")
            if tour[2]:
                print(f"    → {tour[2][:60]}...")
        
        cursor.execute("SELECT id, full_name FROM users WHERE id <= 3 ORDER BY id")
        users = cursor.fetchall()
        print("\n👤 Dữ liệu Users sau khi fix:")
        for user in users:
            print(f"  ID {user[0]}: {user[1]}")
        
        cursor.execute("SELECT id, name FROM places ORDER BY id LIMIT 3")
        places = cursor.fetchall()
        print("\n📍 Dữ liệu Places sau khi fix:")
        for place in places:
            print(f"  ID {place[0]}: {place[1]}")
        
        print("\n" + "="*60)
        print("✅ HOÀN THÀNH! Encoding đã được fix thành công!")
        print("="*60)
        
        cursor.close()
        conn.close()
        
    except psycopg2.OperationalError as e:
        print(f"\n❌ Lỗi kết nối database: {e}")
        print("\nKiểm tra:")
        print("  1. IP có được whitelist trên Cloud SQL không?")
        print("  2. Thông tin host/port/password có đúng không?")
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("="*60)
    print("  FIX ENCODING TIẾNG VIỆT - CLOUD SQL")
    print("="*60)
    fix_encoding()
