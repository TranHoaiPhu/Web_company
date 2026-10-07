const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/authJwt');

// GET: Lấy tất cả places
router.get('/', async (req, res) => {
  try {
    const locationId = req.query.location_id;
    const type = req.query.type;
    const isActive = req.query.is_active;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.*,
        l.name as location_name,
        l.slug as location_slug
      FROM places p
      LEFT JOIN locations l ON p.location_id = l.id
      WHERE 1=1
    `;
    const params = [];

    if (locationId) {
      query += ` AND p.location_id = $${params.length + 1}`;
      params.push(locationId);
    }

    if (type) {
      query += ` AND p.type = $${params.length + 1}`;
      params.push(type);
    }

    if (isActive !== undefined) {
      query += ` AND p.is_active = $${params.length + 1}`;
      params.push(isActive === 'true');
    }

    query += ` ORDER BY p.name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM places WHERE 1=1';
    const countParams = [];

    if (locationId) {
      countQuery += ` AND location_id = $${countParams.length + 1}`;
      countParams.push(locationId);
    }
    if (type) {
      countQuery += ` AND type = $${countParams.length + 1}`;
      countParams.push(type);
    }
    if (isActive !== undefined) {
      countQuery += ` AND is_active = $${countParams.length + 1}`;
      countParams.push(isActive === 'true');
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        data: result.rows.map(row => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description,
          address: row.address,
          latitude: row.latitude ? parseFloat(row.latitude) : null,
          longitude: row.longitude ? parseFloat(row.longitude) : null,
          imageUrl: row.image_url,
          type: row.type,
          rating: row.rating ? parseFloat(row.rating) : null,
          isActive: row.is_active,
          location: {
            id: row.location_id,
            name: row.location_name,
            slug: row.location_slug
          },
          createdAt: row.created_at,
          updatedAt: row.updated_at
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching places',
      error: error.message
    });
  }
});

// GET: Lấy place theo ID hoặc slug
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const isNumeric = /^\d+$/.test(identifier);

    const query = `
      SELECT 
        p.*,
        l.name as location_name,
        l.slug as location_slug
      FROM places p
      LEFT JOIN locations l ON p.location_id = l.id
      WHERE ${isNumeric ? 'p.id = $1' : 'p.slug = $1'}
    `;

    const result = await pool.query(query, [identifier]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Place not found'
      });
    }

    const row = result.rows[0];

    res.json({
      success: true,
      data: {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        address: row.address,
        latitude: row.latitude ? parseFloat(row.latitude) : null,
        longitude: row.longitude ? parseFloat(row.longitude) : null,
        imageUrl: row.image_url,
        type: row.type,
        rating: row.rating ? parseFloat(row.rating) : null,
        isActive: row.is_active,
        location: {
          id: row.location_id,
          name: row.location_name,
          slug: row.location_slug
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching place:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching place',
      error: error.message
    });
  }
});

// POST: Tạo place mới (Admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const {
      locationId,
      name,
      slug,
      description,
      address,
      latitude,
      longitude,
      imageUrl,
      type,
      rating
    } = req.body;

    // Validate required fields
    if (!locationId || !name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Location ID, name, and slug are required'
      });
    }

    // Check if slug already exists
    const existingPlace = await pool.query(
      'SELECT id FROM places WHERE slug = $1',
      [slug]
    );

    if (existingPlace.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Place with this slug already exists'
      });
    }

    const insertQuery = `
      INSERT INTO places (
        location_id, name, slug, description, address, 
        latitude, longitude, image_url, type, rating
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      locationId,
      name,
      slug,
      description || null,
      address || null,
      latitude || null,
      longitude || null,
      imageUrl || null,
      type || 'ATTRACTION',
      rating || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Place created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating place:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating place',
      error: error.message
    });
  }
});

// PUT: Cập nhật place (Admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      locationId,
      name,
      slug,
      description,
      address,
      latitude,
      longitude,
      imageUrl,
      type,
      rating,
      isActive
    } = req.body;

    // Check if place exists
    const existingPlace = await pool.query(
      'SELECT id FROM places WHERE id = $1',
      [id]
    );

    if (existingPlace.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Place not found'
      });
    }

    // Check if new slug conflicts
    if (slug) {
      const slugCheck = await pool.query(
        'SELECT id FROM places WHERE slug = $1 AND id != $2',
        [slug, id]
      );

      if (slugCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Place with this slug already exists'
        });
      }
    }

    const updateQuery = `
      UPDATE places 
      SET 
        location_id = COALESCE($1, location_id),
        name = COALESCE($2, name),
        slug = COALESCE($3, slug),
        description = COALESCE($4, description),
        address = COALESCE($5, address),
        latitude = COALESCE($6, latitude),
        longitude = COALESCE($7, longitude),
        image_url = COALESCE($8, image_url),
        type = COALESCE($9, type),
        rating = COALESCE($10, rating),
        is_active = COALESCE($11, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      locationId,
      name,
      slug,
      description,
      address,
      latitude,
      longitude,
      imageUrl,
      type,
      rating,
      isActive,
      id
    ]);

    res.json({
      success: true,
      message: 'Place updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating place:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating place',
      error: error.message
    });
  }
});

