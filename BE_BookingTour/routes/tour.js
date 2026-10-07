const express = require("express");
const { body, validationResult } = require("express-validator");
const pool = require("../config/database");
// const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// ==================== TOUR ENDPOINTS ====================

router.get("/", async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const offset = (page - 1) * limit;
    
    const { search, status, categoryId, locationId, isFeatured, isHotDeal } = req.query;
    
    let query = `
      SELECT 
        t.*,
        c.name as category_name,
        l.name as location_name,
        (SELECT image_url FROM tour_images WHERE tour_id = t.id AND is_cover = TRUE LIMIT 1) as cover_image
      FROM tours t
      LEFT JOIN tour_categories c ON t.category_id = c.id
      LEFT JOIN locations l ON t.location_id = l.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (search) {
      query += ` AND t.name ILIKE $${params.length + 1}`;
      params.push(`%${search}%`);
    }
    
    if (status) {
      query += ` AND t.status = $${params.length + 1}`;
      params.push(status);
    }

    if (categoryId) {
      query += ` AND t.category_id = $${params.length + 1}`;
      params.push(categoryId);
    }

    if (locationId) {
      query += ` AND t.location_id = $${params.length + 1}`;
      params.push(locationId);
    }

    if (isFeatured === 'true') {
      query += ` AND t.is_featured = TRUE`;
    }

    if (isHotDeal === 'true') {
      query += ` AND t.is_hot_deal = TRUE`;
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) FROM (${query}) AS total_count`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Add ordering and pagination
    query += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching tours:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});
