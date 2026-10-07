const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, isAdmin } = require('../middleware/authJwt');
const axios = require('axios');

// ==================== HELPER FUNCTIONS ====================

/**
 * Sanitize user object - remove sensitive data
 */
function sanitizeUser(user) {
  const { password_hash, ...sanitizedUser } = user;
  return sanitizedUser;
}

/**
 * Build dynamic WHERE clause for filtering
 */
function buildWhereClause(filters) {
  const conditions = ['1=1'];
  const params = [];
  let paramIndex = 1;

  if (filters.role) {
    if (filters.role === 'MANAGEMENT') {
      conditions.push(`role::text NOT IN ('CUSTOMER', '1', 'USER')`);
    } else {
      conditions.push(`role = $${paramIndex}`);
      params.push(filters.role);
      paramIndex++;
    }
  }

  if (filters.status) {
    conditions.push(`status = $${paramIndex}`);
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.search) {
    conditions.push(`(full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  return { where: conditions.join(' AND '), params, paramIndex };
}

// ==================== GET ALL USERS (Admin Only) ====================
/**
 * GET /users
 * Get all users with pagination, filtering, and search
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - role: Filter by role (CUSTOMER/ADMIN)
 * - status: Filter by status (ACTIVE/BLOCKED)
 * - search: Search by name or email
 * - sortBy: Field to sort by (default: created_at)
 * - sortOrder: ASC or DESC (default: DESC)
 */
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      status,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    // Validate pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Validate sort order
    const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const validSortFields = ['id', 'email', 'full_name', 'created_at', 'role', 'status'];
    const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';

    // Build WHERE clause
    const filters = { role, status, search };
    const { where, params, paramIndex } = buildWhereClause(filters);

    // Count total records
    const countQuery = `SELECT COUNT(*) as total FROM users WHERE ${where}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get users
    const usersQuery = `
      SELECT 
        id, user_id, email, full_name, phone, role, status, 
        avatar_url, address, created_at, updated_at
      FROM users
      WHERE ${where}
      ORDER BY ${validSortBy} ${validSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const usersResult = await pool.query(usersQuery, [...params, limitNum, offset]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        users: usersResult.rows,
        pagination: {
          currentPage: pageNum,
          pageSize: limitNum,
          totalItems: total,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách người dùng',
      error: error.message
    });
  }
});

// ==================== GET USERS STATISTICS (Admin Only) ====================
/**
 * GET /users/stats/overview
 * Get overall users statistics
 * NOTE: This route MUST be before /:id to avoid matching 'stats' as an ID
 */


// Get profile of user by UUID
router.get('/profile/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const user = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    res.json({
      success: true,
      data: {
        id: user.rows[0].id,
        full_name: user.rows[0].full_name,
        email: user.rows[0].email,
        phone: user.rows[0].phone,
        status: user.rows[0].status,
        avatar_url: user.rows[0].avatar_url,
        address: user.rows[0].address,
        created_at: user.rows[0].created_at,
        updated_at: user.rows[0].updated_at,
        user_id: user.rows[0].user_id,
        role: user.rows[0].role
      }
    });
  } catch (error) {
    console.error('Error fetching user profile by UUID:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin người dùng',
      error: error.message
    });
  }
});

/// Get profile of user logged in
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`USER_ID`, userId);
    const user = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);
    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    res.json({
      success: true,
      data: {
        id: user.rows[0].id,
        full_name: user.rows[0].full_name,
        email: user.rows[0].email,
        phone: user.rows[0].phone,
        status: user.rows[0].status,
        avatar_url: user.rows[0].avatar_url,
        address: user.rows[0].address,
        created_at: user.rows[0].created_at,
        updated_at: user.rows[0].updated_at,
        user_id: user.rows[0].user_id,
        role: user.rows[0].role
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin người dùng',
      error: error.message
    });
  }
});

// ==================== UPDATE OWN PROFILE ====================
/**
 * PUT /users/profile
 * Update current user's own profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`USER_ID`, userId);
    const { full_name, phone, address, avatar_url } = req.body;

    // Check if user exists
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE user_id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    if (full_name !== undefined) {
      updateFields.push(`full_name = $${paramIndex}`);
      params.push(full_name);
      paramIndex++;
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex}`);
      params.push(phone);
      paramIndex++;
    }

    if (address !== undefined) {
      updateFields.push(`address = $${paramIndex}`);
      params.push(address);
      paramIndex++;
    }

    if (avatar_url !== undefined) {
      updateFields.push(`avatar_url = $${paramIndex}`);
      params.push(avatar_url);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có thông tin nào để cập nhật'
      });
    }

    // Always update updated_at
    updateFields.push(`updated_at = NOW()`);

    // Add user_id to params for WHERE clause
    params.push(userId);

    const updateQuery = `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE user_id = $${paramIndex}
      RETURNING id, user_id, email, full_name, phone, role, status, 
                avatar_url, address, created_at, updated_at
    `;

    const result = await pool.query(updateQuery, params);

    res.json({
      success: true,
      message: 'Cập nhật hồ sơ thành công',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật hồ sơ',
      error: error.message
    });
  }
});



