/**
 * Order Scheduler Service
 * Automatically cancels unpaid orders after 15 minutes
 */

const pool = require('../config/database');

// Default fallback values
const DEFAULT_ORDER_EXPIRY_MINUTES = 15;

/**
 * Get dynamic system settings from database
 */
async function getAutoCancelSettings() {
  try {
    const result = await pool.query(`
      SELECT setting_key, setting_value 
      FROM system_settings 
      WHERE setting_key IN ('auto_cancel_unpaid', 'auto_cancel_minutes')
    `);
    
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    return {
      isEnabled: settings['auto_cancel_unpaid'] === 'true',
      minutes: parseInt(settings['auto_cancel_minutes']) || DEFAULT_ORDER_EXPIRY_MINUTES
    };
  } catch (error) {
    // If table doesn't exist yet or query fails, return defaults
    return { isEnabled: false, minutes: DEFAULT_ORDER_EXPIRY_MINUTES };
  }
}

/**
 * Cancel expired unpaid orders
 * Orders that are PENDING/UNPAID for more than 15 minutes will be cancelled
 */
async function cancelExpiredOrders() {
  const settings = await getAutoCancelSettings();
  
  if (!settings.isEnabled) {
    console.log('⏳ [OrderScheduler] Auto-cancel is currently DISABLED in system settings. Skipping check.');
    return [];
  }

  const client = await pool.connect();
  try {
    console.log(`🔄 [OrderScheduler] Checking for orders unpaid for > ${settings.minutes} minutes...`);

    // Find and update expired orders in one query
    const result = await client.query(`
      UPDATE orders 
      SET 
        status = 'CANCELLED',
        note = COALESCE(note, '') || ' | Tự động hủy do không thanh toán trong ' || $1 || ' phút',
        updated_at = CURRENT_TIMESTAMP
      WHERE 
        payment_status = 'UNPAID'
        AND status IN ('PENDING', 'CONFIRMED')
        AND created_at < NOW() - ($1 || ' minutes')::INTERVAL
      RETURNING id, order_code, created_at, user_id, schedule_id, total_participants
    `, [settings.minutes]);

    if (result.rows.length > 0) {
      console.log(`✅ [OrderScheduler] Cancelled ${result.rows.length} expired orders:`);
      result.rows.forEach(order => {
        console.log(`   - Order ${order.order_code} (created: ${order.created_at})`);
      });

      // No need to update payments to 'CANCELLED' as it's not a valid enum value for payment_status.
      // Keeping it 'UNPAID' is mathematically correct as no money was received.

      // Optional: Release reserved slots back to tour schedules
      for (const order of result.rows) {
        try {
          // Get order details to restore slots
          const orderDetail = await client.query(`
            SELECT schedule_id, total_participants FROM orders WHERE id = $1
          `, [order.id]);
          
          if (orderDetail.rows.length > 0 && orderDetail.rows[0].schedule_id) {
            const { schedule_id, total_participants } = orderDetail.rows[0];
            
            // Restore available slots and decrement booked slots
            await client.query(`
              UPDATE tour_schedules 
              SET 
                available_slots = available_slots + $1,
                booked_slots = GREATEST(0, booked_slots - $1)
              WHERE id = $2
            `, [total_participants || 0, schedule_id]);
            
            console.log(`   ↩️ Restored ${total_participants} slots to schedule ${schedule_id}`);
          }
        } catch (slotError) {
          console.error(`   ⚠️ Failed to restore slots for order ${order.order_code}:`, slotError.message);
        }
      }
    } else {
      console.log('✓ [OrderScheduler] No expired orders found.');
    }

    return result.rows;
  } catch (error) {
    console.error('❌ [OrderScheduler] Error cancelling expired orders:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Start the order scheduler
 * Runs every minute to check for expired orders
 */
function startOrderScheduler() {
  console.log(`🚀 [OrderScheduler] Started - Checking unpaid orders every minute`);
  
  // Run immediately on startup
  cancelExpiredOrders().catch(err => {
    console.error('❌ [OrderScheduler] Initial run failed:', err.message);
  });

  // Then run every minute
  const intervalMs = 60 * 1000; // 1 minute
  setInterval(() => {
    cancelExpiredOrders().catch(err => {
      console.error('❌ [OrderScheduler] Scheduled run failed:', err.message);
    });
  }, intervalMs);
}

/**
 * Get count of orders that will expire soon (within 5 minutes)
 */
async function getExpiringOrdersCount() {
  try {
    const settings = await getAutoCancelSettings();
    if (!settings.isEnabled) return 0;

    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM orders 
      WHERE 
        payment_status = 'UNPAID'
        AND status IN ('PENDING', 'CONFIRMED')
        AND created_at < NOW() - (($1 - 5) || ' minutes')::INTERVAL
        AND created_at >= NOW() - ($1 || ' minutes')::INTERVAL
    `, [settings.minutes]);
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('Error getting expiring orders count:', error.message);
    return 0;
  }
}

module.exports = {
  cancelExpiredOrders,
  startOrderScheduler,
  getExpiringOrdersCount
};