// GET: Danh sách tours
// Type Tour: id, title, description, image, location, duration, price, originalPrice?, rating, reviews, maxGuests, category, featured?, availableSpots?, badges?
router.get('/list', async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 12;
    const offset = (page - 1) * limit;
    
    const { categoryId, locationId, isFeatured, isHotDeal, minPrice, maxPrice, sortBy, search, difficulty, participants, startDate, endDate } = req.query;

    // Build schedule filter subquery if participants or date filters are provided
    let scheduleFilter = '';
    const scheduleParams = [];
    
    if (participants || startDate || endDate) {
      scheduleFilter = `
        AND EXISTS (
          SELECT 1 FROM tour_schedules ts
          WHERE ts.tour_id = t.id 
            AND ts.status = 'OPEN'
      `;
      
      // Filter by available slots (must have enough for requested participants)
      if (participants && parseInt(participants) > 0) {
        scheduleFilter += ` AND (ts.available_slots - COALESCE(ts.booked_slots, 0)) >= ${parseInt(participants)}`;
      }
      
      // Filter by date range
      if (startDate) {
        scheduleFilter += ` AND ts.start_date >= '${startDate}'`;
      }
      if (endDate) {
        scheduleFilter += ` AND ts.start_date <= '${endDate}'`;
      }
      
      scheduleFilter += ')';
    }

    let query = `SELECT 
      t.id,
      t.name as title,
      t.short_description as description,
      t.description as fullDescription,
      (SELECT image_url FROM tour_images WHERE tour_id = t.id AND is_cover = TRUE LIMIT 1) as image,
      l.name as location,
      t.duration_days,
      t.duration_nights,
      CONCAT(t.duration_days, ' ngày ', t.duration_nights, ' đêm') as duration,
      t.base_price as price,
      t.child_price as childPrice,
      t.rating,
      COALESCE(t.review_count, 0) as reviews,
      COALESCE(t.max_participants, 0) as maxGuests,
      c.name as category,
      t.is_featured as featured,
      t.is_hot_deal as isHotDeal,
      t.difficulty as difficulty,
      COALESCE((
        SELECT SUM(GREATEST(ts.available_slots - COALESCE(ts.booked_slots, 0), 0))
        FROM tour_schedules ts
        WHERE ts.tour_id = t.id AND ts.status = 'OPEN'
      ), 0) as availableSpots,
      t.booking_count,
      t.view_count,
      t.slug
     FROM tours t
     LEFT JOIN locations l ON t.location_id = l.id
     LEFT JOIN tour_categories c ON t.category_id = c.id
     WHERE t.status = 'ACTIVE'${scheduleFilter}`;

    const params = [];

    if (categoryId) {
      query += ` AND t.category_id = $${params.length + 1}`;
      params.push(categoryId);
    }
    if (locationId) {
      query += ` AND t.location_id = $${params.length + 1}`;
      params.push(locationId);
    }
    if (isFeatured === 'true') {
      query += ` AND t.is_featured = TRUE`;
    }
    if (isHotDeal === 'true') {
      query += ` AND t.is_hot_deal = TRUE`;
    }
    if (difficulty) {
      query += ` AND t.difficulty = $${params.length + 1}`;
      params.push(difficulty);
    }
    if (minPrice) {
      query += ` AND t.base_price >= $${params.length + 1}`;
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      query += ` AND t.base_price <= $${params.length + 1}`;
      params.push(parseFloat(maxPrice));
    }
    // Sort initial declaration
    let orderBy = ' ORDER BY t.created_at DESC';

    if (search) {
      query += ` AND (
        t.name ILIKE $${params.length + 1} 
        OR t.short_description ILIKE $${params.length + 2}
        OR similarity(t.name, $${params.length + 3}) > 0.2
      )`;
      params.push(`%${search}%`, `%${search}%`, search);

      if (!sortBy || sortBy === 'newest') {
        orderBy = ` ORDER BY (similarity(t.name, $${params.length})) DESC, t.created_at DESC`;
      }
    }

    // Sort update based on sortBy param
    if (sortBy === 'price_asc') {
      orderBy = ' ORDER BY t.base_price ASC';
    } else if (sortBy === 'price_desc') {
      orderBy = ' ORDER BY t.base_price DESC';
    } else if (sortBy === 'rating') {
      orderBy = ' ORDER BY t.rating DESC, t.review_count DESC';
    } else if (sortBy === 'booking') {
      orderBy = ' ORDER BY t.booking_count DESC';
    } else if (sortBy === 'view') {
      orderBy = ' ORDER BY t.view_count DESC';
    }

    query += orderBy;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM tours t WHERE t.status = 'ACTIVE'${scheduleFilter}`;
    const countParams = [];

    if (categoryId) {
      countQuery += ` AND t.category_id = $${countParams.length + 1}`;
      countParams.push(categoryId);
    }
    if (locationId) {
      countQuery += ` AND t.location_id = $${countParams.length + 1}`;
      countParams.push(locationId);
    }
    if (isFeatured === 'true') countQuery += ` AND t.is_featured = TRUE`;
    if (isHotDeal === 'true') countQuery += ` AND t.is_hot_deal = TRUE`;
    if (difficulty) {
      countQuery += ` AND t.difficulty = $${countParams.length + 1}`;
      countParams.push(difficulty);
    }
    if (minPrice) {
      countQuery += ` AND t.base_price >= $${countParams.length + 1}`;
      countParams.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      countQuery += ` AND t.base_price <= $${countParams.length + 1}`;
      countParams.push(parseFloat(maxPrice));
    }
    if (search) {
      countQuery += ` AND (t.name ILIKE $${countParams.length + 1} OR t.short_description ILIKE $${countParams.length + 2})`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = countResult.rows[0].total;

    const data = result.rows.map(row => {
      const originalPrice = parseFloat(row.price);
      const discountedPrice = row.childPrice ? parseFloat(row.childPrice) : originalPrice;
      
      const tour = {
        id: String(row.id),
        title: row.title,
        slug: row.slug,
        description: row.description,
        image: row.image,
        location: row.location,
        duration: row.duration,
        durationDays: row.duration_days,
        durationNights: row.duration_nights,
        originalPrice: originalPrice,
        price: discountedPrice,
        rating: parseFloat(row.rating) || 0,
        reviews: row.reviews,
        maxGuests: parseInt(row.maxGuests),
        availableSpots: parseInt(row.availableSpots) || 0,
        category: row.category,
        bookingCount: row.booking_count || 0,
      };

      // Optional fields
      tour.featured = !!row.featured;
      
      // Generate badges based on conditions
      const badges = [];
      if (row.isHotDeal) badges.push('HOT_DEAL');
      if (row.featured) badges.push('FEATURED');
      if (row.difficulty === 'EASY') badges.push('BEGINNER');
      if (row.difficulty === 'DIFFICULT') badges.push('ADVENTURE');
      if (row.reviews > 50) badges.push('POPULAR');
      if (badges.length > 0) tour.badges = badges;

      return tour;
    });

    res.json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      data
    });
  } catch (error) {
    console.error('Error fetching tour list:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tour list',
      error: error.message
    });
  }
});

// ==================== SEARCH BY DISTANCE ====================
// GET: Tìm tours gần vị trí cho trước (Haversine formula)
// Query params: latitude, longitude, radius (km), limit
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 50, limit = 20, page = 1, participants, startDate, endDate } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude và longitude là bắt buộc'
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusKm = parseFloat(radius);
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const offset = (pageNum - 1) * limitNum;

    // Build schedule filter if participants or date filters are provided
    let scheduleFilter = '';
    if (participants || startDate || endDate) {
      scheduleFilter = `
        AND EXISTS (
          SELECT 1 FROM tour_schedules ts
          WHERE ts.tour_id = t.id 
            AND ts.status = 'OPEN'
      `;
      
      // Filter by available slots (must have enough for requested participants)
      if (participants && parseInt(participants) > 0) {
        scheduleFilter += ` AND (ts.available_slots - COALESCE(ts.booked_slots, 0)) >= ${parseInt(participants)}`;
      }
      
      // Filter by date range
      if (startDate) {
        scheduleFilter += ` AND ts.start_date >= '${startDate}'`;
      }
      if (endDate) {
        scheduleFilter += ` AND ts.start_date <= '${endDate}'`;
      }
      
      scheduleFilter += ')';
    }

    // Haversine formula để tính khoảng cách (km)
    // Sử dụng tọa độ từ bảng tours (nếu có) hoặc từ bảng locations
    const query = `
      WITH tour_coords AS (
        SELECT 
          t.id,
          t.name as title,
          t.short_description as description,
          (SELECT image_url FROM tour_images WHERE tour_id = t.id AND is_cover = TRUE LIMIT 1) as image,
          COALESCE(t.location_name, l.name) as location,
          t.duration_days,
          t.duration_nights,
          CONCAT(t.duration_days, ' ngày ', t.duration_nights, ' đêm') as duration,
          t.base_price as price,
          t.child_price as childPrice,
          t.rating,
          COALESCE(t.review_count, 0) as reviews,
          COALESCE(t.max_participants, 0) as maxGuests,
          c.name as category,
          t.is_featured as featured,
          t.is_hot_deal as isHotDeal,
          t.slug,
          t.booking_count,
          COALESCE(t.lat, l.latitude) as tour_lat,
          COALESCE(t.long, l.longitude) as tour_lng,
          -- Haversine distance calculation
          (
            6371 * acos(
              LEAST(1.0, GREATEST(-1.0,
                cos(radians($1)) * cos(radians(COALESCE(t.lat, l.latitude))) 
                * cos(radians(COALESCE(t.long, l.longitude)) - radians($2)) 
                + sin(radians($1)) * sin(radians(COALESCE(t.lat, l.latitude)))
              ))
            )
          ) as distance_km
        FROM tours t
        LEFT JOIN locations l ON t.location_id = l.id
        LEFT JOIN tour_categories c ON t.category_id = c.id
        WHERE t.status = 'ACTIVE'
          AND (t.lat IS NOT NULL OR l.latitude IS NOT NULL)
          AND (t.long IS NOT NULL OR l.longitude IS NOT NULL)
          ${scheduleFilter}
      )
      SELECT *
      FROM tour_coords
      WHERE distance_km <= $3
      ORDER BY distance_km ASC
      LIMIT $4 OFFSET $5
    `;

    const result = await pool.query(query, [lat, lng, radiusKm, limitNum, offset]);

    // Count total
    const countQuery = `
      WITH tour_coords AS (
        SELECT 
          t.id,
          (
            6371 * acos(
              LEAST(1.0, GREATEST(-1.0,
                cos(radians($1)) * cos(radians(COALESCE(t.lat, l.latitude))) 
                * cos(radians(COALESCE(t.long, l.longitude)) - radians($2)) 
                + sin(radians($1)) * sin(radians(COALESCE(t.lat, l.latitude)))
              ))
            )
          ) as distance_km
        FROM tours t
        LEFT JOIN locations l ON t.location_id = l.id
        WHERE t.status = 'ACTIVE'
          AND (t.lat IS NOT NULL OR l.latitude IS NOT NULL)
          AND (t.long IS NOT NULL OR l.longitude IS NOT NULL)
          ${scheduleFilter}
      )
      SELECT COUNT(*) as total
      FROM tour_coords
      WHERE distance_km <= $3
    `;
    
    const countResult = await pool.query(countQuery, [lat, lng, radiusKm]);
    const total = parseInt(countResult.rows[0].total);

    // Map to Tour Type
    const data = result.rows.map(row => ({
      id: String(row.id),
      title: row.title,
      description: row.description,
      image: row.image,
      location: row.location,
      duration: row.duration,
      durationDays: row.duration_days,
      durationNights: row.duration_nights,
      originalPrice: parseFloat(row.price),
      price: row.childPrice ? parseFloat(row.childPrice) : parseFloat(row.price),
      rating: parseFloat(row.rating) || 0,
      reviews: row.reviews,
      maxGuests: parseInt(row.maxGuests),
      category: row.category,
      featured: !!row.featured,
      isHotDeal: !!row.isHotDeal,
      bookingCount: row.booking_count || 0,
      slug: row.slug,
      // Distance info
      distance: Math.round(row.distance_km * 10) / 10, // Round to 1 decimal
      distanceText: row.distance_km < 1 
        ? `${Math.round(row.distance_km * 1000)} m` 
        : `${Math.round(row.distance_km * 10) / 10} km`,
      coordinates: {
        latitude: parseFloat(row.tour_lat),
        longitude: parseFloat(row.tour_lng)
      }
    }));

    res.json({
      success: true,
      searchParams: {
        latitude: lat,
        longitude: lng,
        radius: radiusKm,
        unit: 'km',
        participants: participants ? parseInt(participants) : null,
        startDate: startDate || null,
        endDate: endDate || null
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      },
      data
    });

  } catch (error) {
    console.error('Error searching nearby tours:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching nearby tours',
      error: error.message
    });
  }
});

// GET: Lấy tất cả tours với đầy đủ thông tin (Base + Frontend Format)
// Hỗ trợ filter, search, sort và pagination tương tự /list nhưng đầy đủ trường hơn
router.get('/', async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 12;
    const offset = (page - 1) * limit;
    
    const { 
      categoryId, 
      locationId, 
      status = 'ACTIVE', 
      isFeatured, 
      isHotDeal, 
      minPrice, 
      maxPrice, 
      sortBy, 
      search, 
      difficulty, 
      participants, 
      startDate, 
      endDate 
    } = req.query;

    // 1. Build schedule filter subquery (tương tự /list)
    let scheduleFilterString = '';
    if (participants || startDate || endDate) {
      scheduleFilterString = `
        AND EXISTS (
          SELECT 1 FROM tour_schedules ts
          WHERE ts.tour_id = t.id 
            AND ts.status = 'OPEN'
      `;
      if (participants && parseInt(participants) > 0) {
        scheduleFilterString += ` AND (ts.available_slots - COALESCE(ts.booked_slots, 0)) >= ${parseInt(participants)}`;
      }
      if (startDate) scheduleFilterString += ` AND ts.start_date >= '${startDate}'`;
      if (endDate) scheduleFilterString += ` AND ts.start_date <= '${endDate}'`;
      scheduleFilterString += ')';
    }

    // 2. Main Query - Lấy t.* và các trường join/subquery
    let query = `SELECT 
      t.*,
      l.name as location_name,
      c.name as category_name,
      (SELECT image_url FROM tour_images WHERE tour_id = t.id AND is_cover = TRUE LIMIT 1) as cover_image,
      CONCAT(t.duration_days, ' ngày ', t.duration_nights, ' đêm') as duration_text,
      COALESCE((
        SELECT SUM(GREATEST(ts.available_slots - COALESCE(ts.booked_slots, 0), 0))
        FROM tour_schedules ts
        WHERE ts.tour_id = t.id AND ts.status = 'OPEN'
      ), 0) as available_spots
     FROM tours t
     LEFT JOIN locations l ON t.location_id = l.id
     LEFT JOIN tour_categories c ON t.category_id = c.id
     WHERE 1=1`;

    const params = [];

    // Filter by status
    if (status !== 'ALL') {
      query += ` AND t.status = $${params.length + 1}`;
      params.push(status);
    }

    // Apply filters
    if (categoryId) {
      query += ` AND t.category_id = $${params.length + 1}`;
      params.push(categoryId);
    }
    if (locationId) {
      query += ` AND t.location_id = $${params.length + 1}`;
      params.push(locationId);
    }
    if (isFeatured === 'true') query += ` AND t.is_featured = TRUE`;
    if (isHotDeal === 'true') query += ` AND t.is_hot_deal = TRUE`;
    if (difficulty) {
      query += ` AND t.difficulty = $${params.length + 1}`;
      params.push(difficulty);
    }
    if (minPrice) {
      query += ` AND t.base_price >= $${params.length + 1}`;
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      query += ` AND t.base_price <= $${params.length + 1}`;
      params.push(parseFloat(maxPrice));
    }
    
    if (search) {
      query += ` AND (t.name ILIKE $${params.length + 1} OR t.short_description ILIKE $${params.length + 2})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += scheduleFilterString;

    // 3. Sorting
    let orderBy = ' ORDER BY t.created_at DESC';
    if (sortBy === 'price_asc') orderBy = ' ORDER BY t.base_price ASC';
    else if (sortBy === 'price_desc') orderBy = ' ORDER BY t.base_price DESC';
    else if (sortBy === 'rating') orderBy = ' ORDER BY t.rating DESC, t.review_count DESC';
    else if (sortBy === 'booking') orderBy = ' ORDER BY t.booking_count DESC';
    else if (sortBy === 'view') orderBy = ' ORDER BY t.view_count DESC';
    else if (search) orderBy = ` ORDER BY (similarity(t.name, $${params.length})) DESC, t.created_at DESC`;

    query += orderBy;
    
    // Pagination params
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // 4. Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM tours t WHERE 1=1`;
    const countParams = [];
    if (status !== 'ALL') {
      countQuery += ` AND t.status = $${countParams.length + 1}`;
      countParams.push(status);
    }
    if (categoryId) {
      countQuery += ` AND t.category_id = $${countParams.length + 1}`;
      countParams.push(categoryId);
    }
    if (locationId) {
      countQuery += ` AND t.location_id = $${countParams.length + 1}`;
      countParams.push(locationId);
    }
    if (isFeatured === 'true') countQuery += ` AND t.is_featured = TRUE`;
    if (isHotDeal === 'true') countQuery += ` AND t.is_hot_deal = TRUE`;
    if (difficulty) {
      countQuery += ` AND t.difficulty = $${countParams.length + 1}`;
      countParams.push(difficulty);
    }
    if (minPrice) {
      countQuery += ` AND t.base_price >= $${countParams.length + 1}`;
      countParams.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      countQuery += ` AND t.base_price <= $${countParams.length + 1}`;
      countParams.push(parseFloat(maxPrice));
    }
    if (search) {
      countQuery += ` AND (t.name ILIKE $${countParams.length + 1} OR t.short_description ILIKE $${countParams.length + 2})`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    countQuery += scheduleFilterString;

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    // 5. Response
    res.json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      data: result.rows.map(row => {
        // Áp dụng logic tương tự /list cho các trường tính toán
        const basePrice = parseFloat(row.base_price);
        const childPrice = row.child_price ? parseFloat(row.child_price) : null;
        
        return {
          ...row, // Trả về toàn bộ các trường base từ bảng tours
          // Ghi đè hoặc thêm các trường format cho frontend (tương đồng /list)
          id: String(row.id),
          title: row.name, // alias cho name
          price: childPrice || basePrice, // Giá hiển thị (thường là giá thấp nhất/giảm)
          originalPrice: basePrice,
          image: row.cover_image,
          location: row.location_name,
          category: row.category_name,
          duration: row.duration_text,
          availableSpots: parseInt(row.available_spots),
          rating: parseFloat(row.rating) || 0,
          reviews: parseInt(row.review_count) || 0,
          featured: !!row.is_featured,
          // Bổ sung badges
          badges: (function() {
            const b = [];
            if (row.is_hot_deal) b.push('HOT_DEAL');
            if (row.is_featured) b.push('FEATURED');
            if (row.difficulty === 'EASY') b.push('BEGINNER');
            if (row.difficulty === 'DIFFICULT') b.push('ADVENTURE');
            if (row.review_count > 50) b.push('POPULAR');
            return b.length > 0 ? b : undefined;
          })()
        };
      })
    });
  } catch (error) {
    console.error('Error fetching comprehensive tour list:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching tour list', 
      error: error.message 
    });
  }
});

