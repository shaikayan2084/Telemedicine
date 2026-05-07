const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },

    // Time window
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    timezone: { type: String, default: 'UTC' },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
      default: 'pending',
    },

    consultationType: {
      type: String,
      enum: ['video', 'in_person'],
      default: 'video',
    },

    // Telehealth room
    roomToken: { type: String, select: false }, // Cryptographic room access token
    roomId: { type: String },

    // Clinical notes (encrypted)
    chiefComplaint: { type: String },
    notes: { type: String },
    followUpDate: { type: Date },

    // Reminders
    reminderSent: { type: Boolean, default: false },
    reminderSentAt: { type: Date },

    cancelledBy: { type: String, enum: ['patient', 'doctor', 'admin'] },
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

// ─── Collision Detection: prevent double-booking ─────────────────────────────
/**
 * Checks if a proposed time window overlaps with any existing appointment
 * for the given doctor.
 * Overlap condition: start < existing.end AND end > existing.start
 */
appointmentSchema.statics.hasConflict = async function (doctorId, startTime, endTime, excludeId = null) {
  const query = {
    doctor: doctorId,
    status: { $nin: ['cancelled', 'no_show'] },
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
    ],
  };
  if (excludeId) query._id = { $ne: excludeId };

  const conflict = await this.findOne(query);
  return !!conflict;
};

// ─── Index for efficient scheduling queries ──────────────────────────────────
appointmentSchema.index({ doctor: 1, startTime: 1, endTime: 1 });
appointmentSchema.index({ patient: 1, startTime: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
