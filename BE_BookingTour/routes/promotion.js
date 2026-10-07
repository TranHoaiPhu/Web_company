const express = require("express");
const pool = require("../config/database");

const router = express.Router();

// Helper function to format discount code response
const formatDiscountCode = (row) => ({
  id: row.id,
  code: row.code,
  name: row.name,
  description: row.description,
  discountType: row.discount_type,
  discountValue: parseFloat(row.discount_value),
  maxDiscountAmount: row.max_discount_amount ? parseFloat(row.max_discount_amount) : null,
  minOrderAmount: row.min_order_amount ? parseFloat(row.min_order_amount) : 0,
  maxUses: row.max_uses,
  maxUsesPerUser: row.max_uses_per_user || 1,
  usedCount: row.used_count || 0,
  validFrom: row.valid_from,
  validTo: row.valid_to,
  isActive: row.is_active,
  isPublic: row.is_public,
  applicableTourIds: row.applicable_tour_ids,
  applicableCategoryIds: row.applicable_category_ids,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  isExpired: new Date(row.valid_to) < new Date()
});

// GET ALL DISCOUNT CODES
router.get('/', async (req, res) => {
  try {
    const { isActive, isPublic, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM discount_codes WHERE 1=1`;
    let params = [];
    let paramCount = 1;

    if (isActive !== undefined) {
      query += ` AND is_active = $${paramCount}`;
      params.push(isActive === 'true');
      paramCount++;
    }

    if (isPublic !== undefined) {
      query += ` AND is_public = $${paramCount}`;
      params.push(isPublic === 'true');
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM discount_codes WHERE 1=1`;
    let countParams = [];
    if (isActive !== undefined) countQuery += ` AND is_active = $1`;
    if (isPublic !== undefined) countQuery += ` AND is_public = $${isActive !== undefined ? 2 : 1}`;
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows.map(formatDiscountCode),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching discount codes', 
      error: error.message 
    });
  }
});

// GET DISCOUNT CODE BY CODE
router.get('/:code', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM discount_codes WHERE code = $1`,
      [req.params.code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Discount code not found' 
      });
    }

    res.json({
      success: true,
      data: formatDiscountCode(result.rows[0])
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching discount code', 
      error: error.message 
    });
  }
});

// VALIDATE DISCOUNT CODE
router.post('/validate/:code', async (req, res) => {
  try {
    const { orderValue, userId, tourId } = req.body;

    // Find discount code
    const result = await pool.query(
      `SELECT * FROM discount_codes 
       WHERE code = $1 
       AND is_active = true
       AND valid_from <= CURRENT_TIMESTAMP
       AND valid_to >= CURRENT_TIMESTAMP`,
      [req.params.code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Discount code is invalid or expired' 
      });
    }

    const code = result.rows[0];

    // Check minimum order amount
    if (code.min_order_amount && orderValue < code.min_order_amount) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum order amount required: ${code.min_order_amount}`,
        minRequired: code.min_order_amount
      });
    }

    // Check max uses
    if (code.max_uses && code.used_count >= code.max_uses) {
      return res.status(400).json({ 
        success: false, 
        message: 'Discount code has reached maximum usage limit' 
      });
    }

    // Check applicable tour if tourId provided
    if (tourId && code.applicable_tour_ids && code.applicable_tour_ids.length > 0) {
      if (!code.applicable_tour_ids.includes(parseInt(tourId))) {
        return res.status(400).json({ 
          success: false, 
          message: 'This discount code is not applicable to this tour' 
        });
      }
    }

    // Calculate discount
    let discount = 0;
    if (code.discount_type === 'PERCENTAGE') {
      discount = (orderValue * code.discount_value) / 100;
      // Apply max discount amount if set
      if (code.max_discount_amount && discount > code.max_discount_amount) {
        discount = code.max_discount_amount;
      }
    } else if (code.discount_type === 'FIXED_AMOUNT') {
      discount = code.discount_value;
    }

    res.json({
      success: true,
      data: {
        code: code.code,
        name: code.name,
        discountType: code.discount_type,
        discountValue: parseFloat(code.discount_value),
        discountAmount: parseFloat(discount.toFixed(2)),
        finalPrice: parseFloat((orderValue - discount).toFixed(2))
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error validating discount code', 
      error: error.message 
    });
  }
});

