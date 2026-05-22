const { z } = require('zod');
const Appointment = require('../models/Appointment');
const { generateRoomToken } = require('../utils/tokenUtils');
const { generateSecureToken } = require('../utils/encryption');

const appointmentSchema = z.object({
  doctor: z.string().min(1),
  startTime: z.string(),
  endTime: z.string(),
  timezone: z.string().default('UTC'),
  consultationType: z.enum(['video', 'in_person']).default('video'),
  chiefComplaint: z.string().min(1).max(500),
});

// ─── Book Appointment ─────────────────────────────────────────────────────────
exports.bookAppointment = async (req, res, next) => {
  try {
    const data = appointmentSchema.parse(req.body);
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    // Validate time window
    if (start >= end) {
      return res.status(400).json({ message: 'endTime must be after startTime' });
    }
    if (start < new Date()) {
      return res.status(400).json({ message: 'Cannot book appointment in the past' });
    }

    // ── Collision Detection Algorithm ──────────────────────────────────────
    const hasConflict = await Appointment.hasConflict(data.doctor, start, end);
    if (hasConflict) {
      return res.status(409).json({
        message: 'Time slot conflict: doctor already has an appointment in this window',
      });
    }

    // Generate unique cryptographic room ID and token
    const roomId = generateSecureToken(16);
    const roomToken = generateRoomToken(null, req.user.id, req.user.role, end);

    const appointment = await Appointment.create({
      ...data,
      patient: req.user.id,
      startTime: start,
      endTime: end,
      roomId,
      roomToken,
    });

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: {
        _id: appointment._id,
        doctor: appointment.doctor,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        roomId: appointment.roomId,
        consultationType: appointment.consultationType,
      },
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', errors: err.errors });
    }
    next(err);
  }
};

// ─── Get My Appointments ──────────────────────────────────────────────────────
exports.getMyAppointments = async (req, res, next) => {
  try {
    const { role, id } = req.user;
    const filter = role === 'patient' ? { patient: id } : { doctor: id };
    const { status, from, to } = req.query;

    if (status) filter.status = status;
    if (from || to) {
      filter.startTime = {};
      if (from) filter.startTime.$gte = new Date(from);
      if (to) filter.startTime.$lte = new Date(to);
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', 'firstName lastName email')
      .populate('doctor', 'firstName lastName specialty')
      .sort({ startTime: 1 });

    res.json({ appointments });
  } catch (err) {
    next(err);
  }
};

// ─── Get Room Token (for video call access) ───────────────────────────────────
exports.getRoomToken = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id).select('+roomToken');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Verify user is participant
    const userId = req.user.id;
    const isParticipant =
      appointment.patient.toString() === userId ||
      appointment.doctor.toString() === userId;

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to access this room' });
    }

    // Only allow access within 5 mins before start to end
    const now = new Date();
    const window = 5 * 60 * 1000;
    if (now < new Date(appointment.startTime) - window) {
      return res.status(403).json({ message: 'Room not yet open. Please wait until near appointment time.' });
    }
    if (now > appointment.endTime) {
      return res.status(403).json({ message: 'Appointment has ended' });
    }

    // Issue fresh room token
    const freshToken = generateRoomToken(
      appointment._id,
      userId,
      req.user.role,
      appointment.endTime
    );

    res.json({ roomId: appointment.roomId, roomToken: freshToken });
  } catch (err) {
    next(err);
  }
};

// ─── Update Appointment Status ────────────────────────────────────────────────
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, cancellationReason } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    appointment.status = status;
    if (status === 'cancelled') {
      appointment.cancelledBy = req.user.role;
      appointment.cancellationReason = cancellationReason;
    }
    await appointment.save();

    res.json({ message: 'Appointment updated', appointment });
  } catch (err) {
    next(err);
  }
};
