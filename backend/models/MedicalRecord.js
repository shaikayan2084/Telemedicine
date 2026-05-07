const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const vitalSignsSchema = new mongoose.Schema({
  bloodPressure: { type: String },     // e.g. "120/80"
  heartRate: { type: Number },          // bpm
  temperature: { type: Number },        // °C
  oxygenSaturation: { type: Number },  // %
  weight: { type: Number },             // kg
  height: { type: Number },             // cm
  bmi: { type: Number },
  recordedAt: { type: Date, default: Date.now },
}, { _id: false });

const medicalRecordSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },

    // PHI fields — stored AES-256 encrypted
    diagnosis: { type: String },           // Encrypted
    symptoms: { type: String },            // Encrypted
    treatmentPlan: { type: String },       // Encrypted
    clinicalNotes: { type: String },       // Encrypted
    labResults: { type: String },          // Encrypted JSON blob

    vitalSigns: vitalSignsSchema,

    attachments: [{
      filename: { type: String },
      url: { type: String },
      uploadedAt: { type: Date, default: Date.now },
    }],

    icdCodes: [{ type: String }],
    followUpRequired: { type: Boolean, default: false },
    followUpDate: { type: Date },

    recordType: {
      type: String,
      enum: ['consultation', 'lab_result', 'imaging', 'vaccination', 'surgery'],
      default: 'consultation',
    },
  },
  { timestamps: true }
);

// ─── Encrypt PHI before save ─────────────────────────────────────────────────
const encryptedFields = ['diagnosis', 'symptoms', 'treatmentPlan', 'clinicalNotes', 'labResults'];

medicalRecordSchema.pre('save', function (next) {
  encryptedFields.forEach((field) => {
    if (this.isModified(field) && this[field]) {
      this[field] = encrypt(this[field]);
    }
  });
  next();
});

medicalRecordSchema.methods.decryptPHI = function () {
  const obj = this.toObject();
  encryptedFields.forEach((field) => {
    if (obj[field]) {
      try { obj[field] = decrypt(obj[field]); } catch { /* leave encrypted */ }
    }
  });
  return obj;
};

medicalRecordSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