// POST: Tạo tour mới
router.post('/', async (req, res) => {
  try {
    const {
      name,
      slug,
      locationId,
      categoryId,
      shortDescription,
      description,
      highlights,
      includedServices,
      excludedServices,
      termsConditions,
      cancellationPolicy,
      durationDays,
      durationNights,
      basePrice,
      childPrice,
      infantPrice,
      maxParticipants,
      minParticipants,
      difficultyLevel,
      transportationType,
      departureLocation,
      returnLocation,
      status
    } = req.body;

    if (!name || !locationId || durationDays === undefined || durationNights === undefined || !basePrice || !maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: name, locationId, durationDays, durationNights, basePrice, maxParticipants'
      });
    }

    const result = await pool.query(
      `INSERT INTO tours (
        name, slug, location_id, category_id, short_description, description,
        highlights, included_services, excluded_services, terms_conditions,
        cancellation_policy, duration_days, duration_nights, base_price,
        child_price, infant_price, max_participants, min_participants,
        difficulty, transportation_type, departure_location, return_location, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING *`,
      [
        name, slug || name.toLowerCase().replace(/\s+/g, '-'),
        locationId, categoryId || null, shortDescription, description,
        highlights, includedServices, excludedServices, termsConditions,
        cancellationPolicy, durationDays, durationNights, basePrice,
        childPrice || null, infantPrice || null, maxParticipants, minParticipants || 1,
        difficultyLevel || 'EASY', transportationType, departureLocation, returnLocation,
        status || 'DRAFT'
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.rows[0].id,
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        locationId,
        categoryId,
        basePrice: parseFloat(basePrice),
        durationDays,
        durationNights,
        maxParticipants,
        status: status || 'DRAFT',
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error creating tour:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating tour',
      error: error.message
    });
  }
});



