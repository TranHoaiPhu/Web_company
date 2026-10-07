-- =====================================================
-- HỆ THỐNG PHÂN QUYỀN - ROLE BASED ACCESS CONTROL (RBAC)
-- =====================================================

-- 1. Bảng ROLES - Lưu trữ các vai trò trong hệ thống
CREATE TABLE IF NOT EXISTS public.roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,  -- True: vai trò hệ thống, không thể xóa
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.roles IS 'Bảng lưu trữ các vai trò trong hệ thống';
COMMENT ON COLUMN public.roles.is_system IS 'Vai trò hệ thống (Super Admin) không thể xóa/chỉnh sửa';

-- 2. Bảng PERMISSIONS - Lưu trữ các quyền hạn
CREATE TABLE IF NOT EXISTS public.permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    module VARCHAR(50) NOT NULL,  -- Nhóm chức năng: users, tours, orders, ...
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.permissions IS 'Bảng lưu trữ các quyền hạn trong hệ thống';
COMMENT ON COLUMN public.permissions.module IS 'Nhóm chức năng: users, tours, orders, chat, settings, stats...';

-- 3. Bảng ROLE_PERMISSIONS - Liên kết vai trò và quyền (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

COMMENT ON TABLE public.role_permissions IS 'Bảng liên kết giữa vai trò và quyền hạn';

-- 4. Bảng USER_ROLES - Liên kết người dùng và vai trò (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,  -- iduser từ bảng users
    role_id BIGINT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_by VARCHAR(255),  -- Người gán quyền
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

COMMENT ON TABLE public.user_roles IS 'Bảng liên kết giữa người dùng và vai trò';

-- =====================================================
-- DỮ LIỆU MẪU - SAMPLE DATA
-- =====================================================

-- Insert các vai trò mặc định
INSERT INTO public.roles (name, slug, description, is_system) VALUES
    ('Super Admin', 'super_admin', 'Toàn quyền quản trị hệ thống', TRUE),
    ('Tour Manager', 'tour_manager', 'Quản lý tour và lịch trình', FALSE),
    ('Order Manager', 'order_manager', 'Quản lý đơn hàng và thanh toán', FALSE),
    ('Support', 'support', 'Hỗ trợ khách hàng qua chat', FALSE),
    ('Content Editor', 'content_editor', 'Quản lý nội dung, banner, danh mục', FALSE)
ON CONFLICT (slug) DO NOTHING;

-- Insert các quyền hạn chi tiết theo module
INSERT INTO public.permissions (name, slug, description, module) VALUES
    -- Module: Người dùng
    ('Xem người dùng', 'users_view', 'Xem danh sách và chi tiết người dùng', 'users'),
    ('Thêm người dùng', 'users_create', 'Tạo mới người dùng', 'users'),
    ('Sửa người dùng', 'users_edit', 'Chỉnh sửa thông tin người dùng', 'users'),
    ('Xóa người dùng', 'users_delete', 'Xóa người dùng khỏi hệ thống', 'users'),
    ('Chặn người dùng', 'users_block', 'Chặn/mở chặn tài khoản người dùng', 'users'),
    
    -- Module: Phân quyền
    ('Xem vai trò', 'roles_view', 'Xem danh sách vai trò và quyền', 'permissions'),
    ('Quản lý vai trò', 'roles_manage', 'Thêm, sửa, xóa vai trò', 'permissions'),
    ('Gán quyền', 'roles_assign', 'Gán quyền cho vai trò', 'permissions'),
    ('Gán vai trò cho user', 'users_assign_role', 'Gán vai trò cho người dùng', 'permissions'),
    
    -- Module: Tours
    ('Xem tours', 'tours_view', 'Xem danh sách và chi tiết tour', 'tours'),
    ('Thêm tour', 'tours_create', 'Tạo mới tour du lịch', 'tours'),
    ('Sửa tour', 'tours_edit', 'Chỉnh sửa thông tin tour', 'tours'),
    ('Xóa tour', 'tours_delete', 'Xóa tour khỏi hệ thống', 'tours'),
    ('Quản lý lịch trình', 'schedules_manage', 'Quản lý lịch khởi hành tour', 'tours'),
    
    -- Module: Đơn hàng
    ('Xem đơn hàng', 'orders_view', 'Xem danh sách và chi tiết đơn hàng', 'orders'),
    ('Cập nhật đơn hàng', 'orders_edit', 'Cập nhật trạng thái đơn hàng', 'orders'),
    ('Hủy đơn hàng', 'orders_cancel', 'Hủy đơn hàng', 'orders'),
    ('Hoàn tiền', 'orders_refund', 'Xử lý hoàn tiền đơn hàng', 'orders'),
    ('Xem hành khách', 'customers_view', 'Xem thông tin hành khách', 'orders'),
    
    -- Module: Hỗ trợ (Chat)
    ('Xem chat', 'chat_view', 'Xem tin nhắn hỗ trợ', 'chat'),
    ('Trả lời chat', 'chat_reply', 'Trả lời tin nhắn hỗ trợ', 'chat'),
    
    -- Module: Nội dung
    ('Quản lý danh mục', 'categories_manage', 'Thêm, sửa, xóa danh mục tour', 'content'),
    ('Quản lý banner', 'banners_manage', 'Quản lý banner trang chủ', 'content'),
    ('Quản lý tiện ích', 'amenities_manage', 'Quản lý tiện ích tour', 'content'),
    
    -- Module: Hệ thống
    ('Xem thống kê', 'stats_view', 'Xem báo cáo và thống kê', 'system'),
    ('Cài đặt hệ thống', 'settings_edit', 'Chỉnh sửa cài đặt hệ thống', 'system'),
    ('Quản lý mã giảm giá', 'discounts_manage', 'Quản lý mã ưu đãi, giảm giá', 'system')
ON CONFLICT (slug) DO NOTHING;

-- Gán toàn bộ quyền cho Super Admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p 
WHERE r.slug = 'super_admin'
ON CONFLICT DO NOTHING;

-- Gán quyền cho Tour Manager
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p 
WHERE r.slug = 'tour_manager' 
  AND p.slug IN ('tours_view', 'tours_create', 'tours_edit', 'tours_delete', 'schedules_manage', 'orders_view', 'customers_view', 'stats_view')
ON CONFLICT DO NOTHING;

-- Gán quyền cho Order Manager
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p 
WHERE r.slug = 'order_manager' 
  AND p.slug IN ('orders_view', 'orders_edit', 'orders_cancel', 'orders_refund', 'customers_view', 'tours_view', 'stats_view')
ON CONFLICT DO NOTHING;

-- Gán quyền cho Support
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p 
WHERE r.slug = 'support' 
  AND p.slug IN ('chat_view', 'chat_reply', 'users_view', 'orders_view')
ON CONFLICT DO NOTHING;

-- Gán quyền cho Content Editor
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p 
WHERE r.slug = 'content_editor' 
  AND p.slug IN ('categories_manage', 'banners_manage', 'amenities_manage', 'tours_view', 'tours_edit')
ON CONFLICT DO NOTHING;

-- =====================================================
-- INDEXES để tối ưu truy vấn
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON public.permissions(module);
