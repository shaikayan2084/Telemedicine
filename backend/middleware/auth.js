const { verifyToken } = require('../utils/tokenUtils');

/**
 * Verifies JWT and attaches user to req.user
 */
const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Role-based access control
 * Usage: restrictTo('admin', 'doctor')
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. Required roles: ${roles.join(', ')}`,
    });
  }
  next();
};

module.exports = { protect, restrictTo };
