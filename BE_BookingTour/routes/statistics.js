const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/authJwt');

// GET: Dashboard statistics (Admin only)
router.get('/dashboard', async (req, res) => {
  try {
    const startDate = req.query.start_date || '2024-01-01';
    const endDate = req.query.end_date || '2099-12-31';

    // Total revenue
    const revenueQuery = `
      SELECT COALESCE(SUM(total_price), 0) as total_revenue
      FROM orders
      WHERE payment_status = 'PAID' 
        AND created_at BETWEEN $1 AND $2
    `;
    const revenueResult = await pool.query(revenueQuery, [startDate, endDate]);

    // Total orders by status
    const ordersQuery = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid_orders,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_orders,
        COUNT(CASE WHEN status = 'REFUNDED' THEN 1 END) as refunded_orders
      FROM orders
      WHERE created_at BETWEEN $1 AND $2
    `;
    const ordersResult = await pool.query(ordersQuery, [startDate, endDate]);

    // Total customers
    const customersQuery = `
      SELECT COUNT(DISTINCT user_id) as total_customers
      FROM orders
      WHERE created_at BETWEEN $1 AND $2
    `;
    const customersResult = await pool.query(customersQuery, [startDate, endDate]);

    // Total tours
    const toursQuery = `
      SELECT 
        COUNT(*) as total_tours,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_tours,
        COUNT(CASE WHEN status = 'INACTIVE' THEN 1 END) as inactive_tours,
        COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_tours
      FROM tours
    `;
    const toursResult = await pool.query(toursQuery);

    // Revenue by month
    const monthlyRevenueQuery = `
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as orders,
        COALESCE(SUM(total_price), 0) as revenue
      FROM orders
      WHERE payment_status = 'PAID'
        AND created_at BETWEEN $1 AND $2
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `;
    const monthlyRevenueResult = await pool.query(monthlyRevenueQuery, [startDate, endDate]);

    // Top tours by revenue
    const topToursQuery = `
      SELECT 
        t.id,
        t.name,
        t.slug,
        COUNT(o.id) as booking_count,
        COALESCE(SUM(o.total_price), 0) as revenue
      FROM tours t
      LEFT JOIN orders o ON t.id = o.tour_id 
        AND o.payment_status = 'PAID'
        AND o.created_at BETWEEN $1 AND $2
      GROUP BY t.id, t.name, t.slug
      ORDER BY revenue DESC
      LIMIT 10
    `;
    const topToursResult = await pool.query(topToursQuery, [startDate, endDate]);

    // Top locations by bookings
    const topLocationsQuery = `
      SELECT 
        l.id,
        l.name,
        l.slug,
        COUNT(DISTINCT t.id) as tour_count,
        COUNT(o.id) as booking_count
      FROM locations l
      LEFT JOIN tours t ON l.id = t.location_id
      LEFT JOIN orders o ON t.id = o.tour_id 
        AND o.payment_status = 'PAID'
        AND o.created_at BETWEEN $1 AND $2
      GROUP BY l.id, l.name, l.slug
      ORDER BY booking_count DESC
      LIMIT 10
    `;
    const topLocationsResult = await pool.query(topLocationsQuery, [startDate, endDate]);

    // Payment method distribution
    const paymentMethodsQuery = `
      SELECT 
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(total_price), 0) as total_amount
      FROM orders
      WHERE payment_status = 'PAID'
        AND created_at BETWEEN $1 AND $2
        AND payment_method IS NOT NULL
      GROUP BY payment_method
      ORDER BY count DESC
    `;
    const paymentMethodsResult = await pool.query(paymentMethodsQuery, [startDate, endDate]);

    res.json({
      success: true,
      data: {
        totalRevenue: parseFloat(revenueResult.rows[0].total_revenue),
        totalOrders: parseInt(ordersResult.rows[0].total_orders),
        pendingOrders: parseInt(ordersResult.rows[0].pending_orders),
        confirmedOrders: parseInt(ordersResult.rows[0].confirmed_orders),
        paidOrders: parseInt(ordersResult.rows[0].paid_orders),
        cancelledOrders: parseInt(ordersResult.rows[0].cancelled_orders),
        refundedOrders: parseInt(ordersResult.rows[0].refunded_orders),
        totalCustomers: parseInt(customersResult.rows[0].total_customers),
        totalTours: parseInt(toursResult.rows[0].total_tours),
        activeTours: parseInt(toursResult.rows[0].active_tours),
        inactiveTours: parseInt(toursResult.rows[0].inactive_tours),
        draftTours: parseInt(toursResult.rows[0].draft_tours),
        revenueByMonth: monthlyRevenueResult.rows.map(row => ({
          month: row.month,
          orders: parseInt(row.orders),
          revenue: parseFloat(row.revenue)
        })),
        topTours: topToursResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          bookingCount: parseInt(row.booking_count),
          revenue: parseFloat(row.revenue)
        })),
        topLocations: topLocationsResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          tourCount: parseInt(row.tour_count),
          bookingCount: parseInt(row.booking_count)
        })),
        paymentMethods: paymentMethodsResult.rows.map(row => ({
          method: row.payment_method,
          count: parseInt(row.count),
          totalAmount: parseFloat(row.total_amount)
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
});

// GET: Revenue report
router.get('/revenue', authenticateToken, isAdmin, async (req, res) => {
  try {
    const startDate = req.query.start_date || '2024-01-01';
    const endDate = req.query.end_date || '2099-12-31';
    const groupBy = req.query.group_by || 'month'; // day, week, month, year

    let dateFormat;
    switch (groupBy) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        dateFormat = 'IYYY-IW';
        break;
      case 'year':
        dateFormat = 'YYYY';
        break;
      default: // month
        dateFormat = 'YYYY-MM';
    }

    const query = `
      SELECT 
        TO_CHAR(created_at, $3) as period,
        COUNT(*) as total_orders,
        COUNT(CASE WHEN payment_status = 'PAID' THEN 1 END) as paid_orders,
        COALESCE(SUM(total_price), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total_price ELSE 0 END), 0) as paid_revenue,
        COALESCE(SUM(discount_amount), 0) as total_discounts,
        COALESCE(AVG(total_price), 0) as average_order_value
      FROM orders
      WHERE created_at BETWEEN $1 AND $2
        AND status IN ('CONFIRMED', 'PAID')
      GROUP BY TO_CHAR(created_at, $3)
      ORDER BY period DESC
    `;

    const result = await pool.query(query, [startDate, endDate, dateFormat]);

    res.json({
      success: true,
      data: {
        groupBy,
        report: result.rows.map(row => ({
          period: row.period,
          totalOrders: parseInt(row.total_orders),
          paidOrders: parseInt(row.paid_orders),
          totalRevenue: parseFloat(row.total_revenue),
          paidRevenue: parseFloat(row.paid_revenue),
          totalDiscounts: parseFloat(row.total_discounts),
          averageOrderValue: parseFloat(row.average_order_value)
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching revenue report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue report',
      error: error.message
    });
  }
});

// GET: Booking report
router.get('/bookings', authenticateToken, isAdmin, async (req, res) => {
  try {
    const startDate = req.query.start_date || '2024-01-01';
    const endDate = req.query.end_date || '2099-12-31';

    const query = `
      SELECT 
        DATE(created_at) as booking_date,
        COUNT(*) as total_bookings,
        SUM(adult_quantity) as total_adults,
        SUM(child_quantity) as total_children,
        SUM(infant_quantity) as total_infants,
        SUM(total_participants) as total_participants,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled
      FROM orders
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY DATE(created_at)
      ORDER BY booking_date DESC
    `;

    const result = await pool.query(query, [startDate, endDate]);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        date: row.booking_date,
        totalBookings: parseInt(row.total_bookings),
        totalAdults: parseInt(row.total_adults),
        totalChildren: parseInt(row.total_children),
        totalInfants: parseInt(row.total_infants),
        totalParticipants: parseInt(row.total_participants),
        pending: parseInt(row.pending),
        confirmed: parseInt(row.confirmed),
        cancelled: parseInt(row.cancelled)
      }))
    });
  } catch (error) {
    console.error('Error fetching booking report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking report',
      error: error.message
    });
  }
});

// GET: Tour performance
router.get('/tours/performance', authenticateToken, isAdmin, async (req, res) => {
  try {
    const sortBy = req.query.sort || 'revenue_desc'; // revenue_desc, bookings_desc, rating_desc
    const limit = parseInt(req.query.limit) || 10;

    let orderBy;
    switch (sortBy) {
      case 'bookings_desc':
        orderBy = 'booking_count DESC';
        break;
      case 'rating_desc':
        orderBy = 'rating DESC, review_count DESC';
        break;
      case 'views_desc':
        orderBy = 'view_count DESC';
        break;
      default: // revenue_desc
        orderBy = 'total_revenue DESC';
    }

    const query = `
      SELECT 
        t.id,
        t.name,
        t.slug,
        t.base_price,
        t.rating,
        t.review_count,
        t.view_count,
        t.booking_count,
        l.name as location_name,
        c.name as category_name,
        COALESCE(SUM(o.total_price), 0) as total_revenue,
        COUNT(o.id) as completed_bookings,
        COALESCE(AVG(o.total_price), 0) as average_booking_value
      FROM tours t
      LEFT JOIN locations l ON t.location_id = l.id
      LEFT JOIN tour_categories c ON t.category_id = c.id
      LEFT JOIN orders o ON t.id = o.tour_id AND o.status IN ('CONFIRMED', 'PAID')
      GROUP BY t.id, t.name, t.slug, t.base_price, t.rating, t.review_count, 
               t.view_count, t.booking_count, l.name, c.name
      ORDER BY ${orderBy}
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        basePrice: parseFloat(row.base_price),
        rating: parseFloat(row.rating) || 0,
        reviewCount: parseInt(row.review_count),
        viewCount: parseInt(row.view_count),
        bookingCount: parseInt(row.booking_count),
        locationName: row.location_name,
        categoryName: row.category_name,
        totalRevenue: parseFloat(row.total_revenue),
        completedBookings: parseInt(row.completed_bookings),
        averageBookingValue: parseFloat(row.average_booking_value),
        conversionRate: row.view_count > 0 
          ? ((parseInt(row.booking_count) / parseInt(row.view_count)) * 100).toFixed(2)
          : 0
      }))
    });
  } catch (error) {
    console.error('Error fetching tour performance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tour performance',
      error: error.message
    });
  }
});

