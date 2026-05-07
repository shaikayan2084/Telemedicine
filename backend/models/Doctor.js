const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const availabilitySlotSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, min: 0, max: 6 }, // 0=Sun
  startTime: { type: String }, // "09:00"
  endTime: { type: String },   // "17:00"
  slotDurationMinutes: { type: Number, default: 30 },
});

const doctorSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, default: 'doctor', immutable: true },

    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    specialty: { type: String, required: true },
    licenseNumber: { type: String, required: true, unique: true },
    phone: { type: String },
    department: { type: String },
    yearsOfExperience: { type: Number },
    qualifications: [{ type: String }],
    bio: { type: String },
    profileImage: { type: String },

    // Availability schedule
    availability: [availabilitySlotSchema],

    // Leave / blocked dates
    blockedDates: [{ type: Date }],

    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

doctorSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

doctorSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

doctorSchema.virtual('fullName').get(function () {
  return `Dr. ${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('Doctor', doctorSchema);