//////
router.post('/complete', async (req, res) => {
  const client = await pool.connect();
  
  console.log('=== Creating Complete Tour ===');
  console.log('Request body keys:', Object.keys(req.body));
  console.log('Images received:', req.body.images?.length || 0);
  console.log('Itinerary received:', req.body.itinerary?.length || 0);
  console.log('Amenities received:', req.body.amenities?.length || 0);
  console.log('Schedules received:', req.body.schedules?.length || 0);
  
  try {
    await client.query('BEGIN');

    const {
      // Basic tour info
      name,
      slug,
      locationId,
      categoryId,
      shortDescription,
      description,
      highlights,
      includedServices,
      excludedServices,
      termsConditions,
      cancellationPolicy,
      
      // Duration & Pricing
      durationDays,
      durationNights,
      basePrice,
      childPrice,
      infantPrice,
      
      // Capacity & Difficulty
      maxParticipants,
      minParticipants,
      difficultyLevel,
      
      // Transportation
      transportationType,
      departureLocation,
      returnLocation,
      
      // Status & Features
      status,
      isFeatured,
      isHotDeal,
      
      // Google Maps coordinates for distance-based search
      latitude,
      longitude,
      locationName,
      
      // Related data
      images,           // Array of { url, alt, isCover, order }
      itinerary,        // Array of { dayNumber, title, description, accommodation, meals, places: [{ placeId, visitOrder, durationMinutes, notes }] }
      amenities,        // Array of { amenityId, price, isIncluded, isOptional }
      schedules         // Array of { startDate, endDate, priceOverride, totalSlots, availableSlots, status, notes }
    } = req.body;

    // Validate required fields
    if (!name || !locationId || durationDays === undefined || durationNights === undefined || !basePrice) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Required fields: name, locationId, durationDays, durationNights, basePrice'
      });
    }

    // 1. Create tour
    const tourSlug = slug || name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const tourResult = await client.query(
      `INSERT INTO tours (
        name, slug, location_id, category_id, short_description, description,
        highlights, included_services, excluded_services, terms_conditions,
        cancellation_policy, duration_days, duration_nights, base_price,
        child_price, infant_price, max_participants, min_participants,
        difficulty, transportation_type, departure_location, return_location,
        status, is_featured, is_hot_deal, lat, long, location_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
      RETURNING id`,
      [
        name,
        tourSlug,
        locationId,
        categoryId || null,
        shortDescription || null,
        description || null,
        highlights || null,
        includedServices || null,
        excludedServices || null,
        termsConditions || null,
        cancellationPolicy || null,
        durationDays,
        durationNights,
        basePrice,
        childPrice || null,
        infantPrice || null,
        maxParticipants || 20,
        minParticipants || 1,
        difficultyLevel || 'EASY',
        transportationType || null,
        departureLocation || null,
        returnLocation || null,
        status || 'DRAFT',
        isFeatured || false,
        isHotDeal || false,
        latitude || null,
        longitude || null,
        locationName || null
      ]
    );

    const tourId = tourResult.rows[0].id;
    console.log('Tour created with ID:', tourId);

    // 2. Insert images
    if (images && Array.isArray(images) && images.length > 0) {
      console.log('Inserting', images.length, 'images...');
      for (const img of images) {
        try {
          await client.query(
            `INSERT INTO tour_images (tour_id, image_url, alt_text, is_cover, display_order)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              tourId,
              img.url,
              img.alt || name,
              img.isCover || false,
              img.order || 0
            ]
          );
          console.log('Image inserted:', img.url);
        } catch (imgErr) {
          console.error('Error inserting image:', imgErr.message);
        }
      }
    } else {
      console.log('No images to insert');
    }

    // 3. Insert itinerary (tour days and places)
    if (itinerary && Array.isArray(itinerary) && itinerary.length > 0) {
      console.log('Inserting', itinerary.length, 'itinerary days...');
      for (const day of itinerary) {
        try {
          const dayResult = await client.query(
            `INSERT INTO tour_days (tour_id, day_number, title, description, accommodation, meals)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [
              tourId,
              day.dayNumber,
              day.title,
              day.description || null,
              day.accommodation || null,
              day.meals || null
            ]
          );

          const tourDayId = dayResult.rows[0].id;
          console.log('Tour day inserted:', day.dayNumber, 'with ID:', tourDayId);

          // Insert places for this day
          if (day.places && Array.isArray(day.places) && day.places.length > 0) {
            for (const place of day.places) {
              try {
                await client.query(
                  `INSERT INTO day_places (tour_day_id, place_id, visit_order, duration_minutes, notes)
                   VALUES ($1, $2, $3, $4, $5)`,
                  [
                    tourDayId,
                    place.placeId,
                    place.visitOrder || 0,
                    place.durationMinutes || null,
                    place.notes || null
                  ]
                );
                console.log('Place inserted for day', day.dayNumber, ':', place.placeId);
              } catch (placeErr) {
                console.error('Error inserting place:', placeErr.message);
                // Continue without throwing - place might not exist
              }
            }
          }
        } catch (dayErr) {
          console.error('Error inserting day:', dayErr.message);
        }
      }
    } else {
      console.log('No itinerary to insert');
    }

    // 4. Insert amenities
    if (amenities && Array.isArray(amenities) && amenities.length > 0) {
      console.log('Inserting', amenities.length, 'amenities...');
      for (const amenity of amenities) {
        try {
          await client.query(
            `INSERT INTO tour_amenities (tour_id, amenity_id, price, is_included, is_optional)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              tourId,
              amenity.amenityId,
              amenity.price || 0,
              amenity.isIncluded !== undefined ? amenity.isIncluded : true,
              amenity.isOptional !== undefined ? amenity.isOptional : false
            ]
          );
          console.log('Amenity inserted:', amenity.amenityId);
        } catch (amenityErr) {
          console.error('Error inserting amenity:', amenityErr.message);
        }
      }
    } else {
      console.log('No amenities to insert');
    }

    // 5. Insert schedules
    if (schedules && Array.isArray(schedules) && schedules.length > 0) {
      console.log('Inserting', schedules.length, 'schedules...');
      for (const schedule of schedules) {
        try {
          const totalSlots = schedule.totalSlots || schedule.availableSlots || 20;
          const availableSlots = schedule.availableSlots || totalSlots;
          
          await client.query(
            `INSERT INTO tour_schedules (
              tour_id, start_date, end_date, price_override, 
              total_slots, available_slots, booked_slots, status, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              tourId,
              schedule.startDate,
              schedule.endDate,
              schedule.priceOverride || null,
              totalSlots,
              availableSlots,
              0, // booked_slots starts at 0
              schedule.status || 'OPEN',
              schedule.notes || null
            ]
          );
          console.log('Schedule inserted:', schedule.startDate, '-', schedule.endDate);
        } catch (schedErr) {
          console.error('Error inserting schedule:', schedErr.message);
        }
      }
    } else {
      console.log('No schedules to insert');
    }

    await client.query('COMMIT');
    console.log('Transaction committed successfully');

    // Fetch complete tour data
    const completeResult = await client.query(
      `SELECT 
        t.*,
        l.name as location_name,
        c.name as category_name,
        (SELECT image_url FROM tour_images WHERE tour_id = t.id AND is_cover = TRUE LIMIT 1) as cover_image
       FROM tours t
       LEFT JOIN locations l ON t.location_id = l.id
       LEFT JOIN tour_categories c ON t.category_id = c.id
       WHERE t.id = $1`,
      [tourId]
    );

    const tour = completeResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Tour created successfully',
      data: {
        id: tour.id,
        name: tour.name,
        slug: tour.slug,
        locationName: tour.location_name,
        categoryName: tour.category_name,
        basePrice: parseFloat(tour.base_price),
        durationDays: tour.duration_days,
        durationNights: tour.duration_nights,
        status: tour.status,
        isFeatured: !!tour.is_featured,
        isHotDeal: !!tour.is_hot_deal,
        coverImage: tour.cover_image,
        createdAt: tour.created_at
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating complete tour:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating tour',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// POST: Thêm images cho tour
router.post('/:id/images', async (req, res) => {
  try {
    const tourId = req.params.id;
    const { images } = req.body; // Array of { url, alt, isCover, order }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Images array is required'
      });
    }

    // Check if tour exists
    const tourCheck = await pool.query('SELECT id FROM tours WHERE id = $1', [tourId]);
    if (tourCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    const insertedImages = [];
    for (const img of images) {
      const result = await pool.query(
        `INSERT INTO tour_images (tour_id, image_url, alt_text, is_cover, display_order)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, image_url, alt_text, is_cover, display_order`,
        [
          tourId,
          img.url,
          img.alt || null,
          img.isCover || false,
          img.order || 0
        ]
      );
      insertedImages.push(result.rows[0]);
    }

    res.status(201).json({
      success: true,
      message: `${insertedImages.length} image(s) added successfully`,
      data: insertedImages
    });

  } catch (error) {
    console.error('Error adding tour images:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding images',
      error: error.message
    });
  }
});

