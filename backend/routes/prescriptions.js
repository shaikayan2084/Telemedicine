const express = require('express');
const router = express.Router();
const { createPrescription, generatePDF, verifyPrescription } = require('../controllers/prescriptionController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/verify/:id', verifyPrescription); // Public: pharmacy verification

router.use(protect);
router.post('/', restrictTo('doctor'), createPrescription);
router.get('/:id/pdf', generatePDF);
router.get('/', async (req, res, next) => {
  try {
    const Prescription = require('../models/Prescription');
    const filter = req.user.role === 'patient'
      ? { patient: req.user.id }
      : { doctor: req.user.id };
    const prescriptions = await Prescription.find(filter)
      .populate('patient', 'firstName lastName')
      .populate('doctor', 'firstName lastName specialty')
      .sort({ createdAt: -1 });
    res.json({ prescriptions });
  } catch (err) { next(err); }
});

module.exports = router;
