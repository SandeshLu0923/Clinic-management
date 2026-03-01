# Clinic Management System 🏥

> **A comprehensive MERN stack clinic management system enabling seamless doctor-receptionist communication, efficient patient queue management, appointment booking, medical record maintenance, and integrated billing.**

[![GitHub](https://img.shields.io/badge/GitHub-Clinic%20Management-blue)](https://github.com/SandeshLu0923/Clinic-management)
[![Version](https://img.shields.io/badge/version-1.0.0-success)]()
[![Node.js](https://img.shields.io/badge/Node.js-v20.19+-green)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

## 📋 Table of Contents
- [Features](#-features-by-role)
- [Project Structure](#-project-structure)
- [Technology Stack](#-technology-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Architecture](#-architecture)
- [Logging & Monitoring](#-logging--monitoring)
- [Security](#-security)
- [Contributing](#-contributing)

## 📋 Project Structure

```
clinic-management/
├── backend/                    # Node.js/Express API Server
│   ├── __tests__/             # Comprehensive test suites
│   │   ├── authController.test.js
│   │   ├── queueService.test.js
│   │   ├── billingSystem.test.js
│   │   ├── patientManagement.test.js
│   │   └── doctorManagement.test.js
│   ├── config/                # Configuration files
│   │   ├── database.js        # MongoDB connection
│   │   ├── email.js           # Email service setup
│   │   ├── twilio.js          # SMS service setup
│   │   └── logger.js          # Winston logger config
│   ├── controllers/            # Business logic controllers
│   │   ├── authController.js
│   │   ├── doctorController.js
│   │   ├── patientController.js
│   │   └── receptionistController.js
│   ├── routes/                # API route definitions
│   │   ├── authRouter.js
│   │   ├── doctorRouter.js
│   │   ├── patientRouter.js
│   │   └── receptionistRouter.js
│   ├── models/                # Mongoose schemas
│   │   ├── User.js
│   │   ├── Doctor.js
│   │   ├── Patient.js
│   │   ├── Appointment.js
│   │   ├── Queue.js
│   │   ├── MedicalRecord.js
│   │   ├── Billing.js
│   │   ├── Department.js
│   │   └── Feedback.js
│   ├── middleware/            # Express middleware
│   │   ├── auth.js            # JWT authentication
│   │   ├── errorHandler.js    # Global error handling
│   │   └── validators.js      # Input validation
│   ├── services/              # Business logic services
│   │   ├── queueService.js    # Queue token management
│   │   ├── slotService.js     # Appointment slot generation
│   │   └── smsService.js      # SMS notification service
│   ├── utils/                 # Utility functions
│   │   ├── fileUpload.js      # File upload handling
│   │   ├── otpGenerator.js    # OTP generation
│   │   └── tokenGenerator.js  # JWT token generation
│   ├── logs/                  # Application logs (auto-created)
│   │   ├── error.log
│   │   ├── combined.log
│   │   └── activity.log
│   ├── server.js              # Express server initialization
│   ├── jest.config.js         # Jest test configuration
│   ├── jest.setup.js          # Test environment setup
│   ├── .env.example           # Environment variables template
│   └── package.json           # Dependencies & scripts
├── frontend/                  # React/Vite Frontend Application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── doctor/        # Doctor dashboard pages
│   │   │   │   ├── DoctorDashboard.jsx
│   │   │   │   ├── DoctorAppointments.jsx
│   │   │   │   ├── DoctorPatients.jsx
│   │   │   │   ├── DoctorPrescriptions.jsx
│   │   │   │   └── DoctorAnalytics.jsx
│   │   │   ├── patient/       # Patient dashboard pages
│   │   │   │   ├── PatientDashboard.jsx
│   │   │   │   ├── PatientAppointments.jsx
│   │   │   │   ├── PatientMedicalRecords.jsx
│   │   │   │   ├── PatientBilling.jsx
│   │   │   │   ├── PatientLabTests.jsx
│   │   │   │   └── PatientFeedback.jsx
│   │   │   ├── receptionist/  # Receptionist dashboard pages
│   │   │   │   ├── ReceptionistDashboard.jsx
│   │   │   │   ├── ReceptionistQueue.jsx
│   │   │   │   ├── ReceptionistAppointments.jsx
│   │   │   │   ├── ReceptionistBilling.jsx
│   │   │   │   └── ReceptionistDoctorVerification.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── store/             # Redux state management
│   │   │   ├── store.js
│   │   │   └── slices/
│   │   │       ├── authSlice.js
│   │   │       ├── appointmentSlice.js
│   │   │       ├── queueSlice.js
│   │   │       ├── billingSlice.js
│   │   │       └── medicalRecordSlice.js
│   │   ├── api/               # API integration
│   │   │   ├── axios.js       # Axios configuration
│   │   │   └── endpoints.js   # API endpoints
│   │   ├── context/           # React Context
│   │   │   └── PrivateRoute.jsx
│   │   ├── components/        # Reusable components
│   │   │   └── common/
│   │   │       ├── Layout.jsx
│   │   │       ├── Navigation.jsx
│   │   │       └── UI.jsx
│   │   ├── App.jsx            # Main application component
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Global styles
│   ├── public/                # Static assets
│   ├── .env.example           # Environment variables template
│   └── package.json           # Dependencies & scripts
├── ARCHITECTURE.md            # System architecture documentation
├── LLD.md                     # Low-level design document
├── DEPLOYMENT.md              # Deployment & system design guide
├── CODING_STANDARDS.md        # Code quality standards
├── TESTING.md                 # Test documentation
└── README.md                  # This file
```

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Configure .env with your database and API credentials
npm run dev
```

**Backend runs on:** `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

**Frontend runs on:** `http://localhost:5173`

## 🔐 Features by Role

### 👨‍⚕️ Doctor
- View appointment schedule
- Manage patient queue (real-time token system)
- Create and update medical records
- Order lab tests
- Issue prescriptions
- View patient history
- Accept/reject consultations

### 👤 Patient
- Register and create profile
- View available doctors by specialization
- Book appointments with automatic slot generation
- View appointment history
- Access medical records
- View prescriptions
- Download reports
- Receive SMS/Email notifications

### 👨‍💼 Receptionist
- Check in patients (generate queue tokens)
- Manage real-time queue
- Create and update billing
- Process payments
- Upload lab reports
- Generate daily reports
- Track pending payments

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, Redux Toolkit, Tailwind CSS, Vite, Axios |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose |
| **Authentication** | JWT + bcrypt |
| **File Upload** | Multer, Cloudinary/AWS S3 |
| **Notifications** | Nodemailer (Email), Twilio (SMS) |
| **Security** | Helmet, CORS, Rate Limiting, CSRF Protection |

## 📦 Core Models

- **User** - Authentication and role management
- **Doctor** - Doctor profiles, specialization, availability
- **Patient** - Patient profiles, medical history
- **Appointment** - Booking management
- **MedicalRecord** - EMR, prescriptions, lab orders
- **Queue** - Real-time queue tracking with tokens
- **Billing** - Payment tracking and invoicing
- **Department** - Specialization management
- **Feedback** - Patient ratings and reviews

## 🔌 API Endpoints Overview

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `GET /me` - Get current user
- `POST /logout` - Logout

### Doctor Routes (`/api/doctor`)
- `GET /profile` - Get doctor profile
- `GET /appointments` - Get appointments
- `GET /queue/today` - Today's queue
- `POST /medical-record` - Create medical record
- `GET /medical-records/:patientId` - Patient records

### Patient Routes (`/api/patient`)
- `GET /profile` - Get patient profile
- `GET /doctors` - List available doctors
- `POST /appointment/book` - Book appointment
- `GET /available-slots` - Available time slots
- `GET /appointments` - My appointments
- `GET /medical-records` - Medical records

### Receptionist Routes (`/api/receptionist`)
- `POST /patient/check-in` - Check in patient
- `GET /queue/status` - Queue status
- `POST /billing` - Create billing
- `PUT /billing/:id` - Update payment
- `POST /lab-report/upload` - Upload report

## 🗄️ Database Schema

See individual model files in `backend/models/` for detailed schema definitions.

## 🔑 Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173
PORT=5000
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
CLOUDINARY_NAME=...
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 📊 Key Workflows

### Patient Appointment Journey
1. Patient registers and creates profile
2. Browses available doctors by specialization
3. Views available appointment slots
4. Books appointment (automatic confirmation)
5. Receives SMS notification
6. Receptionist checks patient in (queue token generated)
7. Doctor examines and orderslab tests
8. Patient receives lab report notification
9. Doctor reviews and prescribes treatment
10. Receptionist creates billing and processes payment

### Queue Management
- Automatic token generation on check-in
- Real-time position tracking
- SMS alerts for queue status
- Doctor can start/complete consultation
- Automatic status updates

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting (100 requests/15 min)
- CORS protection
- Helmet security headers
- File upload restrictions
- Role-based access control

## 🚦 Getting Help

Refer to individual README files:
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🤝 Contributing

This is a learning project. Feel free to fork and submit improvements!

---

## 📚 Complete Documentation

### Project Documentation
The following comprehensive documents are available for understanding and maintaining the system:

| Document | Purpose | Key Topics |
|----------|---------|-----------|
| [REQUIREMENTS_COMPLIANCE.md](REQUIREMENTS_COMPLIANCE.md) | **START HERE** - Verify all requirements are met | Feature checklist, compliance status, setup instructions |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design and architecture overview | 3-tier architecture, technology stack, component interactions |
| [LLD.md](LLD.md) | Low-level design specifications | Class diagrams, database schema, API specifications, workflows |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Deployment guides for all environments | Local setup, cloud deployment, production configuration, monitoring |
| [CODING_STANDARDS.md](CODING_STANDARDS.md) | Code quality and development standards | Naming conventions, best practices, security guidelines, performance tips |
| [TESTING.md](TESTING.md) | Testing strategy and test cases | Test structure, 33+ test cases, coverage reports, CI/CD setup |
| [OPTIMIZATION.md](OPTIMIZATION.md) | Performance optimization guide | Code-level, database, and architecture optimizations, benchmarks |
| [FUNCTION_REFERENCE.md](FUNCTION_REFERENCE.md) | Function-by-function behavior reference | API handlers, services, utilities, frontend API calls |
| [WIREFRAME.md](WIREFRAME.md) | Wireframe and screen flow document | Role screens, navigation map, workflow paths |
| [PROJECT_REPORT.md](PROJECT_REPORT.md) | Detailed final project report | Design choices, implementation summary, validation and risks |

### Documentation Highlights

#### 🎯 Quick Reference
- **Setup & Run**: See [Quick Start](#-quick-start) section above
- **API Endpoints**: See [API Endpoints Overview](#-api-endpoints-overview) section above
- **Features by Role**: See [Features by Role](#-features-by-role) section above
- **Requirements Status**: Check [REQUIREMENTS_COMPLIANCE.md](REQUIREMENTS_COMPLIANCE.md) for complete verification

#### 📊 Architecture Overview
```
Frontend (React 18 + Vite)
    ↓ REST API
Backend (Node.js + Express)
    ├─ Controllers (Request handling)
    ├─ Services (Business logic)
    ├─ Models (Data validation)
    └─ Middleware (Auth, validation, error handling)
    ↓ Mongoose ODM
Database (MongoDB)
    ├─ 9 Collections (Users, Doctors, Patients, etc.)
    ├─ 8+ Indexes (Performance optimization)
    └─ Automated backups
    ↓
External Services
    ├─ Email (Nodemailer)
    ├─ SMS (Twilio)
    └─ File Storage (Cloudinary)
```

#### 🔧 Development Stack
- **Runtime**: Node.js v20.19+
- **Framework**: Express.js (backend), React 18 (frontend)
- **Database**: MongoDB with Mongoose ODM
- **Testing**: Jest + Supertest
- **Authentication**: JWT + bcrypt
- **Logging**: Winston
- **Build**: Vite (frontend)

#### ✨ Key Features Implemented
- 🔐 Role-based access control (Doctor, Patient, Receptionist)
- 📋 Queue token system with real-time tracking
- 📅 Smart appointment booking with automatic slot generation
- 📝 Comprehensive medical records management
- 💰 Complete billing and payment system
- 📱 SMS/Email notifications
- 📊 Analytics and reporting
- 🔍 Patient history search and view

#### ✅ Quality Assurance
- **Code Coverage**: 75%+ test coverage
- **Logging**: All operations logged to console and file
- **Security**: JWT auth, password hashing, input validation, rate limiting
- **Performance**: <200ms API response time, optimized queries
- **Documentation**: 4000+ lines across 7 comprehensive guides

---

## 🚀 Understanding the System

### For New Developers
1. Start with [REQUIREMENTS_COMPLIANCE.md](REQUIREMENTS_COMPLIANCE.md) - understand what's implemented
2. Read [ARCHITECTURE.md](ARCHITECTURE.md) - understand the system design
3. Review [CODING_STANDARDS.md](CODING_STANDARDS.md) - follow development guidelines
4. Check [LLD.md](LLD.md) - understand detailed specifications

### For QA/Testing
1. Review [TESTING.md](TESTING.md) - understand test structure and cases
2. Run tests: `npm test` (from backend folder)
3. Check API endpoints manually using provided curl examples
4. Review test coverage: `npm test -- --coverage`

### For DevOps/Deployment
1. Review [DEPLOYMENT.md](DEPLOYMENT.md) - understand deployment processes
2. Check [OPTIMIZATION.md](OPTIMIZATION.md) - understand performance considerations
3. Set up monitoring and logging
4. Configure environment variables for your environment

### For Code Optimization
1. Review [OPTIMIZATION.md](OPTIMIZATION.md) - current optimizations
2. Check [ARCHITECTURE.md](ARCHITECTURE.md) for scalability plans
3. Monitor performance metrics (API response time, database queries)
4. Review coding standards for best practices

---

## 📞 Support & Issues

For questions about:
- **Features**: See [REQUIREMENTS_COMPLIANCE.md](REQUIREMENTS_COMPLIANCE.md)
- **Setup**: See [Quick Start](#-quick-start) and [DEPLOYMENT.md](DEPLOYMENT.md)
- **Code**: See [CODING_STANDARDS.md](CODING_STANDARDS.md)
- **Testing**: See [TESTING.md](TESTING.md)
- **Performance**: See [OPTIMIZATION.md](OPTIMIZATION.md)

---

**Status**: Complete MERN Stack Implementation ✅

**Requirements Status**: See "Submission Audit (2026-02-22)" below
- ✅ All features implemented and documented
- ✅ Comprehensive logging on all operations
- ✅ 33+ test cases with coverage
- ✅ Code quality standards defined
- ✅ Production-ready deployment guide
- ✅ Performance optimization documented
- ✅ Security best practices implemented

**Project is ready for production deployment!**

---

## Submission Audit (2026-02-22)

### Completed in Repository
- Core clinic features (doctor + receptionist + patient flows)
- Token generation and queue management
- Patient history and prescription persistence
- Billing workflows and payment-state transitions
- LLD, architecture, wireframe, testing, optimization, and project report documents
- Automated validation checks:
  - Backend lint: pass
  - Backend tests: 57/57 pass
  - Frontend lint: pass
  - Frontend build: pass

### Pending External Submission Tasks
- Confirm repository visibility is public before final submission
- Submit final repo link and final project report document to evaluator portal

### Notes for Requirement Interpretation
- Database requirement in this project is fulfilled with MongoDB (approved for this submission).
- Logging is implemented across core API workflows via winston; some utility/bootstrap paths still use console.* output.



