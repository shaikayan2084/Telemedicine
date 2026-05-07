const jwt = require('jsonwebtoken');

/**
 * Signs a JWT token with user payload
 */
const signToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    algorithm: 'HS256',
  });
};

/**
 * Verifies a JWT token and returns the decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Generates a time-limited room token for WebRTC telehealth rooms
 * Expires exactly at appointment end time
 */
const generateRoomToken = (appointmentId, userId, role, expiresAt) => {
  const expirySeconds = Math.floor((new Date(expiresAt) - Date.now()) / 1000);
  return jwt.sign(
    { appointmentId, userId, role, type: 'room_access' },
    process.env.JWT_SECRET,
    { expiresIn: expirySeconds > 0 ? expirySeconds : 3600 }
  );
};

module.exports = { signToken, verifyToken, generateRoomToken };
