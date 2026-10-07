"""
Script để tạo các bảng phân quyền trong database
Chạy script này một lần để tạo cấu trúc bảng và dữ liệu mẫu
"""

from supabase_client import supabase
import traceback

def create_tables():
    """Tạo các bảng roles, permissions, role_permissions, user_roles"""
    
    print("=" * 60)
    print("KHỞI TẠO HỆ THỐNG PHÂN QUYỀN")
    print("=" * 60)
    
    try:
        # 1. Tạo bảng roles
        print("\n[1/4] Kiểm tra/tạo bảng roles...")
        try:
            supabase.table("roles").select("id").limit(1).execute()
            print("  ✓ Bảng roles đã tồn tại")
        except Exception as e:
            if "relation" in str(e) and "does not exist" in str(e):
                print("  ! Bảng roles chưa tồn tại - cần tạo thủ công từ SQL")
            else:
                print(f"  ⚠ Lỗi: {e}")
        
        # 2. Tạo bảng permissions  
        print("\n[2/4] Kiểm tra/tạo bảng permissions...")
        try:
            supabase.table("permissions").select("id").limit(1).execute()
            print("  ✓ Bảng permissions đã tồn tại")
        except Exception as e:
            if "relation" in str(e) and "does not exist" in str(e):
                print("  ! Bảng permissions chưa tồn tại - cần tạo thủ công từ SQL")
            else:
                print(f"  ⚠ Lỗi: {e}")
        
        # 3. Tạo bảng role_permissions
        print("\n[3/4] Kiểm tra/tạo bảng role_permissions...")
        try:
            supabase.table("role_permissions").select("id").limit(1).execute()
            print("  ✓ Bảng role_permissions đã tồn tại")
        except Exception as e:
            if "relation" in str(e) and "does not exist" in str(e):
                print("  ! Bảng role_permissions chưa tồn tại - cần tạo thủ công từ SQL")
            else:
                print(f"  ⚠ Lỗi: {e}")
        
        # 4. Tạo bảng user_roles
        print("\n[4/4] Kiểm tra/tạo bảng user_roles...")
        try:
            supabase.table("user_roles").select("id").limit(1).execute()
            print("  ✓ Bảng user_roles đã tồn tại")
        except Exception as e:
            if "relation" in str(e) and "does not exist" in str(e):
                print("  ! Bảng user_roles chưa tồn tại - cần tạo thủ công từ SQL")
            else:
                print(f"  ⚠ Lỗi: {e}")
        
        print("\n" + "=" * 60)
        print("HƯỚNG DẪN:")
        print("=" * 60)
        print("""
Nếu các bảng chưa tồn tại, hãy chạy file SQL sau trong Supabase SQL Editor:
  
  📁 sql/create_permission_tables.sql

Sau khi chạy SQL xong, hãy restart API server.
        """)
                
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        traceback.print_exc()