router.get('/stats/overview', authenticateToken, isAdmin, async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role::text IN ('CUSTOMER', '1', 'USER') THEN 1 END) as total_customers,
        COUNT(CASE WHEN role::text IN ('ADMIN', '2', '0') THEN 1 END) as total_admins,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_users,
        COUNT(CASE WHEN status = 'BLOCKED' THEN 1 END) as blocked_users,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_7d
      FROM users
    `;

    const result = await pool.query(statsQuery);
    const stats = result.rows[0];

    res.json({
      success: true,
      data: {
        totalUsers: parseInt(stats.total_users),
        totalCustomers: parseInt(stats.total_customers),
        totalAdmins: parseInt(stats.total_admins),
        activeUsers: parseInt(stats.active_users),
        blockedUsers: parseInt(stats.blocked_users),
        newUsers30Days: parseInt(stats.new_users_30d),
        newUsers7Days: parseInt(stats.new_users_7d)
      }
    });
  } catch (error) {
    console.error('Error fetching users statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê người dùng',
      error: error.message
    });
  }
});

// ==================== GET USER BY ID ====================
/**
 * GET /users/:id
 * Get user by ID (Admin or own profile)
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role_id;

    // Check permission: Admin or owner
    if (requesterRole !== 2 && requesterId !== id && req.user.sub !== id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem thông tin người dùng này'
      });
    }

    const result = await pool.query(
      `SELECT 
        id, user_id, email, full_name, phone, role, status, 
        avatar_url, address, created_at, updated_at
      FROM users 
      WHERE id::text = $1 OR user_id::text = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin người dùng',
      error: error.message
    });
  }
});

// ==================== GET USER BY EMAIL (Admin Only) ====================
/**
 * GET /users/email/:email
 * Get user by email
 */
