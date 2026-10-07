const pool = require('../config/database');

// Lấy danh sách orders đầy đủ với filters và pagination (dành cho admin)
exports.getOrdersList = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      payment_status,
      user_id,
      start_date,
      end_date,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

   if (!req.user.sub || !req.user.sub) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  // check role 
  if (req.user.role != 0 ) {
    return res.status(403).json({ success: false, message: 'User not authenticated' });
  }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;

    // Build dynamic WHERE clause
    const conditions = ['1=1'];
    const params = [];
    let paramIndex = 1;

    // Filter by status
    if (status && status !== '') {
      conditions.push(`o.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    // Filter by payment status
    if (payment_status && payment_status !== '') {
      conditions.push(`o.payment_status = $${paramIndex}`);
      params.push(payment_status);
      paramIndex++;
    }

    // Filter by user_id
    if (user_id && user_id !== '') {
      conditions.push(`o.user_id = $${paramIndex}`);
      params.push(user_id);
      paramIndex++;
    }

    // Filter by start date
    if (start_date && start_date !== '') {
      conditions.push(`o.start_date >= $${paramIndex}::date`);
      params.push(start_date);
      paramIndex++;
    }

    // Filter by end date
    if (end_date && end_date !== '') {
      conditions.push(`o.start_date <= $${paramIndex}::date`);
      params.push(end_date);
      paramIndex++;
    }

    // Search across multiple fields
    if (search && search !== '') {
      conditions.push(`(
        o.order_code ILIKE $${paramIndex} OR 
        o.tour_name ILIKE $${paramIndex} OR 
        o.contact_name ILIKE $${paramIndex} OR
        o.contact_email ILIKE $${paramIndex} OR
        u.full_name ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Validate sort_by to prevent SQL injection
    const allowedSortFields = ['o.created_at', 'o.total_price', 'o.status', 'o.payment_status', 'o.start_date'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'o.created_at';
    const sortDir = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count total records
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total) || 0;

    // Get orders with full details
    const query = `
      SELECT 
        o.id,
        o.order_code,
        o.user_id,
        u.full_name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        o.tour_id,
        o.tour_name,
        t.slug as tour_slug,
        o.schedule_id,
        ts.start_date as schedule_start,
        ts.end_date as schedule_end,
        ts.available_slots,
        ts.booked_slots,
        l.name as location_name,
        ti.image_url as tour_image,
        o.adult_quantity,
        o.child_quantity,
        o.infant_quantity,
        o.total_participants,
        o.contact_name,
        o.contact_phone,
        o.contact_email,
        o.subtotal,
        o.discount_amount,
        o.total_price,
        o.status,
        o.payment_status,
        o.special_requests,
        o.created_at,
        o.updated_at
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      LEFT JOIN tours t ON o.tour_id = t.id
      LEFT JOIN locations l ON t.location_id = l.id
      LEFT JOIN tour_schedules ts ON o.schedule_id = ts.id
      LEFT JOIN tour_images ti ON t.id = ti.tour_id AND ti.is_cover = true
      WHERE ${whereClause}
      ORDER BY ${sortField} ${sortDir}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limitNum, offset);
    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        orders: result.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          total_pages: Math.ceil(total / limitNum),
          has_more: pageNum * limitNum < total
        },
        filters: {
          status,
          payment_status,
          user_id,
          start_date,
          end_date,
          search
        }
      },
    });
  } catch (error) {
    console.error('Error fetching orders list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
};

// Lấy tất cả orders (admin hoặc cho mục đích test)
/* exports.getAllOrders = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; */

// Lấy tất cả orders của user đang đăng nhập
exports.getMyOrders = async (req, res) => {
  if (!req.user.sub && !req.user.id) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  const userId = req.user.sub || req.user.id;

  // Lấy page và pageSize từ query, mặc định page=1, pageSize=10
  const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
  const pageSize = parseInt(req.query.pageSize) > 0 ? parseInt(req.query.pageSize) : 10;
  const offset = (page - 1) * pageSize;
  const type = req.query.type; // upcoming, history, cancelled

  try {
    let whereClause = "o.user_id = $1";
    let orderBy = "o.created_at DESC";
    
    if (type === 'upcoming') {
      // Sắp đi: Những tour có ngày kết thúc từ hôm nay trở đi (đang diễn ra hoặc sắp tới)
      whereClause += " AND COALESCE(o.end_date, o.start_date) >= CURRENT_DATE AND o.status != 'CANCELLED'";
      orderBy = "o.start_date ASC, o.created_at DESC";
    } else if (type === 'history') {
      // Lịch sử: Những tour đã kết thúc trước hôm nay
     /*  whereClause += " AND COALESCE(o.end_date, o.start_date) < CURRENT_DATE AND o.status != 'CANCELLED'";
      orderBy = "o.start_date DESC, o.created_at DESC"; */
      /// Lấy tất cả luôn  
      whereClause += " AND o.status != 'CANCELLED'";
      orderBy = "o.start_date DESC, o.created_at DESC";
    } else if (type === 'cancelled') {
      // Đã hủy: Tất cả các tour bị hủy
      whereClause += " AND o.status = 'CANCELLED'";
      orderBy = "o.created_at DESC";
    }

    // Đếm tổng số đơn
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM orders o WHERE ${whereClause}`, [userId]
    );
    const total = parseInt(countResult.rows[0].count);

    // Lấy dữ liệu phân trang với thông tin review
    const result = await pool.query(
      `SELECT o.*, t.name as tour_name, t.slug as tour_slug, tr.image_url as cover_image,
       CASE WHEN r.id IS NOT NULL THEN true ELSE false END as has_review,
       r.id as review_id,
       r.rating as review_rating
       FROM orders o
       LEFT JOIN tours t ON o.tour_id = t.id
       LEFT JOIN tour_images tr ON tr.tour_id = t.id AND tr.is_cover = true
       LEFT JOIN reviews r ON r.order_id = o.id AND r.user_id = o.user_id
       WHERE ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $2 OFFSET $3`,
      [userId, pageSize, offset]
    );
    
    res.json({
      data: result.rows,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Lấy danh sách người đi của một đơn hàng
exports.getOrderParticipants = async (req, res) => {
  const { orderId } = req.params;

  try {
    if (!orderId || isNaN(Number(orderId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID',
      });
    }

    // Lấy participants
    const participantsRes = await pool.query(
      `SELECT * FROM order_participants 
       WHERE order_id = $1 
       ORDER BY full_name ASC`,
      [orderId]
    );

    res.json({
      success: true,
      data: {
        participants: participantsRes.rows,
        total: participantsRes.rows.length,
      },
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch participants',
      error: error.message,
    });
  }
};

// Lấy chi tiết order đầy đủ
exports.getOrderById = async (req, res) => {
  const { code } = req.params;
  console.log('Helo', code)
  try {
    // Lấy thông tin order + join các bảng liên quan
    const orderDetailResult = await pool.query(`
      SELECT o.*,
        u.full_name as user_name, u.email as user_email, u.phone as user_phone,
        t.name as tour_name, t.slug as tour_slug, t.description as tour_description,
        ts.start_date, ts.end_date,
        dc.code as discount_code, dc.discount_type, dc.discount_value,
        p.payment_method, p.amount as payment_amount, p.payment_status, p.paid_at,
        (SELECT image_url FROM tour_images WHERE tour_id = t.id AND is_cover = true LIMIT 1) as image_url,
        CASE WHEN r.id IS NOT NULL THEN true ELSE false END as has_review,
        r.id as review_id,
        r.rating as review_rating
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      LEFT JOIN tours t ON o.tour_id = t.id
      LEFT JOIN tour_schedules ts ON o.schedule_id = ts.id
      LEFT JOIN discount_codes dc ON o.discount_code_id = dc.id
      LEFT JOIN payments p ON p.order_id = o.id
      LEFT JOIN reviews r ON r.order_id = o.id AND r.user_id = o.user_id
      WHERE o.order_code = $1
    `, [code]);

    if (!orderDetailResult.rows.length) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = orderDetailResult.rows[0];

    // Kiểm tra order có phải của user đang đăng nhập không
    if (!order.id || isNaN(Number(order.id))) {
      return res.status(500).json({ error: 'Order ID is invalid (not bigint)' });
    }
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    if (order.user_id != req.user.sub) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this order', success: false, message: 'Forbidden: You do not have access to this order' });
    }

    // Lấy participants và amenities theo order.id (kiểu số)
    let participants = [];
    let amenities = [];
    try {
      const participantsRes = await pool.query(
        'SELECT * FROM order_participants WHERE order_id = $1', [order.id]
      );
      participants = participantsRes.rows;
    } catch (e) {
      console.error('Error fetching participants:', e.message);
    }
    try {
      const amenitiesRes = await pool.query(
        'SELECT * FROM order_amenities WHERE order_id = $1', [order.id]
      );
      amenities = amenitiesRes.rows;
    } catch (e) {
      console.error('Error fetching amenities:', e.message);
    }

    res.json({
      ...order,
      participants,
      amenities
    });
  } catch (err) {
    console.error('Order get error:', err.message);
    res.status(500).json({ error: err.message });
  }
};



// Tạo order mới
exports.createOrder = async (req, res) => {
  const data = req.body;
  try {
    // CRITICAL: Lấy user_id từ authenticated token, không từ request body
    // Điều này đảm bảo order luôn thuộc về user đã đăng nhập
    const authenticatedUserId = req.user?.sub; // Python backend uses 'sub'
    
    if (!authenticatedUserId) {
      return res.status(401).json({ 
        success: false,
        error: 'User not authenticated. Please log in again.' 
      });
    }

    console.log('Creating order for authenticated user:', authenticatedUserId);
    console.log('Request body user_id (ignored):', data.user_id);

    // Chỉ insert các trường cơ bản, các bảng liên quan insert sau
    const insertQuery = `
      INSERT INTO orders (order_code, user_id, tour_id, schedule_id, tour_name, start_date, adult_quantity, child_quantity, infant_quantity, total_participants, contact_name, contact_phone, contact_email, special_requests, subtotal, discount_amount, total_price, status, payment_status, note)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      RETURNING *
    `;
    
    // Sử dụng authenticatedUserId thay vì data.user_id
    const values = [
      data.order_code, 
      authenticatedUserId,  // <-- LẤY TỪ TOKEN, KHÔNG PHẢI REQUEST BODY
      data.tour_id, 
      data.schedule_id, 
      data.tour_name, 
      data.start_date, 
      data.adult_quantity, 
      data.child_quantity, 
      data.infant_quantity, 
      data.total_participants, 
      data.contact_name, 
      data.contact_phone, 
      data.contact_email, 
      data.special_requests, 
      data.subtotal, 
      data.discount_amount, 
      data.total_price, 
      data.status, 
      data.payment_status, 
      data.note
    ];
    
    const result = await pool.query(insertQuery, values);
    console.log('Order created successfully:', result.rows[0]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: err.message });
  }
};



// Cập nhật order
exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  
  try {
    // Dynamic update logic
    const fields = Object.keys(data).filter(key => 
      ['order_code', 'user_id', 'tour_id', 'schedule_id', 'tour_name', 'start_date', 'end_date',
       'adult_quantity', 'child_quantity', 'infant_quantity', 'total_participants', 
       'contact_name', 'contact_phone', 'contact_email', 'special_requests', 
       'subtotal', 'discount_amount', 'total_price', 'status', 'payment_status', 'note'].includes(key)
    );

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update' });
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const values = fields.map(field => data[field]);
    values.push(id);

    const updateQuery = `
      UPDATE orders SET
        ${setClause}, updated_at = NOW()
      WHERE id = $${fields.length + 1} RETURNING *
    `;
    
    const result = await pool.query(updateQuery, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Update order error details:', {
        id,
        receivedData: data,
        errorMessage: err.message,
        stack: err.stack
    });
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};


// Xóa order
exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM orders WHERE id = $1', [id]);
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