def insert_sample_data():
    """Thêm dữ liệu mẫu nếu bảng trống"""
    
    print("\n" + "=" * 60)
    print("KIỂM TRA DỮ LIỆU MẪU")
    print("=" * 60)
    
    try:
        # Kiểm tra roles
        roles = supabase.table("roles").select("*").execute()
        if len(roles.data) == 0:
            print("\n[!] Bảng roles trống - thêm dữ liệu mẫu...")
            sample_roles = [
                {"name": "Super Admin", "slug": "super_admin", "description": "Toàn quyền quản trị hệ thống", "is_system": True},
                {"name": "Tour Manager", "slug": "tour_manager", "description": "Quản lý tour và lịch trình", "is_system": False},
                {"name": "Order Manager", "slug": "order_manager", "description": "Quản lý đơn hàng và thanh toán", "is_system": False},
                {"name": "Support", "slug": "support", "description": "Hỗ trợ khách hàng qua chat", "is_system": False},
                {"name": "Content Editor", "slug": "content_editor", "description": "Quản lý nội dung, banner, danh mục", "is_system": False},
            ]
            for role in sample_roles:
                try:
                    supabase.table("roles").insert(role).execute()
                    print(f"  ✓ Đã thêm role: {role['name']}")
                except Exception as e:
                    print(f"  ⚠ Lỗi thêm role {role['name']}: {e}")
        else:
            print(f"\n✓ Bảng roles đã có {len(roles.data)} vai trò")
        
        # Kiểm tra permissions
        perms = supabase.table("permissions").select("*").execute()
        if len(perms.data) == 0:
            print("\n[!] Bảng permissions trống - thêm dữ liệu mẫu...")
            sample_permissions = [
                # Module: users
                {"name": "Xem người dùng", "slug": "users_view", "description": "Xem danh sách và chi tiết người dùng", "module": "users"},
                {"name": "Thêm người dùng", "slug": "users_create", "description": "Tạo mới người dùng", "module": "users"},
                {"name": "Sửa người dùng", "slug": "users_edit", "description": "Chỉnh sửa thông tin người dùng", "module": "users"},
                {"name": "Xóa người dùng", "slug": "users_delete", "description": "Xóa người dùng khỏi hệ thống", "module": "users"},
                {"name": "Chặn người dùng", "slug": "users_block", "description": "Chặn/mở chặn tài khoản người dùng", "module": "users"},
                
                # Module: permissions
                {"name": "Xem vai trò", "slug": "roles_view", "description": "Xem danh sách vai trò và quyền", "module": "permissions"},
                {"name": "Quản lý vai trò", "slug": "roles_manage", "description": "Thêm, sửa, xóa vai trò", "module": "permissions"},
                {"name": "Gán quyền", "slug": "roles_assign", "description": "Gán quyền cho vai trò", "module": "permissions"},
                {"name": "Gán vai trò cho user", "slug": "users_assign_role", "description": "Gán vai trò cho người dùng", "module": "permissions"},
                
                # Module: tours
                {"name": "Xem tours", "slug": "tours_view", "description": "Xem danh sách và chi tiết tour", "module": "tours"},
                {"name": "Thêm tour", "slug": "tours_create", "description": "Tạo mới tour du lịch", "module": "tours"},
                {"name": "Sửa tour", "slug": "tours_edit", "description": "Chỉnh sửa thông tin tour", "module": "tours"},
                {"name": "Xóa tour", "slug": "tours_delete", "description": "Xóa tour khỏi hệ thống", "module": "tours"},
                {"name": "Quản lý lịch trình", "slug": "schedules_manage", "description": "Quản lý lịch khởi hành tour", "module": "tours"},
                
                # Module: orders
                {"name": "Xem đơn hàng", "slug": "orders_view", "description": "Xem danh sách và chi tiết đơn hàng", "module": "orders"},
                {"name": "Cập nhật đơn hàng", "slug": "orders_edit", "description": "Cập nhật trạng thái đơn hàng", "module": "orders"},
                {"name": "Hủy đơn hàng", "slug": "orders_cancel", "description": "Hủy đơn hàng", "module": "orders"},
                {"name": "Hoàn tiền", "slug": "orders_refund", "description": "Xử lý hoàn tiền đơn hàng", "module": "orders"},
                {"name": "Xem hành khách", "slug": "customers_view", "description": "Xem thông tin hành khách", "module": "orders"},
                
                # Module: chat
                {"name": "Xem chat", "slug": "chat_view", "description": "Xem tin nhắn hỗ trợ", "module": "chat"},
                {"name": "Trả lời chat", "slug": "chat_reply", "description": "Trả lời tin nhắn hỗ trợ", "module": "chat"},
                
                # Module: content
                {"name": "Quản lý danh mục", "slug": "categories_manage", "description": "Thêm, sửa, xóa danh mục tour", "module": "content"},
                {"name": "Quản lý banner", "slug": "banners_manage", "description": "Quản lý banner trang chủ", "module": "content"},
                {"name": "Quản lý tiện ích", "slug": "amenities_manage", "description": "Quản lý tiện ích tour", "module": "content"},
                
                # Module: system
                {"name": "Xem thống kê", "slug": "stats_view", "description": "Xem báo cáo và thống kê", "module": "system"},
                {"name": "Cài đặt hệ thống", "slug": "settings_edit", "description": "Chỉnh sửa cài đặt hệ thống", "module": "system"},
                {"name": "Quản lý mã giảm giá", "slug": "discounts_manage", "description": "Quản lý mã ưu đãi, giảm giá", "module": "system"},
            ]
            for perm in sample_permissions:
                try:
                    supabase.table("permissions").insert(perm).execute()
                    print(f"  ✓ Đã thêm permission: {perm['name']}")
                except Exception as e:
                    print(f"  ⚠ Lỗi thêm permission {perm['name']}: {e}")
        else:
            print(f"\n✓ Bảng permissions đã có {len(perms.data)} quyền")
            
        print("\n" + "=" * 60)
        print("HOÀN TẤT!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    create_tables()
    insert_sample_data()
