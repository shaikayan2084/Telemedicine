const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const Doctor = require('../models/Doctor');

router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const { specialty } = req.query;
    const filter = { isActive: true };
    if (specialty) filter.specialty = new RegExp(specialty, 'i');
    const doctors = await Doctor.find(filter).select('-password -availability');
    res.json({ doctors });
  } catch (err) { next(err); }
});

router.get('/me', restrictTo('doctor'), async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.user.id);
    res.json({ doctor });
  } catch (err) { next(err); }
});

router.put('/me', restrictTo('doctor'), async (req, res, next) => {
  try {
    const disallowed = ['password', 'email', 'role', 'licenseNumber'];
    disallowed.forEach((f) => delete req.body[f]);
    const doctor = await Doctor.findByIdAndUpdate(req.user.id, req.body, { new: true });
    res.json({ doctor });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('-password');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ doctor });
  } catch (err) { next(err); }
});

// Get doctor availability
router.get('/:id/availability', async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('availability blockedDates firstName lastName');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ availability: doctor.availability, blockedDates: doctor.blockedDates });
  } catch (err) { next(err); }
});

module.exports = router;