router.get('/email/:email', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { email } = req.params;

    const result = await pool.query(
      `SELECT 
        id, user_id, email, full_name, phone, role, status, 
        avatar_url, address, created_at, updated_at
      FROM users 
      WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng với email này'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching user by email:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin người dùng',
      error: error.message
    });
  }
});

// ==================== CREATE USER (Admin Only) ====================
/**
 * POST /users
 * Create new user
 */
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const {
      email,
      password,
      full_name,
      phone,
      role = 'CUSTOMER',
      status = 'ACTIVE',
      avatar_url,
      address
    } = req.body;

    // Validate required fields
    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Email, mật khẩu và họ tên là bắt buộc'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    // Validate role
    if (!['CUSTOMER', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role không hợp lệ. Chỉ chấp nhận CUSTOMER hoặc ADMIN'
      });
    }

    // Check if email exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Insert user - Sync both password columns for synchronization with Python
    const insertQuery = `
      INSERT INTO users (
        user_id, email, password_hash, password, full_name, phone, 
        role, status, avatar_url, address, created_at, updated_at
      )
      VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id, user_id, email, full_name, phone, role, status, 
                avatar_url, address, created_at, updated_at
    `;

    const result = await pool.query(insertQuery, [
      userId,
      email,
      hashedPassword,
      full_name,
      phone || null,
      role,
      status,
      avatar_url || null,
      address || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Tạo người dùng thành công',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo người dùng',
      error: error.message
    });
  }
});

// ==================== UPDATE USER ====================
/**
 * PUT /users/:id
 * Update user (Admin or own profile)
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role_id;

    // Check if user exists
    const userCheck = await pool.query(
      'SELECT id, user_id, role, status FROM users WHERE user_id = $1',
      [requesterId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const existingUser = userCheck.rows[0];

    // Check permission: Admin or the user themselves
    const isOwner = (requesterId === existingUser.user_id);
    const isAdminUser = 
        req.user?.role_id === 2 || 
        req.user?.role === 0 || 
        req.user?.role === 'ADMIN' || 
        req.user?.role_id === 'ADMIN';

    if (!isOwner && !isAdminUser) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật thông tin người dùng này'
      });
    }
    console.log(`isOwner: ${isOwner}, isAdminUser: ${isAdminUser}`);

    const {
      full_name,
      phone,
      avatar_url,
      address,
      role,
      status
    } = req.body;
    console.log(req.body);

    // Only admin can change role and status
    if ((role || status) && !isAdminUser) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có thể thay đổi role và status'
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    if (full_name !== undefined) {
      updateFields.push(`full_name = $${paramIndex}`);
      params.push(full_name);
      paramIndex++;
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex}`);
      params.push(phone);
      paramIndex++;
    }

    if (avatar_url !== undefined) {
      updateFields.push(`avatar_url = $${paramIndex}`);
      params.push(avatar_url);
      paramIndex++;
    }

    if (address !== undefined) {
      updateFields.push(`address = $${paramIndex}`);
      params.push(address);
      paramIndex++;
    }

    // Admin-only fields
    if (isAdminUser) {
      if (role !== undefined) {
        // Fetch valid roles from Python API
        try {
          const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000/api/v1';
          const rolesResponse = await axios.get(`${pythonApiUrl}/roles-management/roles`);
          const rolesData = rolesResponse.data.data;
          console.log(`rolesData: ${JSON.stringify(rolesData)}`);
          
          // Map to slugs or IDs as needed. Let's check both just in case.
          const validRoleSlugs = rolesData.map(r => r.slug);
          const validRoleIds = rolesData.map(r => r.id);
          
          // Combined list for validation
          const allValidRoles = [...validRoleSlugs, ...validRoleIds, 0, 1, 'CUSTOMER', 'ADMIN'];

          if (!allValidRoles.includes(role)) {
            return res.status(400).json({
              success: false,
              message: `Role không hợp lệ. Các role hợp lệ: ${validRoleSlugs.join(', ')}`
            });
          }
        } catch (error) {
          console.error('Error fetching roles from Python API:', error.message);
          // Fallback to basic validation if Python API is down
          if (![0, 1, 'CUSTOMER', 'ADMIN'].includes(role)) {
            return res.status(400).json({
              success: false,
              message: 'Role không hợp lệ (Không thể kết nối với hệ thống phân quyền)'
            });
          }
        }
        updateFields.push(`role = $${paramIndex}`);
        params.push(role);
        paramIndex++;
      }

      if (status !== undefined) {
        if (!['ACTIVE', 'BLOCKED'].includes(status)) {
          return res.status(400).json({
            success: false,
            message: 'Status không hợp lệ'
          });
        }
        updateFields.push(`status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có thông tin nào để cập nhật'
      });
    }

    // Always update updated_at
    updateFields.push(`updated_at = NOW()`);

    // Add ID to params
    params.push(existingUser.id); // Use the numeric ID from database

    const updateQuery = `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, user_id, email, full_name, phone, role, status, 
                avatar_url, address, created_at, updated_at
    `;

    const result = await pool.query(updateQuery, params);

    res.json({
      success: true,
      message: 'Cập nhật thông tin người dùng thành công',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông tin người dùng',
      error: error.message
    });
  }
});

// ==================== CHANGE PASSWORD ====================
/**
 * PUT /users/:id/password
 * Change user password (own profile or admin)
 */
router.put('/:id/password', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role_id;
    const { currentPassword, newPassword } = req.body;

    // Check permission
    const isOwner = requesterId === parseInt(id);
    const isAdminUser = requesterRole === 2;

    if (!isOwner && !isAdminUser) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thay đổi mật khẩu người dùng này'
      });
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    // Get current user
    const userResult = await pool.query(
      'SELECT id, password_hash FROM users WHERE id::text = $1 OR user_id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const user = userResult.rows[0];

    // If owner is changing their own password, verify current password
    if (isOwner && !isAdminUser) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập mật khẩu hiện tại'
        });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Mật khẩu hiện tại không đúng'
        });
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đổi mật khẩu',
      error: error.message
    });
  }
});

// ==================== UPDATE USER STATUS (Admin Only) ====================
/**
 * PUT /users/:id/status
 * Block/Unblock user (soft delete)
 */
router.put('/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'BLOCKED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status không hợp lệ. Chỉ chấp nhận ACTIVE hoặc BLOCKED'
      });
    }

    // Check if user exists
    const userCheck = await pool.query(
      'SELECT id, user_id, status FROM users WHERE id::text = $1 OR user_id = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Prevent admin from blocking themselves
    // req.user.id is the UUID from the token
    if (userCheck.rows[0].user_id === req.user.id && status === 'BLOCKED') {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể khóa tài khoản của chính mình'
      });
    }

    // Update status
    const result = await pool.query(
      `UPDATE users 
       SET status = $1, updated_at = NOW() 
       WHERE id::text = $2 OR user_id = $2
       RETURNING id, user_id, email, full_name, status`,
      [status, id]
    );

    res.json({
      success: true,
      message: status === 'BLOCKED' ? 'Đã khóa người dùng' : 'Đã mở khóa người dùng',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái người dùng',
      error: error.message
    });
  }
});

// ==================== DELETE USER (Hard Delete - Admin Only) ====================
/**
 * DELETE /users/:id
 * Permanently delete user
 * WARNING: This will cascade delete related data
 */
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Prevent admin from deleting themselves
    if (id === req.user.id || (req.user.sub === id)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể xóa tài khoản của chính mình'
      });
    }

    // Check if user exists
    const userCheck = await client.query(
      'SELECT id, user_id, email, full_name FROM users WHERE id::text = $1 OR user_id = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const user = userCheck.rows[0];

    // Check for related orders
    const ordersCheck = await client.query(
      'SELECT COUNT(*) as count FROM orders WHERE user_id = $1',
      [user.user_id]
    );

    const orderCount = parseInt(ordersCheck.rows[0].count);

    if (orderCount > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Không thể xóa người dùng có ${orderCount} đơn hàng. Vui lòng khóa tài khoản thay vì xóa.`
      });
    }

    // Delete user (will cascade to related tables)
    await client.query('DELETE FROM users WHERE id = $1', [user.id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Đã xóa người dùng thành công',
      data: {
        deletedUser: {
          id: user.id,
          email: user.email,
          full_name: user.full_name
        }
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa người dùng',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// ==================== GET USER ORDERS ====================
/**
 * GET /users/:id/orders
 * Get all orders of a user
 */
router.get('/:id/orders', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role_id;

    // Check permission
    if (requesterRole !== 2 && requesterId !== id && req.user.sub !== id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem đơn hàng của người dùng này'
      });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT id, user_id FROM users WHERE id::text = $1 OR user_id::text = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const { page = 1, limit = 10, status } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const userId = userCheck.rows[0].user_id;

    // Build query
    let whereClause = 'WHERE o.user_id = $1::uuid';
    const params = [userId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM orders o ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get orders
    const ordersQuery = `
      SELECT 
        o.id, o.order_code, o.tour_name, o.location_name,
        o.start_date, o.end_date, o.total_price, o.status,
        o.payment_status, o.created_at
      FROM orders o
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const ordersResult = await pool.query(ordersQuery, [...params, limitNum, offset]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        orders: ordersResult.rows,
        pagination: {
          currentPage: pageNum,
          pageSize: limitNum,
          totalItems: total,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đơn hàng',
      error: error.message
    });
  }
});

// ==================== GET USER STATISTICS ====================
/**
 * GET /users/:id/statistics
 * Get user statistics (total orders, total spent, etc.)
 */
router.get('/:id/statistics', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role_id;

    // Check permission
    if (requesterRole !== 2 && requesterId !== id && req.user.sub !== id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem thống kê của người dùng này'
      });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT id, user_id FROM users WHERE id::text = $1 OR user_id::text = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const userId = userCheck.rows[0].user_id;

    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'CONFIRMED' OR status = 'PAID' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_orders,
        COALESCE(SUM(CASE WHEN status = 'CONFIRMED' OR status = 'PAID' THEN total_price ELSE 0 END), 0) as total_spent,
        COALESCE(AVG(CASE WHEN status = 'CONFIRMED' OR status = 'PAID' THEN total_price END), 0) as avg_order_value,
        CASE WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END)::float / COUNT(*)) * 100 ELSE 0 END as cancellation_rate
      FROM orders
      WHERE user_id = $1::uuid
    `;

    const statsResult = await pool.query(statsQuery, [userId]);
    const stats = statsResult.rows[0];

    res.json({
      success: true,
      data: {
        totalOrders: parseInt(stats.total_orders),
        completedOrders: parseInt(stats.completed_orders),
        cancelledOrders: parseInt(stats.cancelled_orders),
        totalSpent: parseFloat(stats.total_spent),
        avgOrderValue: parseFloat(stats.avg_order_value),
        cancellationRate: parseFloat(stats.cancellation_rate)
      }
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê người dùng',
      error: error.message
    });
  }
});


module.exports = router;