// DELETE: Xóa place (Admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Check if place is being used in any tour itinerary
    const usageCheck = await client.query(
      'SELECT COUNT(*) as count FROM day_places WHERE place_id = $1',
      [id]
    );

    if (parseInt(usageCheck.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Cannot delete place that is being used in tour itineraries'
      });
    }

    // Delete place
    const result = await client.query(
      'DELETE FROM places WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Place not found'
      });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Place deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting place:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting place',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// ==================== FIND OR CREATE PLACE FROM GOOGLE MAPS ====================
// POST /places/find-or-create
// Find existing place by coordinates (within ~100m) or create new one
// Validates that place is within reasonable distance of parent location
router.post('/find-or-create', async (req, res) => {
  try {
    const { latitude, longitude, name, address, placeId, photos, locationId, type } = req.body;
    
    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        success: false,
        error: 'Latitude and longitude are required' 
      });
    }
    
    if (!locationId) {
      return res.status(400).json({ 
        success: false,
        error: 'locationId is required - place must belong to a location' 
      });
    }

    // Validate lat/lng range
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid latitude/longitude values' 
      });
    }

    // Get parent location to validate distance
    const locationResult = await pool.query(
      'SELECT id, name, latitude, longitude FROM locations WHERE id = $1 AND is_active = true',
      [locationId]
    );

    if (locationResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Location not found or inactive' 
      });
    }

    const location = locationResult.rows[0];

    // Calculate distance from place to location center (Haversine formula)
    // Allow places within 100km of location center
    const MAX_DISTANCE_KM = 100;
    
    if (location.latitude && location.longitude) {
      const R = 6371; // Earth radius in km
      const dLat = (latitude - location.latitude) * Math.PI / 180;
      const dLon = (longitude - location.longitude) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(location.latitude * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      if (distance > MAX_DISTANCE_KM) {
        return res.status(400).json({ 
          success: false,
          error: `Địa điểm quá xa ${location.name} (${distance.toFixed(1)}km). Vui lòng chọn địa điểm trong phạm vi ${MAX_DISTANCE_KM}km.`,
          distance: distance.toFixed(1),
          maxDistance: MAX_DISTANCE_KM
        });
      }
    }

    // Search for existing place within ~100 meters
    const threshold = 0.001; // ~111m
    const existingResult = await pool.query(
      `SELECT * FROM places 
       WHERE location_id = $1
         AND ABS(latitude - $2) < $4 
         AND ABS(longitude - $3) < $4
         AND is_active = true
       ORDER BY 
         (latitude - $2)*(latitude - $2) + (longitude - $3)*(longitude - $3) 
       LIMIT 1`,
      [locationId, latitude, longitude, threshold]
    );

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      
      // Update image if not set and photos provided
      if (!existing.image_url && photos && photos.length > 0) {
        await pool.query(
          'UPDATE places SET image_url = $1, updated_at = NOW() WHERE id = $2',
          [photos[0], existing.id]
        );
        existing.image_url = photos[0];
      }
      
      return res.json({
        success: true,
        isNew: false,
        data: {
          id: existing.id,
          name: existing.name,
          slug: existing.slug,
          address: existing.address,
          latitude: parseFloat(existing.latitude),
          longitude: parseFloat(existing.longitude),
          imageUrl: existing.image_url,
          type: existing.type,
          locationId: existing.location_id,
          locationName: location.name
        }
      });
    }

    // Create new place
    const placeName = name || address || `Điểm tham quan (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
    const slugify = require('slugify');
    const slug = slugify(placeName, { lower: true, strict: true }) + '-' + Date.now();
    const imageUrl = photos && photos.length > 0 ? photos[0] : null;
    const placeType = type || 'ATTRACTION';
    
    const insertResult = await pool.query(
      `INSERT INTO places (location_id, name, slug, address, latitude, longitude, image_url, type, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`,
      [locationId, placeName, slug, address || null, latitude, longitude, imageUrl, placeType]
    );

    const newPlace = insertResult.rows[0];

    res.status(201).json({
      success: true,
      isNew: true,
      data: {
        id: newPlace.id,
        name: newPlace.name,
        slug: newPlace.slug,
        address: newPlace.address,
        latitude: parseFloat(newPlace.latitude),
        longitude: parseFloat(newPlace.longitude),
        imageUrl: newPlace.image_url,
        type: newPlace.type,
        locationId: newPlace.location_id,
        locationName: location.name
      }
    });

  } catch (error) {
    console.error('Error in find-or-create place:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;
