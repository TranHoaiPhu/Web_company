const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const crypto = require('crypto');
const querystring = require('qs');
const { authenticateToken } = require('../middleware/authJwt');
const sendMail = require('../sendemail');
const fs = require('fs');
const path = require('path');
const html_to_pdf = require('html-pdf-node');

// VNPay Configuration (load from .env)
const vnpayConfig = {
  vnp_TmnCode: process.env.VNP_TMN_CODE,
  vnp_HashSecret: process.env.VNP_HASH_SECRET,
  vnp_Url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_ReturnUrl: process.env.VNP_RETURN_URL || 'https://ai-trip-system-frontend-40205731279.us-central1.run.app/payment/vnpay/callback'
};

// MoMo Configuration
const momoConfig = {
  partnerCode: process.env.MOMO_PARTNER_CODE,
  accessKey: process.env.MOMO_ACCESS_KEY,
  secretKey: process.env.MOMO_SECRET_KEY,
  endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
  returnUrl: process.env.MOMO_RETURN_URL || 'https://ai-trip-system-frontend-40205731279.us-central1.run.app/payment/momo/callback',
  notifyUrl: process.env.MOMO_NOTIFY_URL || 'http://localhost:5000/api/payments/momo/notify'
};

// ZaloPay Configuration
const zaloPayConfig = {
  appId: process.env.ZALOPAY_APP_ID,
  key1: process.env.ZALOPAY_KEY1,
  key2: process.env.ZALOPAY_KEY2,
  endpoint: process.env.ZALOPAY_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/create',
  callbackUrl: process.env.ZALOPAY_CALLBACK_URL || 'http://localhost:5000/api/payments/zalopay/callback'
};

// ==================== VNPay ====================

