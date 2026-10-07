const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const sendMail = require('../sendemail');

// Utility to generate random coupon code
function generateRandomCode(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}


// CHECK Discount Code validity
router.post('/check', async (req, res) => {
  try {
    const { code, user_id, order_amount, tour_id, category_id } = req.body;
    // Find code, check active, date, usage, min order, applicable tour/category
    const result = await pool.query(
      `SELECT * FROM discount_codes WHERE code = $1 AND is_active = TRUE AND valid_from <= CURRENT_TIMESTAMP AND valid_to >= CURRENT_TIMESTAMP`,
      [code]
    );
    if (result.rows.length === 0) return res.status(404).json({ valid: false, error: 'Mã không hợp lệ hoặc đã hết hạn' });
    const discount = result.rows[0];
    // Check min_order_amount
    if (discount.min_order_amount && order_amount && Number(order_amount) < Number(discount.min_order_amount)) {
      return res.status(400).json({ valid: false, error: `Đơn hàng phải từ ${discount.min_order_amount}` });
    }
    // Check max_uses
    if (discount.max_uses && discount.used_count && discount.used_count >= discount.max_uses) {
      return res.status(400).json({ valid: false, error: 'Mã đã hết lượt sử dụng' });
    }
    // Check max_uses_per_user
    if (user_id && discount.max_uses_per_user) {
      const userUsage = await pool.query(
        `SELECT COUNT(*) FROM discount_code_usages WHERE discount_code_id = $1 AND user_id = $2`,
        [discount.id, user_id]
      );
      if (Number(userUsage.rows[0].count) >= discount.max_uses_per_user) {
        return res.status(400).json({ valid: false, error: 'Bạn đã sử dụng mã này tối đa số lần cho phép' });
      }
    }
    // Check applicable_tour_ids
    if (discount.applicable_tour_ids && Array.isArray(discount.applicable_tour_ids) && discount.applicable_tour_ids.length > 0 && tour_id) {
      if (!discount.applicable_tour_ids.includes(Number(tour_id))) {
        return res.status(400).json({ valid: false, error: 'Mã không áp dụng cho tour này' });
      }
    }
    // Check applicable_category_ids
    if (discount.applicable_category_ids && Array.isArray(discount.applicable_category_ids) && discount.applicable_category_ids.length > 0 && category_id) {
      if (!discount.applicable_category_ids.includes(Number(category_id))) {
        return res.status(400).json({ valid: false, error: 'Mã không áp dụng cho loại tour này' });
      }
    }
    res.json({ valid: true, discount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// CREATE Discount Code (manual or random code)
router.post('/', async (req, res) => {
  try {
    let {
      code, name, description, discount_type, discount_value, max_discount_amount, min_order_amount, max_uses, max_uses_per_user,
      valid_from, valid_to, is_active, is_public, applicable_tour_ids, applicable_category_ids, created_by
    } = req.body;
    if (!code || code.trim() === '') {
      code = generateRandomCode(10);
    }
    const result = await pool.query(
      `INSERT INTO discount_codes (
        code, name, description, discount_type, discount_value, max_discount_amount, min_order_amount, max_uses, max_uses_per_user,
        valid_from, valid_to, is_active, is_public, applicable_tour_ids, applicable_category_ids, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING *`,
      [
        code, name, description, discount_type, discount_value, max_discount_amount, min_order_amount, max_uses, max_uses_per_user,
        valid_from, valid_to, is_active, is_public, applicable_tour_ids, applicable_category_ids, created_by
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ all Discount Codes
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM discount_codes ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ one Discount Code by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM discount_codes WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Discount code not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE Discount Code
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code, name, description, discount_type, discount_value, max_discount_amount, min_order_amount, max_uses, max_uses_per_user,
      valid_from, valid_to, is_active, is_public, applicable_tour_ids, applicable_category_ids, created_by
    } = req.body;
    const result = await pool.query(
      `UPDATE discount_codes SET
        code=$1, name=$2, description=$3, discount_type=$4, discount_value=$5, max_discount_amount=$6, min_order_amount=$7, max_uses=$8, max_uses_per_user=$9,
        valid_from=$10, valid_to=$11, is_active=$12, is_public=$13, applicable_tour_ids=$14, applicable_category_ids=$15, created_by=$16, updated_at=NOW()
        WHERE id=$17 RETURNING *`,
      [
        code, name, description, discount_type, discount_value, max_discount_amount, min_order_amount, max_uses, max_uses_per_user,
        valid_from, valid_to, is_active, is_public, applicable_tour_ids, applicable_category_ids, created_by, id
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Discount code not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE Discount Code
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM discount_codes WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Discount code not found' });
    res.json({ message: 'Discount code deleted', discount_code: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// SEND Discount Code via Email
router.post('/send-email', async (req, res) => {
  try {
    const { coupon_id, user_email, user_name } = req.body;

    if (!coupon_id || !user_email) {
      return res.status(400).json({ error: 'Thiếu thông tin mã giảm giá hoặc email' });
    }

    // Fetch discount code details
    const couponResult = await pool.query('SELECT * FROM discount_codes WHERE id = $1', [coupon_id]);
    if (couponResult.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy mã giảm giá' });
    }

    const coupon = couponResult.rows[0];
    
    // Format discount value
    const formatDiscount = () => {
      if (coupon.discount_type === 'PERCENTAGE') {
        return `${coupon.discount_value}%`;
      }
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(coupon.discount_value);
    };

    // Format date
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Email HTML content
    const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mã giảm giá đặc biệt dành cho bạn</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 50px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0 0 10px; font-size: 28px; font-weight: 700;">
                Mã Giảm Giá Đặc Biệt!
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">
                Dành riêng cho bạn từ TravelVN
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Greeting -->
              <p style="color: #333333; font-size: 16px; margin: 0 0 24px; line-height: 1.6;">
                Xin chào <strong>${user_name || 'Quý khách'}</strong>,
              </p>
              <p style="color: #666666; font-size: 15px; margin: 0 0 32px; line-height: 1.6;">
                Chúng tôi gửi tặng bạn một mã giảm giá đặc biệt để sử dụng cho chuyến du lịch tiếp theo. 
                Đừng bỏ lỡ cơ hội tiết kiệm này!
              </p>

              <!-- Coupon Card -->
              <div style="background: linear-gradient(135deg, #f8f9ff, #e8f4fd); border: 2px dashed #667eea; border-radius: 16px; padding: 30px; text-align: center; margin-bottom: 32px;">
                
                <!-- Coupon Code -->
                <p style="color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px;">
                  Mã giảm giá của bạn
                </p>
                <div style="background: #ffffff; border-radius: 8px; padding: 16px 24px; display: inline-block; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                  <code style="font-size: 28px; font-weight: 700; color: #667eea; letter-spacing: 3px; font-family: 'Courier New', monospace;">
                    ${coupon.code}
                  </code>
                </div>

                <!-- Discount Value -->
                <p style="color: #333333; font-size: 32px; font-weight: 700; margin: 0 0 8px;">
                  Giảm ${formatDiscount()}
                </p>
                ${coupon.max_discount_amount ? `
                <p style="color: #888888; font-size: 14px; margin: 0;">
                  (Tối đa ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(coupon.max_discount_amount)})
                </p>
                ` : ''}
              </div>

              <!-- Coupon Details -->
              <div style="background: #f9f9f9; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                <h3 style="color: #333333; font-size: 16px; margin: 0 0 16px; font-weight: 600;">
                  📋 Chi tiết ưu đãi
                </h3>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-size: 14px;">
                  ${coupon.name ? `
                  <tr>
                    <td style="color: #888888; padding: 8px 0; width: 140px;">Tên chương trình:</td>
                    <td style="color: #333333; font-weight: 500;">${coupon.name}</td>
                  </tr>
                  ` : ''}
                  ${coupon.description ? `
                  <tr>
                    <td style="color: #888888; padding: 8px 0; vertical-align: top;">Mô tả:</td>
                    <td style="color: #333333;">${coupon.description}</td>
                  </tr>
                  ` : ''}
                  ${coupon.min_order_amount ? `
                  <tr>
                    <td style="color: #888888; padding: 8px 0;">Đơn tối thiểu:</td>
                    <td style="color: #333333; font-weight: 500;">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(coupon.min_order_amount)}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="color: #888888; padding: 8px 0;">Có hiệu lực:</td>
                    <td style="color: #333333; font-weight: 500;">${formatDate(coupon.valid_from)} - ${formatDate(coupon.valid_to)}</td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="${process.env.FRONTEND_URL || 'https://ai-trip-system-frontend-40205731279.us-central1.run.app'}/tours" 
                       style="display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                      Khám phá tour ngay
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f5f5f5; padding: 30px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #999999; font-size: 13px; margin: 0 0 8px;">
                © 2025 TravelVN. All rights reserved.
              </p>
              <p style="color: #bbbbbb; font-size: 12px; margin: 0;">
                Bạn nhận được email này vì đã đăng ký nhận thông tin ưu đãi từ TravelVN
              </p>
            </td>
          </tr>

        </table>
        
      </td>
    </tr>
  </table>

</body>
</html>
    `;

    // Send email
    await sendMail(
      user_email,
      `[TravelVN] Mã giảm giá ${formatDiscount()} dành riêng cho bạn!`,
      htmlContent
    );

    res.json({ 
      success: true, 
      message: `Đã gửi mã giảm giá đến ${user_email}` 
    });

  } catch (err) {
    console.error('Error sending discount email:', err);
    res.status(500).json({ error: err.message });
  }
});

// BROADCAST Discount Code to All Users
router.post('/broadcast', async (req, res) => {
  try {
    const { coupon_id, custom_subject, custom_heading, custom_greeting, custom_cta } = req.body;

    if (!coupon_id) {
      return res.status(400).json({ error: 'Thiếu thông tin mã giảm giá' });
    }

    // Fetch discount code details
    const couponResult = await pool.query('SELECT * FROM discount_codes WHERE id = $1', [coupon_id]);
    if (couponResult.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy mã giảm giá' });
    }

    const coupon = couponResult.rows[0];

    // Fetch all active users with email
    const usersResult = await pool.query(
      `SELECT id, user_id, email, full_name FROM users WHERE status = 'ACTIVE' AND email IS NOT NULL AND email != ''`
    );

    if (usersResult.rows.length === 0) {
      return res.status(404).json({ error: 'Không có người dùng nào để gửi' });
    }

    const users = usersResult.rows;

    // Format discount value
    const formatDiscount = () => {
      if (coupon.discount_type === 'PERCENTAGE') {
        return `${coupon.discount_value}%`;
      }
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(coupon.discount_value);
    };

    // Format date
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Generate HTML content function
    const generateHtmlContent = (userName) => `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${custom_subject || 'Mã giảm giá đặc biệt dành cho bạn'}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 50px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0 0 10px; font-size: 28px; font-weight: 700;">
                ${custom_heading || 'Ưu Đãi Đặc Biệt Dành Cho Bạn!'}
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">
                Từ TravelVN với ❤️
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Greeting -->
              <p style="color: #333333; font-size: 16px; margin: 0 0 24px; line-height: 1.6;">
                Xin chào <strong>${userName || 'Quý khách'}</strong>,
              </p>
              <p style="color: #666666; font-size: 15px; margin: 0 0 32px; line-height: 1.6; white-space: pre-line;">
                ${custom_greeting || 'Chúng tôi gửi tặng bạn một mã giảm giá đặc biệt để sử dụng cho chuyến du lịch tiếp theo. \n                Đừng bỏ lỡ cơ hội tiết kiệm này!'}
              </p>

              <!-- Coupon Card -->
              <div style="background: linear-gradient(135deg, #f8f9ff, #e8f4fd); border: 2px dashed #667eea; border-radius: 16px; padding: 30px; text-align: center; margin-bottom: 32px;">
                
                <!-- Coupon Code -->
                <p style="color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px;">
                  Mã giảm giá của bạn
                </p>
                <div style="background: #ffffff; border-radius: 8px; padding: 16px 24px; display: inline-block; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                  <code style="font-size: 28px; font-weight: 700; color: #667eea; letter-spacing: 3px; font-family: 'Courier New', monospace;">
                    ${coupon.code}
                  </code>
                </div>

                <!-- Discount Value -->
                <p style="color: #333333; font-size: 32px; font-weight: 700; margin: 0 0 8px;">
                  Giảm ${formatDiscount()}
                </p>
                ${coupon.max_discount_amount ? `
                <p style="color: #888888; font-size: 14px; margin: 0;">
                  (Tối đa ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(coupon.max_discount_amount)})
                </p>
                ` : ''}
              </div>

              <!-- Coupon Details -->
              <div style="background: #f9f9f9; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                <h3 style="color: #333333; font-size: 16px; margin: 0 0 16px; font-weight: 600;">
                  📋 Chi tiết ưu đãi
                </h3>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-size: 14px;">
                  ${coupon.name ? `
                  <tr>
                    <td style="color: #888888; padding: 8px 0; width: 140px;">Tên chương trình:</td>
                    <td style="color: #333333; font-weight: 500;">${coupon.name}</td>
                  </tr>
                  ` : ''}
                  ${coupon.min_order_amount ? `
                  <tr>
                    <td style="color: #888888; padding: 8px 0;">Đơn tối thiểu:</td>
                    <td style="color: #333333; font-weight: 500;">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(coupon.min_order_amount)}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="color: #888888; padding: 8px 0;">Có hiệu lực:</td>
                    <td style="color: #333333; font-weight: 500;">${formatDate(coupon.valid_from)} - ${formatDate(coupon.valid_to)}</td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="${process.env.FRONTEND_URL || 'https://ai-trip-system-frontend-40205731279.us-central1.run.app'}/tours" 
                       style="display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                      ${custom_cta || 'Khám phá tour ngay'}
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f5f5f5; padding: 30px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #999999; font-size: 13px; margin: 0 0 8px;">
                © ${new Date().getFullYear()} TravelVN. All rights reserved.
              </p>
              <p style="color: #bbbbbb; font-size: 12px; margin: 0;">
                Bạn nhận được email này vì đã đăng ký nhận thông tin ưu đãi từ TravelVN
              </p>
            </td>
          </tr>

        </table>
        
      </td>
    </tr>
  </table>

</body>
</html>
    `;

    // Send emails in batches
    let successCount = 0;
    let failCount = 0;
    const batchSize = 10;
    const delayBetweenBatches = 1000; // 1 second delay between batches

    const finalSubject = custom_subject || `[TravelVN] Ưu đãi đặc biệt: Giảm ${formatDiscount()} cho chuyến đi tiếp theo!`;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      const promises = batch.map(async (user) => {
        try {
          await sendMail(
            user.email,
            finalSubject,
            generateHtmlContent(user.full_name)
          );
          successCount++;
        } catch (error) {
          console.error(`Failed to send email to ${user.email}:`, error);
          failCount++;
        }
      });

      await Promise.all(promises);

      // Wait before next batch (if not last batch)
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    res.json({ 
      success: true, 
      message: `Đã gửi broadcast thành công`,
      stats: {
        total: users.length,
        success: successCount,
        failed: failCount
      }
    });

  } catch (err) {
    console.error('Error broadcasting discount email:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
