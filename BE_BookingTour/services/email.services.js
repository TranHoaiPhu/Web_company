/*
const sendVerificationEmail = async (userEmail, token) => {
    const verifyUrl = //http://yourdomain.com/api/auth/verify-email?token=${token};

    mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: "Xác thực tài khoản",
        html: `<p>Nhấn vào liên kết sau để xác thực tài khoản:</p>
               <a href="${verifyUrl}">${verifyUrl}</a>`,
    };

    await transporter.sendMail(mailOptions);
};
*/

/*
const nodemailer = require('nodemailer');
require('dotenv').config();

const sendVerificationEmail = async (email, token) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        port: 587,
        host: "smtp-relay.brevo.com",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Email Verification',
        text: `Click this link to verify your email: ${process.env.BASE_URL}/api/auth/verify/${token}`
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };
*/

// services/email.service.js
// const nodemailer = require('nodemailer');

/*
const config = require('../config');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
        service: "gmail",
        port: 587,
        host: "smtp-relay.brevo.com",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
    });
  }
  
  async sendEmail(to, subject, text, html) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        html
      };
      
      const info = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  async sendOTPEmail(email, otp) {
    const subject = 'Mã xác thực OTP của bạn';
    const text = `Mã xác thực của bạn là: ${otp}. Mã có hiệu lực trong 5 phút.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
        <h2 style="color: #333;">Mã xác thực của bạn</h2>
        <p>Xin chào,</p>
        <p>Chúng tôi đã nhận được yêu cầu xác thực từ bạn. Vui lòng sử dụng mã OTP sau để hoàn tất quá trình:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
          ${otp}
        </div>
        <p>Mã này có hiệu lực trong 5 phút.</p>
        <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
        <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
      </div>
    `;
    
    return await this.sendEmail(email, subject, text, html);
  }
}

module.exports = new EmailService();

*/

require("dotenv").config();

// If using Gmail instead, use this configuration:
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS, // Use an app password if 2FA is enabled
//   },
// });

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "omgniceten@gmail.com",
    pass: process.env.EMAIL_PASS || "kkptczknvlpyqism",
  },
});

