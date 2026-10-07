const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { OAuth2Client } = require('google-auth-library');
const { v4: uuidv4 } = require('uuid');
const { hashPassword, createAccessToken } = require('../utils/auth.utils');
const otpService = require('../services/otp.services');
const emailService = require('../services/email.services');
// Google OAuth Client
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// ==================== HELPER FUNCTIONS ====================

function generateToken(user) {
  return jwt.sign(
    {
      id: user.user_id, // UUID string
      sub: user.user_id, // For Python sync/compatibility
      email: user.email,
      role: user.role || 'CUSTOMER',
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

// Generate Refresh Token
function generateRefreshToken(user) {
  return jwt.sign(
    { 
      id: user.user_id, // UUID string
      sub: user.user_id 
    },
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET_KEY,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  );
}

// ==================== GET CURRENT USER (ME) ====================
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    console.log("TOKEN", token);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token không được cung cấp'
      });
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, decoded) => {
      console.log("DECODED", decoded);
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Token không hợp lệ hoặc đã hết hạn'
        });
      }

      const result = await pool.query(
        `SELECT id, user_id, email, full_name, phone, avatar_url, role, created_at 
         FROM users WHERE user_id = $1 AND status = 'ACTIVE'`,
        [decoded.sub]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Người dùng không tồn tại'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
});

// ==================== REGISTER ====================
router.post('/register', async (req, res) => {
  try {
    const { password, username, phone, email, full_name } = req.body;

    // Validate
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Email và mật khẩu là bắt buộc'
      });
    }

    // Check email exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email đã được đăng ký'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Insert user - Sync both password columns for synchronization with Python
    const result = await pool.query(
      `INSERT INTO users (user_id, username, password_hash, password, email, full_name, phone, role, status, created_at)
       VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, user_id, username, full_name, phone, role, avatar_url, created_at`,
      [userId, username, hashedPassword, email || 'User', full_name || 'User', phone || null, 1, 'ACTIVE']
    );

    const newUser = result.rows[0];

    // Generate tokens
    // const accessToken = generateToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        user: {
          id: newUser.id,
          user_id: newUser.user_id,
          email: newUser.email,
          full_name: newUser.full_name,
          phone: newUser.phone,
          avatar_url: newUser.avatar_url,
          role: newUser.role, 
          username: newUser.username,
        },
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Đăng ký thất bại',
      error: error.message
    });
  }
});

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email và mật khẩu là bắt buộc'
      });
    }

    // Find user
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND status = 'ACTIVE'",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    const user = result.rows[0];

    // Check password
    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản này sử dụng đăng nhập Google. Vui lòng đăng nhập bằng Google.'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      access_token: accessToken,
      refresh_token: refreshToken,
      user_id: user.user_id,
      data: {
        user: {
          id: user.id,
          user_id: user.user_id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          avatar_url: user.avatar_url,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Đăng nhập thất bại',
      error: error.message
    });
  }
});


