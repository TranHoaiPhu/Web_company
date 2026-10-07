const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Secret key and Configuration matching Python logic
const SECRET_KEY = process.env.JWT_SECRET_KEY 
const ALGORITHM = 'HS256'; // Same as Python
const ACCESS_TOKEN_EXPIRE_MINUTES = 60; // Same as Python

/**
 * Hash password using bcrypt
 * @param {string} password 
 * @returns {Promise<string>} hashed passwords
 */
const hashPassword = async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

/**
 * Verify password against hash
 * @param {string} plainPassword 
 * @param {string} hashedPassword 
 * @returns {Promise<boolean>}
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Create access token (JWT)
 * @param {object} data - Payload to encode
 * @param {number} [expiresInMinutes] - Custom expiry in minutes
 * @returns {string} encoded JWT
 */
const createAccessToken = (data, expiresInMinutes = null) => {
    const payload = { ...data };
    
    // Set expiration
    const expiry = (expiresInMinutes || ACCESS_TOKEN_EXPIRE_MINUTES) * 60; // convert to seconds
    
    return jwt.sign(payload, SECRET_KEY, {
        algorithm: ALGORITHM,
        expiresIn: expiry
    });
};

module.exports = {
    hashPassword,
    verifyPassword,
    createAccessToken,
    SECRET_KEY,
    ALGORITHM
};
