const pool = require('../config/database');

async function initSettings() {
  const client = await pool.connect();
  try {
    console.log('Initializing system_settings table...');
    
    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        setting_group VARCHAR(50) DEFAULT 'general',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default values
    const defaultSettings = [
      ['show_flash_sale', 'true', 'homepage'],
      ['show_combo_promotion', 'false', 'homepage'],
      ['show_new_customer_promo', 'true', 'homepage'],
      ['show_featured_tours', 'true', 'homepage']
    ];

    for (const [key, value, group] of defaultSettings) {
      await client.query(`
        INSERT INTO system_settings (setting_key, setting_value, setting_group)
        VALUES ($1, $2, $3)
        ON CONFLICT (setting_key) DO NOTHING
      `, [key, value, group]);
    }

    console.log('Successfully initialized system settings.');
  } catch (error) {
    console.error('Error during settings initialization:', error);
  } finally {
    client.release();
    process.exit();
  }
}

initSettings();
