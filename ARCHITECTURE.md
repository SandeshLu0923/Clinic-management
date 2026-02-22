# System Architecture Document - Clinic Management System

## 1. System Overview

The Clinic Management System is a MERN stack application designed to streamline healthcare operations by managing patient queues, appointments, medical records, billing, and doctor verification.

### 1.1 System Goals
- Enable efficient patient queue management with token system
- Facilitate seamless doctor-receptionist communication
- Maintain comprehensive patient medical history
- Automate billing and payment tracking
- Ensure secure authentication and role-based access control

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER (Frontend)                    │
│                         React 19 + Vite                          │
│  ┌──────────────┬──────────────────┬──────────────────┐         │
│  │   Doctor     │     Patient      │   Receptionist   │         │
│  │  Dashboard   │    Dashboard     │    Dashboard     │         │
│  └──────────────┴──────────────────┴──────────────────┘         │
│                           │                                       │
│                    Redux State Management                         │
│      (Auth, Appointments, Queue, Billing, Medical Records)       │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP/REST
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY / LOAD BALANCER                   │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER (Backend)                    │
│                     Node.js + Express.js                         │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      API Routes                          │   │
│  │  ├─ /api/auth         (Authentication)                  │   │
│  │  ├─ /api/doctors      (Doctor Management)               │   │
│  │  ├─ /api/patients     (Patient Management)              │   │
│  │  ├─ /api/appointments (Appointment Booking)             │   │
│  │  ├─ /api/queue        (Queue Management)                │   │
│  │  ├─ /api/medical      (Medical Records)                 │   │
│  │  ├─ /api/billing      (Billing & Payments)              │   │
│  │  └─ /api/receptionists (Receptionist Operations)        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Middleware Layer                            │   │
│  │  ├─ Authentication (JWT)                                │   │
│  │  ├─ Authorization (Role-based Access)                   │   │
│  │  ├─ Validation (Input/Output)                           │   │
│  │  ├─ Error Handling                                      │   │
│  │  ├─ Logging                                             │   │
│  │  └─ Rate Limiting                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Controllers & Services Layer                   │   │
│  │  ├─ AuthController      ├─ QueueService                 │   │
│  │  ├─ DoctorController    ├─ SlotService                  │   │
│  │  ├─ PatientController   ├─ SMSService                   │   │
│  │  ├─ BillingController   ├─ EmailService                 │   │
│  │  ├─ AppointmentController                               │   │
│  │  └─ ReceptionistController                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                                │
│                      MongoDB (Mongoose)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Collections:                                            │   │
│  │  ├─ users            ├─ medical_records                 │   │
│  │  ├─ doctors          ├─ appointments                     │   │
│  │  ├─ patients         ├─ billing                          │   │
│  │  ├─ queues           └─ feedback                         │   │
│  │  └─ departments                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES LAYER                         │
│  ├─ Nodemailer (Email Notifications)                            │
│  ├─ Twilio (SMS notifications)                                  │
│  ├─ Cloudinary/AWS S3 (File Upload & Storage)                  │
│  └─ JWT (Token Generation & Validation)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### 3.1 Frontend
| Component | Technology |
|-----------|-----------|
| Framework | React 19 |
| Build Tool | Vite |
| State Management | Redux Toolkit |
| Styling | Tailwind CSS |
| HTTP Client | Axios |
| Routing | React Router (configured in App.jsx) |

### 3.2 Backend
| Component | Technology |
|-----------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB with Mongoose ODM |
| Authentication | JWT + bcryptjs |
| Validation | express-validator |
| Security | Helmet, CORS, Rate Limiting |
| File Upload | Multer |
| Logging | Winston |
| Task Queue | Node cron (for scheduled tasks) |

### 3.3 DevOps & Utilities
| Tool | Purpose |
|------|---------|
| Jest | Unit Testing |
| Supertest | API Testing |
| Nodemailer | Email Services |
| Twilio | SMS Services |
| Dotenv | Environment Configuration |

---

## 4. Component Architecture

### 4.1 Frontend Components Structure

