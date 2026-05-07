const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const Patient = require('../models/Patient');

router.use(protect);

// Get own profile
router.get('/me', async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.user.id);
    if (!patient) return res.status(404).json({ message: 'Not found' });
    res.json({ patient: patient.decryptPHI() });
  } catch (err) { next(err); }
});

// Update own profile
router.put('/me', async (req, res, next) => {
  try {
    const disallowed = ['password', 'email', 'role'];
    disallowed.forEach((f) => delete req.body[f]);
    const patient = await Patient.findByIdAndUpdate(req.user.id, req.body, { new: true, runValidators: true });
    res.json({ patient: patient.decryptPHI() });
  } catch (err) { next(err); }
});

// Admin: list all patients
router.get('/', restrictTo('admin', 'doctor'), async (req, res, next) => {
  try {
    const patients = await Patient.find().select('-password');
    res.json({ patients });
  } catch (err) { next(err); }
});

// Admin/Doctor: get patient by ID
router.get('/:id', restrictTo('admin', 'doctor'), async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json({ patient: patient.decryptPHI() });
  } catch (err) { next(err); }
});

module.exports = router;
