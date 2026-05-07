const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { encrypt, decrypt } = require('../utils/encryption');

const patientSchema = new mongoose.Schema(
  {
    // ─── Auth Fields ──────────────────────────────────────────────────────────
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, default: 'patient', immutable: true },

    // ─── PHI Fields (AES-256 encrypted) ──────────────────────────────────────
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: String }, // Stored encrypted
    gender: { type: String },
    phone: { type: String },       // Stored encrypted
    address: { type: String },     // Stored encrypted

    // Medical PHI
    bloodGroup: { type: String },
    allergies: [{ type: String }], // Each entry encrypted
    chronicConditions: [{ type: String }],
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relationship: { type: String },
    },

    // Insurance
    insuranceProvider: { type: String },
    insurancePolicyNumber: { type: String }, // Encrypted

    // System
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// ─── Pre-save: Hash password & Encrypt PHI ───────────────────────────────────
patientSchema.pre('save', async function (next) {
  // Hash password only when modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }

  // Encrypt sensitive PHI fields before saving
  const sensitiveFields = ['dateOfBirth', 'phone', 'address', 'insurancePolicyNumber'];
  sensitiveFields.forEach((field) => {
    if (this.isModified(field) && this[field]) {
      this[field] = encrypt(this[field]);
    }
  });

  // Encrypt each allergy entry
  if (this.isModified('allergies') && this.allergies.length) {
    this.allergies = this.allergies.map((a) => encrypt(a));
  }

  next();
});

// ─── Instance Methods ─────────────────────────────────────────────────────────
patientSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

patientSchema.methods.decryptPHI = function () {
  const obj = this.toObject();
  const sensitiveFields = ['dateOfBirth', 'phone', 'address', 'insurancePolicyNumber'];
  sensitiveFields.forEach((field) => {
    if (obj[field]) obj[field] = decrypt(obj[field]);
  });
  if (obj.allergies) {
    obj.allergies = obj.allergies.map((a) => {
      try { return decrypt(a); } catch { return a; }
    });
  }
  return obj;
};

module.exports = mongoose.model('Patient', patientSchema);