```
src/
├── pages/
│   ├── doctor/
│   │   ├── DoctorDashboard.jsx      - Main doctor interface
│   │   ├── DoctorAppointments.jsx   - View/manage appointments
│   │   ├── DoctorPatients.jsx       - Patient list and details
│   │   ├── DoctorMedicalRecords.jsx - Patient medical history
│   │   ├── DoctorPrescriptions.jsx  - Create/manage prescriptions
│   │   └── DoctorAnalytics.jsx      - Performance analytics
│   │
│   ├── patient/
│   │   ├── PatientDashboard.jsx     - Patient home page
│   │   ├── PatientAppointments.jsx  - Book/manage appointments
│   │   ├── PatientMedicalRecords.jsx - View own records
│   │   ├── PatientBilling.jsx       - View invoices/payments
│   │   ├── PatientLabTests.jsx      - View lab test results
│   │   └── PatientFeedback.jsx      - Rate doctor/clinic
│   │
│   ├── receptionist/
│   │   ├── ReceptionistDashboard.jsx    - Receptionist home
│   │   ├── ReceptionistQueue.jsx        - Manage patient queue
│   │   ├── ReceptionistAppointments.jsx - Manage appointments
│   │   ├── ReceptionistBilling.jsx      - Generate bills
│   │   └── ReceptionistDoctorVerification.jsx - Verify doctors
│   │
│   ├── LoginPage.jsx                - User authentication
│   └── RegisterPage.jsx             - User registration
│
├── store/
│   ├── store.js                     - Redux store configuration
│   └── slices/
│       ├── authSlice.js             - Authentication state
│       ├── appointmentSlice.js      - Appointments state
│       ├── queueSlice.js            - Queue state
│       ├── billingSlice.js          - Billing state
│       └── medicalRecordSlice.js    - Medical records state
│
├── api/
│   ├── axios.js                     - Axios instance configuration
│   └── endpoints.js                 - API endpoint definitions
│
├── context/
│   ├── AuthContext.jsx              - Authentication context
│   └── PrivateRoute.jsx             - Route protection component
│
├── components/
│   └── common/
│       ├── Layout.jsx               - Common layout wrapper
│       ├── Navigation.jsx           - Navigation component
│       └── UI.jsx                   - UI utility components
│
├── App.jsx                          - Main application component
├── main.jsx                         - Entry point
└── index.css                        - Global styles
```

### 4.2 Backend Components Structure

```
backend/
├── config/
│   ├── database.js                  - MongoDB connection
│   ├── email.js                     - Nodemailer configuration
│   ├── twilio.js                    - Twilio SMS configuration
│   └── logger.js                    - Winston logger setup
│
├── models/ (Mongoose Schemas)
│   ├── User.js                      - Base user schema
│   ├── Doctor.js                    - Doctor model
│   ├── Patient.js                   - Patient model
│   ├── Appointment.js               - Appointment model
│   ├── Queue.js                     - Queue token model
│   ├── MedicalRecord.js             - Medical record model
│   ├── Billing.js                   - Invoice/billing model
│   ├── Department.js                - Department model
│   └── Feedback.js                  - Patient feedback model
│
├── controllers/
│   ├── authController.js            - Login, register, token refresh
│   ├── doctorController.js          - Doctor operations
│   ├── patientController.js         - Patient operations
│   ├── receptionistController.js    - Receptionist operations
│   └── appointmentController.js     - Appointment management
│
├── routes/
│   ├── authRouter.js                - Auth endpoints
│   ├── doctorRouter.js              - Doctor endpoints
│   ├── patientRouter.js             - Patient endpoints
│   ├── receptionistRouter.js        - Receptionist endpoints
│   └── appointmentRouter.js         - Appointment endpoints
│
├── middleware/
│   ├── auth.js                      - JWT verification
│   ├── errorHandler.js              - Global error handling
│   └── validators.js                - Input validation
│
├── services/
│   ├── queueService.js              - Queue token management
│   ├── slotService.js               - Appointment slot generation
│   └── smsService.js                - SMS sending
│
├── utils/
│   ├── fileUpload.js                - File upload handling
│   ├── otpGenerator.js              - OTP generation
│   └── tokenGenerator.js            - JWT token generation
│
├── seeds/
│   └── seedData.js                  - Database seed data
│
├── __tests__/
│   ├── authController.test.js       - Auth tests
│   ├── queueService.test.js         - Queue tests
│   ├── billingSystem.test.js        - Billing tests
│   ├── patientManagement.test.js    - Patient tests
│   └── doctorManagement.test.js     - Doctor tests
│
├── server.js                        - Express app initialization
├── jest.config.js                   - Jest configuration
├── jest.setup.js                    - Jest setup
├── package.json                     - Dependencies & scripts
└── .env.example                     - Environment variables template
```

