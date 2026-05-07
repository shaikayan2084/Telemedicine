/**
 * PHI Audit Logging Middleware
 * Intercepts every API request touching PHI and logs: timestamp, userId, IP, action
 * Creates an immutable audit trail for HIPAA-analog compliance
 */

const AuditLog = require('../models/AuditLog');

const PHI_ROUTES = [
  '/patients',
  '/medical-records',
  '/prescriptions',
  '/appointments',
];

const isPHIRoute = (path) => PHI_ROUTES.some((r) => path.includes(r));

const auditLogger = async (req, res, next) => {
  if (!isPHIRoute(req.path)) return next();

  const originalJson = res.json.bind(res);
  const startTime = Date.now();

  res.json = async (body) => {
    try {
      const log = new AuditLog({
        timestamp: new Date(),
        userId: req.user ? req.user.id : 'unauthenticated',
        userRole: req.user ? req.user.role : 'unknown',
        ipAddress: req.ip || req.connection.remoteAddress,
        method: req.method,
        endpoint: req.originalUrl,
        action: `${req.method} ${req.path}`,
        statusCode: res.statusCode,
        responseTimeMs: Date.now() - startTime,
        userAgent: req.headers['user-agent'],
        resourceId: req.params.id || null,
      });
      await log.save();
    } catch (err) {
      console.error('Audit log save failed:', err.message);
    }
    return originalJson(body);
  };

  next();
};

module.exports = { auditLogger };
