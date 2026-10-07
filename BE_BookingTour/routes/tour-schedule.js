const express = require("express");
const pool = require("../config/database");
const router = express.Router();

/**
 * ===============================================
 * TOUR SCHEDULE ENDPOINTS - FINAL VERSION
 * ===============================================
 * Schema: tour_schedules, orders, order_participants
 * Status enum: OPEN, CLOSED, FULL
 */

// ===========================
// 1. GET SCHEDULE WITH TOUR DETAILS
// ===========================
/**
 * GET /:schedule_id/tour
 * Lấy thông tin schedule + tour đầy đủ (tour details, location, category, images, itinerary, amenities)
 */
router.get("/:schedule_id/tour", async (req, res) => {
  try {
    const { schedule_id } = req.params;

    // 1. Lấy schedule + tour
    const scheduleRes = await pool.query(
      `SELECT ts.*, t.*, l.name as location_name, l.slug as location_slug, c.name as category_name, c.slug as category_slug, c.icon as category_icon
       FROM tour_schedules ts
       JOIN tours t ON ts.tour_id = t.id
       LEFT JOIN locations l ON t.location_id = l.id
       LEFT JOIN tour_categories c ON t.category_id = c.id
       WHERE ts.id = $1`,
      [schedule_id]
    );

    if (scheduleRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Schedule not found" });
    }

    const row = scheduleRes.rows[0];

    // 2. Lấy images
    const imagesRes = await pool.query(
      `SELECT image_url, alt_text, is_cover, display_order FROM tour_images WHERE tour_id = $1 ORDER BY is_cover DESC, display_order ASC`,
      [row.tour_id]
    );

    // 3. Lấy days + places
    const daysRes = await pool.query(
      `SELECT id, day_number, title, description, accommodation, meals FROM tour_days WHERE tour_id = $1 ORDER BY day_number ASC`,
      [row.tour_id]
    );

    const itinerary = await Promise.all(
      daysRes.rows.map(async (day) => {
        const placesRes = await pool.query(
          `SELECT dp.visit_order, dp.duration_minutes, dp.notes, p.id as place_id, p.name, p.slug, p.address, p.latitude, p.longitude, p.image_url, p.type, p.rating
           FROM day_places dp JOIN places p ON dp.place_id = p.id WHERE dp.tour_day_id = $1 ORDER BY dp.visit_order ASC`,
          [day.id]
        );
        return {
          day_number: day.day_number,
          title: day.title,
          description: day.description,
          accommodation: day.accommodation,
          meals: day.meals,
          places: placesRes.rows.map(p => ({
            id: p.place_id,
            name: p.name,
            slug: p.slug,
            address: p.address,
            latitude: p.latitude ? parseFloat(p.latitude) : null,
            longitude: p.longitude ? parseFloat(p.longitude) : null,
            image_url: p.image_url,
            type: p.type,
            rating: p.rating ? parseFloat(p.rating) : null,
            visit_order: p.visit_order,
            duration_minutes: p.duration_minutes,
            notes: p.notes
          }))
        };
      })
    );

    // 4. Lấy amenities
    const amenitiesRes = await pool.query(
      `SELECT ta.amenity_id, a.name, a.slug, a.icon, a.category, ta.price, ta.is_included, ta.is_optional
       FROM tour_amenities ta JOIN amenities a ON ta.amenity_id = a.id WHERE ta.tour_id = $1 ORDER BY a.category, a.name`,
      [row.tour_id]
    );

    // 5. Calculate occupancy
    const occupancyRate = row.total_slots > 0 
      ? ((row.booked_slots / row.total_slots) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        schedule: {
          id: row.id,
          tour_id: row.tour_id,
          start_date: row.start_date,
          end_date: row.end_date,
          price_override: row.price_override,
          total_slots: row.total_slots,
          available_slots: row.available_slots,
          booked_slots: row.booked_slots,
          occupancy_rate: occupancyRate,
          status: row.status,
          notes: row.notes,
          created_at: row.created_at,
          updated_at: row.updated_at
        },
        tour: {
          id: row.tour_id,
          name: row.name,
          slug: row.slug,
          short_description: row.short_description,
          description: row.description,
          duration_days: row.duration_days,
          duration_nights: row.duration_nights,
          base_price: row.base_price,
          child_price: row.child_price,
          infant_price: row.infant_price,
          max_participants: row.max_participants,
          min_participants: row.min_participants,
          difficulty: row.difficulty,
          transportation_type: row.transportation_type,
          departure_location: row.departure_location,
          return_location: row.return_location,
          rating: row.rating,
          review_count: row.review_count
        },
        location: row.location_id ? {
          id: row.location_id,
          name: row.location_name,
          slug: row.location_slug
        } : null,
        category: row.category_id ? {
          id: row.category_id,
          name: row.category_name,
          slug: row.category_slug,
          icon: row.category_icon
        } : null,
        images: imagesRes.rows,
        itinerary,
        amenities: amenitiesRes.rows
      }
    });
  } catch (error) {
    console.error('Error fetching tour by schedule:', error);
    res.status(500).json({ success: false, message: 'Error fetching tour', error: error.message });
  }
});

