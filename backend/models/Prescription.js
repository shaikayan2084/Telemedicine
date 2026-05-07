const mongoose = require('mongoose');
const { generateHash } = require('../utils/encryption');

const medicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },     // e.g. "500mg"
  frequency: { type: String, required: true },  // e.g. "twice daily"
  duration: { type: String, required: true },   // e.g. "7 days"
  route: { type: String, default: 'oral' },     // oral, topical, IV
  instructions: { type: String },
}, { _id: false });

const prescriptionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },

    medications: [medicationSchema],
    diagnosis: { type: String, required: true },
    notes: { type: String },
    refillsAllowed: { type: Number, default: 0 },

    // Cryptographic integrity
    integrityHash: { type: String },  // SHA-256 of prescription contents
    qrCodeData: { type: String },
    pdfUrl: { type: String },

    issuedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    isRevoked: { type: Boolean, default: false },

    // Pharmacy verification
    verifiedByPharmacy: { type: Boolean, default: false },
    pharmacyName: { type: String },
    dispensedAt: { type: Date },
  },
  { timestamps: true }
);

// ─── Generate integrity hash before save ─────────────────────────────────────
prescriptionSchema.pre('save', function (next) {
  if (this.isModified('medications') || this.isModified('diagnosis') || !this.integrityHash) {
    const content = JSON.stringify({
      patient: this.patient,
      doctor: this.doctor,
      medications: this.medications,
      diagnosis: this.diagnosis,
      issuedAt: this.issuedAt,
    });
    this.integrityHash = generateHash(content);
  }
  next();
});

prescriptionSchema.methods.verifyIntegrity = function () {
  const content = JSON.stringify({
    patient: this.patient,
    doctor: this.doctor,
    medications: this.medications,
    diagnosis: this.diagnosis,
    issuedAt: this.issuedAt,
  });
  return generateHash(content) === this.integrityHash;
};

module.exports = mongoose.model('Prescription', prescriptionSchema);
