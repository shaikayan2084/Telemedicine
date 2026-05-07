const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

router.use(protect, restrictTo('admin'));

router.get('/logs', async (req, res, next) => {
  try {
    const { userId, from, to, endpoint, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (endpoint) filter.endpoint = new RegExp(endpoint, 'i');
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await AuditLog.countDocuments(filter);
    res.json({ logs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

module.exports = router;