// POST: Tạo payment URL cho VNPay
router.post('/vnpay/create', authenticateToken, async (req, res) => {
  try {
    const { orderId, bankCode, returnUrl } = req.body;
    const userId = req.user.id;

    // Get order details
    const orderQuery = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, userId]
    );

    if (orderQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orderQuery.rows[0];

    if (order.payment_status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Order has already been paid'
      });
    }

    // Create payment record
    const paymentCode = `PAY${Date.now()}`;
    const paymentInsert = await pool.query(
      `INSERT INTO payments (payment_code, order_id, payment_method, amount, payment_status, bankcode)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [paymentCode, orderId, 'VNPAY', order.total_price, 'UNPAID', bankCode || null]
    );

    const paymentId = paymentInsert.rows[0].id;

    // Create VNPay payment URL
    const date = new Date();
    const createDate = date.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const orderId_vnpay = `${order.order_code}_${paymentId}`;
    const amount = Math.round(order.total_price);
    const locale = 'vn';
    const currCode = 'VND';
    const vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnpayConfig.vnp_TmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: currCode,
      vnp_TxnRef: orderId_vnpay,
      vnp_OrderInfo: `Thanh toan don hang ${order.order_code}`,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100, // VNPay requires amount in smallest currency unit
      vnp_ReturnUrl: returnUrl || vnpayConfig.vnp_ReturnUrl,
      vnp_IpAddr: req.ip || '127.0.0.1',
      vnp_CreateDate: createDate
    };

    if (bankCode) {
      vnp_Params.vnp_BankCode = bankCode;
    }

    // Sort params
    const sortedParams = sortObject(vnp_Params);
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    sortedParams.vnp_SecureHash = signed;

    const paymentUrl = vnpayConfig.vnp_Url + '?' + querystring.stringify(sortedParams, { encode: false });

    res.json({
      success: true,
      data: {
        paymentUrl,
        paymentCode,
        orderId: order.id,
        orderCode: order.order_code
      }
    });
  } catch (error) {
    console.error('Error creating VNPay payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating VNPay payment',
      error: error.message
    });
  }
});

// GET: VNPay callback
router.get('/vnpay/callback', async (req, res) => {
  const client = await pool.connect();
  try {
    let vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
      const orderId_vnpay = vnp_Params['vnp_TxnRef'];
      const rspCode = vnp_Params['vnp_ResponseCode'];
      const transactionNo = vnp_Params['vnp_TransactionNo'];
      const amount = parseInt(vnp_Params['vnp_Amount']) / 100;

      await client.query('BEGIN');

      // Extract payment ID from vnp_TxnRef
      const parts = orderId_vnpay.split('_');
      const paymentId = parts[parts.length - 1];

      if (rspCode === '00') {
        // Payment successful
        await client.query(
          `UPDATE payments 
           SET payment_status = 'PAID', transaction_code = $1, paid_at = CURRENT_TIMESTAMP,
               gateway_response = $2
           WHERE id = $3`,
          [transactionNo, JSON.stringify(vnp_Params), paymentId]
        );

        // Update order
        const paymentResult = await client.query('SELECT order_id FROM payments WHERE id = $1', [paymentId]);
        const orderId = paymentResult.rows[0].order_id;

        await client.query(
          `UPDATE orders 
           SET payment_status = 'PAID', payment_method = 'VNPAY', status = 'CONFIRMED', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [orderId]
        );

        await client.query('COMMIT');

        res.json({
          success: true,
          message: 'Payment successful',
          data: { rspCode, transactionNo }
        });
      } else {
        // Payment failed
        await client.query(
          `UPDATE payments 
           SET payment_status = 'UNPAID', gateway_response = $1
           WHERE id = $2`,
          [JSON.stringify(vnp_Params), paymentId]
        );

        await client.query('COMMIT');

        res.json({
          success: false,
          message: 'Payment failed',
          data: { rspCode }
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing VNPay callback:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment callback',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// ==================== MoMo ====================

// POST: Tạo payment cho MoMo
router.post('/momo/create', authenticateToken, async (req, res) => {
  try {
    const { orderId, returnUrl } = req.body;
    const userId = req.user.id;

    // Get order details
    const orderQuery = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, userId]
    );

    if (orderQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orderQuery.rows[0];

    if (order.payment_status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Order has already been paid'
      });
    }

    // Create payment record
    const paymentCode = `PAY${Date.now()}`;
    const paymentInsert = await pool.query(
      `INSERT INTO payments (payment_code, order_id, payment_method, amount, payment_status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [paymentCode, orderId, 'MOMO', order.total_price, 'UNPAID']
    );

    const paymentId = paymentInsert.rows[0].id;

    // Create MoMo payment request
    const requestId = `${order.order_code}_${paymentId}`;
    const amount = Math.round(order.total_price).toString();
    const orderInfo = `Thanh toan don hang ${order.order_code}`;
    const requestType = 'captureWallet';
    const extraData = '';

    const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${momoConfig.notifyUrl}&orderId=${requestId}&orderInfo=${orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${returnUrl || momoConfig.returnUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto
      .createHmac('sha256', momoConfig.secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode: momoConfig.partnerCode,
      accessKey: momoConfig.accessKey,
      requestId: requestId,
      amount: amount,
      orderId: requestId,
      orderInfo: orderInfo,
      redirectUrl: returnUrl || momoConfig.returnUrl,
      ipnUrl: momoConfig.notifyUrl,
      extraData: extraData,
      requestType: requestType,
      signature: signature,
      lang: 'vi'
    };

    // Call MoMo API
    const https = require('https');
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const momoRequest = https.request(momoConfig.endpoint, options, (momoRes) => {
      let data = '';
      momoRes.on('data', (chunk) => {
        data += chunk;
      });
      momoRes.on('end', () => {
        const response = JSON.parse(data);
        if (response.resultCode === 0) {
          res.json({
            success: true,
            data: {
              paymentUrl: response.payUrl,
              paymentCode,
              orderId: order.id,
              orderCode: order.order_code
            }
          });
        } else {
          res.status(400).json({
            success: false,
            message: 'Error creating MoMo payment',
            error: response.message
          });
        }
      });
    });

    momoRequest.on('error', (error) => {
      console.error('MoMo request error:', error);
      res.status(500).json({
        success: false,
        message: 'Error connecting to MoMo',
        error: error.message
      });
    });

    momoRequest.write(JSON.stringify(requestBody));
    momoRequest.end();

  } catch (error) {
    console.error('Error creating MoMo payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating MoMo payment',
      error: error.message
    });
  }
});

// POST: MoMo callback/notify
router.post('/momo/notify', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature
    } = req.body;

    // Verify signature
    const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const expectedSignature = crypto
      .createHmac('sha256', momoConfig.secretKey)
      .update(rawSignature)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    await client.query('BEGIN');

    // Extract payment ID
    const parts = orderId.split('_');
    const paymentId = parts[parts.length - 1];

    if (resultCode === 0) {
      // Payment successful
      await client.query(
        `UPDATE payments 
         SET payment_status = 'PAID', transaction_code = $1, paid_at = CURRENT_TIMESTAMP,
             gateway_response = $2
         WHERE id = $3`,
        [transId.toString(), JSON.stringify(req.body), paymentId]
      );

      // Update order
      const paymentResult = await client.query('SELECT order_id FROM payments WHERE id = $1', [paymentId]);
      const orderIdNum = paymentResult.rows[0].order_id;

      await client.query(
        `UPDATE orders 
         SET payment_status = 'PAID', payment_method = 'MOMO', status = 'CONFIRMED', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [orderIdNum]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Payment successful'
      });
    } else {
      // Payment failed
      await client.query(
        `UPDATE payments 
         SET payment_status = 'UNPAID', gateway_response = $1
         WHERE id = $2`,
        [JSON.stringify(req.body), paymentId]
      );

      await client.query('COMMIT');

      res.json({
        success: false,
        message: 'Payment failed'
      });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing MoMo callback:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment callback',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// ==================== Common Payment Routes ====================

// POST: Update payment status from VNPay callback (called from Next.js frontend)
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { order_code, payment_method, amount, transaction_code, gateway_response } = req.body;
    
    console.log('Payment update request:', { order_code, payment_method, amount, transaction_code });

    if (!order_code) {
      return res.status(400).json({
        success: false,
        message: 'Missing order_code'
      });
    }

    await client.query('BEGIN');

    // Get order by order_code
    const orderQuery = await client.query(
      'SELECT * FROM orders WHERE order_code = $1',
      [order_code]
    );

    if (orderQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orderQuery.rows[0];

    // Check if payment already exists for this order
    const existingPayment = await client.query(
      'SELECT * FROM payments WHERE order_id = $1',
      [order.id]
    );

    let paymentId;
    if (existingPayment.rows.length > 0) {
      // Update existing payment
      const updateResult = await client.query(
        `UPDATE payments 
         SET payment_status = 'PAID', 
             transaction_code = $1, 
             paid_at = CURRENT_TIMESTAMP,
             gateway_response = $2,
             bankcode = $3
         WHERE order_id = $4
         RETURNING *`,
        [transaction_code, JSON.stringify(gateway_response), gateway_response?.vnp_BankCode || null, order.id]
      );
      paymentId = updateResult.rows[0].id;
    } else {
      // Create new payment record
      const paymentCode = `PAY${Date.now()}`;
      const insertResult = await client.query(
        `INSERT INTO payments (payment_code, order_id, payment_method, amount, payment_status, transaction_code, bankcode, paid_at, gateway_response)
         VALUES ($1, $2, $3, $4, 'PAID', $5, $6, CURRENT_TIMESTAMP, $7)
         RETURNING *`,
        [paymentCode, order.id, payment_method, amount, transaction_code, gateway_response?.vnp_BankCode || null, JSON.stringify(gateway_response)]
      );
      paymentId = insertResult.rows[0].id;
    }

    // Update order status
    await client.query(
      `UPDATE orders 
       SET payment_status = 'PAID', 
           payment_method = $1, 
           status = 'CONFIRMED', 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [payment_method, order.id]
    );

    await client.query('COMMIT');

    // Get payment info for response
    const paymentResult = await client.query(
      'SELECT * FROM payments WHERE id = $1',
      [paymentId]
    );
    const payment = paymentResult.rows[0];

    // Get location name for email
    const locationQuery = await pool.query(
      `SELECT l.name as location_name 
       FROM tours t 
       LEFT JOIN locations l ON t.location_id = l.id 
       WHERE t.id = $1`,
      [order.tour_id]
    );
    const locationName = locationQuery.rows[0]?.location_name || 'Chưa xác định';

    // Get participants for email
    const participantsQuery = await pool.query(
      'SELECT * FROM order_participants WHERE order_id = $1',
      [order.id]
    );
    const participants = participantsQuery.rows;

    // Get user email as fallback if contact_email is invalid
    let recipientEmail = order.contact_email;
    const isValidEmail = (email) => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    if (!isValidEmail(recipientEmail)) {
      // Get email from user account
      const userQuery = await pool.query(
        'SELECT email FROM users WHERE id = $1',
        [order.user_id]
      );
      if (userQuery.rows.length > 0 && isValidEmail(userQuery.rows[0].email)) {
        recipientEmail = userQuery.rows[0].email;
        console.log('Using user account email instead of contact_email:', recipientEmail);
      }
    }

    // Send confirmation email to customer asynchronously to avoid blocking the response
    (async () => {
      try {
        const templatePath = path.join(__dirname, '../templates/booking-confirmation.html');
        if (!fs.existsSync(templatePath)) {
          console.warn('Email template not found at:', templatePath);
          return;
        }
        
        let emailTemplate = fs.readFileSync(templatePath, 'utf8');
  
        // Format currency
        const formatPrice = (price) => parseFloat(price).toLocaleString('vi-VN') + '₫';
  
        // Format date and time to Vietnam timezone
        const formatDate = (date) => {
          const d = new Date(date);
          return d.toLocaleString('vi-VN', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'Asia/Ho_Chi_Minh'
          });
        };
  
        // Build participants list HTML
        let participantsHtml = '';
        if (participants && participants.length > 0) {
          participantsHtml = participants.map((p, index) => {
            const typeLabel = p.participant_type === 'ADULT' ? 'Người lớn' : p.participant_type === 'CHILD' ? 'Trẻ em' : 'Em bé';
            const genderLabel = p.gender === 'MALE' ? 'Nam' : p.gender === 'FEMALE' ? 'Nữ' : 'Khác';
            return `
              <div style="background: #fff; padding: 10px 15px; border-radius: 8px; margin-bottom: 8px; border: 1px solid #e8e8e8;">
                <strong style="color: #333;">${index + 1}. ${p.full_name}</strong>
                <span style="color: #888; font-size: 12px; margin-left: 10px;">(${typeLabel} - ${genderLabel})</span>
              </div>
            `;
          }).join('');
        }
  
        // Replace simple placeholders
        emailTemplate = emailTemplate
          .replace(/{{contact_name}}/g, order.contact_name || 'Quý khách')
          .replace(/{{website_logo}}/g, `${process.env.FRONTEND_URL || 'https://ai-trip-system-frontend-40205731279.us-central1.run.app'}/logo/travelVN.png`)
          .replace(/{{order_code}}/g, order.order_code)
          .replace(/{{tour_name}}/g, order.tour_name || 'Tour du lịch')
          .replace(/{{location_name}}/g, locationName)
          .replace(/{{start_date}}/g, formatDate(order.start_date))
          .replace(/{{end_date}}/g, formatDate(order.end_date))
          .replace(/{{adult_quantity}}/g, order.adult_quantity || 0)
          .replace(/{{contact_phone}}/g, order.contact_phone || '')
          .replace(/{{contact_email}}/g, order.contact_email || '')
          .replace(/{{subtotal}}/g, formatPrice(order.subtotal || order.total_price))
          .replace(/{{total_price}}/g, formatPrice(order.total_price))
          .replace(/{{payment_method}}/g, payment_method || 'VNPay')
          .replace(/{{payment_status}}/g, 'Đã thanh toán')
          .replace(/{{payment_status_color}}/g, '#27ae60')
          .replace(/{{order_detail_url}}/g, `${process.env.FRONTEND_URL || 'https://ai-trip-system-frontend-40205731279.us-central1.run.app'}/order/${order.order_code}`);
  
        // Handle multi-line conditional blocks
        // 1. Discount amount
        emailTemplate = emailTemplate.replace(/{{#if discount_amount}}([\s\S]*?){{\/if}}/g, (match, p1) => {
          return parseFloat(order.discount_amount) > 0 ? 
            p1.replace(/{{discount_amount}}/g, formatPrice(order.discount_amount)) : '';
        });
  
        // 2. Child quantity
        emailTemplate = emailTemplate.replace(/{{#if child_quantity}}([\s\S]*?){{\/if}}/g, (match, p1) => {
          return order.child_quantity > 0 ? p1.replace(/{{child_quantity}}/g, order.child_quantity) : '';
        });
  
        // 3. Infant quantity
        emailTemplate = emailTemplate.replace(/{{#if infant_quantity}}([\s\S]*?){{\/if}}/g, (match, p1) => {
          return order.infant_quantity > 0 ? p1.replace(/{{infant_quantity}}/g, order.infant_quantity) : '';
        });
  
        // 4. Participants
        emailTemplate = emailTemplate.replace(/{{#if participants}}([\s\S]*?){{\/if}}/g, (match, p1) => {
          return participants && participants.length > 0 ? p1.replace(/{{participants_list}}/g, participantsHtml) : '';
        });
  
        // 5. Special requests
        emailTemplate = emailTemplate.replace(/{{#if special_requests}}([\s\S]*?){{\/if}}/g, (match, p1) => {
          return order.special_requests ? p1.replace(/{{special_requests}}/g, order.special_requests) : '';
        });
  
        // Only send email if we have a valid recipient
        if (isValidEmail(recipientEmail)) {
          // Generate PDF
          const options = { 
            format: 'A4',
            margin: { top: 20, right: 20, bottom: 20, left: 20 }
          };
          const file = { content: emailTemplate };
          
          try {
            const pdfBuffer = await html_to_pdf.generatePdf(file, options);
            
            await sendMail(
              recipientEmail,
              `Thanh toán thành công - Đơn hàng ${order.order_code}`,
              emailTemplate,
              [
                {
                  filename: `TravelVN_Invoice_${order.order_code}.pdf`,
                  content: pdfBuffer
                }
              ]
            );
            console.log('Payment confirmation email with PDF attachment sent to:', recipientEmail);
          } catch (pdfError) {
            console.error('Error generating PDF, sending email without attachment:', pdfError.message);
            await sendMail(
              recipientEmail,
              `Thanh toán thành công - Đơn hàng ${order.order_code}`,
              emailTemplate
            );
          }
        } else {
          console.log('No valid email found, skipping email notification');
        }
      } catch (emailError) {
        console.error('Failed to send payment confirmation email:', emailError.message);
      }
    })();

    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: {
        paymentInfo: {
          id: payment.id,
          payment_code: payment.payment_code,
          payment_method: payment.payment_method,
          amount: parseFloat(payment.amount),
          payment_status: payment.payment_status,
          transaction_code: payment.transaction_code,
          bankcode: payment.bankcode,
          paid_at: payment.paid_at
        },
        infoBooking: {
          order_code: order.order_code,
          name: order.tour_name || 'Tour du lịch',
          adult_quantity: order.adult_quantity,
          child_quantity: order.child_quantity,
          infant_quantity: order.infant_quantity,
          total_price: parseFloat(order.total_price)
        }
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// GET: Get payment details
router.get('/:paymentCode', authenticateToken, async (req, res) => {
  try {
    const { paymentCode } = req.params;
    const userId = req.user.id;

    const query = `
      SELECT 
        p.*,
        o.order_code,
        o.user_id
      FROM payments p
      INNER JOIN orders o ON p.order_id = o.id
      WHERE p.payment_code = $1
    `;

    const result = await pool.query(query, [paymentCode]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const payment = result.rows[0];

    // Check ownership (or admin)
    if (payment.user_id !== userId && req.user.role_id !== 2) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        id: payment.id,
        paymentCode: payment.payment_code,
        orderCode: payment.order_code,
        paymentMethod: payment.payment_method,
        amount: parseFloat(payment.amount),
        paymentStatus: payment.payment_status,
        transactionCode: payment.transaction_code,
        bankCode: payment.bankcode,
        paidAt: payment.paid_at,
        createdAt: payment.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment',
      error: error.message
    });
  }
});

// Helper function to sort object
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach(key => {
    sorted[key] = obj[key];
  });
  return sorted;
}

module.exports = router;
