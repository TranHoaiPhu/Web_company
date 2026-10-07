const pool = require('../config/database');
const slugify = require('slugify');

// Helper: validate lat/lng
function validateLatLng(lat, lng) {
  if (lat !== undefined && (lat < -90 || lat > 90)) return false;
  if (lng !== undefined && (lng < -180 || lng > 180)) return false;
  return true;
}

// Helper: check parent exists
async function parentExists(parent_id) {
  if (!parent_id) return true;
  const result = await pool.query('SELECT id FROM locations WHERE id = $1', [parent_id]);
  return result.rows.length > 0;
}

// Helper: prevent circular parent
async function isCircular(id, parent_id) {
  let current = parent_id;
  while (current) {
    if (current == id) return true;
    const res = await pool.query('SELECT parent_id FROM locations WHERE id = $1', [current]);
    if (!res.rows.length) break;
    current = res.rows[0].parent_id;
  }
  return false;
}

// CREATE
exports.createLocation = async (req, res) => {
  try {
    const { 
      name, type, parent_id, description, latitude, longitude, image_url, is_active,
      tagline, subtitle, hero_image_url, climate, suitable_for, famous_for, vibe, comparison,
      season_data, highlights_data, cuisine_data, ideal_for_data, tips_data, activities_data
    } = req.body;

    if (!name || !type) return res.status(400).json({ error: 'Name and type are required' });
    if (!validateLatLng(latitude, longitude)) return res.status(400).json({ error: 'Invalid latitude/longitude' });
    if (parent_id && !(await parentExists(parent_id))) return res.status(400).json({ error: 'Parent location not found' });
    
    const slug = slugify(name, { lower: true, strict: true });
    // Check unique slug
    const slugCheck = await pool.query('SELECT id FROM locations WHERE slug = $1', [slug]);
    if (slugCheck.rows.length) return res.status(400).json({ error: 'Slug already exists' });

    const result = await pool.query(
      `INSERT INTO locations (
        name, slug, type, parent_id, description, latitude, longitude, image_url, is_active,
        tagline, subtitle, hero_image_url, climate, suitable_for, famous_for, vibe, comparison,
        season_data, highlights_data, cuisine_data, ideal_for_data, tips_data, activities_data
      )
       VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, TRUE),
        $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23
       ) RETURNING *`,
      [
        name, slug, type, parent_id || null, description, latitude, longitude, image_url, is_active,
        tagline, subtitle, hero_image_url, climate, suitable_for, famous_for, vibe, comparison,
        season_data ? JSON.stringify(season_data) : '[]',
        highlights_data ? JSON.stringify(highlights_data) : '[]',
        cuisine_data ? JSON.stringify(cuisine_data) : '[]',
        ideal_for_data ? JSON.stringify(ideal_for_data) : '[]',
        tips_data ? JSON.stringify(tips_data) : '[]',
        activities_data ? JSON.stringify(activities_data) : '[]'
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LIST (pagination + filter)
exports.getLocations = async (req, res) => {
  try {
    let { page = 1, pageSize = 10, search, type, parent_id, is_active, slug } = req.query;
    page = parseInt(page); pageSize = parseInt(pageSize);
    let where = [], params = [], idx = 1;
    if (search) { where.push(`(name ILIKE $${idx} OR slug ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    if (slug) { where.push(`slug = $${idx}`); params.push(slug); idx++; }
    if (type) { where.push(`type = $${idx}`); params.push(type); idx++; }
    if (parent_id) { where.push(`parent_id = $${idx}`); params.push(parent_id); idx++; }
    if (is_active !== undefined) { where.push(`is_active = $${idx}`); params.push(is_active === 'true'); idx++; }
    const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const countRes = await pool.query(`SELECT COUNT(*) FROM locations ${whereStr}`, params);
    const total = parseInt(countRes.rows[0].count);
    const dataRes = await pool.query(
      `SELECT * FROM locations ${whereStr} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, pageSize, (page - 1) * pageSize]
    );
    res.json({
      data: dataRes.rows,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DETAIL
exports.getLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM locations WHERE id = $1', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Location not found' });
    const location = result.rows[0];
    let parent = null;
    if (location.parent_id) {
      const parentRes = await pool.query('SELECT id, name, slug, type FROM locations WHERE id = $1', [location.parent_id]);
      if (parentRes.rows.length) parent = parentRes.rows[0];
    }
    res.json({ ...location, parent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
exports.updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, description, parent_id, latitude, longitude, image_url, is_active,
      tagline, subtitle, hero_image_url, climate, suitable_for, famous_for, vibe, comparison,
      season_data, highlights_data, cuisine_data, ideal_for_data, tips_data, activities_data
    } = req.body;
    
    // Check exists
    const oldRes = await pool.query('SELECT * FROM locations WHERE id = $1', [id]);
    if (!oldRes.rows.length) return res.status(404).json({ error: 'Location not found' });
    const old = oldRes.rows[0];
    // Prevent circular
    if (parent_id && await isCircular(id, parent_id)) return res.status(400).json({ error: 'Circular parent relationship' });
    if (parent_id && !(await parentExists(parent_id))) return res.status(400).json({ error: 'Parent location not found' });
    if (!validateLatLng(latitude, longitude)) return res.status(400).json({ error: 'Invalid latitude/longitude' });
    
    let slug = old.slug;
    if (name && name !== old.name) {
      slug = slugify(name, { lower: true, strict: true });
      const slugCheck = await pool.query('SELECT id FROM locations WHERE slug = $1 AND id != $2', [slug, id]);
      if (slugCheck.rows.length) return res.status(400).json({ error: 'Slug already exists' });
    }

    const result = await pool.query(
      `UPDATE locations SET 
        name = COALESCE($1, name), 
        slug = $2, 
        description = COALESCE($3, description), 
        parent_id = COALESCE($4, parent_id), 
        latitude = COALESCE($5, latitude), 
        longitude = COALESCE($6, longitude), 
        image_url = COALESCE($7, image_url), 
        is_active = COALESCE($8, is_active),
        tagline = COALESCE($9, tagline),
        subtitle = COALESCE($10, subtitle),
        hero_image_url = COALESCE($11, hero_image_url),
        climate = COALESCE($12, climate),
        suitable_for = COALESCE($13, suitable_for),
        famous_for = COALESCE($14, famous_for),
        vibe = COALESCE($15, vibe),
        comparison = COALESCE($16, comparison),
        season_data = COALESCE($17, season_data),
        highlights_data = COALESCE($18, highlights_data),
        cuisine_data = COALESCE($19, cuisine_data),
        ideal_for_data = COALESCE($20, ideal_for_data),
        tips_data = COALESCE($21, tips_data),
        activities_data = COALESCE($22, activities_data),
        updated_at = NOW() 
      WHERE id = $23 RETURNING *`,
      [
        name, slug, description, parent_id, latitude, longitude, image_url, is_active,
        tagline, subtitle, hero_image_url, climate, suitable_for, famous_for, vibe, comparison,
        season_data ? (typeof season_data === 'string' ? season_data : JSON.stringify(season_data)) : old.season_data,
        highlights_data ? (typeof highlights_data === 'string' ? highlights_data : JSON.stringify(highlights_data)) : old.highlights_data,
        cuisine_data ? (typeof cuisine_data === 'string' ? cuisine_data : JSON.stringify(cuisine_data)) : old.cuisine_data,
        ideal_for_data ? (typeof ideal_for_data === 'string' ? ideal_for_data : JSON.stringify(ideal_for_data)) : old.ideal_for_data,
        tips_data ? (typeof tips_data === 'string' ? tips_data : JSON.stringify(tips_data)) : old.tips_data,
        activities_data ? (typeof activities_data === 'string' ? activities_data : JSON.stringify(activities_data)) : old.activities_data,
        id
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// SOFT DELETE
exports.deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    // Check active children
    const childRes = await pool.query('SELECT id FROM locations WHERE parent_id = $1 AND is_active = true', [id]);
    if (childRes.rows.length) return res.status(400).json({ error: 'Cannot delete: has active children' });
    const result = await pool.query('UPDATE locations SET is_active = false WHERE id = $1 RETURNING *', [id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET TREE
exports.getLocationTree = async (req, res) => {
  try {
    const allRes = await pool.query('SELECT * FROM locations WHERE is_active = true');
    const all = allRes.rows;
    // Build tree
    function buildTree(parentId) {
      return all.filter(l => l.parent_id == parentId).map(l => ({
        ...l,
        children: buildTree(l.id)
      }));
    }
    res.json(buildTree(null));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ACTIVE
exports.getActiveLocations = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM locations WHERE is_active = true');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// FIND BY COORDINATES (within ~100m radius) or CREATE NEW
// POST /locations/find-or-create
exports.findOrCreateByCoordinates = async (req, res) => {
  try {
    const { latitude, longitude, name, address, placeId, photos } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    if (!validateLatLng(latitude, longitude)) {
      return res.status(400).json({ error: 'Invalid latitude/longitude' });
    }

    // Search for existing location within ~100 meters (0.001 degree ~ 111m)
    const threshold = 0.001;
    const existingResult = await pool.query(
      `SELECT * FROM locations 
       WHERE ABS(latitude - $1) < $3 
         AND ABS(longitude - $2) < $3
         AND is_active = true
       ORDER BY 
         (latitude - $1)*(latitude - $1) + (longitude - $2)*(longitude - $2) 
       LIMIT 1`,
      [latitude, longitude, threshold]
    );

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      
      // Update image if not set and photos provided
      if (!existing.image_url && photos && photos.length > 0) {
        await pool.query(
          'UPDATE locations SET image_url = $1, updated_at = NOW() WHERE id = $2',
          [photos[0], existing.id]
        );
        existing.image_url = photos[0];
      }
      
      // Found existing location nearby
      return res.json({
        success: true,
        isNew: false,
        data: existing
      });
    }

    // Create new location
    const locationName = name || address || `Địa điểm (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
    const slug = slugify(locationName, { lower: true, strict: true }) + '-' + Date.now();
    
    // Use first photo as image_url
    const imageUrl = photos && photos.length > 0 ? photos[0] : null;
    
    const insertResult = await pool.query(
      `INSERT INTO locations (name, slug, type, latitude, longitude, description, image_url, is_active)
       VALUES ($1, $2, 'CITY', $3, $4, $5, $6, true)
       RETURNING *`,
      [locationName, slug, latitude, longitude, address || null, imageUrl]
    );

    res.status(201).json({
      success: true,
      isNew: true,
      data: insertResult.rows[0]
    });

  } catch (err) {
    console.error('Error in findOrCreateByCoordinates:', err);
    res.status(500).json({ error: err.message });
  }
};
