/**
 * Tour Reminder Routes
 * Endpoints for managing tour reminder emails
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { 
  sendPendingTourReminders, 
  sendRemindersForInterval, 
  getReminderStats 
} = require('../services/tourReminderScheduler');
const { authenticateToken, isAdmin } = require('../middleware/authJwt');

/**
 * @route   GET /api/tour-reminders/stats
 * @desc    Get tour reminder statistics
 * @access  Admin only
 */
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const stats = await getReminderStats(parseInt(days));
    
    res.json({
      success: true,
      data: stats,
      period: `Last ${days} days`
    });
  } catch (error) {
    console.error('Error fetching reminder stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reminder statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/tour-reminders/upcoming
 * @desc    Get upcoming tours that will receive reminders
 * @access  Admin only
 */
router.get('/upcoming', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { hours = 72 } = req.query;
    
    const result = await pool.query(`
      SELECT 
        o.id as order_id,
        o.contact_email as email,
        o.contact_name as customer_name,
        o.tour_name as tour_title,
        ts.start_date,
        ts.end_date,
        o.total_participants as number_of_people,
        o.total_price,
        o.order_code,
        EXTRACT(EPOCH FROM (ts.start_date - NOW())) / 3600 as hours_until_tour
      FROM orders o
      INNER JOIN tour_schedules ts ON o.schedule_id = ts.id
      INNER JOIN tours t ON o.tour_id = t.id
      WHERE 
        o.status IN ('CONFIRMED', 'PAID')
        AND o.payment_status = 'PAID'
        AND ts.start_date > NOW()
        AND ts.start_date <= NOW() + ($1 || ' hours')::INTERVAL
      ORDER BY ts.start_date ASC
      LIMIT 50
    `, [hours]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      timeWindow: `Next ${hours} hours`
    });
  } catch (error) {
    console.error('Error fetching upcoming tours:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming tours',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/tour-reminders/send-now
 * @desc    Manually trigger sending reminders (for testing or manual run)
 * @access  Admin only
 */
router.post('/send-now', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { interval } = req.body; // Optional: specific interval in hours
    
    let results;
    if (interval) {
      results = await sendRemindersForInterval(parseInt(interval));
    } else {
      results = await sendPendingTourReminders();
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    res.json({
      success: true,
      message: 'Reminder sending completed',
      data: {
        total: results.length,
        successful: successCount,
        failed: failCount,
        details: results
      }
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminders',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/tour-reminders/history/:orderId
 * @desc    Get reminder history for a specific order
 * @access  Authenticated users (own orders) or Admin
 */
router.get('/history/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Check if user owns this order or is admin
    const orderCheck = await pool.query(
      'SELECT user_id FROM orders WHERE id = $1',
      [orderId]
    );
    
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    const isOwner = orderCheck.rows[0].user_id === req.user.user_id;
    const isAdmin = req.user.role === 'ADMIN';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const result = await pool.query(`
      SELECT 
        id,
        reminder_type,
        sent_at,
        email_sent_to,
        status,
        error_message
      FROM tour_reminders
      WHERE order_id = $1
      ORDER BY sent_at DESC
    `, [orderId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching reminder history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reminder history',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/tour-reminders/settings
 * @desc    Get tour reminder settings
 * @access  Admin only
 */
router.get('/settings', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT setting_key, setting_value, description
      FROM system_settings
      WHERE setting_key IN ('tour_reminder_enabled', 'tour_reminder_intervals')
    `);
    
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = {
        value: row.setting_value,
        description: row.description
      };
    });
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/tour-reminders/settings
 * @desc    Update tour reminder settings
 * @access  Admin only
 */
router.put('/settings', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { tour_reminder_enabled, tour_reminder_intervals } = req.body;
    
    const updates = [];
    
    if (tour_reminder_enabled !== undefined) {
      await pool.query(`
        UPDATE system_settings 
        SET setting_value = $1, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = 'tour_reminder_enabled'
      `, [tour_reminder_enabled.toString()]);
      updates.push('tour_reminder_enabled');
    }
    
    if (tour_reminder_intervals !== undefined) {
      // Validate it's an array of numbers
      if (!Array.isArray(tour_reminder_intervals) || 
          !tour_reminder_intervals.every(n => typeof n === 'number')) {
        return res.status(400).json({
          success: false,
          message: 'tour_reminder_intervals must be an array of numbers'
        });
      }
      
      await pool.query(`
        UPDATE system_settings 
        SET setting_value = $1, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = 'tour_reminder_intervals'
      `, [JSON.stringify(tour_reminder_intervals)]);
      updates.push('tour_reminder_intervals');
    }
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      updated: updates
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
});

module.exports = router;