---

## 5. Data Flow Architecture

### 5.1 Authentication Flow
```
User Input (Login/Register)
         ↓
ValidationMiddleware
         ↓
AuthController
         ↓
User Model (Create/Find)
         ↓
Password Hashing (bcryptjs)
         ↓
JWT Token Generation
         ↓
Token Stored in Frontend (Redux)
         ↓
Subsequent Requests Include Token
         ↓
AuthMiddleware Verifies Token
         ↓
Request Processed / Error Returned
```

### 5.2 Queue Management Flow
```
Patient Arrives at Clinic
         ↓
Receptionist Generates Token
         ↓
QueueService.generateToken()
         ↓
Token Stored in Queue Collection
         ↓
Token Number Displayed to Patient
         ↓
Doctor Views Queue (Real-time)
         ↓
Doctor Marks Patient As Called
         ↓
Appointment Created / Medical Record Updated
         ↓
Patient Checked Out
         ↓
Token Marked As Completed
```

### 5.3 Appointment Booking Flow
```
Patient Selects Doctor/Date
         ↓
AppointmentController.getAvailableSlots()
         ↓
SlotService Calculates Available Times
         ↓
Slots Displayed to Patient
         ↓
Patient Confirms Booking
         ↓
Appointment Created in Database
         ↓
Email/SMS Confirmation Sent
         ↓
Doctor Receives Appointment Notification
         ↓
Appointment Appears in Doctor's Schedule
```

### 5.4 Billing Flow
```
Patient Consultation Complete
         ↓
Doctor Creates/Updates MedicalRecord
         ↓
BillingController.generateInvoice()
         ↓
Billing Model Created with Items
         ↓
Tax/Discount Calculations Applied
         ↓
Invoice Generated & Stored
         ↓
Receptionist Reviews Invoice
         ↓
Payment Processing
         ↓
Payment Status Updated
         ↓
Receipt Generated
```

---

## 6. Security Architecture

### 6.1 Authentication & Authorization
- **JWT (JSON Web Tokens)**: Stateless authentication
  - Tokens include user ID, role, and expiration
  - Tokens verified on each request
  - Refresh tokens for session extension

- **Role-Based Access Control (RBAC)**:
  - **Doctor**: View patients, create prescriptions, order tests
  - **Patient**: Book appointments, view records, pay bills
  - **Receptionist**: Manage queue, verify doctors, create bills

### 6.2 Data Protection
- **Password Security**:
  - bcryptjs hashing with salt rounds (10+)
  - Never stored in plain text
  
- **Sensitive Data**:
  - Medical records encrypted at rest
  - JWT tokens transmitted over HTTPS only
  - Environment variables for API keys

### 6.3 Security Middleware
- **Helmet.js**: Sets HTTP headers for security
- **CORS**: Restricts cross-origin requests
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: express-validator sanitizes inputs

---

## 7. Database Schema Overview

```
User (Base Collection)
├── _id (ObjectId)
├── firstName (String)
├── lastName (String)
├── email (String, Unique)
├── password (String, Hashed)
├── role (enum: doctor, patient, receptionist, admin)
├── phone (String)
└── createdAt (Date)

Doctor (Extends User)
├── specialization (String)
├── licenseNumber (String)
├── yearsOfExperience (Number)
├── department (ObjectId → Department)
├── verificationStatus (enum: pending, approved, rejected)
├── availableSchedule (Object)
└── rating (Number, 0-5)

Patient (Extends User)
├── dateOfBirth (Date)
├── gender (String)
├── address (String)
├── emergencyContact (Object)
├── medicalHistory (String)
└── allergies (Array)

Appointment
├── _id (ObjectId)
├── patientId (ObjectId → Patient)
├── doctorId (ObjectId → Doctor)
├── appointmentDate (Date)
├── appointmentTime (String)
├── status (enum: scheduled, completed, cancelled)
├── notes (String)
└── createdAt (Date)

Queue
├── _id (ObjectId)
├── tokenNumber (Number)
├── patientId (ObjectId → Patient)
├── doctorId (ObjectId → Doctor)
├── departmentId (ObjectId → Department)
├── status (enum: waiting, called, completed, cancelled)
├── arrivalTime (Date)
├── estimatedWaitTime (Number)
└── createdAt (Date)

MedicalRecord
├── _id (ObjectId)
├── patientId (ObjectId → Patient)
├── doctorId (ObjectId → Doctor)
├── visitDate (Date)
├── diagnosis (String)
├── treatment (String)
├── prescriptions (Array of Objects)
├── labTests (Array)
├── notes (String)
└── createdAt (Date)

Billing
├── _id (ObjectId)
├── invoiceNumber (String, Unique)
├── patientId (ObjectId → Patient)
├── billItems (Array of Objects)
├── subtotal (Number)
├── tax (Number)
├── discount (Number)
├── totalAmount (Number)
├── paymentStatus (enum: pending, paid, partial)
├── paymentMethod (String)
├── paidDate (Date)
└── createdAt (Date)

Feedback
├── _id (ObjectId)
├── patientId (ObjectId → Patient)
├── doctorId (ObjectId → Doctor)
├── rating (Number, 1-5)
├── comment (String)
├── createdAt (Date)

Department
├── _id (ObjectId)
├── name (String)
├── description (String)
├── headDoctor (ObjectId → Doctor)
└── createdAt (Date)
```