// ==================== GOOGLE LOGIN ====================
router.post('/google', async (req, res) => {
  try {
    const { idToken, accessToken: googleAccessToken } = req.body;

    // 1. Validate input
    if (!idToken && !googleAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'Token Google là bắt buộc'
      });
    }

    // 2. Verify Google token and get user info
    const googleUser = await verifyGoogleToken(idToken, googleAccessToken);
    
    if (!googleUser.email) {
      return res.status(400).json({
        success: false,
        message: 'Không thể lấy email từ tài khoản Google'
      });
    }

    // 3. Find or create user
    const { user, isNewUser, tempPassword, hashedTempPassword } = await findOrCreateGoogleUser(googleUser);

    // 4. Generate tokens
    const accessToken = createAccessToken({
      sub: user.user_id,
      role: user.role
    });
    const refreshToken = generateRefreshToken(user);

    // 5. Build response data
    const responseData = {
      user: {
        id: user.id,
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        avatar_url: user.avatar_url,
        role: user.role
      },
      accessToken,
      refreshToken,
      isNewUser
    };

    // Include temp password only for new users
    if (isNewUser && tempPassword) {
      responseData.tempPassword = tempPassword;
      responseData.hashedTempPassword = hashedTempPassword;
    }

    // 6. Return response
    res.json({
      success: true,
      message: isNewUser ? 'Đăng ký thành công với Google' : 'Đăng nhập thành công với Google',
      data: responseData
    });

  } catch (error) {
    console.error('Google login error:', error);
    
    // Handle specific errors
    if (error.message.includes('Token Google không hợp lệ')) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Đăng nhập Google thất bại',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Verify Google token and extract user information
 * @param {string} idToken - Google ID token
 * @param {string} googleAccessToken - Google access token
 * @returns {Promise<Object>} User info from Google
 */
async function verifyGoogleToken(idToken, googleAccessToken) {
  let email, name, picture, googleId;

  // Method 1: Verify ID Token (recommended)
  if (idToken) {
    try {
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
      googleId = payload.sub;
    } catch (err) {
      console.error('Google ID token verification failed:', err);
      throw new Error('Token Google không hợp lệ');
    }
  }
  // Method 2: Use Access Token to get user info
  else if (googleAccessToken) {
    try {
      const axios = require('axios');
      const response = await axios.get(
        'https://www.googleapis.com/oauth2/v3/userinfo', // v3 is more stable
        {
          headers: { Authorization: `Bearer ${googleAccessToken}` },
          timeout: 5000 // Add timeout
        }
      );
      
      email = response.data.email;
      name = response.data.name;
      picture = response.data.picture;
      googleId = response.data.sub; // v3 uses 'sub' instead of 'id'
    } catch (err) {
      console.error('Google access token verification failed:', err);
      throw new Error('Token Google không hợp lệ');
    }
  }

  return { email, name, picture, googleId };
}

/**
 * Find existing user or create new one
 * @param {Object} googleUser - User info from Google
 * @returns {Promise<Object>} { user, isNewUser, tempPassword, hashedTempPassword }
 */
async function findOrCreateGoogleUser(googleUser) {
  const { email, name, picture, googleId } = googleUser;

  // Check if user exists
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  let user;
  let isNewUser = false;
  let tempPassword = null;
  let hashedTempPassword = null;

  if (result.rows.length === 0) {
    // Create new user
    isNewUser = true;
    const userId = uuidv4();
    
    // Generate a readable temporary password: GG_XXXXXXXX (8 random chars)
    tempPassword = `GG_${userId.substring(0, 8).toUpperCase()}`;
    hashedTempPassword = await hashPassword(tempPassword);
    
    const insertResult = await pool.query(
      `INSERT INTO users (
        user_id, 
        email, 
        full_name, 
        avatar_url, 
        password_hash, 
        password,
        role, 
        status, 
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $5, $6, $7, NOW())
      RETURNING *`,
      [
        userId,
        email,
        name || 'Google User',
        picture || null,
        hashedTempPassword, // Store the hashed temp password in both columns
        1, // role: user
        'ACTIVE'
      ]
    );
    
    user = insertResult.rows[0];
    console.log(`New Google user created: ${email} with temporary password`);
  } else {
    // User exists
    user = result.rows[0];
    
    // Update avatar if not set or if new one is better
    if (picture && (!user.avatar_url || user.avatar_url.includes('default'))) {
      await pool.query(
        `UPDATE users 
         SET avatar_url = $1, updated_at = NOW()
         WHERE user_id = $2`,
        [picture, user.user_id]
      );
      user.avatar_url = picture;
      console.log(`Updated avatar for user: ${email}`);
    }

    // Update full name if not set
    if (name && (!user.full_name || user.full_name === 'Google User')) {
      await pool.query(
        `UPDATE users 
         SET full_name = $1, updated_at = NOW()
         WHERE user_id = $2`,
        [name, user.user_id]
      );
      user.full_name = name;
    }

    console.log(`Existing Google user logged in: ${email}`);
  }

  return { user, isNewUser, tempPassword, hashedTempPassword };
}

// ==================== REFRESH TOKEN ====================
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token là bắt buộc'
      });
    }

    // Verify refresh token
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET_KEY,
      async (err, decoded) => {
        if (err) {
          return res.status(401).json({
            success: false,
            message: 'Refresh token không hợp lệ hoặc đã hết hạn'
          });
        }

        // Get user
        const result = await pool.query(
          "SELECT * FROM users WHERE id = $1 AND status = 'ACTIVE'",
          [decoded.id]
        );

        if (result.rows.length === 0) {
          return res.status(401).json({
            success: false,
            message: 'Người dùng không tồn tại'
          });
        }

        const user = result.rows[0];

        // Generate new tokens
        const newAccessToken = generateToken(user);
        const newRefreshToken = generateRefreshToken(user);

        res.json({
          success: true,
          data: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
          }
        });
      }
    );
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Refresh token thất bại',
      error: error.message
    });
  }
});



