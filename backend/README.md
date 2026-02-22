# Clinic Management System - Backend

Backend API server for the Clinic Management System built with Node.js, Express, and MongoDB.

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
- MongoDB URI
- JWT secret
- Email credentials
- Twilio credentials
- Cloudinary credentials

### Running the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Doctor Routes
- `GET /api/doctor/profile` - Get doctor profile
- `PUT /api/doctor/profile` - Update doctor profile
- `GET /api/doctor/appointments` - Get doctor's appointments
- `GET /api/doctor/queue/today` - Get today's queue
- `POST /api/doctor/consultation/start` - Start consultation
- `POST /api/doctor/consultation/complete` - Complete consultation
- `POST /api/doctor/medical-record` - Create medical record
- `GET /api/doctor/medical-records/:patientId` - Get patient's medical records

### Patient Routes
- `GET /api/patient/profile` - Get patient profile
- `PUT /api/patient/profile` - Update patient profile
- `GET /api/patient/doctors` - Get list of doctors
- `GET /api/patient/available-slots` - Get available appointment slots
- `POST /api/patient/appointment/book` - Book appointment
- `GET /api/patient/appointments` - Get patient's appointments
- `DELETE /api/patient/appointment/:appointmentId` - Cancel appointment
- `GET /api/patient/medical-records` - Get medical records
- `GET /api/patient/prescriptions` - Get prescriptions

### Receptionist Routes
- `POST /api/receptionist/patient/check-in` - Check in patient
- `GET /api/receptionist/queue/status` - Get queue status
- `POST /api/receptionist/billing` - Create billing
- `GET /api/receptionist/billings` - Get billings
- `PUT /api/receptionist/billing/:billingId` - Update billing status
- `POST /api/receptionist/lab-report/upload` - Upload lab report
- `GET /api/receptionist/report/daily` - Get daily report

## Project Structure

```
backend/
├── models/              # Mongoose schemas
├── controllers/         # Business logic
├── routes/             # API routes
├── middleware/         # Auth, validation, error handling
├── services/           # Queue, SMS, slot management
├── utils/              # Token generation, file upload
├── config/             # Database, email, Twilio config
├── server.js           # Main server file
└── package.json
```

## Environment Variables

See `.env.example` for all required environment variables.

## Technologies

- Express.js - Web framework
- MongoDB - Database
- Mongoose - ODM
- JWT - Authentication
- Bcrypt - Password hashing
- Nodemailer - Email service
- Twilio - SMS service
- Multer - File upload
- Helmet - Security
- CORS - Cross-Origin Resource Sharing
