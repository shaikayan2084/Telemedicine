import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: Attach JWT ──────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response Interceptor: Handle 401 ────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data: { email: string; password: string; role: string }) =>
    api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// ─── Appointments API ─────────────────────────────────────────────────────────
export const appointmentsAPI = {
  book: (data: any) => api.post('/appointments', data),
  getAll: (params?: any) => api.get('/appointments', { params }),
  getRoomToken: (id: string) => api.get(`/appointments/${id}/room-token`),
  updateStatus: (id: string, data: any) => api.patch(`/appointments/${id}/status`, data),
};

// ─── Medical Records API ──────────────────────────────────────────────────────
export const medicalRecordsAPI = {
  create: (data: any) => api.post('/medical-records', data),
  getByPatient: (patientId: string) => api.get(`/medical-records/patient/${patientId}`),
  getById: (id: string) => api.get(`/medical-records/${id}`),
  update: (id: string, data: any) => api.put(`/medical-records/${id}`, data),
};

// ─── Prescriptions API ────────────────────────────────────────────────────────
export const prescriptionsAPI = {
  create: (data: any) => api.post('/prescriptions', data),
  getAll: () => api.get('/prescriptions'),
  downloadPDF: (id: string) => api.get(`/prescriptions/${id}/pdf`, { responseType: 'blob' }),
  verify: (id: string, hash: string) => api.get(`/prescriptions/verify/${id}?hash=${hash}`),
};

// ─── Doctors API ──────────────────────────────────────────────────────────────
export const doctorsAPI = {
  getAll: (specialty?: string) => api.get('/doctors', { params: { specialty } }),
  getById: (id: string) => api.get(`/doctors/${id}`),
  getAvailability: (id: string) => api.get(`/doctors/${id}/availability`),
  updateProfile: (data: any) => api.put('/doctors/me', data),
};

// ─── Patients API ─────────────────────────────────────────────────────────────
export const patientsAPI = {
  getProfile: () => api.get('/patients/me'),
  updateProfile: (data: any) => api.put('/patients/me', data),
  getById: (id: string) => api.get(`/patients/${id}`),
};

// ─── Admin API ────────────────────────────────────────────────────────────────
export const adminAPI = {
  getAuditLogs: (params?: any) => api.get('/admin/logs', { params }),
};

export default api;
