// /auth/controller/googleAuth.controller.js
const googleAuthService = require('../services/googleAuth.services');

const verifyAndLogin = async (req, res) => {
  const { idToken } = req.body;
  

  if (!idToken) {
    return res.status(400).json({ success: false, error: 'Missing idToken' });
  }

  googleAuthService.verifyGoogleToken(idToken, (error, result) => {
    if (error) {
      console.error(' Google Sign-In failed:', error.message || error);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: error.message || error,
      });
    }

    if (!result?.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  });
};

module.exports = {
  verifyAndLogin,
};
