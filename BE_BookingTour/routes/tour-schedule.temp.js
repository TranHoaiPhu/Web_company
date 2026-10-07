/* const express = require("express");
const pool = require("../config/database");
const router = express.Router();

// GET: Lấy thông tin tour theo schedule_id (đầy đủ tour, lịch trình, location, category, images, days, amenities)
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
      return res.status(404).json({ success: false, message: "Schedule or tour not found" });
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
    // 5. Build response
    res.json({
      success: true,
      data: {
        schedule: {
          id: row.id,
          tour_id: row.tour_id,
          start_date: row.start_date,
          end_date: row.end_date,
          price_override: row.price_override,
          available_slots: row.available_slots,
          booked_slots: row.booked_slots,
          status: row.status,
          notes: row.notes
        },
        tour: {
          id: row.tour_id,
          name: row.name,
          slug: row.slug,
          short_description: row.short_description,
          description: row.description,
          highlights: row.highlights,
          included_services: row.included_services,
          excluded_services: row.excluded_services,
          terms_conditions: row.terms_conditions,
          cancellation_policy: row.cancellation_policy,
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
          view_count: row.view_count,
          booking_count: row.booking_count,
          rating: row.rating,
          review_count: row.review_count,
          status: row.status,
          is_featured: row.is_featured,
          is_hot_deal: row.is_hot_deal,
          created_at: row.created_at,
          updated_at: row.updated_at
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
    console.error('Get tour by schedule error:', error);
    res.status(500).json({ success: false, message: 'Error fetching tour by schedule', error: error.message });
  }
});

// ...CRUD khác giữ nguyên...

// POST: Tạo lịch khởi hành mới
router.post('/', async (req, res) => {
  try {
    const { tourId, startDate, endDate, priceOverride, totalSlots, status, notes } = req.body;

    if (!tourId || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Tour ID and Start Date are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO tour_schedules (tour_id, start_date, end_date, price_override, total_slots, available_slots, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        tourId, 
        startDate, 
        endDate, 
        priceOverride, 
        totalSlots || 20, 
        totalSlots || 20, // Initial available slots = total slots
        status || 'OPEN', 
        notes
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

// PUT: Cập nhật lịch khởi hành
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, priceOverride, totalSlots, availableSlots, status, notes } = req.body;

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
      [startDate, endDate, priceOverride, totalSlots, availableSlots, status, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
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

// DELETE: Xóa lịch khởi hành
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check existing bookings? (Optional logic here)
    
    const result = await pool.query(
      'DELETE FROM tour_schedules WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
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

interface ScheduleCustomer {
  order_id: number;
  order_code: string;
  booking_date: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  total_participants: number;
  adult_quantity: number;
  child_quantity: number;
  infant_quantity: number;
  total_price: number;
  payment_status: string;
  order_status: string;
  participants: ParticipantDetail[];
}

interface ParticipantDetail {
  id: number;
  full_name: string;
  participant_type: string;
  gender: string;
  date_of_birth: string;
  age: number;
  id_number: string;
  nationality: string;
  phone: string;
  email: string;
  special_notes: string;
}

// ===========================
// 1. GET SCHEDULE OVERVIEW
// ===========================

router.get('/tour-schedules/:scheduleId', async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;

    const query = `
      SELECT 
        ts.*,
        t.name as tour_name,
        t.slug as tour_slug,
        t.duration_days,
        t.duration_nights,
        t.base_price,
        t.departure_location,
        t.return_location,
        l.name as location_name,
        l.slug as location_slug,
        COUNT(DISTINCT o.id) as total_bookings,
        SUM(o.total_participants) as total_customers,
        SUM(o.total_price) FILTER (WHERE o.payment_status = 'PAID') as total_revenue,
        json_agg(DISTINCT ti.image_url) FILTER (WHERE ti.image_url IS NOT NULL) as tour_images
      FROM tour_schedules ts
      LEFT JOIN tours t ON ts.tour_id = t.id
      LEFT JOIN locations l ON t.location_id = l.id
      LEFT JOIN orders o ON ts.id = o.schedule_id AND o.status != 'CANCELLED'
      LEFT JOIN tour_images ti ON t.id = ti.tour_id AND ti.is_cover = true
      WHERE ts.id = $1
      GROUP BY ts.id, t.id, l.id
    `;

    const result = await pool.query(query, [scheduleId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    const schedule = result.rows[0];

    // Calculate occupancy rate
    schedule.occupancy_rate = schedule.total_slots > 0 
      ? ((schedule.booked_slots / schedule.total_slots) * 100).toFixed(2)
      : 0;

    schedule.available_slots_remaining = schedule.total_slots - schedule.booked_slots;

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schedule',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ===========================
// 2. GET CUSTOMERS LIST BY SCHEDULE
// ===========================

router.get('/tour-schedules/:scheduleId/customers', async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const { 
      payment_status, 
      order_status,
      search 
    } = req.query;

    // Build filters
    const conditions = ['o.schedule_id = $1', "o.status != 'CANCELLED'"];
    const params: any[] = [scheduleId];
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
        o.contact_phone ILIKE $${paramIndex} OR
        o.contact_email ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get orders with customer info
    const ordersQuery = `
      SELECT 
        o.id as order_id,
        o.order_code,
        o.created_at as booking_date,
        o.contact_name,
        o.contact_phone,
        o.contact_email,
        o.total_participants,
        o.adult_quantity,
        o.child_quantity,
        o.infant_quantity,
        o.total_price,
        o.payment_status,
        o.status as order_status,
        o.special_requests,
        u.full_name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        p.payment_method,
        p.paid_at
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      LEFT JOIN payments p ON o.id = p.order_id
      WHERE ${whereClause}
      ORDER BY o.created_at DESC
    `;

    const ordersResult = await pool.query(ordersQuery, params);

    // Get all participants for these orders
    const orderIds = ordersResult.rows.map(o => o.order_id);
    
    let participants: any[] = [];
    if (orderIds.length > 0) {
      const participantsQuery = `
        SELECT 
          op.*,
          EXTRACT(YEAR FROM AGE(CURRENT_DATE, op.date_of_birth))::int as age
        FROM order_participants op
        WHERE op.order_id = ANY($1)
        ORDER BY 
          op.order_id,
          CASE op.participant_type
            WHEN 'ADULT' THEN 1
            WHEN 'CHILD' THEN 2
            WHEN 'INFANT' THEN 3
          END
      `;
      
      const participantsResult = await pool.query(participantsQuery, [orderIds]);
      participants = participantsResult.rows;
    }

    // Group participants by order_id
    const participantsByOrder = participants.reduce((acc, p) => {
      if (!acc[p.order_id]) acc[p.order_id] = [];
      acc[p.order_id].push(p);
      return acc;
    }, {} as Record<number, any[]>);

    // Combine data
    const customers: ScheduleCustomer[] = ordersResult.rows.map(order => ({
      ...order,
      participants: participantsByOrder[order.order_id] || [],
    }));

    // Calculate statistics
    const stats = {
      total_bookings: customers.length,
      total_customers: customers.reduce((sum, c) => sum + c.total_participants, 0),
      total_adults: customers.reduce((sum, c) => sum + c.adult_quantity, 0),
      total_children: customers.reduce((sum, c) => sum + c.child_quantity, 0),
      total_infants: customers.reduce((sum, c) => sum + c.infant_quantity, 0),
      paid_bookings: customers.filter(c => c.payment_status === 'PAID').length,
      pending_bookings: customers.filter(c => c.payment_status === 'UNPAID').length,
      total_revenue: customers
        .filter(c => c.payment_status === 'PAID')
        .reduce((sum, c) => sum + parseFloat(c.total_price.toString()), 0),
    };

    res.json({
      success: true,
      data: {
        customers,
        statistics: stats,
      },
    });
  } catch (error) {
    console.error('Error fetching schedule customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ===========================
// 3. GET ALL PARTICIPANTS (FLAT LIST)
// ===========================

router.get('/tour-schedules/:scheduleId/participants', async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const { participant_type, gender, search } = req.query;

    const conditions = ['o.schedule_id = $1', "o.status != 'CANCELLED'"];
    const params: any[] = [scheduleId];
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
        op.phone ILIKE $${paramIndex} OR
        op.email ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT 
        op.*,
        o.order_code,
        o.contact_name as booking_contact_name,
        o.contact_phone as booking_contact_phone,
        o.payment_status,
        o.status as order_status,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, op.date_of_birth))::int as age,
        CASE 
          WHEN op.date_of_birth IS NOT NULL THEN 
            TO_CHAR(op.date_of_birth, 'DD/MM/YYYY')
          ELSE NULL
        END as dob_formatted
      FROM order_participants op
      JOIN orders o ON op.order_id = o.id
      WHERE ${whereClause}
      ORDER BY 
        op.participant_type,
        op.full_name
    `;

    const result = await pool.query(query, params);

    // Group by participant type
    const grouped = {
      adults: result.rows.filter(p => p.participant_type === 'ADULT'),
      children: result.rows.filter(p => p.participant_type === 'CHILD'),
      infants: result.rows.filter(p => p.participant_type === 'INFANT'),
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
          infants: grouped.infants.length,
          male: result.rows.filter(p => p.gender === 'MALE').length,
          female: result.rows.filter(p => p.gender === 'FEMALE').length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch participants',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ===========================
// 4. EXPORT CUSTOMER LIST (Excel-ready format)
// ===========================

router.get('/tour-schedules/:scheduleId/export', async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;

    const query = `
      SELECT 
        o.order_code as "Mã đơn hàng",
        o.created_at as "Ngày đặt",
        o.contact_name as "Người liên hệ",
        o.contact_phone as "SĐT liên hệ",
        o.contact_email as "Email",
        op.full_name as "Họ tên khách",
        op.participant_type as "Loại khách",
        op.gender as "Giới tính",
        TO_CHAR(op.date_of_birth, 'DD/MM/YYYY') as "Ngày sinh",
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, op.date_of_birth))::int as "Tuổi",
        op.id_number as "CMND/Passport",
        op.nationality as "Quốc tịch",
        op.phone as "SĐT khách",
        op.email as "Email khách",
        op.special_notes as "Ghi chú",
        o.payment_status as "Trạng thái thanh toán",
        o.status as "Trạng thái đơn"
      FROM order_participants op
      JOIN orders o ON op.order_id = o.id
      WHERE o.schedule_id = $1 AND o.status != 'CANCELLED'
      ORDER BY o.created_at, op.participant_type
    `;

    const result = await pool.query(query, [scheduleId]);

    res.json({
      success: true,
      data: result.rows,
      meta: {
        total_records: result.rows.length,
        export_date: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error exporting customer list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export customer list',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ===========================
// 5. CHECK-IN PARTICIPANT
// ===========================

router.post('/tour-schedules/:scheduleId/check-in', async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const { participant_id, checked_in } = req.body;

    // Note: Bạn cần thêm cột `checked_in` và `check_in_time` vào bảng order_participants
    const query = `
      UPDATE order_participants op
      SET 
        checked_in = $1,
        check_in_time = CASE WHEN $1 = true THEN NOW() ELSE NULL END
      FROM orders o
      WHERE op.id = $2 
        AND op.order_id = o.id 
        AND o.schedule_id = $3
      RETURNING op.*
    `;

    const result = await pool.query(query, [checked_in, participant_id, scheduleId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found',
      });
    }

    res.json({
      success: true,
      message: checked_in ? 'Checked in successfully' : 'Check-in cancelled',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error checking in participant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check in',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ===========================
// 6. GET SCHEDULE STATISTICS
// ===========================

router.get('/tour-schedules/:scheduleId/statistics', async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;

    const query = `
      SELECT 
        ts.total_slots,
        ts.booked_slots,
        ts.available_slots,
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT CASE WHEN o.payment_status = 'PAID' THEN o.id END) as paid_orders,
        COUNT(DISTINCT CASE WHEN o.payment_status = 'UNPAID' THEN o.id END) as unpaid_orders,
        SUM(o.adult_quantity) as total_adults,
        SUM(o.child_quantity) as total_children,
        SUM(o.infant_quantity) as total_infants,
        SUM(o.total_price) as total_revenue_potential,
        SUM(CASE WHEN o.payment_status = 'PAID' THEN o.total_price ELSE 0 END) as total_revenue_confirmed,
        AVG(o.total_price) as average_booking_value,
        json_agg(DISTINCT o.payment_method) FILTER (WHERE o.payment_method IS NOT NULL) as payment_methods_used
      FROM tour_schedules ts
      LEFT JOIN orders o ON ts.id = o.schedule_id AND o.status != 'CANCELLED'
      WHERE ts.id = $1
      GROUP BY ts.id, ts.total_slots, ts.booked_slots, ts.available_slots
    `;

    const result = await pool.query(query, [scheduleId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    const stats = result.rows[0];

    // Calculate derived metrics
    stats.occupancy_rate = stats.total_slots > 0 
      ? ((stats.booked_slots / stats.total_slots) * 100).toFixed(2) 
      : 0;

    stats.payment_completion_rate = stats.total_orders > 0
      ? ((stats.paid_orders / stats.total_orders) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching schedule statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ===========================
// 7. GET ALL SCHEDULES WITH CUSTOMER COUNT
// ===========================

router.get('/tour-schedules', async (req: Request, res: Response) => {
  try {
    const { 
      tour_id, 
      status, 
      from_date, 
      to_date,
      page = 1,
      limit = 20 
    } = req.query;

    const conditions = ['1=1'];
    const params: any[] = [];
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
        t.slug as tour_slug,
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

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM tour_schedules ts
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params.slice(0, -2));

    res.json({
      success: true,
      data: {
        schedules: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].total),
          total_pages: Math.ceil(parseInt(countResult.rows[0].total) / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schedules',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

module.exports = router;
 */