// ===========================
// 2. CREATE SCHEDULE
// ===========================
/**
 * POST /
 * Tạo lịch khởi hành mới
 */
router.post('/', async (req, res) => {
  try {
    const { tour_id, start_date, end_date, price_override, total_slots, status, notes } = req.body;

    if (!tour_id || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'tour_id, start_date, and end_date are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO tour_schedules (tour_id, start_date, end_date, price_override, total_slots, available_slots, status, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        tour_id, 
        start_date, 
        end_date, 
        price_override || null, 
        total_slots || 20, 
        total_slots || 20, // Initial available slots = total slots
        status || 'OPEN', 
        notes || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating schedule',
      error: error.message
    });
  }
});

// ===========================
// 3. UPDATE SCHEDULE
// ===========================
/**
 * PUT /:id
 * Cập nhật lịch khởi hành
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, price_override, total_slots, available_slots, status, notes } = req.body;

    const result = await pool.query(
      `UPDATE tour_schedules
       SET 
         start_date = COALESCE($1, start_date),
         end_date = COALESCE($2, end_date),
         price_override = COALESCE($3, price_override),
         total_slots = COALESCE($4, total_slots),
         available_slots = COALESCE($5, available_slots),
         status = COALESCE($6, status),
         notes = COALESCE($7, notes),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [start_date, end_date, price_override, total_slots, available_slots, status, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating schedule',
      error: error.message
    });
  }
});

// ===========================
// 4. DELETE SCHEDULE
// ===========================
/**
 * DELETE /:id
 * Xóa lịch khởi hành
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if schedule has active bookings
    const bookingsCheck = await pool.query(
      "SELECT COUNT(*) as count FROM orders WHERE schedule_id = $1 AND status != 'CANCELLED'",
      [id]
    );

    if (bookingsCheck.rows[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete schedule with active bookings'
      });
    }

    const result = await pool.query(
      'DELETE FROM tour_schedules WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting schedule',
      error: error.message
    });
  }
});

// ===========================
// 5. GET SCHEDULE OVERVIEW
// ===========================
/**
 * GET /overview/:scheduleId
 * Lấy tổng quan schedule (occupancy, booking stats)
 */
router.get('/overview/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const result = await pool.query(
      `SELECT 
        ts.*,
        t.name as tour_name,
        t.slug as tour_slug,
        t.base_price,
        l.name as location_name,
        COUNT(DISTINCT o.id) as total_bookings,
        SUM(o.total_participants) as total_customers,
        SUM(o.total_price) FILTER (WHERE o.payment_status = 'PAID') as total_revenue
      FROM tour_schedules ts
      LEFT JOIN tours t ON ts.tour_id = t.id
      LEFT JOIN locations l ON t.location_id = l.id
      LEFT JOIN orders o ON ts.id = o.schedule_id AND o.status != 'CANCELLED'
      WHERE ts.id = $1
      GROUP BY ts.id, t.id, l.id`,
      [scheduleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    const schedule = result.rows[0];
    schedule.occupancy_rate = schedule.total_slots > 0 
      ? ((schedule.booked_slots / schedule.total_slots) * 100).toFixed(2)
      : 0;
    schedule.available_slots_remaining = schedule.total_slots - schedule.booked_slots;

    res.json({ success: true, data: schedule });
  } catch (error) {
    console.error('Error fetching schedule overview:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch schedule', error: error.message });
  }
});