// GET: Customer statistics
router.get('/customers', authenticateToken, isAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id,
        u.user_id,
        u.full_name,
        u.email,
        u.phone,
        u.created_at as registration_date,
        COUNT(o.id) as total_bookings,
        COALESCE(SUM(o.total_price), 0) as total_spent,
        MAX(o.created_at) as last_booking_date
      FROM users u
      LEFT JOIN orders o ON u.user_id = o.user_id AND o.status IN ('CONFIRMED', 'PAID')
      WHERE u.role::text IN ('CUSTOMER', '1', 'USER')
      GROUP BY u.id, u.user_id, u.full_name, u.email, u.phone, u.created_at
      ORDER BY total_spent DESC
      LIMIT 50
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        fullName: row.full_name,
        email: row.email,
        phone: row.phone,
        registrationDate: row.registration_date,
        totalBookings: parseInt(row.total_bookings),
        totalSpent: parseFloat(row.total_spent),
        lastBookingDate: row.last_booking_date,
        averageOrderValue: row.total_bookings > 0 
          ? (parseFloat(row.total_spent) / parseInt(row.total_bookings)).toFixed(2)
          : 0
      }))
    });
  } catch (error) {
    console.error('Error fetching customer statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer statistics',
      error: error.message
    });
  }
});

