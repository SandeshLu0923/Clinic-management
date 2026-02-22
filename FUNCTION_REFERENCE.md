# Function Reference - Clinic Management System

## Purpose
This document explains the main functions used in the project, where they are used, and what each function does when called.

## Backend Entry and Core

### `backend/server.js`
- `connectDB()`
  - Used at server startup.
  - Connects to MongoDB before serving API traffic.
- `app.use(...)` middleware chain
  - Used for security headers, CORS, parsers, static files, and rate limiting.
  - Controls request handling order.
- `app.get('/api/health', ...)`
  - Health check endpoint.
  - Returns 200 when API is up.

### `backend/config/database.js`
- `connectDB()`
  - Uses `mongoose.connect(process.env.MONGODB_URI)`.
  - On success: enables DB-backed operations.
  - On failure: logs the error and keeps server in limited mode.

## Authentication Functions

### `backend/controllers/authController.js`
- `register(req, res, next)`
  - Creates a new user (patient registration route enforces role `patient`).
  - Creates role profile data (doctor/patient) and returns JWT payload.
- `login(req, res, next)`
  - Validates credentials and returns token + user.
- `getMe(req, res, next)`
  - Returns current authenticated user basic info.
- `getProfile(req, res, next)`
  - Returns user profile with role-specific details.
- `updateProfile(req, res, next)`
  - Updates common and role-specific profile fields.
- `changePassword(req, res, next)`
  - Validates old password and updates password hash.
- `logout(req, res, next)`
  - Stateless logout response; client clears local token.

## Doctor Functions

### `backend/controllers/doctorController.js`
- `getDoctorProfile`
  - Fetches doctor profile details.
- `updateDoctorProfile`
  - Updates specialization, experience, fee, availability, etc.
- `getAppointments`
  - Returns doctor's appointment list.
- `acceptAppointment`
  - Marks a scheduled appointment as accepted.
- `cancelAppointment`
  - Cancels appointment with optional reason.
- `rescheduleAppointment`
  - Changes date/time and marks as rescheduled.
- `completeAppointment`
  - Marks appointment as complete on doctor side and transitions queue flow to billing stage.
- `getTodayQueue`
  - Returns today's queue entries for this doctor.
- `startConsultation`
  - Moves queue/appointment status to consultation state.
- `completeConsultation`
  - Finishes consultation status update.
- `createMedicalRecord`
  - Stores diagnosis, symptoms, prescription, notes, tests, and updates related entities.
- `updateMedicalRecord`
  - Edits an existing medical record.
- `getMedicalRecords`
  - Returns record history for one patient.
- `getPatients`
  - Returns doctor patient list with filters/search.

## Patient Functions

### `backend/controllers/patientController.js`
- `getPatientProfile`
  - Returns patient's profile object.
- `updatePatientProfile`
  - Updates demographics, contacts, history/allergies.
- `getDoctors`
  - Returns available doctors with profile metadata.
- `getAvailableSlots`
  - Returns available slots for doctor/date selection.
- `bookAppointment`
  - Creates scheduled appointment if slot is free.
- `getMyAppointments`
  - Returns patient appointment timeline.
- `cancelAppointment`
  - Cancels one patient appointment.
- `getMedicalRecords`
  - Returns patient's own records.
- `getPrescriptions`
  - Returns prescription-oriented medical record data.
- `getMyBillings`
  - Returns billing list for patient.
- `payBilling`
  - Marks payment done and updates billing state.

## Receptionist Functions

### `backend/controllers/receptionistController.js`
- `getDoctors`
  - Returns doctor list for receptionist actions/forms.
- `getPendingWalkInPatients`
  - Returns registered walk-ins without token generation.
- `registerWalkInPatient`
  - Creates/reuses a walk-in patient profile.
- `bookWalkInAppointment`
  - Creates/reuses a walk-in appointment entry.
- `generateWalkInToken`
  - Creates queue token for walk-in appointment.
- `addPatientToQueueAtPriority`
  - Inserts scheduled/priority case in queue (top priority flow).
- `checkInPatient`
  - Moves scheduled patient into active queue.
- `reorderQueue`
  - Updates queue order positions.
- `removePatientFromQueue`
  - Deletes queue entry manually.
- `getQueueStatus`
  - Returns queue state and counters.
- `getWalkInQueue`
  - Returns only walk-in queue list for selected date.
- `getWalkInAppointments`
  - Returns walk-in appointments with filters.
- `getScheduledAppointments`
  - Returns appointment-origin patients for receptionist appointment handling.
- `rescheduleScheduledAppointment`
  - Reschedules scheduled appointment.
- `cancelScheduledAppointment`
  - Cancels scheduled appointment.
- `getConsultationSummary`
  - Returns diagnosis/symptoms/prescription summary for billing/print view.
- `createBilling`
  - Creates bill with consultation + optional additional charges.
- `getBillings`
  - Returns billing records and filtered summaries.
- `updateBillingStatus`
  - Updates amount/status/payment data and recalculates where needed.
- `deleteBilling`
  - Deletes billing record.
- `uploadLabReport`
  - Uploads report file and stores document metadata.
- `getDailyReport`
  - Returns day-wise operational report metrics.
- `addDoctor`, `updateDoctor`, `deleteDoctor`
  - Staff management for doctors.
- `addService`, `getServices`, `updateService`, `deleteService`
  - Service catalog management.

## Services and Utilities

### `backend/services/queueService.js`
- Queue token/position helper logic used by receptionist and doctor flows.
- Maintains sequence and queue state transitions.

### `backend/services/slotService.js`
- Slot generation and time availability helpers for appointment booking.

### `backend/services/smsService.js`
- Notification wrappers for appointment, queue, report, and prescription alerts.

### `backend/utils/tokenGenerator.js`
- JWT helper to create auth tokens.

### `backend/utils/otpGenerator.js`
- Queue token/date-position helper utilities.

### `backend/utils/fileUpload.js`
- Multer upload configuration for file-based endpoints.

## Middleware Functions

### `backend/middleware/auth.js`
- `protect`
  - Validates bearer token and attaches `req.user`.
- `authorize(...roles)`
  - Role gate for protected endpoints.

### `backend/middleware/validators.js`
- Validation chains for auth/profile/appointment payloads.
- `handle`
  - Converts validation result to API error response.

### `backend/middleware/errorHandler.js`
- Centralized API error response formatting.

## Frontend API Function Groups

### `frontend/src/api/endpoints.js`
- `authAPI.*`
  - Registration, login, logout, profile, password.
- `doctorAPI.*`
  - Doctor dashboard actions (appointments, consultation, records).
- `patientAPI.*`
  - Patient flows (bookings, records, billing payments).
- `medicalDocumentAPI.*`
  - Upload/read/share medical documents.
- `receptionistAPI.*`
  - Walk-in registration, queue, appointments, billing, staff, services.

Each frontend API function wraps an Axios call and returns a promise. Components call these in `async` handlers, then update local state/Redux store and render success/error messages accordingly.

## Redux Async Functions

### `frontend/src/store/slices/authSlice.js`
- `loginUser`
  - Calls `authAPI.login`, stores token/user, sets authenticated state.
- `registerUser`
  - Calls `authAPI.register`, stores token/user, sets authenticated state.
- `logoutUser`
  - Calls logout endpoint, always clears client auth state.

## Notes
- Removed obsolete medical-record-access module path and related dead files.
- Function names in this document are focused on callable app behavior (route handlers, services, middleware, API wrappers).
