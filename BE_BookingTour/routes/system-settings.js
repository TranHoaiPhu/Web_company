const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/authJwt');

// GET: Lấy tất cả cài đặt hệ thống
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT setting_key, setting_value, setting_group FROM system_settings');
    
    // Chuyển đổi sang object cho dễ dùng ở frontend
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value === 'true' ? true : row.setting_value === 'false' ? false : row.setting_value;
    });

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system settings',
      error: error.message
    });
  }
});

// PUT: Cập nhật cài đặt hệ thống (Yêu cầu Admin)
router.put('/', authenticateToken, isAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { settings } = req.body; // Expecting { key1: value1, key2: value2 }

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings format'
      });
    }

    await client.query('BEGIN');

    for (const [key, value] of Object.entries(settings)) {
      await client.query(
        `INSERT INTO system_settings (setting_key, setting_value) 
         VALUES ($1, $2)
         ON CONFLICT (setting_key) 
         DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP`,
        [key, String(value)]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'System settings updated successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating system settings',
      error: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;