// ============================================================================
// GET: Dashboard Overview - Comprehensive dashboard data in single endpoint
// ============================================================================
router.get('/dashboard/overview', async (req, res) => {
  try {
    const endDate = req.query.endDate || new Date().toISOString().split('T')[0];
    const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const compareWithPrevious = req.query.compareWithPrevious !== 'false';
    const groupBy = req.query.groupBy || 'day'; // day, week, month

    // Calculate previous period
    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);
    const periodDays = Math.ceil((currentEnd - currentStart) / (1000 * 60 * 60 * 24));
    const previousStart = new Date(currentStart.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousEnd = new Date(currentStart.getTime() - 1);

    // ==================== SUMMARY METRICS ====================
    // Current period metrics
    const summaryQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total_price ELSE 0 END), 0) as total_revenue,
        COUNT(*) as total_orders,
        COUNT(DISTINCT user_id) as total_customers,
        COALESCE(AVG(CASE WHEN payment_status = 'PAID' THEN total_price END), 0) as avg_order_value
      FROM orders
      WHERE created_at >= $1 AND created_at <= $2
    `;
    const summaryResult = await pool.query(summaryQuery, [startDate, endDate]);

    // Previous period metrics (for comparison)
    let previousSummary = { total_revenue: 0, total_orders: 0, total_customers: 0, avg_order_value: 0 };
    if (compareWithPrevious) {
      const prevResult = await pool.query(summaryQuery, [
        previousStart.toISOString().split('T')[0],
        previousEnd.toISOString().split('T')[0]
      ]);
      previousSummary = prevResult.rows[0];
    }

    // Calculate percentage changes
    const calcChange = (current, previous) => {
      if (!previous || previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous * 100).toFixed(1);
    };

    const current = summaryResult.rows[0];
    const summary = {
      totalRevenue: parseFloat(current.total_revenue),
      revenueChange: parseFloat(calcChange(current.total_revenue, previousSummary.total_revenue)),
      totalOrders: parseInt(current.total_orders),
      ordersChange: parseFloat(calcChange(current.total_orders, previousSummary.total_orders)),
      totalCustomers: parseInt(current.total_customers),
      customersChange: parseFloat(calcChange(current.total_customers, previousSummary.total_customers)),
      avgOrderValue: parseFloat(current.avg_order_value),
      avgOrderValueChange: parseFloat(calcChange(current.avg_order_value, previousSummary.avg_order_value))
    };

    // ==================== REVENUE BY TIME ====================
    let dateFormat;
    switch (groupBy) {
      case 'week':
        dateFormat = 'IYYY-"W"IW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      default: // day
        dateFormat = 'YYYY-MM-DD';
    }

    const revenueByTimeQuery = `
      SELECT 
        TO_CHAR(created_at, $3) as date,
        COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total_price ELSE 0 END), 0) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY TO_CHAR(created_at, $3)
      ORDER BY date ASC
    `;
    const revenueByTimeResult = await pool.query(revenueByTimeQuery, [startDate, endDate, dateFormat]);

    // ==================== ORDERS BY STATUS ====================
    const ordersByStatusQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM orders
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY status
    `;
    const ordersByStatusResult = await pool.query(ordersByStatusQuery, [startDate, endDate]);
    
    const totalOrdersForStatus = ordersByStatusResult.rows.reduce((sum, r) => sum + parseInt(r.count), 0);
    const ordersByStatus = ordersByStatusResult.rows.map(row => ({
      status: row.status,
      count: parseInt(row.count),
      percentage: totalOrdersForStatus > 0 ? parseFloat((parseInt(row.count) / totalOrdersForStatus * 100).toFixed(1)) : 0
    }));

    // ==================== REVENUE BY CATEGORY ====================
    const revenueByCategoryQuery = `
      SELECT 
        tc.id as category_id,
        tc.name as category_name,
        COALESCE(SUM(CASE WHEN o.payment_status = 'PAID' THEN o.total_price ELSE 0 END), 0) as revenue
      FROM tour_categories tc
      LEFT JOIN tours t ON tc.id = t.category_id
      LEFT JOIN orders o ON t.id = o.tour_id AND o.created_at >= $1 AND o.created_at <= $2
      GROUP BY tc.id, tc.name
      HAVING COALESCE(SUM(CASE WHEN o.payment_status = 'PAID' THEN o.total_price ELSE 0 END), 0) > 0
      ORDER BY revenue DESC
    `;
    const revenueByCategoryResult = await pool.query(revenueByCategoryQuery, [startDate, endDate]);
    
    const totalCategoryRevenue = revenueByCategoryResult.rows.reduce((sum, r) => sum + parseFloat(r.revenue), 0);
    const revenueByCategory = revenueByCategoryResult.rows.map(row => ({
      categoryId: row.category_id,
      categoryName: row.category_name,
      revenue: parseFloat(row.revenue),
      percentage: totalCategoryRevenue > 0 ? parseFloat((parseFloat(row.revenue) / totalCategoryRevenue * 100).toFixed(1)) : 0
    }));

    // ==================== TOP TOURS ====================
    const topToursQuery = `
      SELECT 
        t.id as tour_id,
        t.name as tour_name,
        COUNT(o.id) as booking_count,
        COALESCE(SUM(CASE WHEN o.payment_status = 'PAID' THEN o.total_price ELSE 0 END), 0) as revenue,
        COALESCE(t.rating, 0) as avg_rating
      FROM tours t
      LEFT JOIN orders o ON t.id = o.tour_id AND o.created_at >= $1 AND o.created_at <= $2
      GROUP BY t.id, t.name, t.rating
      HAVING COUNT(o.id) > 0
      ORDER BY booking_count DESC, revenue DESC
      LIMIT 10
    `;
    const topToursResult = await pool.query(topToursQuery, [startDate, endDate]);

    // ==================== REVENUE BY LOCATION ====================
    const revenueByLocationQuery = `
      SELECT 
        l.id as location_id,
        l.name as location_name,
        COALESCE(SUM(CASE WHEN o.payment_status = 'PAID' THEN o.total_price ELSE 0 END), 0) as revenue
      FROM locations l
      LEFT JOIN tours t ON l.id = t.location_id
      LEFT JOIN orders o ON t.id = o.tour_id AND o.created_at >= $1 AND o.created_at <= $2
      WHERE l.type = 'REGION' OR l.parent_id IS NULL
      GROUP BY l.id, l.name
      HAVING COALESCE(SUM(CASE WHEN o.payment_status = 'PAID' THEN o.total_price ELSE 0 END), 0) > 0
      ORDER BY revenue DESC
      LIMIT 10
    `;
    const revenueByLocationResult = await pool.query(revenueByLocationQuery, [startDate, endDate]);
    
    const totalLocationRevenue = revenueByLocationResult.rows.reduce((sum, r) => sum + parseFloat(r.revenue), 0);
    const revenueByLocation = revenueByLocationResult.rows.map(row => ({
      locationId: row.location_id,
      locationName: row.location_name,
      revenue: parseFloat(row.revenue),
      percentage: totalLocationRevenue > 0 ? parseFloat((parseFloat(row.revenue) / totalLocationRevenue * 100).toFixed(1)) : 0
    }));

    // ==================== PAYMENT METHODS ====================
    const paymentMethodsQuery = `
      SELECT 
        payment_method as method,
        COUNT(*) as count,
        COALESCE(SUM(total_price), 0) as amount
      FROM orders
      WHERE created_at >= $1 AND created_at <= $2
        AND payment_status = 'PAID'
        AND payment_method IS NOT NULL
      GROUP BY payment_method
      ORDER BY count DESC
    `;
    const paymentMethodsResult = await pool.query(paymentMethodsQuery, [startDate, endDate]);
    
    const totalPaymentCount = paymentMethodsResult.rows.reduce((sum, r) => sum + parseInt(r.count), 0);
    const paymentMethods = paymentMethodsResult.rows.map(row => ({
      method: row.method,
      count: parseInt(row.count),
      amount: parseFloat(row.amount),
      percentage: totalPaymentCount > 0 ? parseFloat((parseInt(row.count) / totalPaymentCount * 100).toFixed(1)) : 0
    }));

    // ==================== CUSTOMER METRICS ====================
    const customerMetricsQuery = `
      SELECT 
        COALESCE(SUM(adult_quantity), 0) as adult,
        COALESCE(SUM(child_quantity), 0) as child,
        COALESCE(SUM(infant_quantity), 0) as infant,
        COALESCE(AVG(total_participants), 0) as avg_participants
      FROM orders
      WHERE created_at >= $1 AND created_at <= $2
    `;
    const customerMetricsResult = await pool.query(customerMetricsQuery, [startDate, endDate]);
    const cm = customerMetricsResult.rows[0];

    // ==================== RESPONSE ====================
    res.json({
      success: true,
      data: {
        period: {
          startDate,
          endDate,
          previousPeriod: compareWithPrevious ? {
            startDate: previousStart.toISOString().split('T')[0],
            endDate: previousEnd.toISOString().split('T')[0]
          } : null
        },
        summary,
        revenueByTime: revenueByTimeResult.rows.map(row => ({
          date: row.date,
          revenue: parseFloat(row.revenue),
          orders: parseInt(row.orders)
        })),
        ordersByStatus,
        revenueByCategory,
        topTours: topToursResult.rows.map(row => ({
          tourId: row.tour_id,
          tourName: row.tour_name,
          bookingCount: parseInt(row.booking_count),
          revenue: parseFloat(row.revenue),
          avgRating: parseFloat(row.avg_rating)
        })),
        revenueByLocation,
        paymentMethods,
        customerMetrics: {
          totalParticipants: {
            adult: parseInt(cm.adult),
            child: parseInt(cm.child),
            infant: parseInt(cm.infant)
          },
          avgParticipantsPerOrder: parseFloat(parseFloat(cm.avg_participants).toFixed(2))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard overview',
      error: error.message
    });
  }
});

