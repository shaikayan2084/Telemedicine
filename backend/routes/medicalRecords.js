const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const MedicalRecord = require('../models/MedicalRecord');
const { z } = require('zod');

const recordSchema = z.object({
  patient: z.string().min(1),
  appointment: z.string().optional(),
  diagnosis: z.string().min(1),
  symptoms: z.string().optional(),
  treatmentPlan: z.string().optional(),
  clinicalNotes: z.string().optional(),
  labResults: z.string().optional(),
  recordType: z.enum(['consultation', 'lab_result', 'imaging', 'vaccination', 'surgery']).default('consultation'),
  followUpRequired: z.boolean().optional(),
  followUpDate: z.string().datetime().optional(),
  icdCodes: z.array(z.string()).optional(),
  vitalSigns: z.object({
    bloodPressure: z.string().optional(),
    heartRate: z.number().optional(),
    temperature: z.number().optional(),
    oxygenSaturation: z.number().optional(),
    weight: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
});

router.use(protect);

// Create record (doctor only)
router.post('/', restrictTo('doctor'), async (req, res, next) => {
  try {
    const data = recordSchema.parse(req.body);
    const record = await MedicalRecord.create({ ...data, doctor: req.user.id });
    res.status(201).json({ message: 'Medical record created', record });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ errors: err.errors });
    next(err);
  }
});

// Get records for a patient
router.get('/patient/:patientId', async (req, res, next) => {
  try {
    // Patients can only see their own; doctors can see any
    if (req.user.role === 'patient' && req.user.id !== req.params.patientId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const records = await MedicalRecord.find({ patient: req.params.patientId })
      .populate('doctor', 'firstName lastName specialty')
      .sort({ createdAt: -1 });

    const decrypted = records.map((r) => r.decryptPHI());
    res.json({ records: decrypted });
  } catch (err) {
    next(err);
  }
});

// Get single record
router.get('/:id', async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('doctor', 'firstName lastName specialty')
      .populate('patient', 'firstName lastName');
    if (!record) return res.status(404).json({ message: 'Record not found' });

    if (req.user.role === 'patient' && record.patient._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ record: record.decryptPHI() });
  } catch (err) {
    next(err);
  }
});

// Update record (doctor only)
router.put('/:id', restrictTo('doctor'), async (req, res, next) => {
  try {
    const record = await MedicalRecord.findOneAndUpdate(
      { _id: req.params.id, doctor: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!record) return res.status(404).json({ message: 'Record not found or unauthorized' });
    res.json({ message: 'Record updated', record });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
