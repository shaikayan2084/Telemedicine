const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

router.use(protect, restrictTo('admin'));

router.get('/', async (req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json({ logs });
  } catch (err) { next(err); }
});

module.exports = router;
