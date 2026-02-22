import api from './axios';

// Auth API calls
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Doctor API calls
export const doctorAPI = {
  getProfile: () => api.get('/doctor/profile'),
  updateProfile: (data) => api.put('/doctor/profile', data),
  getPatients: (params) => api.get('/doctor/patients', { params }),
  getAppointments: () => api.get('/doctor/appointments'),
  acceptAppointment: (appointmentId) => api.post(`/doctor/appointment/${appointmentId}/accept`),
  cancelAppointment: (appointmentId, cancellationReason) => api.post(`/doctor/appointment/${appointmentId}/cancel`, { cancellationReason }),
  rescheduleAppointment: (appointmentId, data) => api.post(`/doctor/appointment/${appointmentId}/reschedule`, data),
  completeAppointment: (appointmentId) => api.post(`/doctor/appointment/${appointmentId}/complete`),
  getTodayQueue: () => api.get('/doctor/queue/today'),
  startConsultation: (data) => api.post('/doctor/consultation/start', data),
  completeConsultation: (data) => api.post('/doctor/consultation/complete', data),
  createMedicalRecord: (data) => api.post('/doctor/medical-record', data),
  getMedicalRecords: (patientId) => api.get(`/doctor/medical-records/${patientId}`),
  updateMedicalRecord: (recordId, data) => api.put(`/doctor/medical-record/${recordId}`, data),
};

// Patient API calls
export const patientAPI = {
  getProfile: () => api.get('/patient/profile'),
  updateProfile: (data) => api.put('/patient/profile', data),
  getDoctors: (params) => api.get('/patient/doctors', { params }),
  getAvailableSlots: (params) => api.get('/patient/available-slots', { params }),
  bookAppointment: (data) => api.post('/patient/appointment/book', data),
  getAppointments: () => api.get('/patient/appointments'),
  cancelAppointment: (appointmentId) => api.delete(`/patient/appointment/${appointmentId}`),
  getMedicalRecords: () => api.get('/patient/medical-records'),
  getPrescriptions: () => api.get('/patient/prescriptions'),
  getBillings: () => api.get('/patient/billings'),
  payBilling: (billingId, data) => api.post(`/patient/billing/${billingId}/pay`, data),
};

// Medical Documents API calls
export const medicalDocumentAPI = {
  uploadDocument: (formData) => api.post('/medical-documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getPatientDocuments: () => api.get('/medical-documents'),
  deleteDocument: (documentId) => api.delete(`/medical-documents/${documentId}`),
  grantDoctorAccess: (documentId, doctorIds) => api.put(`/medical-documents/${documentId}/grant-access`, { doctorIds }),
  revokeDoctorAccess: (documentId, doctorId) => api.put(`/medical-documents/${documentId}/revoke-access/${doctorId}`),
  getDoctorAccessibleDocuments: () => api.get('/medical-documents/doctor/accessible'),
  getAvailableDoctors: () => api.get('/medical-documents/doctors/available'),
};

// Receptionist API calls
export const receptionistAPI = {
  getDoctors: () => api.get('/receptionist/doctors'),
  getPendingWalkInPatients: () => api.get('/receptionist/patient/walk-in/pending'),
  registerPatient: (data) => api.post('/auth/register', data),
  checkInPatient: (data) => api.post('/receptionist/patient/check-in', data),
  getQueueStatus: (params) => api.get('/receptionist/queue/status', { params }),
  getScheduledAppointments: (params) => api.get('/receptionist/appointments/scheduled', { params }),
  rescheduleAppointment: (appointmentId, data) => api.post(`/receptionist/appointments/${appointmentId}/reschedule`, data),
  cancelAppointment: (appointmentId, data) => api.post(`/receptionist/appointments/${appointmentId}/cancel`, data),
  getWalkInQueue: (params) => api.get('/receptionist/queue/walk-in', { params }),
  getWalkInAppointments: (params) => api.get('/receptionist/appointments/walk-in', { params }),
  getConsultationSummary: (appointmentId) => api.get(`/receptionist/consultation/${appointmentId}`),
  // Walk-in Patient Management
  registerWalkInPatient: (data) => api.post('/receptionist/patient/walk-in/register', data),
  bookWalkInAppointment: (data) => api.post('/receptionist/patient/walk-in/appointment', data),
  generateWalkInToken: (data) => api.post('/receptionist/patient/walk-in/token', data),
  addPatientToQueueAtPriority: (data) => api.post('/receptionist/queue/priority', data),
  reorderQueue: (data) => api.post('/receptionist/queue/reorder', data),
  removePatientFromQueue: (queueId) => api.delete(`/receptionist/queue/${queueId}`),
  // Billing
  createBilling: (data) => api.post('/receptionist/billing', data),
  getBillings: (params) => api.get('/receptionist/billings', { params }),
  updateBillingStatus: (billingId, data) => api.put(`/receptionist/billing/${billingId}`, data),
  deleteBilling: (billingId) => api.delete(`/receptionist/billing/${billingId}`),
  uploadLabReport: (data) => api.post('/receptionist/lab-report/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getDailyReport: (params) => api.get('/receptionist/report/daily', { params }),
  // Staff Management
  addDoctor: (data) => api.post('/receptionist/staff/doctor', data),
  updateDoctor: (doctorId, data) => api.put(`/receptionist/staff/doctor/${doctorId}`, data),
  deleteDoctor: (doctorId) => api.delete(`/receptionist/staff/doctor/${doctorId}`),
  // Service Management
  addService: (data) => api.post('/receptionist/services', data),
  getServices: () => api.get('/receptionist/services'),
  updateService: (serviceId, data) => api.put(`/receptionist/services/${serviceId}`, data),
  deleteService: (serviceId) => api.delete(`/receptionist/services/${serviceId}`),
};

export default api;