// CREATE DISCOUNT CODE (ADMIN)
router.post('/', async (req, res) => {
  try {
    const { 
      code, name, description, discountType, discountValue, maxDiscountAmount,
      minOrderAmount, maxUses, maxUsesPerUser, validFrom, validTo,
      isActive, isPublic, applicableTourIds, applicableCategoryIds, createdBy
    } = req.body;

    // Validation
    if (!code || !name || !discountType || !discountValue) {
      return res.status(400).json({ 
        success: false, 
        message: 'Code, Name, Discount Type, and Discount Value are required' 
      });
    }

    if (!validFrom || !validTo) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid From and Valid To dates are required' 
      });
    }

    if (new Date(validFrom) >= new Date(validTo)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid To date must be after Valid From date' 
      });
    }

    const result = await pool.query(
      `INSERT INTO discount_codes 
       (code, name, description, discount_type, discount_value, max_discount_amount, 
        min_order_amount, max_uses, max_uses_per_user, valid_from, valid_to, 
        is_active, is_public, applicable_tour_ids, applicable_category_ids, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [code, name, description || null, discountType, discountValue, maxDiscountAmount || null,
       minOrderAmount || 0, maxUses || null, maxUsesPerUser || 1, validFrom, validTo,
       isActive !== false, isPublic !== false, applicableTourIds || null, applicableCategoryIds || null, createdBy || null]
    );

    res.status(201).json({
      success: true,
      data: formatDiscountCode(result.rows[0])
    });
  } catch (error) {
    // Check for unique constraint violation
    if (error.code === '23505') {
      return res.status(400).json({ 
        success: false, 
        message: 'Discount code already exists' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Error creating discount code', 
      error: error.message 
    });
  }
});

// UPDATE DISCOUNT CODE (ADMIN)
router.put('/:code', async (req, res) => {
  try {
    const { 
      name, description, discountType, discountValue, maxDiscountAmount,
      minOrderAmount, maxUses, maxUsesPerUser, validFrom, validTo,
      isActive, isPublic, applicableTourIds, applicableCategoryIds
    } = req.body;

    // Build dynamic update query
    let updateFields = [];
    let params = [];
    let paramCount = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount}`);
      params.push(description);
      paramCount++;
    }
    if (discountType !== undefined) {
      updateFields.push(`discount_type = $${paramCount}`);
      params.push(discountType);
      paramCount++;
    }
    if (discountValue !== undefined) {
      updateFields.push(`discount_value = $${paramCount}`);
      params.push(discountValue);
      paramCount++;
    }
    if (maxDiscountAmount !== undefined) {
      updateFields.push(`max_discount_amount = $${paramCount}`);
      params.push(maxDiscountAmount);
      paramCount++;
    }
    if (minOrderAmount !== undefined) {
      updateFields.push(`min_order_amount = $${paramCount}`);
      params.push(minOrderAmount);
      paramCount++;
    }
    if (maxUses !== undefined) {
      updateFields.push(`max_uses = $${paramCount}`);
      params.push(maxUses);
      paramCount++;
    }
    if (maxUsesPerUser !== undefined) {
      updateFields.push(`max_uses_per_user = $${paramCount}`);
      params.push(maxUsesPerUser);
      paramCount++;
    }
    if (validFrom !== undefined) {
      updateFields.push(`valid_from = $${paramCount}`);
      params.push(validFrom);
      paramCount++;
    }
    if (validTo !== undefined) {
      updateFields.push(`valid_to = $${paramCount}`);
      params.push(validTo);
      paramCount++;
    }
    if (isActive !== undefined) {
      updateFields.push(`is_active = $${paramCount}`);
      params.push(isActive);
      paramCount++;
    }
    if (isPublic !== undefined) {
      updateFields.push(`is_public = $${paramCount}`);
      params.push(isPublic);
      paramCount++;
    }
    if (applicableTourIds !== undefined) {
      updateFields.push(`applicable_tour_ids = $${paramCount}`);
      params.push(applicableTourIds);
      paramCount++;
    }
    if (applicableCategoryIds !== undefined) {
      updateFields.push(`applicable_category_ids = $${paramCount}`);
      params.push(applicableCategoryIds);
      paramCount++;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateFields.length === 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'No fields to update' 
      });
    }

    params.push(req.params.code);
    const query = `UPDATE discount_codes SET ${updateFields.join(', ')} WHERE code = $${paramCount} RETURNING *`;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Discount code not found' 
      });
    }

    res.json({
      success: true,
      data: formatDiscountCode(result.rows[0])
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating discount code', 
      error: error.message 
    });
  }
});

// DELETE DISCOUNT CODE (ADMIN)
router.delete('/:code', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM discount_codes WHERE code = $1 RETURNING code',
      [req.params.code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Discount code not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Discount code deleted successfully',
      data: { code: result.rows[0].code }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting discount code', 
      error: error.message 
    });
  }
});

module.exports = router;
