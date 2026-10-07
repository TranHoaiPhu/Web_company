/**
 * Tour Reminder Scheduler Service
 * Automatically sends reminder emails to customers before their tour starts
 * 
 * Features:
 * - Sends reminders at configurable intervals (e.g., 3 days, 1 day, 3 hours before tour)
 * - Tracks sent reminders to avoid duplicates
 * - Includes tour details, schedule, and order information
 */

const pool = require('../config/database');
const { sendTourReminderEmail } = require('./email.services');

// Default reminder intervals (in hours before tour start)
const DEFAULT_REMINDER_INTERVALS = [72, 24, 3]; // 3 days, 1 day, 3 hours

/**
 * Get dynamic tour reminder settings from database
 */
async function getTourReminderSettings() {
  try {
    const result = await pool.query(`
      SELECT setting_key, setting_value 
      FROM system_settings 
      WHERE setting_key IN ('tour_reminder_enabled', 'tour_reminder_intervals')
    `);
    
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    return {
      isEnabled: settings['tour_reminder_enabled'] === 'true',
      intervals: settings['tour_reminder_intervals'] 
        ? JSON.parse(settings['tour_reminder_intervals']) 
        : DEFAULT_REMINDER_INTERVALS
    };
  } catch (error) {
    // If table doesn't exist yet or query fails, return defaults
    console.log('⚠️ [TourReminder] Using default settings');
    return { 
      isEnabled: true, // Enable by default
      intervals: DEFAULT_REMINDER_INTERVALS 
    };
  }
}

/**
 * Create tour_reminders table if it doesn't exist
 */
