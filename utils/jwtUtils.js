/**
 * JWT Utility Functions
 * Handles token generation and verification
 */

const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user
 * @param {Object} user - User object with id and email
 * @returns {string} JWT token
 */
const generateToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.name
    };

    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token to decode
 * @returns {Object|null} Decoded token payload
 */
const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        return null;
    }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null
 */
const extractToken = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.split(' ')[1];
};

module.exports = {
    generateToken,
    verifyToken,
    decodeToken,
    extractToken
};
