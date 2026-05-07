# Architecture Documentation

## System Overview

The Telemedicine & EHR Platform is a three-tier, microservices-influenced architecture:

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│           React + TypeScript + Material-UI               │
│   (Patient Portal | Doctor Portal | Admin Dashboard)     │
└─────────────────────┬────────────────────────────────────┘
                      │ HTTPS / WSS
┌─────────────────────▼────────────────────────────────────┐
│                  SERVICE LAYER                           │
│   ┌─────────────────┐    ┌────────────────────────────┐  │
│   │  REST API        │    │  Signaling Server          │  │
│   │  Node.js/Express │    │  Node.js + Socket.io       │  │
│   │  Port: 5000      │    │  Port: 4000                │  │
│   └────────┬────────┘    └────────────────────────────┘  │
└────────────┼─────────────────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────────────────┐
│                    DATA LAYER                            │
│               MongoDB (AES-256 encrypted PHI)            │
└──────────────────────────────────────────────────────────┘
```

## Security Architecture

### AES-256-CBC Field-Level Encryption

All Protected Health Information (PHI) is encrypted at the **application layer** before reaching the database.

```
Patient Input → Zod Validation → AES-256-CBC Encrypt → MongoDB Storage
                                       ↓
                               Fresh IV per field (prepended)
                               Format: {16-byte-IV-hex}:{ciphertext-hex}
```

**Affected fields:**
- `Patient.dateOfBirth`
- `Patient.phone`
- `Patient.address`
- `Patient.insurancePolicyNumber`
- `Patient.allergies[]` (each entry)
- `MedicalRecord.diagnosis`
- `MedicalRecord.symptoms`
- `MedicalRecord.treatmentPlan`
- `MedicalRecord.clinicalNotes`
- `MedicalRecord.labResults`

### JWT Authentication Flow

```
Login Request → bcrypt verify → Sign JWT (HS256, 7d expiry)
                                     ↓
               Client stores token → Attach to every request header
                                     ↓
               protect middleware → verifyToken → attach req.user
                                     ↓
               restrictTo() → RBAC check (patient/doctor/admin)
```

### WebRTC Security Model

```
Patient/Doctor → Request Room Token (JWT with type:'room_access')
                        ↓
         Socket.io Auth Middleware verifies token
                        ↓
              Join room (validated against appointmentId)
                        ↓
         SDP Offer/Answer Exchange (through signaling server)
                        ↓
         DTLS-SRTP encrypted P2P video stream established
         (Signaling server never sees video data)
```

### Prescription Integrity

```
Doctor inputs medication data
        ↓
SHA-256 hash generated from: { patient, doctor, medications, diagnosis, issuedAt }
        ↓
Hash stored in prescription document + embedded in QR code
        ↓
Pharmacy scans QR → GET /prescriptions/verify/:id?hash={hash}
        ↓
Server recomputes hash → compares → returns { valid: true/false }
```

## Database Schema

### Collections

| Collection | Purpose | Encrypted Fields |
|------------|---------|-----------------|
| `patients` | Patient profiles & auth | dateOfBirth, phone, address, allergies, insurancePolicyNumber |
| `doctors` | Doctor profiles & availability | None (non-PHI) |
| `appointments` | Scheduling & room tokens | roomToken (select: false) |
| `medicalrecords` | Clinical EHR data | diagnosis, symptoms, treatmentPlan, clinicalNotes, labResults |
| `prescriptions` | Medication orders | None (integrity via hash) |
| `auditlogs` | Immutable compliance trail | None |

### Indexes

- `Appointment`: `{ doctor, startTime, endTime }` — collision detection performance
- `Appointment`: `{ patient, startTime: -1 }` — patient history queries
- `MedicalRecord`: `{ patient, createdAt: -1 }` — longitudinal record queries
- `AuditLog`: `{ userId, timestamp: -1 }`, `{ endpoint }` — compliance searches

## Audit Logging

Every API request touching PHI routes is intercepted and logged:

```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "userRole": "doctor",
  "ipAddress": "192.168.1.100",
  "method": "GET",
  "endpoint": "/api/medical-records/patient/64f1a2b3...",
  "action": "GET /patient/:id",
  "statusCode": 200,
  "responseTimeMs": 45,
  "resourceId": "64f1a2b3c4d5e6f7g8h9i0j1"
}
```

PHI routes monitored: `/patients`, `/medical-records`, `/prescriptions`, `/appointments`

## Scheduling Algorithm — Collision Detection

For any proposed appointment [newStart, newEnd] for doctor D:

```
SELECT * FROM appointments
WHERE doctor = D
  AND status NOT IN ('cancelled', 'no_show')
  AND startTime < newEnd          ← existing starts before new ends
  AND endTime > newStart          ← existing ends after new starts

IF result exists → REJECT (409 Conflict)
ELSE → ACCEPT
```

This covers all overlap cases:
- Partial left overlap
- Partial right overlap  
- New appointment completely inside existing
- Existing completely inside new appointment
