const { sendRemindersForInterval } = require('./services/tourReminderScheduler');
const pool = require('./config/database');

async function runTest() {
  try {
    console.log('=== MANUAL REMINDER TEST ===');

    // 1. Find a suitable order
    console.log('Searching for an upcoming CONFIRMED/PAID order...');
    const query = `
      SELECT 
        o.id, 
        ts.start_date,
        EXTRACT(EPOCH FROM (ts.start_date - NOW())) / 3600 as hours_until 
      FROM orders o 
      JOIN tour_schedules ts ON o.schedule_id = ts.id 
      WHERE o.status IN ('CONFIRMED', 'PAID')
      AND o.payment_status = 'PAID'
      AND ts.start_date > NOW()
      ORDER BY ts.start_date ASC
      LIMIT 1
    `;
    
    const res = await pool.query(query);
    
    if (res.rows.length === 0) {
      console.log('❌ No eligible orders found.');
      console.log('Please create an order fulfilling these criteria:');
      console.log('- Status: CONFIRMED or PAID');
      console.log('- Payment Status: PAID');
      console.log('- Tour Schedule: In the future');
      return;
    }

    const order = res.rows[0];
    // Use floor to match the window logic of the scheduler (hours to hours+1)
    // Actually scheduler query: start_date BETWEEN NOW() + hours AND NOW() + (hours+1)
    // So if tour is in 24.5 hours. We need interval=24.
    // 24 < 24.5 < 25. Correct.
    const targetInterval = Math.floor(Number(order.hours_until));

    console.log(`✔ Found Order ID: ${order.id}`);
    console.log(`  Start Date: ${order.start_date}`);
    console.log(`  Hours until tour: ${Number(order.hours_until).toFixed(2)}`);
    console.log(`  Targeting interval window: ${targetInterval}h - ${targetInterval + 1}h`);

    // 2. Clear existing reminder log for this type if it exists (so we can re-test)
    await pool.query(
      `DELETE FROM tour_reminders WHERE order_id = $1 AND reminder_type = $2`,
      [order.id, `${targetInterval}h`]
    );
    console.log('  (Cleared previous reminder logs for this interval to allow re-sending)');

    // 3. Trigger reminder
    console.log(`\n🚀 Attempting to send reminder for interval: ${targetInterval} hours...`);
    const results = await sendRemindersForInterval(targetInterval);

    // 4. Report
    if (results.length > 0) {
      const result = results[0];
      if (result.success) {
        console.log(`\n✅ Email SENT successfully to: ${result.order.email}`);
      } else {
        console.error(`\n❌ Failed to send email: ${result.error}`);
      }
    } else {
      console.log('\n⚠️ No reminders were sent. Check if the order is strictly within the time window.');
    }

  } catch (err) {
    console.error('\n❌ Test execution failed with error:');
    console.error(err.stack || err);
  } finally {
    if (pool) await pool.end(); // Close DB connection
  }
}

runTest();
