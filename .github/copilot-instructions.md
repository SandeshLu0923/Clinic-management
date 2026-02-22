# Clinic Management System - Development Guide

## Project Overview
MERN stack clinic management system with multi-role access (Doctors, Patients, Receptionists), appointment booking, medical records, queue management, and billing system.

## Key Features
- Real-time patient queue with token system
- Intelligent appointment booking with automatic time slot generation
- Medical record management with lab test ordering
- Integrated billing and payment tracking
- Doctor verification workflow
- Financial analytics and reporting

## Technology Stack
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: React 19, Redux Toolkit, Tailwind CSS, Vite
- **Authentication**: JWT + bcrypt
- **File Upload**: Cloudinary/AWS S3
- **Additional**: Nodemailer (email), Twilio (SMS)

## Project Setup Instructions

### Backend Setup
1. Navigate to backend folder: `cd backend`
2. Install dependencies: `npm install`
3. Configure `.env` file with MongoDB, JWT, and API keys
4. Start server: `npm run dev`

### Frontend Setup
1. Navigate to frontend folder: `cd frontend`
2. Install dependencies: `npm install`
3. Configure API base URL in environment files
4. Start dev server: `npm run dev`

## Development Workflow
1. Create feature branch from main
2. Implement features in backend/frontend
3. Test thoroughly
4. Submit pull request
5. Merge after review
