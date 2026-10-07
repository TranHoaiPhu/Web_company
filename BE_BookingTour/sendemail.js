const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'omgniceten@gmail.com',
    pass: process.env.EMAIL_PASS || 'kkptczknvlpyqism' 
  }
});

async function sendMail(to, subject, htmlContent, attachments = []) {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'omgniceten@gmail.com',
    to,
    subject,
    html: htmlContent,
    attachments: attachments
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', result.messageId);
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
  }
}

module.exports = sendMail;
