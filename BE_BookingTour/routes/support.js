const express = require('express');
const router = express.Router();
const sendMail = require('../sendemail');

// POST /contact - Gửi email hỗ trợ
router.post('/contact', async (req, res) => {
  try {
    const { order, message } = req.body;
    
    if (!order || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu thông tin bắt buộc' 
      });
    }

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "omgniceten@gmail.com";
    const subject = `Yêu cầu hỗ trợ từ khách hàng - Đơn hàng ${order.order_code}`;
    const htmlContent = `
      <h2>Yêu cầu hỗ trợ từ khách hàng</h2>
      <p><b>Mã đơn hàng:</b> ${order.order_code}</p>
      <p><b>Khách hàng:</b> ${order.contact_name} (${order.contact_email}, ${order.contact_phone})</p>
      <p><b>Nội dung hỗ trợ:</b></p>
      <div style="background:#f8f8f8;padding:12px;border-radius:8px;margin-bottom:12px;">${message}</div>
      <hr/>
      <p><b>Thông tin tour:</b> ${order.tour_name} (${order.start_date} - ${order.end_date})</p>
      <p><b>Thành tiền:</b> ${order.total_price}₫</p>
    `;

    await sendMail(ADMIN_EMAIL, subject, htmlContent);

    // Gửi bản sao cho khách hàng nếu có email
    if (order.contact_email) {
      const customerSubject = `Xác nhận tiếp nhận yêu cầu hỗ trợ - Đơn hàng ${order.order_code}`;
      const customerHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #2563eb; margin-top: 0;">Xin chào ${order.contact_name},</h2>
          <p>Chúng tôi đã nhận được yêu cầu hỗ trợ/khiếu nại của bạn về đơn hàng <b>${order.order_code}</b>.</p>
          <p><b>Nội dung của bạn:</b></p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
            ${message}
          </div>
          <p style="margin-top: 20px;">Đội ngũ hỗ trợ của TravelVN sẽ xem xét và phản hồi cho bạn trong thời gian sớm nhất (thường trong vòng 24 giờ làm việc).</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">Đây là email tự động, vui lòng không trả lời trực tiếp email này.</p>
        </div>
      `;
      await sendMail(order.contact_email, customerSubject, customerHtml);
    }

    res.json({
      success: true,
      message: 'Đã gửi yêu cầu hỗ trợ thành công'
    });

  } catch (error) {
    console.error('Support email error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi email hỗ trợ',
      error: error.message
    });
  }
});

module.exports = router;
