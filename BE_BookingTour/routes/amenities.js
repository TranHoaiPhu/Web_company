const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/authJwt');

// GET: Lấy tất cả amenities
router.get('/', async (req, res) => {
  try {
    const category = req.query.category;
    const isActive = req.query.is_active;

    let query = 'SELECT * FROM amenities WHERE 1=1';
    const params = [];

    if (category) {
      query += ` AND category = $${params.length + 1}`;
      params.push(category);
    }

    if (isActive !== undefined) {
      query += ` AND is_active = $${params.length + 1}`;
      params.push(isActive === 'true');
    }

    query += ' ORDER BY category, name';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        icon: row.icon,
        category: row.category,
        isActive: row.is_active,
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    console.error('Error fetching amenities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching amenities',
      error: error.message
    });
  }
});

// GET: Lấy amenity theo ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM amenities WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Amenity not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching amenity:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching amenity',
      error: error.message
    });
  }
});

// GET: Kiểm tra số tour đang sử dụng amenity
router.get('/:id/usage', async (req, res) => {
  try {
    const { id } = req.params;

    // Lấy danh sách tour đang sử dụng amenity này
    const result = await pool.query(
      `SELECT t.id, t.name, t.slug 
       FROM tours t
       INNER JOIN tour_amenities ta ON t.id = ta.tour_id
       WHERE ta.amenity_id = $1
       ORDER BY t.name
       LIMIT 10`,
      [id]
    );

    // Đếm tổng số tour
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM tour_amenities WHERE amenity_id = $1',
      [id]
    );

    res.json({
      success: true,
      data: {
        count: parseInt(countResult.rows[0].count),
        tours: result.rows
      }
    });
  } catch (error) {
    console.error('Error checking amenity usage:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking amenity usage',
      error: error.message
    });
  }
});

// POST: Tạo amenity mới (Admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, slug, description, icon, category } = req.body;

    // Validate required fields
    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Name and slug are required'
      });
    }

    // Check if slug already exists
    const existingAmenity = await pool.query(
      'SELECT id FROM amenities WHERE slug = $1',
      [slug]
    );

    if (existingAmenity.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Amenity with this slug already exists'
      });
    }

    const insertQuery = `
      INSERT INTO amenities (name, slug, description, icon, category)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      name,
      slug,
      description || null,
      icon || null,
      category || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Amenity created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating amenity:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating amenity',
      error: error.message
    });
  }
});

// PUT: Cập nhật amenity (Admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, icon, category, isActive } = req.body;

    // Check if amenity exists
    const existingAmenity = await pool.query(
      'SELECT id FROM amenities WHERE id = $1',
      [id]
    );

    if (existingAmenity.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Amenity not found'
      });
    }

    // Check if new slug conflicts with another amenity
    if (slug) {
      const slugCheck = await pool.query(
        'SELECT id FROM amenities WHERE slug = $1 AND id != $2',
        [slug, id]
      );

      if (slugCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Amenity with this slug already exists'
        });
      }
    }

    const updateQuery = `
      UPDATE amenities 
      SET 
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        icon = COALESCE($4, icon),
        category = COALESCE($5, category),
        is_active = COALESCE($6, is_active)
      WHERE id = $7
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      name,
      slug,
      description,
      icon,
      category,
      isActive,
      id
    ]);

    res.json({
      success: true,
      message: 'Amenity updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating amenity:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating amenity',
      error: error.message
    });
  }
});

// DELETE: Xóa amenity (Admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Check if amenity is being used by any tours
    const usageCheck = await client.query(
      'SELECT COUNT(*) as count FROM tour_amenities WHERE amenity_id = $1',
      [id]
    );

    if (parseInt(usageCheck.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Cannot delete amenity that is being used by tours'
      });
    }

    // Delete amenity
    const result = await client.query(
      'DELETE FROM amenities WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Amenity not found'
      });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Amenity deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting amenity:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting amenity',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// GET: Lấy amenities của một tour
router.get('/tour/:tourId', async (req, res) => {
  try {
    const { tourId } = req.params;

    const query = `
      SELECT 
        a.id,
        a.name,
        a.slug,
        a.description,
        a.icon,
        a.category,
        ta.price,
        ta.is_included,
        ta.is_optional
      FROM amenities a
      INNER JOIN tour_amenities ta ON a.id = ta.amenity_id
      WHERE ta.tour_id = $1 AND a.is_active = true
      ORDER BY ta.is_included DESC, a.category, a.name
    `;

    const result = await pool.query(query, [tourId]);

    const included = result.rows.filter(row => row.is_included);
    const optional = result.rows.filter(row => !row.is_included && row.is_optional);

    res.json({
      success: true,
      data: {
        included: included.map(row => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description,
          icon: row.icon,
          category: row.category
        })),
        optional: optional.map(row => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description,
          icon: row.icon,
          category: row.category,
          price: parseFloat(row.price)
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching tour amenities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tour amenities',
      error: error.message
    });
  }
});

// POST: Thêm amenity vào tour (Link)
router.post('/tour', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { tourId, amenityId, isIncluded, isOptional, price } = req.body;

    if (!tourId || !amenityId) {
      return res.status(400).json({
        success: false,
        message: 'Tour ID and Amenity ID are required'
      });
    }

    // Check if link already exists
    const check = await pool.query(
      'SELECT * FROM tour_amenities WHERE tour_id = $1 AND amenity_id = $2',
      [tourId, amenityId]
    );

    if (check.rows.length > 0) {
      // Update existing
      const updateResult = await pool.query(
        `UPDATE tour_amenities 
         SET is_included = $1, is_optional = $2, price = $3
         WHERE tour_id = $4 AND amenity_id = $5
         RETURNING *`,
        [isIncluded || false, isOptional || false, price || 0, tourId, amenityId]
      );
      
      return res.json({
        success: true,
        message: 'Tour amenity updated',
        data: updateResult.rows[0]
      });
    }

    // Insert new
    const result = await pool.query(
      `INSERT INTO tour_amenities (tour_id, amenity_id, is_included, is_optional, price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [tourId, amenityId, isIncluded || false, isOptional || false, price || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Amenity added to tour',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding amenity to tour:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding amenity to tour',
      error: error.message
    });
  }
});

// DELETE: Xóa amenity khỏi tour (Unlink)
router.delete('/tour', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { tourId, amenityId } = req.body;

    const result = await pool.query(
      'DELETE FROM tour_amenities WHERE tour_id = $1 AND amenity_id = $2 RETURNING *',
      [tourId, amenityId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour amenity link not found'
      });
    }

    res.json({
      success: true,
      message: 'Amenity removed from tour'
    });
  } catch (error) {
    console.error('Error removing amenity from tour:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing amenity from tour',
      error: error.message
    });
  }
});

module.exports = router;
