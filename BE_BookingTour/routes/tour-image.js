const express = require("express");
const pool = require("../config/database");

const router = express.Router();

// GET ALL IMAGES FOR A TOUR
router.get('/tour/:tourId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        id,
        tour_id,
        image_url,
        is_cover,
        created_at
       FROM tour_images
       WHERE tour_id = $1
       ORDER BY is_cover DESC, created_at DESC`,
      [req.params.tourId]
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        imageId: row.id,
        tourId: row.tour_id,
        imageUrl: row.image_url,
        isCover: row.is_cover,
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching tour images', 
      error: error.message 
    });
  }
});

// GET COVER IMAGE FOR A TOUR
router.get('/tour/:tourId/cover', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT image_url FROM tour_images
       WHERE tour_id = $1 AND is_cover = TRUE
       LIMIT 1`,
      [req.params.tourId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No cover image found' 
      });
    }

    res.json({
      success: true,
      data: {
        imageUrl: result.rows[0].image_url
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching cover image', 
      error: error.message 
    });
  }
});

// GET IMAGE BY ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM tour_images
       WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Image not found' 
      });
    }

    res.json({
      success: true,
      data: {
        imageId: result.rows[0].id,
        tourId: result.rows[0].tour_id,
        imageUrl: result.rows[0].image_url,
        isCover: result.rows[0].is_cover,
        createdAt: result.rows[0].created_at
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching image', 
      error: error.message 
    });
  }
});

// ADD IMAGE TO TOUR
router.post('/', async (req, res) => {
  try {
    const { tourId, imageUrl, isCover } = req.body;

    if (!tourId || !imageUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tour ID and Image URL are required' 
      });
    }

    // If this is a cover image, remove cover status from other images
    if (isCover) {
      await pool.query(
        `UPDATE tour_images
         SET is_cover = FALSE
         WHERE tour_id = $1`,
        [tourId]
      );
    }

    const result = await pool.query(
      `INSERT INTO tour_images (tour_id, image_url, is_cover)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [tourId, imageUrl, isCover || false]
    );

    res.status(201).json({
      success: true,
      data: {
        imageId: result.rows[0].id,
        tourId: result.rows[0].tour_id,
        imageUrl: result.rows[0].image_url,
        isCover: result.rows[0].is_cover,
        createdAt: result.rows[0].created_at
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error adding image', 
      error: error.message 
    });
  }
});

// UPDATE IMAGE (Set as cover or update URL)
router.put('/:id', async (req, res) => {
  try {
    const { imageUrl, isCover } = req.body;

    // Get tour ID first
    const imageResult = await pool.query(
      'SELECT tour_id FROM tour_images WHERE id = $1',
      [req.params.id]
    );

    if (imageResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Image not found' 
      });
    }

    const tourId = imageResult.rows[0].tour_id;

    // If setting as cover, remove cover from others
    if (isCover) {
      await pool.query(
        `UPDATE tour_images
         SET is_cover = FALSE
         WHERE tour_id = $1`,
        [tourId]
      );
    }

    const result = await pool.query(
      `UPDATE tour_images
       SET image_url = COALESCE($1, image_url),
           is_cover = COALESCE($2, is_cover)
       WHERE id = $3
       RETURNING *`,
      [imageUrl || null, isCover !== undefined ? isCover : null, req.params.id]
    );

    res.json({
      success: true,
      data: {
        imageId: result.rows[0].id,
        tourId: result.rows[0].tour_id,
        imageUrl: result.rows[0].image_url,
        isCover: result.rows[0].is_cover,
        createdAt: result.rows[0].created_at
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating image', 
      error: error.message 
    });
  }
});

// DELETE IMAGE
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM tour_images WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Image not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Image deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting image', 
      error: error.message 
    });
  }
});

module.exports = router;
