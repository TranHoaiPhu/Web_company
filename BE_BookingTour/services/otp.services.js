
const bcrypt = require('bcrypt');
const pool = require('../config/database');

class OtpService {
  /**
   * Tạo mã OTP ngẫu nhiên
   * @param {Number} length - Độ dài của mã OTP
   * @returns {String} - Mã OTP
   */

  generateOtp(length = 6) {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  /**
   * Tạo và lưu mã OTP mới cho người dùng
   * @param {String} userId - ID của người dùng (UUID)
   * @param {String} purpose - Mục đích của OTP (login, reset_password, etc.)
   * @param {Number} expiresInMinutes - Thời gian hết hạn (phút)
   * @returns {Object} - Thông tin OTP
   */
  async createOtp(userId, purpose, expiresInMinutes = 30) {
    try {
      if (!userId) throw new Error("userId không được để trống");
  
      const otpCode = this.generateOtp();
      const hashedOtp = await bcrypt.hash(otpCode, 10);
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60000);
  
      console.log('[DEBUG] Bắt đầu tạo OTP:', { userId, purpose });
      // console.log('[DEBUG] OTP raw:', otpCode);
  
      const query = `
        INSERT INTO otps (user_id, otp_code, purpose, expires_at, used, created_at)
        VALUES ($1, $2, $3, $4, FALSE, NOW())
        RETURNING id, user_id, purpose, expires_at
      `;
      
      const result = await pool.query(query, [userId, hashedOtp, purpose, expiresAt]);
      const otpRecord = result.rows[0];

      console.log('[DEBUG] OTP đã lưu với ID:', otpRecord?.id);
  
      return {
        otpCode, // RAW code to send via email
        expiresAt,
        otpId: otpRecord.id
      };
    } catch (error) {
      console.error('[ERROR] Không thể tạo OTP:', {
        userId,
        purpose,
        message: error.message
      });
      throw new Error(`Lỗi khi tạo OTP: ${error.message}`);
    }
  }
  
  
  /**
   * Xác thực mã OTP
   * @param {String} userId - ID của người dùng
   * @param {String} otpCode - Mã OTP cần xác thực (RAW)
   * @param {String} purpose - Mục đích của OTP
   * @returns {Boolean} - true nếu OTP hợp lệ
   */
  async verifyOtp(userId, otpCode, purpose) {
    try {
      // Tìm OTP gần nhất chưa sử dụng và chưa hết hạn của user
      const query = `
        SELECT * FROM otps 
        WHERE user_id = $1 
          AND purpose = $2 
          AND used = FALSE 
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const result = await pool.query(query, [userId, purpose]);
      
      // Nếu không tìm thấy OTP hợp lệ
      if (result.rows.length === 0) {
        return { valid: false, message: 'OTP không hợp lệ hoặc đã hết hạn' };
      }
      
      const otpRecord = result.rows[0];

      // So sánh OTP
      const isValid = await bcrypt.compare(otpCode, otpRecord.otp_code);
      
      if (isValid) {
        // NOTE: We do NOT mark used here immediately if we want to verify it first then use it in reset-password.
        // But commonly verify marks it used. 
        // If we split verify and reset, we might need a way to say "this was verified".
        // For simplicity, let's keep it unused until final action OR allow verify to just check.
        // However, the caller might simply call this in reset-password flow.
        return { valid: true, message: 'OTP hợp lệ', recordId: otpRecord.id };
      }
      
      return { valid: false, message: 'OTP không đúng' };
    } catch (error) {
      throw new Error(`Lỗi khi xác thực OTP: ${error.message}`);
    }
  }

  /**
   * Đánh dấu OTP là đã sử dụng
   */
  async markAsUsed(id) {
      await pool.query('UPDATE otps SET used = TRUE WHERE id = $1', [id]);
  }

  /**
   * Dọn dẹp OTP đã hết hạn hoặc đã sử dụng
   * @returns {Number} - Số lượng bản ghi đã xóa
   */
  async cleanupOtps() {
    try {
      const result = await pool.query(`
        DELETE FROM otps 
        WHERE used = TRUE OR expires_at < NOW()
      `);
      
      return result.rowCount;
    } catch (error) {
      throw new Error(`Lỗi khi dọn dẹp OTP: ${error.message}`);
    }
  }
}

module.exports = new OtpService();