// Send Email for Verify new Account
// Send Email for Verify new Account
async function sendOtpVerifyAccount(to, otpInfo) {
  try {
    const otpCode = otpInfo.otpCode;

    const htmlContent = `
      <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${process.env.FRONTEND_URL || 'https://ai-trip-system-frontend-40205731279.us-central1.run.app'}/logo/travelVN.png" alt="TravelVN" style="height: 60px; width: auto;">
        </div>
        <h2 style="color: #3498db; text-align: center;">Chào mừng bạn đến với <strong>TravelVN</strong>!</h2>
        <p>Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã OTP bên dưới để xác minh tài khoản của bạn:</p>
        <h1 style="text-align: center; color: #3498db; letter-spacing: 4px;">${otpCode}</h1>
        <p>Mã OTP này có hiệu lực trong vòng <strong>30 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
        <p>Nếu bạn không thực hiện đăng ký, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi để được hỗ trợ.</p>
        <hr>
        <p style="font-size: 12px; color: #999;">Cảm ơn bạn đã chọn <strong>TravelVN</strong>. Chúc bạn một ngày tốt lành!</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || "omgniceten@gmail.com",
      to,
      subject: "[TravelVN] - Mã OTP xác minh tài khoản",
      text: `Mã OTP xác minh tài khoản của bạn là ${otpCode}. Mã có hiệu lực trong 10 phút.`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

// Send email Content for Reset_password
// Send Email for Verify new Account
async function sendOtpResetPW(to, otpInfo) {
  try {
    const otpCode = otpInfo.otpCode;

    const htmlContent = `
      <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${process.env.FRONTEND_URL || 'https://ai-trip-system-frontend-40205731279.us-central1.run.app'}/logo/travelVN.png" alt="TravelVN" style="height: 60px; width: auto;">
        </div>
        <h2 style="color: #e67e22; text-align: center;">Hello,</h2>
        <p>You or someone else has requested to reset the password for your account at <strong>TravelVN</strong>.</p>
        <p>Here is the OTP code to verify your request:</p>
        <h1 style="text-align: center; color: #e67e22; letter-spacing: 4px;">${otpCode}</h1>
        <p>The OTP code is valid for <strong>1 minutes</strong>. Please do not share this code with anyone.</p>
        <p>If you did not make this request, please ignore this email or contact our support team.</p>
        <hr>
        <p style="font-size: 12px; color: #999;">Thank you for using <strong>TravelVN</strong> services.</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || "omgniceten@gmail.com",
      to,
      subject: "[TravelVN] - Password Reset OTP Code",
      text: `Your OTP code is ${otpCode}. It is valid for 1 minutes.`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}


async function sendEmailChangePassword(to) {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 40px 30px 0 30px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <div style="text-align: center; padding-bottom: 30px;">
                      <img src="${process.env.FRONTEND_URL || 'http://localhost:3000'}/logo/travelVN.png" alt="TravelVN" style="height: 80px; width: auto;">
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <h1 style="color: #333333; font-size: 24px; margin: 0 0 20px 0; text-align: center;">Password Change Notification</h1>
                    <p style="color: #555555; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">Hello,</p>
                    <p style="color: #555555; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">We're reaching out to let you know that your password for <strong>TravelVN</strong> has been successfully changed.</p>
                    <p style="color: #555555; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">If you requested this change, you can now log in with your new password. No further action is required.</p>
                    <p style="color: #555555; font-size: 16px; line-height: 24px; margin: 0 0 20px 0; background-color: #fef9e7; padding: 15px; border-left: 4px solid #f39c12; border-radius: 4px;">
                      <strong>Important:</strong> If you did NOT request this password change, please contact our support team immediately at <a href="mailto:support@travelvn.com" style="color: #e67e22; text-decoration: none;">support@travelvn.com</a>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 20px 0; border-top: 1px solid #eeeeee; color: #777777; font-size: 14px; line-height: 22px; text-align: center;">
                    <p style="margin: 0 0 10px 0;">Need help? Contact our support team</p>
                    <a href="mailto:support@travelvn.com" style="color: #e67e22; text-decoration: none;">support@travelvn.com</a>
                  </td>
                </tr>
                <tr>
                  <td style="color: #999999; font-size: 12px; line-height: 18px; text-align: center; padding-top: 10px;">
                    <p style="margin: 0;">© 2025 TravelVN. All rights reserved.</p>
                    <p style="margin: 10px 0 0 0;">
                      <a href="#" style="color: #999999; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
                      <a href="#" style="color: #999999; text-decoration: none; margin: 0 10px;">Terms of Service</a>
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

    const mailOptions = {
      from: process.env.EMAIL_USER || "omgniceten@gmail.com",
      to,
      subject: "[TravelVN] - Password Change Notification",
      text: "Your password has been changed. If you did not request the password change, please contact our support team immediately at support@travelvn.com.",
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
/**
 * Gửi email từ form liên hệ
 * @param {Object} formData - Thông tin form gồm name, email, message
 * @param {Function} [callback] - Callback optional (error, info)
 */
const sendContact = async (formData, callback) => {
  const { fullname, email, phoneNumber, message, subject, attachment } =
    formData || {};

  // Kiểm tra dữ liệu đầu vào
  if (!fullname || !email || !message) {
    const error = new Error("Missing required form fields");
    if (callback) return callback(error, null);
    else throw error;
  }

  const mailOptions = {
    from: `"TravelVN Support" <${process.env.EMAIL_USER || "omgniceten@gmail.com"}>`,
    to: process.env.ADMIN_EMAIL || "omgniceten@gmail.com",
    subject: `Feedback from ${fullname} (${email})`,
    text: `
New contact form submission:

Name: ${fullname}
Email: ${email}
${phoneNumber ? `Phone: ${phoneNumber}` : ''}
${subject ? `Subject: ${subject}` : ''}

Message:
${message}
  `,
    html: `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>New Contact Submission</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  
  <!-- Wrapper Table for Email Clients -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f7fa;">
    <tr>
      <td style="padding: 20px 10px;">
        
        <!-- Main Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e88e5, #42a5f5); padding: 32px 24px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 500; letter-spacing: 0.5px; line-height: 1.3;">
                New Contact Submission
              </h2>
              <p style="color: #e3f2fd; margin: 8px 0 0; font-size: 14px; font-weight: 400;">
                Received from your website contact form
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 24px;">
              
              <!-- Contact Information Table -->
              <table role="presentation" cellpadding="12" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="font-weight: 600; color: #212121; width: 120px; font-size: 15px; vertical-align: top; padding: 12px 12px 12px 0;">
                    Name:
                  </td>
                  <td style="color: #424242; font-size: 15px; padding: 12px 0;">
                    ${fullname}
                  </td>
                </tr>
                <tr>
                  <td style="font-weight: 600; color: #212121; font-size: 15px; vertical-align: top; padding: 12px 12px 12px 0;">
                    Email:
                  </td>
                  <td style="padding: 12px 0;">
                    <a href="mailto:${email}" style="color: #1e88e5; text-decoration: none; font-size: 15px; font-weight: 500;">
                      ${email}
                    </a>
                  </td>
                </tr>
                ${phoneNumber ? `
                <tr>
                  <td style="font-weight: 600; color: #212121; font-size: 15px; vertical-align: top; padding: 12px 12px 12px 0;">
                    Phone:
                  </td>
                  <td style="color: #424242; font-size: 15px; padding: 12px 0;">
                    <a href="tel:${phoneNumber}" style="color: #1e88e5; text-decoration: none; font-weight: 500;">
                      ${phoneNumber}
                    </a>
                  </td>
                </tr>
                ` : ''}
                ${subject ? `
                <tr>
                  <td style="font-weight: 600; color: #212121; font-size: 15px; vertical-align: top; padding: 12px 12px 12px 0;">
                    Subject:
                  </td>
                  <td style="color: #424242; font-size: 15px; padding: 12px 0;">
                    ${subject}
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="font-weight: 600; color: #212121; vertical-align: top; font-size: 15px; padding: 12px 12px 12px 0;">
                    Message:
                  </td>
                  <td style="padding: 12px 0;">
                    <div style="background: #fafafa; border-radius: 10px; padding: 16px; color: #37474f; font-size: 14px; line-height: 1.8; white-space: pre-line; border: 1px solid #eceff1; word-wrap: break-word; overflow-wrap: break-word;">
                      ${message}
                    </div>
                  </td>
                </tr>
              </table>

              ${attachment ? `
              <!-- Attachment Section -->
              <div style="margin-top: 24px; background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 10px; padding: 16px;">
                <div style="color: #1565c0; font-size: 14px; font-weight: 600; margin-bottom: 4px;">
                  📎 Attachment:
                </div>
                <div style="color: #1976d2; font-size: 14px;">
                  ${attachment.originalname}
                </div>
              </div>
              ` : ''}

            </td>
          </tr>

          <!-- Action Buttons -->
          <tr>
            <td style="padding: 0 24px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <!--[if mso]>
                  <td style="width: 48%; text-align: center;">
                  <![endif]-->
                  <td style="width: 48%; text-align: center; display: inline-block; vertical-align: top;">
                    <a href="mailto:${email}" style="background: #1e88e5; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; min-width: 100px; text-align: center;">
                      Reply
                    </a>
                  </td>
                  <!--[if mso]>
                  </td>
                  <td style="width: 4%;"></td>
                  <td style="width: 48%; text-align: center;">
                  <![endif]-->
                  <td style="width: 48%; text-align: center; display: inline-block; vertical-align: top;">
                    ${phoneNumber ? `<a href="tel:${phoneNumber}" style="background: #4caf50; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; min-width: 100px; text-align: center;">Call</a>` : `<a href="#" style="background: #6c757d; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; min-width: 100px; text-align: center;">Archive</a>`}
                  </td>
                  <!--[if mso]>
                  </td>
                  <![endif]-->
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #eceff1; padding: 24px; text-align: center; border-top: 1px solid #dfe4ea;">
              <p style="margin: 0; font-size: 12px; color: #78909c; font-weight: 400;">
                This email was sent from the contact form on your website.
              </p>
              <p style="margin: 8px 0 0; font-size: 12px;">
                <a href="https://yourwebsite.com" style="color: #1e88e5; text-decoration: none; font-weight: 500;">Visit Website</a>
              </p>
              <div style="margin-top: 12px; font-size: 11px; color: #9e9e9e;">
                Received on ${new Date().toLocaleString('vi-VN', { 
                  timeZone: 'Asia/Ho_Chi_Minh',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </td>
          </tr>

        </table>
        
      </td>
    </tr>
  </table>

</body>
</html>
    `,
    attachments: attachment
      ? [
          {
            filename: attachment.originalname,
            content: attachment.buffer,
            contentType: attachment.mimetype,
          },
        ]
      : [],
  };

  try {
    console.log("[sendContact] Sending email...");
    const info = await transporter.sendMail(mailOptions);
    console.log("[sendContact] Email sent successfully!");
    console.log("[sendContact] Message ID:", info.messageId);

    if (callback) return callback(null, info);
    return info;
  } catch (error) {
    console.error("[sendContact] ❌ Failed to send email:", error);
    if (callback) return callback(error, null);
    throw error;
  }
};
/**
 * Send tour reminder email to customer
 */
async function sendTourReminderEmail(data) {
  try {
    const {
      to,
      customerName,
      tourTitle,
      tourId,
      startDate,
      endDate,
      departureLocation,
      numberOfPeople,
      totalPrice,
      orderCode,
      hoursUntil,
      daysUntil,
      reminderType
    } = data;

    // Format dates
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Format currency
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount);
    };

    // Determine reminder message based on time
    let reminderMessage = '';
    let urgencyColor = '#1e88e5';
    
    if (daysUntil >= 2) {
      reminderMessage = `Chuyến đi của bạn sẽ bắt đầu trong ${daysUntil} ngày`;
      urgencyColor = '#4caf50';
    } else if (daysUntil === 1) {
      reminderMessage = `Chuyến đi của bạn sẽ bắt đầu vào ngày mai`;
      urgencyColor = '#ff9800';
    } else if (hoursUntil >= 12) {
      reminderMessage = `Chuyến đi của bạn sẽ bắt đầu trong ${hoursUntil} giờ`;
      urgencyColor = '#ff9800';
    } else {
      reminderMessage = `Chuyến đi của bạn sắp bắt đầu trong ${hoursUntil} giờ`;
      urgencyColor = '#f44336';
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nhắc nhở chuyến đi - ${tourTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4; line-height: 1.6;">
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td style="padding: 40px 20px;">
        
        <!-- Main Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e88e5, #1976d2); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                TravelVN
              </h1>
              <p style="color: #e3f2fd; margin: 8px 0 0; font-size: 14px;">Nhắc nhở chuyến đi</p>
            </td>
          </tr>

          <!-- Urgency Notice -->
          <tr>
            <td style="background: ${urgencyColor}; padding: 16px 30px; text-align: center;">
              <p style="color: #ffffff; margin: 0; font-size: 16px; font-weight: 500;">
                ${reminderMessage}
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Greeting -->
              <p style="color: #333333; font-size: 16px; margin: 0 0 24px;">
                Xin chào <strong>${customerName}</strong>,
              </p>
              <p style="color: #666666; font-size: 15px; margin: 0 0 32px;">
                Đây là lời nhắc nhở về chuyến du lịch sắp tới của bạn. Hãy chuẩn bị hành trang để có một chuyến đi thật tuyệt vời!
              </p>

              <!-- Tour Title -->
              <h2 style="color: #1e88e5; margin: 0 0 24px; font-size: 20px; font-weight: 600; padding-bottom: 12px; border-bottom: 2px solid #e0e0e0;">
                ${tourTitle}
              </h2>
              
              <!-- Tour Details -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: #999999; font-size: 13px; width: 140px; vertical-align: top;">Điểm khởi hành</td>
                        <td style="color: #333333; font-size: 14px; font-weight: 500;">${departureLocation || 'Sẽ thông báo sau'}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: #999999; font-size: 13px; width: 140px; vertical-align: top;">Ngày khởi hành</td>
                        <td style="color: #333333; font-size: 14px; font-weight: 500;">${formatDate(startDate)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: #999999; font-size: 13px; width: 140px; vertical-align: top;">Ngày kết thúc</td>
                        <td style="color: #333333; font-size: 14px; font-weight: 500;">${formatDate(endDate)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: #999999; font-size: 13px; width: 140px; vertical-align: top;">Số hành khách</td>
                        <td style="color: #333333; font-size: 14px; font-weight: 500;">${numberOfPeople} người</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${orderCode ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: #999999; font-size: 13px; width: 140px; vertical-align: top;">Mã đơn hàng</td>
                        <td style="color: #333333; font-size: 14px; font-weight: 600; font-family: 'Courier New', monospace;">${orderCode}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 16px 0 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: #999999; font-size: 13px; width: 140px; vertical-align: top;">Tổng chi phí</td>
                        <td style="color: #1e88e5; font-size: 18px; font-weight: 700;">${formatCurrency(totalPrice)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Checklist -->
              <div style="background: #f9f9f9; border-radius: 6px; padding: 24px; margin-bottom: 32px;">
                <h3 style="color: #333333; margin: 0 0 16px; font-size: 16px; font-weight: 600;">
                  Danh sách chuẩn bị
                </h3>
                <ul style="color: #666666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Giấy tờ tùy thân (CMND/CCCD/Hộ chiếu)</li>
                  <li>Xác nhận đặt tour${orderCode ? ` (Mã: ${orderCode})` : ''}</li>
                  <li>Hành lý cá nhân và thuốc men cần thiết</li>
                  <li>Có mặt tại điểm tập trung trước 15-30 phút</li>
                  <li>Liên hệ hotline nếu có thay đổi hoặc khẩn cấp</li>
                </ul>
              </div>

              <!-- Action Buttons -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <a href="${process.env.FRONTEND_URL || 'https://ai-trip-system-frontend-40205731279.us-central1.run.app'}/tours/${tourId}" style="display: block; background: #1e88e5; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 6px; font-weight: 500; font-size: 15px; text-align: center;">
                      Xem chi tiết tour
                    </a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a href="${process.env.FRONTEND_URL || 'https://ai-trip-system-frontend-40205731279.us-central1.run.app'}/profile/bookings" style="display: block; background: #ffffff; color: #1e88e5; text-decoration: none; padding: 14px 24px; border-radius: 6px; font-weight: 500; font-size: 15px; text-align: center; border: 2px solid #1e88e5;">
                      Quản lý đặt chỗ
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Support Section -->
          <tr>
            <td style="background: #fafafa; padding: 30px; border-top: 1px solid #e0e0e0;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 16px; text-align: center;">
                <strong style="color: #333333;">Cần hỗ trợ?</strong>
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding: 6px 0;">
                    <a href="mailto:support@travelvn.com" style="color: #1e88e5; text-decoration: none; font-size: 14px;">
                      support@travelvn.com
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding: 6px 0;">
                    <a href="tel:+84123456789" style="color: #1e88e5; text-decoration: none; font-size: 14px;">
                      +84 123 456 789
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #333333; padding: 30px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #999999;">
                © 2025 TravelVN. All rights reserved.
              </p>
              <p style="margin: 0 0 16px; font-size: 12px; color: #888888;">
                Bạn nhận được email này vì đã đặt tour tại TravelVN
              </p>
              <div style="margin: 0;">
                <a href="#" style="color: #999999; text-decoration: none; margin: 0 12px; font-size: 12px;">Chính sách</a>
                <span style="color: #666666;">•</span>
                <a href="#" style="color: #999999; text-decoration: none; margin: 0 12px; font-size: 12px;">Điều khoản</a>
              </div>
            </td>
          </tr>

        </table>
        
      </td>
    </tr>
  </table>

</body>
</html>
    `;

    const mailOptions = {
      from: '"TravelVN" <support@travelvn.com>',
      to,
      subject: `Nhắc nhở: Chuyến đi "${tourTitle}" của bạn ${daysUntil >= 1 ? `sẽ bắt đầu trong ${daysUntil} ngày` : `sắp bắt đầu`}`,
      text: `
Xin chào ${customerName},

${reminderMessage}

THÔNG TIN CHUYẾN ĐI
────────────────────
Tour: ${tourTitle}
Khởi hành: ${formatDate(startDate)}
Kết thúc: ${formatDate(endDate)}
Điểm khởi hành: ${departureLocation || 'Sẽ thông báo sau'}
Số hành khách: ${numberOfPeople}
${orderCode ? `Mã đơn hàng: ${orderCode}` : ''}
Tổng chi phí: ${formatCurrency(totalPrice)}

DANH SÁCH CHUẨN BỊ
────────────────────
• Giấy tờ tùy thân (CMND/CCCD/Hộ chiếu)
• Xác nhận đặt tour${orderCode ? ` (Mã: ${orderCode})` : ''}
• Hành lý cá nhân và thuốc men cần thiết
• Có mặt tại điểm tập trung trước 15-30 phút
• Liên hệ hotline nếu có thay đổi hoặc khẩn cấp

HỖ TRỢ
────────────────────
Email: support@travelvn.com
Hotline: +84 123 456 789

Chúc bạn có chuyến đi thật tuyệt vời!

────────────────────
TravelVN Team
      `,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Tour reminder email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending tour reminder email:", error);
    throw error;
  }
}

module.exports = {
  sendOtpVerifyAccount,
  sendOtpResetPW,
  sendEmailChangePassword,
  sendContact,
  sendTourReminderEmail,
};
