const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET: Global search
router.get('/', async (req, res) => {
  try {
    const query = req.query.q;
    const type = req.query.type; // tours, locations, categories (comma-separated)
    const limit = parseInt(req.query.limit) || 10;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchPattern = `%${query}%`;
    const types = type ? type.split(',') : ['tours', 'locations', 'categories'];
    const results = {};

    // Search tours
    if (types.includes('tours')) {
      const toursQuery = `
        SELECT 
          id,
          name,
          slug,
          short_description,
          base_price,
          rating,
          'tour' as type
        FROM tours
        WHERE status = 'ACTIVE' 
          AND (name ILIKE $1 OR short_description ILIKE $1 OR description ILIKE $1)
        ORDER BY 
          CASE 
            WHEN name ILIKE $1 THEN 1
            WHEN short_description ILIKE $1 THEN 2
            ELSE 3
          END,
          rating DESC,
          booking_count DESC
        LIMIT $2
      `;
      const toursResult = await pool.query(toursQuery, [searchPattern, limit]);
      results.tours = toursResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.short_description,
        basePrice: parseFloat(row.base_price),
        rating: parseFloat(row.rating) || 0,
        type: 'tour'
      }));
    }

    // Search locations
    if (types.includes('locations')) {
      const locationsQuery = `
        SELECT 
          id,
          name,
          slug,
          description,
          type as location_type,
          image_url,
          'location' as type
        FROM locations
        WHERE is_active = true 
          AND (name ILIKE $1 OR description ILIKE $1)
        ORDER BY 
          CASE 
            WHEN name ILIKE $1 THEN 1
            ELSE 2
          END,
          name
        LIMIT $2
      `;
      const locationsResult = await pool.query(locationsQuery, [searchPattern, limit]);
      results.locations = locationsResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        locationType: row.location_type,
        imageUrl: row.image_url,
        type: 'location'
      }));
    }

    // Search categories
    if (types.includes('categories')) {
      const categoriesQuery = `
        SELECT 
          id,
          name,
          slug,
          description,
          icon,
          'category' as type
        FROM tour_categories
        WHERE is_active = true 
          AND (name ILIKE $1 OR description ILIKE $1)
        ORDER BY name
        LIMIT $2
      `;
      const categoriesResult = await pool.query(categoriesQuery, [searchPattern, limit]);
      results.categories = categoriesResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        icon: row.icon,
        type: 'category'
      }));
    }

    // Search places
    if (types.includes('places')) {
      const placesQuery = `
        SELECT 
          id,
          name,
          slug,
          description,
          type as place_type,
          image_url,
          'place' as type
        FROM places
        WHERE is_active = true 
          AND (name ILIKE $1 OR description ILIKE $1)
        ORDER BY 
          CASE 
            WHEN name ILIKE $1 THEN 1
            ELSE 2
          END,
          rating DESC NULLS LAST
        LIMIT $2
      `;
      const placesResult = await pool.query(placesQuery, [searchPattern, limit]);
      results.places = placesResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        placeType: row.place_type,
        imageUrl: row.image_url,
        type: 'place'
      }));
    }

    // Calculate total results
    const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

    res.json({
      success: true,
      query,
      totalResults,
      data: results
    });
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing search',
      error: error.message
    });
  }
});

// GET: Search suggestions (autocomplete)
router.get('/suggestions', async (req, res) => {
  try {
    const query = req.query.q;
    const limit = parseInt(req.query.limit) || 5;

    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const searchPattern = `${query}%`; // Prefix match for autocomplete

    const suggestionsQuery = `
      (
        SELECT name, slug, 'tour' as type, base_price as price
        FROM tours
        WHERE status = 'ACTIVE' AND name ILIKE $1
        ORDER BY booking_count DESC
        LIMIT $2
      )
      UNION ALL
      (
        SELECT name, slug, 'location' as type, NULL as price
        FROM locations
        WHERE is_active = true AND name ILIKE $1
        ORDER BY name
        LIMIT $2
      )
      UNION ALL
      (
        SELECT name, slug, 'category' as type, NULL as price
        FROM tour_categories
        WHERE is_active = true AND name ILIKE $1
        ORDER BY name
        LIMIT $2
      )
      LIMIT ${limit * 3}
    `;

    const result = await pool.query(suggestionsQuery, [searchPattern, limit]);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        name: row.name,
        slug: row.slug,
        type: row.type,
        price: row.price ? parseFloat(row.price) : null
      }))
    });
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching search suggestions',
      error: error.message
    });
  }
});

// GET: Popular searches
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const popularQuery = `
      SELECT 
        name,
        slug,
        'tour' as type,
        view_count + (booking_count * 10) as popularity_score
      FROM tours
      WHERE status = 'ACTIVE'
      ORDER BY popularity_score DESC
      LIMIT $1
    `;

    const result = await pool.query(popularQuery, [limit]);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        name: row.name,
        slug: row.slug,
        type: row.type
      }))
    });
  } catch (error) {
    console.error('Error fetching popular searches:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular searches',
      error: error.message
    });
  }
});

module.exports = router;
