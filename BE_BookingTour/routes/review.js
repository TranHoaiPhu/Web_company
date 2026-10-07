const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/authJwt');

// GET: Lấy reviews của một tour
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const query = `
      SELECT * FROM (
        SELECT DISTINCT ON (r.user_id)
          r.id,
          r.rating,
          r.title,
          r.comment,
          r.images,
          r.created_at,
          u.full_name as user_name,
          u.avatar_url as user_avatar,
          t.name as tour_name,
          t.id as tour_id,
          t.slug as tour_slug
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.user_id
        LEFT JOIN tours t ON r.tour_id = t.id
        WHERE r.rating = 5
        ORDER BY r.user_id, r.created_at DESC
      ) sub
      ORDER BY created_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        rating: row.rating,
        title: row.title,
        comment: row.comment,
        images: row.images || [],
        createdAt: row.created_at,
        user: {
          name: row.user_name,
          avatar: row.user_avatar
        },
        tour: {
          id: row.tour_id,
          name: row.tour_name,
          slug: row.tour_slug
        }
      }))
    });
  } catch (error) {
    console.error('Error fetching recent reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent reviews',
      error: error.message
    });
  }
});

// GET: Lấy danh sách review của user đang login
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        r.id,
        r.rating,
        r.title,
        r.comment,
        r.images,
        r.created_at,
        r.updated_at,
        t.id as tour_id,
        t.name as tour_name,
        t.slug as tour_slug,
        ti.image_url as tour_image,
        o.order_code
      FROM reviews r
      JOIN tours t ON r.tour_id = t.id
      LEFT JOIN tour_images ti ON t.id = ti.tour_id AND ti.is_cover = true
      LEFT JOIN orders o ON r.order_id = o.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [userId, limit, offset]);
    
    const countQuery = `SELECT COUNT(*) FROM reviews WHERE user_id = $1`;
    const countResult = await pool.query(countQuery, [userId]);
    const total = parseInt(countResult.rows[0].count);

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
    console.error('Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user reviews',
      error: error.message
    });
  }
});

// GET: Lấy reviews của một tour
router.get('/tour/:tourId', async (req, res) => {
  try {
    const { tourId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const rating = req.query.rating ? parseInt(req.query.rating) : null;
    const sortBy = req.query.sort || 'newest'; // newest, oldest, highest, lowest

    let query = `
      SELECT 
        r.id,
        r.rating,
        r.title,
        r.comment,
        r.images,
        r.created_at,
        r.updated_at,
        u.full_name as user_name,
        u.avatar_url as user_avatar,
        o.order_code
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN orders o ON r.order_id = o.id
      WHERE r.tour_id = $1
    `;

    const params = [tourId];

    if (rating) {
      query += ` AND r.rating = $${params.length + 1}`;
      params.push(rating);
    }

    // Sorting
    switch (sortBy) {
      case 'oldest':
        query += ' ORDER BY r.created_at ASC';
        break;
      case 'highest':
        query += ' ORDER BY r.rating DESC, r.created_at DESC';
        break;
      case 'lowest':
        query += ' ORDER BY r.rating ASC, r.created_at DESC';
        break;
      default: // newest
        query += ' ORDER BY r.created_at DESC';
    }

    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM reviews 
      WHERE tour_id = $1 ${rating ? 'AND rating = $2' : ''}
    `;
    const countParams = rating ? [tourId, rating] : [tourId];
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    // Get rating statistics
    const statsQuery = `
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as total_reviews,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM reviews
      WHERE tour_id = $1
    `;
    const statsResult = await pool.query(statsQuery, [tourId]);

    res.json({
      success: true,
      data: {
        reviews: result.rows.map(row => ({
          id: row.id,
          rating: row.rating,
          title: row.title,
          comment: row.comment,
          images: row.images || [],
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          user: {
            name: row.user_name,
            avatar: row.user_avatar
          },
          orderCode: row.order_code
        })),
        statistics: {
          averageRating: parseFloat(statsResult.rows[0].average_rating) || 0,
          totalReviews: parseInt(statsResult.rows[0].total_reviews),
          ratingDistribution: {
            5: parseInt(statsResult.rows[0].five_star),
            4: parseInt(statsResult.rows[0].four_star),
            3: parseInt(statsResult.rows[0].three_star),
            2: parseInt(statsResult.rows[0].two_star),
            1: parseInt(statsResult.rows[0].one_star)
          }
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
});

// POST: Tạo review mới (yêu cầu đăng nhập)
router.post('/tour/:tourId', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { tourId } = req.params;
    const { orderId, rating, title, comment, images } = req.body;
    const userId = req.user.id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    await client.query('BEGIN');

    // Check if user has booked this tour
    const orderCheck = await client.query(
      `SELECT id FROM orders 
       WHERE id = $1 AND user_id = $2 AND tour_id = $3 AND status = 'CONFIRMED'`,
      [orderId, userId, tourId]
    );

    if (orderCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'You can only review tours you have booked and completed'
      });
    }

    // Check if user already reviewed this order
    const existingReview = await client.query(
      'SELECT id FROM reviews WHERE order_id = $1 AND user_id = $2',
      [orderId, userId]
    );

    if (existingReview.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this booking'
      });
    }

    // Create review
    const insertQuery = `
      INSERT INTO reviews (tour_id, user_id, order_id, rating, title, comment, images)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await client.query(insertQuery, [
      tourId,
      userId,
      orderId,
      rating,
      title || null,
      comment || null,
      JSON.stringify(images || [])
    ]);

    // Update tour rating
    const updateTourQuery = `
      UPDATE tours 
      SET 
        rating = (SELECT AVG(rating) FROM reviews WHERE tour_id = $1),
        review_count = (SELECT COUNT(*) FROM reviews WHERE tour_id = $1)
      WHERE id = $1
    `;
    await client.query(updateTourQuery, [tourId]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// PUT: Cập nhật review (yêu cầu đăng nhập)
router.put('/:reviewId', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { reviewId } = req.params;
    const { rating, title, comment, images } = req.body;
    const userId = req.user.id;

    // Check ownership
    const ownerCheck = await client.query(
      'SELECT tour_id FROM reviews WHERE id = $1 AND user_id = $2',
      [reviewId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own reviews'
      });
    }

    const tourId = ownerCheck.rows[0].tour_id;

    await client.query('BEGIN');

    // Update review
    const updateQuery = `
      UPDATE reviews 
      SET 
        rating = COALESCE($1, rating),
        title = COALESCE($2, title),
        comment = COALESCE($3, comment),
        images = COALESCE($4, images),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    const result = await client.query(updateQuery, [
      rating,
      title,
      comment,
      images,
      reviewId
    ]);

    // Update tour rating
    const updateTourQuery = `
      UPDATE tours 
      SET rating = (SELECT AVG(rating) FROM reviews WHERE tour_id = $1)
      WHERE id = $1
    `;
    await client.query(updateTourQuery, [tourId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// DELETE: Xóa review (yêu cầu đăng nhập)
router.delete('/:reviewId', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Check ownership
    const ownerCheck = await client.query(
      'SELECT tour_id FROM reviews WHERE id = $1 AND user_id = $2',
      [reviewId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }

    const tourId = ownerCheck.rows[0].tour_id;

    await client.query('BEGIN');

    // Delete review
    await client.query('DELETE FROM reviews WHERE id = $1', [reviewId]);

    // Update tour rating
    const updateTourQuery = `
      UPDATE tours 
      SET 
        rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE tour_id = $1), 0),
        review_count = (SELECT COUNT(*) FROM reviews WHERE tour_id = $1)
      WHERE id = $1
    `;
    await client.query(updateTourQuery, [tourId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;