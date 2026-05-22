const { z } = require('zod');
const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { signToken } = require('../utils/tokenUtils');
const { SPECIALTY_KEYS } = require('../utils/specialties');

// ─── Zod Validation Schemas ───────────────────────────────────────────────────
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    'Password must contain uppercase, lowercase, number, and special character'),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.enum(['patient', 'doctor']),
  // Doctor-specific
  specialty: z.enum(SPECIALTY_KEYS).optional(),
  licenseNumber: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(['patient', 'doctor', 'admin']),
});

// ─── Register ─────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    if (data.role === 'patient') {
      const exists = await Patient.findOne({ email: data.email });
      if (exists) return res.status(409).json({ message: 'Email already registered' });

      const patient = await Patient.create(data);
      const token = signToken({ id: patient._id, role: 'patient' });

      return res.status(201).json({
        message: 'Patient registered successfully',
        token,
        user: { id: patient._id, email: patient.email, role: 'patient' },
      });
    }

    if (data.role === 'doctor') {
      if (!data.specialty || !data.licenseNumber) {
        return res.status(400).json({ message: 'Specialty and license number are required for doctors' });
      }
      const exists = await Doctor.findOne({ email: data.email });
      if (exists) return res.status(409).json({ message: 'Email already registered' });

      const doctor = await Doctor.create(data);
      const token = signToken({ id: doctor._id, role: 'doctor' });

      return res.status(201).json({
        message: 'Doctor registered successfully',
        token,
        user: { id: doctor._id, email: doctor.email, role: 'doctor' },
      });
    }
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password, role } = loginSchema.parse(req.body);

    let user;
    if (role === 'patient') {
      user = await Patient.findOne({ email }).select('+password');
    } else if (role === 'doctor') {
      user = await Doctor.findOne({ email }).select('+password');
    } else if (role === 'admin') {
      const Admin = mongoose.models.Admin || require('../models/Admin');
      user = await Admin.findOne({ email }).select('+password');
    }

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account deactivated. Contact admin.' });
    }

    if (role !== 'admin') {
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });
    }

    const token = signToken({ id: user._id, role });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email, role, firstName: user.firstName, lastName: user.lastName },
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
};

// ─── Get Me ───────────────────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    let user;
    if (req.user.role === 'patient') {
      user = await Patient.findById(req.user.id);
      if (user) user = user.decryptPHI();
    } else {
      user = await Doctor.findById(req.user.id);
    }
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};