// ===========================
// 6. GET CUSTOMERS LIST BY SCHEDULE
// ===========================
/**
 * GET /customers/:scheduleId
 * Lấy danh sách khách hàng của schedule (with participants)
 */
router.get('/customers/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { payment_status, order_status, search } = req.query;

    const conditions = ['o.schedule_id = $1', "o.status != 'CANCELLED'"];
    const params = [scheduleId];
    let paramIndex = 2;

    if (payment_status) {
      conditions.push(`o.payment_status = $${paramIndex}`);
      params.push(payment_status);
      paramIndex++;
    }

    if (order_status) {
      conditions.push(`o.status = $${paramIndex}`);
      params.push(order_status);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(
        o.order_code ILIKE $${paramIndex} OR
        o.contact_name ILIKE $${paramIndex} OR
        o.contact_email ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get orders
    const ordersQuery = `
      SELECT 
        o.id, o.order_code, o.created_at as booking_date,
        o.contact_name, o.contact_phone, o.contact_email,
        o.total_participants, o.adult_quantity, o.child_quantity, o.infant_quantity,
        o.total_price, o.payment_status, o.status as order_status
      FROM orders o
      WHERE ${whereClause}
      ORDER BY o.created_at DESC
    `;

    const ordersResult = await pool.query(ordersQuery, params);
    const orderIds = ordersResult.rows.map(o => o.id);

    // Get participants
    let participants = [];
    if (orderIds.length > 0) {
      const participantsQuery = `
        SELECT op.*, op.order_id
        FROM order_participants op
        WHERE op.order_id = ANY($1)
        ORDER BY op.order_id, op.full_name
      `;
      const participantsResult = await pool.query(participantsQuery, [orderIds]);
      participants = participantsResult.rows;
    }

    const participantsByOrder = participants.reduce((acc, p) => {
      if (!acc[p.order_id]) acc[p.order_id] = [];
      acc[p.order_id].push(p);
      return acc;
    }, {});

    const customers = ordersResult.rows.map(order => ({
      ...order,
      participants: participantsByOrder[order.id] || []
    }));

    const stats = {
      total_bookings: customers.length,
      total_customers: customers.reduce((sum, c) => sum + c.total_participants, 0),
      paid_bookings: customers.filter(c => c.payment_status === 'PAID').length,
      pending_bookings: customers.filter(c => c.payment_status === 'UNPAID').length,
      total_revenue: customers
        .filter(c => c.payment_status === 'PAID')
        .reduce((sum, c) => sum + parseFloat(c.total_price || 0), 0)
    };

    res.json({ success: true, data: { customers, statistics: stats } });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customers', error: error.message });
  }
});

// ===========================
// 7. GET ALL PARTICIPANTS 
// ===========================
/**
 * GET /participants/:scheduleId
 * Lấy danh sách tất cả người đi 
 */
