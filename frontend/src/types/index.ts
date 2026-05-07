// ─── User Types ───────────────────────────────────────────────────────────────
export type UserRole = 'patient' | 'doctor' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface Patient extends AuthUser {
  role: 'patient';
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  address?: string;
  bloodGroup?: string;
  allergies?: string[];
  chronicConditions?: string[];
  insuranceProvider?: string;
}

export interface Doctor extends AuthUser {
  role: 'doctor';
  specialty: string;
  licenseNumber: string;
  department?: string;
  yearsOfExperience?: number;
  qualifications?: string[];
  bio?: string;
  availability?: AvailabilitySlot[];
}

// ─── Appointment Types ────────────────────────────────────────────────────────
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type ConsultationType = 'video' | 'in_person';

export interface Appointment {
  _id: string;
  patient: Patient | string;
  doctor: Doctor | string;
  startTime: string;
  endTime: string;
  timezone: string;
  status: AppointmentStatus;
  consultationType: ConsultationType;
  roomId?: string;
  chiefComplaint?: string;
  notes?: string;
  createdAt: string;
}

// ─── Medical Record Types ─────────────────────────────────────────────────────
export interface VitalSigns {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
}

export interface MedicalRecord {
  _id: string;
  patient: Patient | string;
  doctor: Doctor | string;
  appointment?: string;
  diagnosis: string;
  symptoms?: string;
  treatmentPlan?: string;
  clinicalNotes?: string;
  vitalSigns?: VitalSigns;
  icdCodes?: string[];
  recordType: 'consultation' | 'lab_result' | 'imaging' | 'vaccination' | 'surgery';
  followUpRequired?: boolean;
  followUpDate?: string;
  createdAt: string;
}

// ─── Prescription Types ───────────────────────────────────────────────────────
export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions?: string;
}

export interface Prescription {
  _id: string;
  patient: Patient | string;
  doctor: Doctor | string;
  medications: Medication[];
  diagnosis: string;
  notes?: string;
  integrityHash: string;
  issuedAt: string;
  expiresAt: string;
  isRevoked: boolean;
  refillsAllowed: number;
}

// ─── API Response Types ───────────────────────────────────────────────────────
export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  message: string;
}

// ─── Availability ─────────────────────────────────────────────────────────────
export interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}