async function ensureReminderTableExists() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tour_reminders (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        reminder_type VARCHAR(50) NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        email_sent_to VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(order_id, reminder_type)
      );

      CREATE INDEX IF NOT EXISTS idx_tour_reminders_order ON tour_reminders(order_id);
      CREATE INDEX IF NOT EXISTS idx_tour_reminders_sent_at ON tour_reminders(sent_at);
    `);
    console.log('✅ [TourReminder] Table ensured');
  } catch (error) {
    console.error('❌ [TourReminder] Error creating reminders table:', error.message);
  }
}

/**
 * Get upcoming orders that need reminders
 */
async function getOrdersNeedingReminders(hoursBeforeTour) {
  const client = await pool.connect();
  try {
    // Calculate the time window for this reminder
    const startWindow = `${hoursBeforeTour + 1} hours`;
    const endWindow = `${hoursBeforeTour} hours`;

    const query = `
      SELECT 
        o.id as order_id,
        o.order_code,
        o.user_id,
        o.total_price,
        o.total_participants as number_of_people,
        o.contact_name as customer_name,
        o.contact_email as email,
        o.contact_phone as phone,
        o.status as order_status,
        o.payment_status,
        o.tour_name as tour_title,
        o.tour_id,
        ts.start_date,
        ts.end_date,
        t.departure_location,
        ts.id as schedule_id
      FROM orders o
      INNER JOIN tour_schedules ts ON o.schedule_id = ts.id
      INNER JOIN tours t ON o.tour_id = t.id
      WHERE 
        o.status IN ('CONFIRMED', 'PAID')
        AND o.payment_status = 'PAID'
        AND ts.start_date BETWEEN 
          NOW() + ($1 || ' hours')::INTERVAL 
          AND NOW() + ($2 || ' hours')::INTERVAL
        AND NOT EXISTS (
          SELECT 1 FROM tour_reminders tr 
          WHERE tr.order_id = o.id 
          AND tr.reminder_type = $3
        )
      ORDER BY ts.start_date ASC
    `;

    const reminderType = `${hoursBeforeTour}h`;
    const result = await client.query(query, [endWindow.split(' ')[0], startWindow.split(' ')[0], reminderType]);
    
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Record that a reminder was sent
 */
async function recordReminderSent(orderId, reminderType, email, status = 'sent', errorMessage = null) {
  try {
    await pool.query(`
      INSERT INTO tour_reminders (order_id, reminder_type, email_sent_to, status, error_message)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (order_id, reminder_type) 
      DO UPDATE SET 
        sent_at = CURRENT_TIMESTAMP,
        status = EXCLUDED.status,
        error_message = EXCLUDED.error_message
    `, [orderId, reminderType, email, status, errorMessage]);
  } catch (error) {
    console.error('❌ [TourReminder] Error recording reminder:', error.message);
  }
}

/**
 * Send tour reminder emails for a specific interval
 */
async function sendRemindersForInterval(hoursBeforeTour) {
  try {
    const orders = await getOrdersNeedingReminders(hoursBeforeTour);
    
    if (orders.length === 0) {
      console.log(`✓ [TourReminder] No orders need ${hoursBeforeTour}h reminder`);
      return [];
    }

    console.log(`📧 [TourReminder] Sending ${hoursBeforeTour}h reminders to ${orders.length} customers...`);

    const results = [];
    for (const order of orders) {
      try {
        // Calculate days/hours until tour
        const now = new Date();
        const tourStart = new Date(order.start_date);
        const hoursUntil = Math.round((tourStart - now) / (1000 * 60 * 60));
        const daysUntil = Math.floor(hoursUntil / 24);

        // Send reminder email
        await sendTourReminderEmail({
          to: order.email,
          customerName: order.customer_name,
          tourTitle: order.tour_title,
          tourId: order.tour_id,
          startDate: order.start_date,
          endDate: order.end_date,
          departureLocation: order.departure_location,
          numberOfPeople: order.number_of_people,
          totalPrice: order.total_price,
          orderCode: order.order_code,
          hoursUntil,
          daysUntil,
          reminderType: `${hoursBeforeTour}h`
        });

        // Record successful send
        await recordReminderSent(
          order.order_id, 
          `${hoursBeforeTour}h`, 
          order.email, 
          'sent'
        );

        console.log(`   ✅ Sent ${hoursBeforeTour}h reminder to ${order.email} for tour "${order.tour_title}"`);
        results.push({ success: true, order });
      } catch (error) {
        console.error(`   ❌ Failed to send reminder to ${order.email}:`, error.message);
        
        // Record failed send
        await recordReminderSent(
          order.order_id, 
          `${hoursBeforeTour}h`, 
          order.email, 
          'failed',
          error.message
        );

        results.push({ success: false, order, error: error.message });
      }
    }

    return results;
  } catch (error) {
    console.error(`❌ [TourReminder] Error sending ${hoursBeforeTour}h reminders:`, error.message);
    throw error;
  }
}

/**
 * Check and send all pending tour reminders
 */
async function sendPendingTourReminders() {
  const settings = await getTourReminderSettings();
  
  if (!settings.isEnabled) {
    console.log('⏳ [TourReminder] Tour reminders are currently DISABLED in system settings. Skipping.');
    return [];
  }

  console.log(`🔄 [TourReminder] Checking for tours needing reminders at intervals: ${settings.intervals.join(', ')} hours`);

  const allResults = [];
  for (const interval of settings.intervals) {
    try {
      const results = await sendRemindersForInterval(interval);
      allResults.push(...results);
    } catch (error) {
      console.error(`❌ [TourReminder] Error processing ${interval}h interval:`, error.message);
    }
  }

  return allResults;
}

/**
 * Start the tour reminder scheduler
 * Runs every hour to check for tours needing reminders
 */
function startTourReminderScheduler() {
  console.log(`🚀 [TourReminder] Scheduler started - Checking for tour reminders every hour`);
  
  // Ensure table exists
  ensureReminderTableExists();

  // Run immediately on startup
  sendPendingTourReminders().catch(err => {
    console.error('❌ [TourReminder] Initial run failed:', err.message);
  });

  // Then run every hour
  const intervalMs = 60 * 60 * 1000; // 1 hour
  setInterval(() => {
    sendPendingTourReminders().catch(err => {
      console.error('❌ [TourReminder] Scheduled run failed:', err.message);
    });
  }, intervalMs);
}

/**
 * Get statistics about sent reminders
 */
async function getReminderStats(days = 7) {
  try {
    const result = await pool.query(`
      SELECT 
        reminder_type,
        status,
        COUNT(*) as count,
        DATE(sent_at) as sent_date
      FROM tour_reminders
      WHERE sent_at >= NOW() - ($1 || ' days')::INTERVAL
      GROUP BY reminder_type, status, DATE(sent_at)
      ORDER BY sent_date DESC, reminder_type
    `, [days]);

    return result.rows;
  } catch (error) {
    console.error('Error getting reminder stats:', error.message);
    return [];
  }
}

module.exports = {
  startTourReminderScheduler,
  sendPendingTourReminders,
  sendRemindersForInterval,
  getReminderStats,
  ensureReminderTableExists
};