// ============================================================================
// GET: Schedule & Availability Analytics
// ============================================================================
router.get('/dashboard/schedules', async (req, res) => {
  try {
    const startDate = req.query.startDate || new Date().toISOString().split('T')[0];
    const endDate = req.query.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tourId = req.query.tourId || null;
    const status = req.query.status || null;

    // Build WHERE conditions
    let conditions = ['ts.start_date >= $1', 'ts.start_date <= $2'];
    let params = [startDate, endDate];
    let paramIndex = 3;

    if (tourId) {
      conditions.push(`ts.tour_id = $${paramIndex}`);
      params.push(tourId);
      paramIndex++;
    }

    if (status) {
      conditions.push(`ts.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // ==================== SUMMARY ====================
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_schedules,
        COUNT(CASE WHEN status = 'OPEN' THEN 1 END) as open_schedules,
        COUNT(CASE WHEN status = 'FULL' THEN 1 END) as full_schedules,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_schedules,
        COALESCE(AVG(
          CASE WHEN total_slots > 0 THEN (booked_slots::float / total_slots * 100) END
        ), 0) as avg_occupancy_rate
      FROM tour_schedules ts
      WHERE ${whereClause}
    `;
    const summaryResult = await pool.query(summaryQuery, params);
    const s = summaryResult.rows[0];

    // ==================== OCCUPANCY BY TOUR ====================
    const occupancyByTourQuery = `
      SELECT 
        t.id as tour_id,
        t.name as tour_name,
        COUNT(ts.id) as schedule_count,
        COALESCE(AVG(
          CASE WHEN ts.total_slots > 0 THEN (ts.booked_slots::float / ts.total_slots * 100) END
        ), 0) as avg_occupancy,
        COALESCE(SUM(ts.total_slots), 0) as total_slots,
        COALESCE(SUM(ts.booked_slots), 0) as booked_slots
      FROM tours t
      INNER JOIN tour_schedules ts ON t.id = ts.tour_id
      WHERE ${whereClause}
      GROUP BY t.id, t.name
      ORDER BY avg_occupancy DESC
      LIMIT 20
    `;
    const occupancyByTourResult = await pool.query(occupancyByTourQuery, params);

    // ==================== SCHEDULES BY STATUS ====================
    const schedulesByStatusQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM tour_schedules ts
      WHERE ${whereClause}
      GROUP BY status
    `;
    const schedulesByStatusResult = await pool.query(schedulesByStatusQuery, params);
    
    const totalSchedulesForStatus = schedulesByStatusResult.rows.reduce((sum, r) => sum + parseInt(r.count), 0);
    const schedulesByStatus = schedulesByStatusResult.rows.map(row => ({
      status: row.status,
      count: parseInt(row.count),
      percentage: totalSchedulesForStatus > 0 ? parseFloat((parseInt(row.count) / totalSchedulesForStatus * 100).toFixed(1)) : 0
    }));

    // ==================== UPCOMING SCHEDULES ====================
    const upcomingSchedulesQuery = `
      SELECT 
        ts.id as schedule_id,
        t.name as tour_name,
        ts.start_date,
        ts.end_date,
        COALESCE(ts.total_slots, ts.available_slots + ts.booked_slots) as total_slots,
        ts.booked_slots,
        ts.available_slots,
        CASE 
          WHEN COALESCE(ts.total_slots, ts.available_slots + ts.booked_slots) > 0 
          THEN (ts.booked_slots::float / COALESCE(ts.total_slots, ts.available_slots + ts.booked_slots) * 100)
          ELSE 0 
        END as occupancy_rate,
        ts.status
      FROM tour_schedules ts
      INNER JOIN tours t ON ts.tour_id = t.id
      WHERE ts.start_date >= CURRENT_DATE
        AND ts.status != 'CANCELLED'
        ${tourId ? `AND ts.tour_id = $${params.length + 1}` : ''}
      ORDER BY ts.start_date ASC
      LIMIT 20
    `;
    const upcomingParams = tourId ? [...params.slice(0, 2), tourId] : params.slice(0, 2);
    const upcomingSchedulesResult = await pool.query(
      tourId ? upcomingSchedulesQuery : upcomingSchedulesQuery.replace(`AND ts.tour_id = $${params.length + 1}`, ''),
      tourId ? [tourId] : []
    );

    // ==================== OCCUPANCY TREND ====================
    const occupancyTrendQuery = `
      SELECT 
        TO_CHAR(ts.start_date, 'IYYY-"W"IW') as week,
        COALESCE(AVG(
          CASE WHEN ts.total_slots > 0 THEN (ts.booked_slots::float / ts.total_slots * 100) END
        ), 0) as avg_occupancy
      FROM tour_schedules ts
      WHERE ts.start_date >= $1 AND ts.start_date <= $2
      GROUP BY TO_CHAR(ts.start_date, 'IYYY-"W"IW')
      ORDER BY week ASC
    `;
    const occupancyTrendResult = await pool.query(occupancyTrendQuery, [startDate, endDate]);

    // ==================== RESPONSE ====================
    res.json({
      success: true,
      data: {
        summary: {
          totalSchedules: parseInt(s.total_schedules),
          openSchedules: parseInt(s.open_schedules),
          fullSchedules: parseInt(s.full_schedules),
          cancelledSchedules: parseInt(s.cancelled_schedules),
          avgOccupancyRate: parseFloat(parseFloat(s.avg_occupancy_rate).toFixed(1))
        },
        occupancyByTour: occupancyByTourResult.rows.map(row => ({
          tourId: row.tour_id,
          tourName: row.tour_name,
          scheduleCount: parseInt(row.schedule_count),
          avgOccupancy: parseFloat(parseFloat(row.avg_occupancy).toFixed(1)),
          totalSlots: parseInt(row.total_slots),
          bookedSlots: parseInt(row.booked_slots)
        })),
        schedulesByStatus,
        upcomingSchedules: upcomingSchedulesResult.rows.map(row => ({
          scheduleId: row.schedule_id,
          tourName: row.tour_name,
          startDate: row.start_date,
          endDate: row.end_date,
          totalSlots: parseInt(row.total_slots),
          bookedSlots: parseInt(row.booked_slots),
          availableSlots: parseInt(row.available_slots),
          occupancyRate: parseFloat(parseFloat(row.occupancy_rate).toFixed(1)),
          status: row.status
        })),
        occupancyTrend: occupancyTrendResult.rows.map(row => ({
          week: row.week,
          avgOccupancy: parseFloat(parseFloat(row.avg_occupancy).toFixed(1))
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching schedule analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching schedule analytics',
      error: error.message
    });
  }
});

module.exports = router;