// ==================== FORGOT PASSWORD ====================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email là bắt buộc'
      });
    }

    // Check if user exists
    const result = await pool.query(
      "SELECT user_id, email, full_name FROM users WHERE email = $1 AND status = 'ACTIVE'",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Email không tồn tại trong hệ thống'
      });
    }

    const user = result.rows[0];

    // Create OTP
    const otpData = await otpService.createOtp(user.user_id, 'reset_password');

    // Send Email
    await emailService.sendOtpResetPW(user.email, { otpCode: otpData.otpCode });

    res.json({
      success: true,
      message: 'Mã xác thực đã được gửi đến email của bạn'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi mã xác thực',
      error: error.message
    });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({
        success: false,
        message: 'Email và mã OTP là bắt buộc'
      });
    }

    // Get user
    const result = await pool.query(
      "SELECT user_id FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Email không tồn tại'
      });
    }

    const user = result.rows[0];

    // Verify OTP
    const verifyResult = await otpService.verifyOtp(user.user_id, otpCode, 'reset_password');

    if (!verifyResult.valid) {
      return res.status(400).json({
        success: false,
        message: verifyResult.message || 'Mã OTP không hợp lệ'
      });
    }

    res.json({
      success: true,
      message: 'Mã OTP hợp lệ'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xác thực OTP',
      error: error.message
    });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otpCode, newPassword } = req.body;

    if (!email || !otpCode || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    // Get user
    const result = await pool.query(
      "SELECT id, user_id FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Email không tồn tại'
      });
    }

    const user = result.rows[0];

    // Verify OTP again 
    const verifyResult = await otpService.verifyOtp(user.user_id, otpCode, 'reset_password');

    if (!verifyResult.valid) {
      return res.status(400).json({
        success: false,
        message: 'Mã OTP không hợp lệ hoặc đã hết hạn'
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password in both columns for sync with Python
    await pool.query(
      "UPDATE users SET password_hash = $1, password = $1, updated_at = NOW() WHERE id = $2",
      [hashedPassword, user.id]
    );

    // Mark OTP as used
    if (verifyResult.recordId) {
      await otpService.markAsUsed(verifyResult.recordId);
    }
    
    // Send confirmation email
    await emailService.sendEmailChangePassword(email);

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đổi mật khẩu',
      error: error.message
    });
  }
});
router.post('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập' });
    }

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, decoded) => {
      if (err) return res.status(401).json({ success: false, message: 'Phiên đăng nhập hết hạn' });

      // Get user with password hash
      const result = await pool.query(
        "SELECT id, password_hash FROM users WHERE user_id = $1", 
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
      }

      const user = result.rows[0];
      if (!user.password_hash) {
        return res.status(400).json({ success: false, message: 'Tài khoản Google không thể đổi mật khẩu tại đây' });
      }

      // Verify old password
      const isValid = await bcrypt.compare(oldPassword, user.password_hash);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Mật khẩu cũ không chính xác' });
      }

      // Update password in both columns for sync with Python
      const hashedNewPassword = await hashPassword(newPassword);
      await pool.query(
        "UPDATE users SET password_hash = $1, password = $1, updated_at = NOW() WHERE user_id = $2",
        [hashedNewPassword, user.user_id]
      );

      res.json({ success: true, message: 'Đổi mật khẩu thành công' });
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
});

module.exports = router;