router.get('/participants/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { participant_type, gender, search } = req.query;

    const conditions = ['o.schedule_id = $1', "o.status != 'CANCELLED'"];
    const params = [scheduleId];
    let paramIndex = 2;

    if (participant_type) {
      conditions.push(`op.participant_type = $${paramIndex}`);
      params.push(participant_type);
      paramIndex++;
    }

    if (gender) {
      conditions.push(`op.gender = $${paramIndex}`);
      params.push(gender);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(
        op.full_name ILIKE $${paramIndex} OR
        op.id_number ILIKE $${paramIndex} OR
        op.email ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const result = await pool.query(
      `SELECT 
        op.*,
        o.order_code,
        o.contact_name as booking_contact,
        o.payment_status,
        EXTRACT(YEAR FROM AGE(op.date_of_birth))::int as age
      FROM order_participants op
      JOIN orders o ON op.order_id = o.id
      WHERE ${whereClause}
      ORDER BY op.participant_type, op.full_name`,
      params
    );

    const grouped = {
      adults: result.rows.filter(p => p.participant_type === 'ADULT'),
      children: result.rows.filter(p => p.participant_type === 'CHILD'),
      infants: result.rows.filter(p => p.participant_type === 'INFANT')
    };

    res.json({
      success: true,
      data: {
        participants: result.rows,
        grouped,
        summary: {
          total: result.rows.length,
          adults: grouped.adults.length,
          children: grouped.children.length,
          infants: grouped.infants.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch participants', error: error.message });
  }
});

// ===========================
// 8. GET STATISTICS
// ===========================
/**
 * GET /statistics/:scheduleId
 * Lấy thống kê schedule
 */
router.get('/statistics/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const result = await pool.query(
      `SELECT 
        ts.total_slots,
        ts.booked_slots,
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT CASE WHEN o.payment_status = 'PAID' THEN o.id END) as paid_orders,
        COUNT(DISTINCT CASE WHEN o.payment_status = 'UNPAID' THEN o.id END) as unpaid_orders,
        SUM(o.adult_quantity) as total_adults,
        SUM(o.child_quantity) as total_children,
        SUM(o.infant_quantity) as total_infants,
        SUM(o.total_price) as total_revenue_potential,
        SUM(CASE WHEN o.payment_status = 'PAID' THEN o.total_price ELSE 0 END) as total_revenue_confirmed
      FROM tour_schedules ts
      LEFT JOIN orders o ON ts.id = o.schedule_id AND o.status != 'CANCELLED'
      WHERE ts.id = $1
      GROUP BY ts.id, ts.total_slots, ts.booked_slots`,
      [scheduleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    const stats = result.rows[0];
    stats.occupancy_rate = stats.total_slots > 0 
      ? ((stats.booked_slots / stats.total_slots) * 100).toFixed(2) 
      : 0;
    stats.payment_completion_rate = stats.total_orders > 0
      ? ((stats.paid_orders / stats.total_orders) * 100).toFixed(2)
      : 0;

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: error.message });
  }
});

// ===========================
// 9. GET ALL SCHEDULES WITH FILTERS
// ===========================
/**
 * GET /
 * Lấy danh sách schedules (with filters, pagination)
 */
router.get('/', async (req, res) => {
  try {
    const { tour_id, status, from_date, to_date, page = 1, limit = 20 } = req.query;

    const conditions = ['1=1'];
    const params = [];
    let paramIndex = 1;

    if (tour_id) {
      conditions.push(`ts.tour_id = $${paramIndex}`);
      params.push(tour_id);
      paramIndex++;
    }

    if (status) {
      conditions.push(`ts.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (from_date) {
      conditions.push(`ts.start_date >= $${paramIndex}`);
      params.push(from_date);
      paramIndex++;
    }

    if (to_date) {
      conditions.push(`ts.start_date <= $${paramIndex}`);
      params.push(to_date);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const offset = (Number(page) - 1) * Number(limit);

    const query = `
      SELECT 
        ts.*,
        t.name as tour_name,
        l.name as location_name,
        COUNT(DISTINCT o.id) FILTER (WHERE o.status != 'CANCELLED') as booking_count,
        SUM(o.total_participants) FILTER (WHERE o.status != 'CANCELLED') as customer_count,
        SUM(o.total_price) FILTER (WHERE o.payment_status = 'PAID') as revenue
      FROM tour_schedules ts
      LEFT JOIN tours t ON ts.tour_id = t.id
      LEFT JOIN locations l ON t.location_id = l.id
      LEFT JOIN orders o ON ts.id = o.schedule_id
      WHERE ${whereClause}
      GROUP BY ts.id, t.id, l.id
      ORDER BY ts.start_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(Number(limit), offset);
    const result = await pool.query(query, params);

    const countQuery = `SELECT COUNT(*) as total FROM tour_schedules ts WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, params.slice(0, -2));

    res.json({
      success: true,
      data: {
        schedules: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].total),
          total_pages: Math.ceil(parseInt(countResult.rows[0].total) / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch schedules', error: error.message });
  }
});

module.exports = router;
