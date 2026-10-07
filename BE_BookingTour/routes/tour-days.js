const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/authJwt');

// POST: Thêm ngày vào tour
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { tourId, dayNumber, title, description, accommodation, meals } = req.body;

    if (!tourId || dayNumber === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Tour ID and Day Number are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO tour_days (tour_id, day_number, title, description, accommodation, meals)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [tourId, dayNumber, title, description, accommodation, meals]
    );

    res.status(201).json({
      success: true,
      message: 'Tour day created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating tour day:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating tour day',
      error: error.message
    });
  }
});

// PUT: Cập nhật ngày tour
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { dayNumber, title, description, accommodation, meals } = req.body;

    const result = await pool.query(
      `UPDATE tour_days 
       SET 
         day_number = COALESCE($1, day_number),
         title = COALESCE($2, title),
         description = COALESCE($3, description),
         accommodation = COALESCE($4, accommodation),
         meals = COALESCE($5, meals)
       WHERE id = $6
       RETURNING *`,
      [dayNumber, title, description, accommodation, meals, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour day not found'
      });
    }

    res.json({
      success: true,
      message: 'Tour day updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating tour day:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tour day',
      error: error.message
    });
  }
});

// DELETE: Xóa ngày tour
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Note: Due to foreign key constraints (CASCADE usually), deleting a day should delete associated day_places.
    // Ensure ON DELETE CASCADE is set in DB schema for day_places.tour_day_id
    
    const result = await pool.query(
      'DELETE FROM tour_days WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour day not found'
      });
    }

    res.json({
      success: true,
      message: 'Tour day deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tour day:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting tour day',
      error: error.message
    });
  }
});

// ==================== PLACES IN DAY ====================

// POST: Thêm địa điểm vào ngày tour
router.post('/:id/places', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params; // tour_day_id
    const { placeId, visitOrder, durationMinutes, notes } = req.body;

    if (!placeId) {
      return res.status(400).json({
        success: false,
        message: 'Place ID is required'
      });
    }

    const result = await pool.query(
      `INSERT INTO day_places (tour_day_id, place_id, visit_order, duration_minutes, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, placeId, visitOrder || 1, durationMinutes || 60, notes]
    );

    res.status(201).json({
      success: true,
      message: 'Place added to day successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding place to day:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding place to day',
      error: error.message
    });
  }
});

// DELETE: Xóa địa điểm khỏi ngày (bằng ID của day_places)
router.delete('/places/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params; // day_place_id

    const result = await pool.query(
      'DELETE FROM day_places WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Day place entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Place removed from day successfully'
    });
  } catch (error) {
    console.error('Error removing place from day:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing place from day',
      error: error.message
    });
  }
});

module.exports = router;
