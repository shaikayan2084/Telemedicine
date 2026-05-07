const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const Prescription = require('../models/Prescription');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// ─── Create Prescription ──────────────────────────────────────────────────────
exports.createPrescription = async (req, res, next) => {
  try {
    const { patientId, appointmentId, medications, diagnosis, notes, refillsAllowed } = req.body;

    if (!medications || !medications.length) {
      return res.status(400).json({ message: 'At least one medication is required' });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30-day validity

    const prescription = await Prescription.create({
      patient: patientId,
      doctor: req.user.id,
      appointment: appointmentId,
      medications,
      diagnosis,
      notes,
      refillsAllowed: refillsAllowed || 0,
      expiresAt,
    });

    res.status(201).json({ message: 'Prescription created', prescription });
  } catch (err) {
    next(err);
  }
};

// ─── Generate PDF Prescription ────────────────────────────────────────────────
exports.generatePDF = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'firstName lastName dateOfBirth')
      .populate('doctor', 'firstName lastName specialty licenseNumber');

    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
    if (prescription.isRevoked) return res.status(410).json({ message: 'Prescription has been revoked' });

    const doctor = prescription.doctor;
    const patient = prescription.patient;

    // ── Generate QR Code data ─────────────────────────────────────────────
    const verifyUrl = `${process.env.CLIENT_URL}/verify-prescription/${prescription._id}?hash=${prescription.integrityHash}`;
    const qrBuffer = await QRCode.toBuffer(verifyUrl, { type: 'png', width: 120 });

    // ── Generate PDF ──────────────────────────────────────────────────────
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=prescription-${prescription._id}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text('MEDICAL PRESCRIPTION', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Telemedicine & EHR Platform', { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // Doctor info
    doc.fontSize(12).font('Helvetica-Bold').text(`Dr. ${doctor.firstName} ${doctor.lastName}`);
    doc.fontSize(10).font('Helvetica').text(`Specialty: ${doctor.specialty}`);
    doc.text(`License No: ${doctor.licenseNumber}`);
    doc.text(`Date: ${new Date(prescription.issuedAt).toLocaleDateString('en-IN')}`);
    doc.moveDown();

    // Patient info
    doc.fontSize(12).font('Helvetica-Bold').text('Patient Information');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Name: ${patient.firstName} ${patient.lastName}`);
    doc.text(`Prescription ID: ${prescription._id}`);
    doc.text(`Valid Until: ${new Date(prescription.expiresAt).toLocaleDateString('en-IN')}`);
    doc.moveDown();

    // Diagnosis
    doc.fontSize(12).font('Helvetica-Bold').text('Diagnosis');
    doc.fontSize(10).font('Helvetica').text(prescription.diagnosis);
    doc.moveDown();

    // Medications table
    doc.fontSize(12).font('Helvetica-Bold').text('Medications');
    doc.moveDown(0.5);
    prescription.medications.forEach((med, i) => {
      doc.fontSize(10).font('Helvetica-Bold').text(`${i + 1}. ${med.name} — ${med.dosage}`);
      doc.font('Helvetica').text(`   Frequency: ${med.frequency} | Duration: ${med.duration} | Route: ${med.route}`);
      if (med.instructions) doc.text(`   Instructions: ${med.instructions}`);
      doc.moveDown(0.3);
    });

    if (prescription.notes) {
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold').text('Additional Notes');
      doc.fontSize(10).font('Helvetica').text(prescription.notes);
    }

    // Integrity hash & QR
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();
    doc.fontSize(8).font('Helvetica').text(`Integrity Hash (SHA-256): ${prescription.integrityHash}`, { align: 'left' });
    doc.text('Scan QR code to verify prescription authenticity:', { align: 'left' });
    doc.image(qrBuffer, doc.page.width - 150, doc.y - 15, { width: 100 });

    // Doctor signature line
    doc.moveDown(4);
    doc.moveTo(350, doc.y).lineTo(545, doc.y).stroke();
    doc.fontSize(9).text(`Dr. ${doctor.firstName} ${doctor.lastName}`, 350, doc.y + 5);
    doc.text('Authorized Signature', 350, doc.y + 2);

    doc.end();
  } catch (err) {
    next(err);
  }
};

// ─── Verify Prescription (pharmacy endpoint) ──────────────────────────────────
exports.verifyPrescription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hash } = req.query;
    const prescription = await Prescription.findById(id);
    if (!prescription) return res.status(404).json({ valid: false, message: 'Not found' });

    const isValid = prescription.integrityHash === hash && prescription.verifyIntegrity() && !prescription.isRevoked;

    res.json({
      valid: isValid,
      isRevoked: prescription.isRevoked,
      expiresAt: prescription.expiresAt,
      message: isValid ? 'Prescription is authentic and valid' : 'Prescription verification failed',
    });
  } catch (err) {
    next(err);
  }
};