// DELETE: Xóa image của tour
router.delete('/:id/images/:imageId', async (req, res) => {
  try {
    const { id: tourId, imageId } = req.params;

    // Verify tour exists
    const tourCheck = await pool.query('SELECT id FROM tours WHERE id = $1', [tourId]);
    if (tourCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    const result = await pool.query(
      'DELETE FROM tour_images WHERE id = $1 AND tour_id = $2 RETURNING id',
      [imageId, tourId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Image not found in this tour'
      });
    }

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tour image:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
});

// POST: Thêm itinerary day cho tour
router.post('/:id/itinerary', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const tourId = req.params.id;
    const { days } = req.body; // Array of day objects

    if (!days || !Array.isArray(days) || days.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Days array is required'
      });
    }

    // Check if tour exists
    const tourCheck = await client.query('SELECT id FROM tours WHERE id = $1', [tourId]);
    if (tourCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    const insertedDays = [];
    
    for (const day of days) {
      const dayResult = await client.query(
        `INSERT INTO tour_days (tour_id, day_number, title, description, accommodation, meals)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, day_number, title, description, accommodation, meals`,
        [
          tourId,
          day.dayNumber,
          day.title,
          day.description || null,
          day.accommodation || null,
          day.meals || null
        ]
      );

      const tourDayId = dayResult.rows[0].id;
      const dayData = { ...dayResult.rows[0], places: [] };

      // Insert places for this day
      if (day.places && Array.isArray(day.places) && day.places.length > 0) {
        for (const place of day.places) {
          const placeResult = await client.query(
            `INSERT INTO day_places (tour_day_id, place_id, visit_order, duration_minutes, notes)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, place_id, visit_order, duration_minutes, notes`,
            [
              tourDayId,
              place.placeId,
              place.visitOrder || 0,
              place.durationMinutes || null,
              place.notes || null
            ]
          );
          dayData.places.push(placeResult.rows[0]);
        }
      }

      insertedDays.push(dayData);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `${insertedDays.length} day(s) added successfully`,
      data: insertedDays
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding tour itinerary:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding itinerary',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// POST: Thêm single itinerary day cho tour (for edit page)
router.post('/:id/itinerary/single', async (req, res) => {
  try {
    const tourId = parseInt(req.params.id);
    const { day_number, dayNumber, title, description, accommodation, meals } = req.body;

    const dayNum = parseInt(day_number || dayNumber);
    
    if (isNaN(dayNum)) {
      return res.status(400).json({
        success: false,
        message: 'day_number is required and must be a number'
      });
    }

    // Check if tour exists
    const tourCheck = await pool.query('SELECT id FROM tours WHERE id = $1', [tourId]);
    if (tourCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    // Check if day_number already exists for this tour
    const dayCheck = await pool.query(
      'SELECT id FROM tour_days WHERE tour_id = $1 AND day_number = $2',
      [tourId, dayNum]
    );

    if (dayCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Ngày ${dayNum} đã tồn tại trong lịch trình của tour này. Vui lòng chọn số ngày khác.`
      });
    }

    const result = await pool.query(
      `INSERT INTO tour_days (tour_id, day_number, title, description, accommodation, meals)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [tourId, dayNum, title || `Ngày ${dayNum}`, description || null, accommodation || null, meals || null]
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

// PUT: Cập nhật itinerary day
router.put('/:id/itinerary/:dayId', async (req, res) => {
  try {
    const { id: tourId, dayId } = req.params;
    console.log(`DEBUG: Updating itinerary. TourId: ${tourId}, DayId: ${dayId}`);
    const { day_number, dayNumber, title, description, accommodation, meals } = req.body;

    // Verify tour exists
    const tourCheck = await pool.query('SELECT id FROM tours WHERE id = $1', [tourId]);
    if (tourCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    const result = await pool.query(
      `UPDATE tour_days 
       SET 
         day_number = COALESCE($1, day_number),
         title = COALESCE($2, title),
         description = COALESCE($3, description),
         accommodation = COALESCE($4, accommodation),
         meals = COALESCE($5, meals)
       WHERE id = $6 AND tour_id = $7
       RETURNING *`,
      [day_number || dayNumber, title, description, accommodation, meals, dayId, tourId]
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

// DELETE: Xóa itinerary day
router.delete('/:id/itinerary/:dayId', async (req, res) => {
  try {
    const { id: tourId, dayId } = req.params;

    // Verify tour exists
    const tourCheck = await pool.query('SELECT id FROM tours WHERE id = $1', [tourId]);
    if (tourCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    // First delete associated day_places (if not CASCADE)
    await pool.query('DELETE FROM day_places WHERE tour_day_id = $1', [dayId]);

    // Then delete the tour day
    const result = await pool.query(
      'DELETE FROM tour_days WHERE id = $1 AND tour_id = $2 RETURNING id',
      [dayId, tourId]
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

// POST: Thêm amenities cho tour
router.post('/:id/amenities', async (req, res) => {
  try {
    const tourId = req.params.id;
    const { amenities } = req.body; // Array of { amenityId, price, isIncluded, isOptional }

    if (!amenities || !Array.isArray(amenities) || amenities.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Amenities array is required'
      });
    }

    // Check if tour exists
    const tourCheck = await pool.query('SELECT id FROM tours WHERE id = $1', [tourId]);
    if (tourCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    const insertedAmenities = [];
    for (const amenity of amenities) {
      const result = await pool.query(
        `INSERT INTO tour_amenities (tour_id, amenity_id, price, is_included, is_optional)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, amenity_id, price, is_included, is_optional`,
        [
          tourId,
          amenity.amenityId,
          amenity.price || 0,
          amenity.isIncluded !== undefined ? amenity.isIncluded : true,
          amenity.isOptional !== undefined ? amenity.isOptional : false
        ]
      );
      insertedAmenities.push(result.rows[0]);
    }

    res.status(201).json({
      success: true,
      message: `${insertedAmenities.length} amenity/amenities added successfully`,
      data: insertedAmenities
    });

  } catch (error) {
    console.error('Error adding tour amenities:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding amenities',
      error: error.message
    });
  }
});

// POST: Thêm single amenity cho tour (for edit page)
router.post('/:id/amenities/single', async (req, res) => {
  try {
    const tourId = req.params.id;
    const { amenity_id, amenityId, is_included, isIncluded, is_optional, isOptional, price } = req.body;

    const amenityIdVal = amenity_id || amenityId;
    
    if (!amenityIdVal) {
      return res.status(400).json({
        success: false,
        message: 'amenity_id is required'
      });
    }

    // Check if tour exists
    const tourCheck = await pool.query('SELECT id FROM tours WHERE id = $1', [tourId]);
    if (tourCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    // Check if already exists
    const existCheck = await pool.query(
      'SELECT id FROM tour_amenities WHERE tour_id = $1 AND amenity_id = $2',
      [tourId, amenityIdVal]
    );

    if (existCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Amenity already added to this tour'
      });
    }

    const result = await pool.query(
      `INSERT INTO tour_amenities (tour_id, amenity_id, price, is_included, is_optional)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        tourId,
        amenityIdVal,
        price || 0,
        is_included !== undefined ? is_included : (isIncluded !== undefined ? isIncluded : true),
        is_optional !== undefined ? is_optional : (isOptional !== undefined ? isOptional : false)
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Amenity added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding tour amenity:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding amenity',
      error: error.message
    });
  }
});

// DELETE: Xóa amenity khỏi tour
router.delete('/:id/amenities/:amenityId', async (req, res) => {
  try {
    const { id: tourId, amenityId } = req.params;

    // Verify tour exists
    const tourCheck = await pool.query('SELECT id FROM tours WHERE id = $1', [tourId]);
    if (tourCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    const result = await pool.query(
      'DELETE FROM tour_amenities WHERE tour_id = $1 AND amenity_id = $2 RETURNING id',
      [tourId, amenityId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Amenity not found in this tour'
      });
    }

    res.json({
      success: true,
      message: 'Amenity removed from tour successfully'
    });
  } catch (error) {
    console.error('Error removing tour amenity:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing amenity',
      error: error.message
    });
  }
});

// POST: Thêm schedules cho tour
router.post('/:id/schedules', async (req, res) => {
  try {
    const tourId = req.params.id;
    const { schedules } = req.body; // Array of schedule objects

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Schedules array is required'
      });
    }

    // Check if tour exists
    const tourCheck = await pool.query('SELECT id FROM tours WHERE id = $1', [tourId]);
    if (tourCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    const insertedSchedules = [];
    for (const schedule of schedules) {
      const totalSlots = schedule.totalSlots || schedule.availableSlots || 20;
      const availableSlots = schedule.availableSlots || totalSlots;
      
      const result = await pool.query(
        `INSERT INTO tour_schedules (
          tour_id, start_date, end_date, price_override,
          total_slots, available_slots, booked_slots, status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, start_date, end_date, price_override, total_slots, available_slots, status`,
        [
          tourId,
          schedule.startDate,
          schedule.endDate,
          schedule.priceOverride || null,
          totalSlots,
          availableSlots,
          0,
          schedule.status || 'OPEN',
          schedule.notes || null
        ]
      );
      insertedSchedules.push(result.rows[0]);
    }

    res.status(201).json({
      success: true,
      message: `${insertedSchedules.length} schedule(s) added successfully`,
      data: insertedSchedules
    });

  } catch (error) {
    console.error('Error adding tour schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding schedules',
      error: error.message
    });
  }
});

// POST: Thêm single schedule cho tour (for edit page)
router.post('/:id/schedules/single', async (req, res) => {
  try {
    const tourId = req.params.id;
    const { start_date, startDate, end_date, endDate, price_override, priceOverride, total_slots, totalSlots, status } = req.body;

    // Support both snake_case and camelCase
    const startDateVal = start_date || startDate;
    const endDateVal = end_date || endDate;
    const priceOverrideVal = price_override || priceOverride || null;
    const totalSlotsVal = total_slots || totalSlots || 20;

    if (!startDateVal || !endDateVal) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date are required'
      });
    }

    // Check if tour exists
    const tourCheck = await pool.query('SELECT id FROM tours WHERE id = $1', [tourId]);
    if (tourCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    const result = await pool.query(
      `INSERT INTO tour_schedules (
        tour_id, start_date, end_date, price_override,
        total_slots, available_slots, booked_slots, status
      ) VALUES ($1, $2, $3, $4, $5, $5, 0, $6)
      RETURNING *`,
      [tourId, startDateVal, endDateVal, priceOverrideVal, totalSlotsVal, status || 'OPEN']
    );

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating schedule',
      error: error.message
    });
  }
});

// PUT: Cập nhật schedule
router.put('/:id/schedules/:scheduleId', async (req, res) => {
  try {
    const { id: tourId, scheduleId } = req.params;
    const { start_date, startDate, end_date, endDate, price_override, priceOverride, total_slots, totalSlots, available_slots, availableSlots, status } = req.body;

    // Verify tour exists
    const tourCheck = await pool.query('SELECT id FROM tours WHERE id = $1', [tourId]);
    if (tourCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    const result = await pool.query(
      `UPDATE tour_schedules 
       SET 
         start_date = COALESCE($1, start_date),
         end_date = COALESCE($2, end_date),
         price_override = COALESCE($3, price_override),
         total_slots = COALESCE($4, total_slots),
         available_slots = COALESCE($5, available_slots),
         status = COALESCE($6, status),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND tour_id = $8
       RETURNING *`,
      [
        start_date || startDate,
        end_date || endDate,
        price_override !== undefined ? price_override : (priceOverride !== undefined ? priceOverride : null),
        total_slots || totalSlots,
        available_slots || availableSlots,
        status,
        scheduleId,
        tourId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating schedule',
      error: error.message
    });
  }
});

// DELETE: Xóa schedule
router.delete('/:id/schedules/:scheduleId', async (req, res) => {
  try {
    const { id: tourId, scheduleId } = req.params;

    // Verify tour exists
    const tourCheck = await pool.query('SELECT id FROM tours WHERE id = $1', [tourId]);
    if (tourCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    // Check if schedule has bookings
    const bookingCheck = await pool.query(
      'SELECT COUNT(*) as count FROM order_items WHERE schedule_id = $1',
      [scheduleId]
    );

    if (parseInt(bookingCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete schedule with existing bookings'
      });
    }

    const result = await pool.query(
      'DELETE FROM tour_schedules WHERE id = $1 AND tour_id = $2 RETURNING id',
      [scheduleId, tourId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting schedule',
      error: error.message
    });
  }
});




// GET: Lấy chi tiết tour đầy đủ
router.get('/:id', async (req, res) => {
  try {
    const idOrSlug = req.params.id;

    // Check if param is numeric ID or slug string
    const isNumeric = /^\d+$/.test(idOrSlug);
    const whereClause = isNumeric ? 't.id = $1' : 't.slug = $1';

    // Get tour details with location and category
    const tourResult = await pool.query(
      `SELECT 
        t.*,
        l.id as location_id,
        l.name as location_name,
        l.slug as location_slug,
        l.latitude as location_latitude,
        l.longitude as location_longitude,
        c.id as category_id,
        c.name as category_name,
        c.slug as category_slug,
        c.icon as category_icon
       FROM tours t
       LEFT JOIN locations l ON t.location_id = l.id
       LEFT JOIN tour_categories c ON t.category_id = c.id
       WHERE ${whereClause}`,
      [idOrSlug]
    );

    if (tourResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    const tour = tourResult.rows[0];

    // Update view count
    await pool.query(
      'UPDATE tours SET view_count = view_count + 1 WHERE id = $1',
      [tour.id]
    );

    // Get all images
    const imagesResult = await pool.query(
      `SELECT 
        id,
        image_url,
        alt_text,
        is_cover,
        display_order
       FROM tour_images
       WHERE tour_id = $1
       ORDER BY is_cover DESC, display_order ASC`,
      [tour.id]
    );

    // Get cover image
    const coverImage = imagesResult.rows.find(img => img.is_cover)?.image_url || null;

    // Get tour days with places
    const daysResult = await pool.query(
      `SELECT 
        td.id,
        td.day_number,
        td.title,
        td.description,
        td.accommodation,
        td.meals
       FROM tour_days td
       WHERE td.tour_id = $1
       ORDER BY td.day_number ASC`,
      [tour.id]
    );

    // Get places for each day
    const itinerary = await Promise.all(
      daysResult.rows.map(async (day) => {
        const placesResult = await pool.query(
          `SELECT 
            dp.id,
            dp.visit_order,
            dp.duration_minutes,
            dp.notes,
            p.id as place_id,
            p.name as place_name,
            p.slug as place_slug,
            p.address as place_address,
            p.latitude as place_latitude,
            p.longitude as place_longitude,
            p.image_url as place_image_url,
            p.type as place_type,
            p.rating as place_rating
           FROM day_places dp
           JOIN places p ON dp.place_id = p.id
           WHERE dp.tour_day_id = $1
           ORDER BY dp.visit_order ASC`,
          [day.id]
        );

        return {
          day_number: day.day_number,
          title: day.title,
          description: day.description,
          accommodation: day.accommodation,
          meals: day.meals,
          places: placesResult.rows.map(p => ({
            place: {
              id: p.place_id,
              name: p.place_name,
              slug: p.place_slug,
              address: p.place_address,
              latitude: p.place_latitude ? parseFloat(p.place_latitude) : null,
              longitude: p.place_longitude ? parseFloat(p.place_longitude) : null,
              image_url: p.place_image_url,
              type: p.place_type,
              rating: p.place_rating ? parseFloat(p.place_rating) : null
            },
            visit_order: p.visit_order,
            duration_minutes: p.duration_minutes,
            notes: p.notes
          }))
        };
      })
    );

    // Get amenities
    const amenitiesResult = await pool.query(
      `SELECT 
        ta.amenity_id,
        a.name,
        a.slug,
        a.icon,
        a.category,
        ta.price,
        ta.is_included,
        ta.is_optional
       FROM tour_amenities ta
       JOIN amenities a ON ta.amenity_id = a.id
       WHERE ta.tour_id = $1
       ORDER BY a.category, a.name`,
      [tour.id]
    );

    // Get upcoming schedules (status OPEN, start_date >= today)
    const schedulesResult = await pool.query(
      `SELECT 
        ts.id as schedule_id,
        ts.start_date,
        ts.end_date,
        ts.price_override,
        ts.available_slots,
        COALESCE(ts.booked_slots, 0) as booked_slots,
        ts.total_slots,
        ts.status
       FROM tour_schedules ts
       WHERE ts.tour_id = $1 AND ts.status = 'OPEN' AND ts.start_date >= CURRENT_DATE
       ORDER BY ts.start_date ASC
       LIMIT 10`,
      [tour.id]
    );

    // Build response
    res.json({
      success: true,
      data: {
        tour: {
          id: tour.id,
          name: tour.name,
          slug: tour.slug,
          short_description: tour.short_description,
          description: tour.description,
          highlights: tour.highlights,
          included_services: tour.included_services,
          excluded_services: tour.excluded_services,
          cancellation_policy: tour.cancellation_policy,
          terms_conditions: tour.terms_conditions,
          duration_days: tour.duration_days,
          duration_nights: tour.duration_nights,
          base_price: parseFloat(tour.base_price),
          child_price: tour.child_price ? parseFloat(tour.child_price) : null,
          infant_price: tour.infant_price ? parseFloat(tour.infant_price) : null,
          difficulty: tour.difficulty,
          transportation_type: tour.transportation_type,
          departure_location: tour.departure_location,
          return_location: tour.return_location,
          is_featured: !!tour.is_featured,
          is_hot_deal: !!tour.is_hot_deal,
          rating: parseFloat(tour.rating) || 0,
          review_count: tour.review_count || 0,
          view_count: tour.view_count || 0,
          booking_count: tour.booking_count || 0
        },
        location: tour.location_id ? {
          id: tour.location_id,
          name: tour.location_name,
          slug: tour.location_slug,
          latitude: tour.location_latitude ? parseFloat(tour.location_latitude) : null,
          longitude: tour.location_longitude ? parseFloat(tour.location_longitude) : null
        } : null,
        category: tour.category_id ? {
          id: tour.category_id,
          name: tour.category_name,
          slug: tour.category_slug,
          icon: tour.category_icon
        } : null,
        cover_image: coverImage,
        images: imagesResult.rows.map(img => ({
          id: img.id,
          url: img.image_url,
          alt: img.alt_text,
          is_cover: !!img.is_cover,
          order: img.display_order
        })),
        itinerary: itinerary,
        amenities: amenitiesResult.rows.map(am => ({
          amenity_id: am.amenity_id,
          name: am.name,
          slug: am.slug,
          icon: am.icon,
          category: am.category,
          price: parseFloat(am.price) || 0,
          is_included: !!am.is_included,
          is_optional: !!am.is_optional
        })),
        upcoming_schedules: schedulesResult.rows.map(sch => ({
          schedule_id: sch.schedule_id,
          start_date: sch.start_date,
          end_date: sch.end_date,
          price_override: sch.price_override ? parseFloat(sch.price_override) : null,
          available_slots: sch.available_slots,
          booked_slots: sch.booked_slots,
          total_slots: sch.total_slots, 
          status: sch.status
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching tour details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tour details',
      error: error.message
    });
  }
});

// PUT: Cập nhật tour
router.put('/:id', async (req, res) => {
  try {
    const tourId = req.params.id;
    const updates = [];
    const values = [];
    let paramCount = 1;

    const fieldsMap = {
      name: 'name',
      slug: 'slug',
      locationId: 'location_id',
      categoryId: 'category_id',
      shortDescription: 'short_description',
      description: 'description',
      highlights: 'highlights',
      includedServices: 'included_services',
      excludedServices: 'excluded_services',
      termsConditions: 'terms_conditions',
      cancellationPolicy: 'cancellation_policy',
      durationDays: 'duration_days',
      durationNights: 'duration_nights',
      basePrice: 'base_price',
      childPrice: 'child_price',
      infantPrice: 'infant_price',
      maxParticipants: 'max_participants',
      minParticipants: 'min_participants',
      difficultyLevel: 'difficulty',
      transportationType: 'transportation_type',
      departureLocation: 'departure_location',
      returnLocation: 'return_location',
      status: 'status',
      isFeatured: 'is_featured',
      isHotDeal: 'is_hot_deal'
    };

    Object.entries(fieldsMap).forEach(([key, dbField]) => {
      if (req.body[key] !== undefined) {
        updates.push(`${dbField} = $${paramCount++}`);
        values.push(req.body[key]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(tourId);
    const updateQuery = `UPDATE tours SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    const tour = result.rows[0];
    res.json({
      success: true,
      data: {
        id: tour.id,
        name: tour.name,
        basePrice: parseFloat(tour.base_price),
        status: tour.status,
        updatedAt: tour.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating tour:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tour',
      error: error.message
    });
  }
});

// DELETE: Xóa tour
router.delete('/:id', async (req, res) => {
  try {
    const tourId = req.params.id;
    const result = await pool.query(
      'DELETE FROM tours WHERE id = $1 RETURNING id',
      [tourId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    res.json({
      success: true,
      message: 'Tour deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tour:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting tour',
      error: error.message
    });
  }
});

// ==================== FEATURED & HOT DEALS ====================

// GET: Tours nổi bật
router.get('/featured/tours', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 8;
    const result = await pool.query(
      `SELECT t.id, t.name, t.base_price, t.duration_days, t.rating, t.review_count, t.slug,
              (SELECT image_url FROM tour_images WHERE tour_id = t.id AND is_cover = TRUE LIMIT 1) as image
       FROM tours t
       WHERE t.is_featured = TRUE AND t.status = 'ACTIVE'
       ORDER BY t.created_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        basePrice: parseFloat(row.base_price),
        durationDays: row.duration_days,
        rating: parseFloat(row.rating) || 0,
        reviewCount: row.review_count,
        image: row.image
      }))
    });
  } catch (error) {
    console.error('Error fetching featured tours:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured tours',
      error: error.message
    });
  }
});

// GET: Hot deal tours
router.get('/hot-deals/tours', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 8;
    const result = await pool.query(
      `SELECT t.id, t.name, t.base_price, t.booking_count, t.slug,
              (SELECT image_url FROM tour_images WHERE tour_id = t.id AND is_cover = TRUE LIMIT 1) as image
       FROM tours t
       WHERE t.is_hot_deal = TRUE AND t.status = 'ACTIVE'
       ORDER BY t.booking_count DESC
       LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        basePrice: parseFloat(row.base_price),
        bookingCount: row.booking_count,
        image: row.image
      }))
    });
  } catch (error) {
    console.error('Error fetching hot deal tours:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hot deal tours',
      error: error.message
    });
  }
});

// POST: Sync booking_count from orders table
router.post('/sync-booking-count', async (req, res) => {
  try {
    // Update booking_count for all tours based on actual orders count
    const result = await pool.query(`
      UPDATE tours t
      SET booking_count = (
        SELECT COUNT(*)
        FROM orders o
        WHERE o.tour_id = t.id
        AND o.status NOT IN ('CANCELLED')
      )
      RETURNING id, name, booking_count
    `);

    res.json({
      success: true,
      message: `Updated booking_count for ${result.rowCount} tours`,
      data: result.rows
    });
  } catch (error) {
    console.error('Error syncing booking count:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing booking count',
      error: error.message
    });
  }
});

module.exports = router;