---

## 8. API Communication Patterns

### 8.1 Request/Response Format

**Success Response** (HTTP 200)
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

**Error Response** (HTTP 4xx/5xx)
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ /* array of specific errors */ ]
}
```

### 8.2 Endpoint Examples

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| GET | `/api/doctors/:id` | Get doctor profile |
| GET | `/api/patients/:id/appointments` | Get patient appointments |
| POST | `/api/appointments` | Book appointment |
| GET | `/api/queue` | View queue status |
| POST | `/api/billing/invoice` | Generate invoice |
| GET | `/api/medical-records/:patientId` | Get medical records |

---

## 9. Scalability & Performance

### 9.1 Database Optimization
- **Indexes**: On frequently queried fields (email, patientId, doctorId)
- **Data Partitioning**: Queue data archived after 30 days
- **Connection Pooling**: MongoDB connection pool managed by Mongoose

### 9.2 API Performance
- **Pagination**: Large datasets paginated (20 items/page)
- **Caching**: Frequently accessed data cached (department list, doctor profiles)
- **Lazy Loading**: Medical records loaded on demand
- **Compression**: gzip compression for API responses

### 9.3 Frontend Optimization
- **Code Splitting**: Route-based lazy loading with React
- **State Management**: Redux prevents prop drilling
- **Image Optimization**: Cloudinary for image delivery

---

## 10. Deployment Architecture

### 10.1 Development Environment
- LocalHost frontend: `http://localhost:5176`
- LocalHost backend: `http://localhost:5000`
- MongoDB: Local or cloud Atlas

### 10.2 Production Environment
- **Frontend**: Deployed on Vercel/Netlify
- **Backend**: Deployed on Heroku/AWS/DigitalOcean
- **Database**: MongoDB Atlas Cloud
- **CDN**: Cloudinary for media delivery

### 10.3 Monitoring & Logging
- **Application Logs**: Winston logs stored in `/backend/logs/`
- **Error Tracking**: Centralized error logging
- **Performance Metrics**: API response times tracked
- **Uptime Monitoring**: Health check endpoint `/api/health`

---

## 11. Integration Points

### 11.1 Third-Party Services
- **Nodemailer**: Email confirmations and notifications
- **Twilio**: SMS reminders and notifications
- **Cloudinary/AWS S3**: Document and file storage
- **MongoDB Atlas**: Cloud database hosting

### 11.2 Webhooks
- Appointment reminder webhooks (24 hours before)
- Payment success/failure webhooks
- Doctor verification callbacks

---

## 12. System Constraints & Assumptions

### 12.1 Constraints
- Maximum concurrent users: 1000
- Max file upload size: 10MB
- API response time target: < 200ms
- Database query optimization for 100k+ records

### 12.2 Assumptions
- Internet connectivity always available
- Clock synchronization across servers
- MongoDB replication for high availability
- Secure HTTPS for all communications

---

## 13. Future Enhancement Points

1. **Video Consultation**: Integrate Zoom/Jitsi for remote consultations
2. **AI Diagnostics**: ML models for preliminary diagnosis
3. **Mobile App**: React Native for iOS/Android
4. **Advanced Analytics**: Real-time dashboard with charts
5. **Telemedicine**: Home patient monitoring integration
6. **Multi-clinic Support**: Support for hospital chains
7. **Insurance Integration**: Direct billing to insurance companies
8. **Prescription Management**: E-prescriptions to pharmacies

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-18 | Initial architecture design |

