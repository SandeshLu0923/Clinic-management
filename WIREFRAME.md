# Wireframe and Screen Flow

## Purpose
This document provides the screen-level architecture and navigation flow for the Clinic Management System.

## Global Layout
- Top navigation bar:
  - App title
  - Role links
  - User info
  - Logout
- Left sidebar (role-specific)
- Main content panel
- Modal overlays for create/edit/view operations

## Receptionist Wireframe

### 1. Dashboard
- Smart cards:
  - Total appointments
  - Completed
  - Total billing
  - Queue count
  - Pending transactions
- Queue table:
  - Token, Type, Patient, Doctor, Position, Status, Actions

### 2. Walk-in Queue
- Filters:
  - Search token
  - Date filter
- Summary cards:
  - Total walk-ins
  - Waiting
  - In consultation
  - Completed
- Pending walk-in patients list:
  - Registered but token not generated
- Walk-in queue table:
  - Token, Type, Patient, Doctor, Appointment ID, Age, Gender, Reason, Status, Actions

### 3. Appointments
- Scheduled appointments list with actions:
  - Add to queue
  - Reschedule
  - Cancel
- Status synchronization with doctor and queue state

### 4. Billing
- Full-width billing table:
  - Invoice ID, Patient, Amount, Status, Method, Date, Actions
- Actions:
  - Process payment
  - Edit billing
  - Delete billing
- Edit billing modal:
  - Auto consultation fee from selected doctor
  - Additional charges rows
  - Tax, discount, subtotal, total

## Doctor Wireframe

### 1. Dashboard
- Daily metrics and queue summary
- Quick actions for consultation and records

### 2. Appointments
- Appointment-only list (walk-ins excluded)
- Actions:
  - View patient
  - View diagnosis
  - View prescription
  - Accept/cancel/reschedule where applicable

### 3. My Patients
- Combined patients list:
  - Walk-in + scheduled completed visits
- Date filter and search
- Menu actions:
  - View patient
  - View record
- Contact info hidden for doctor privacy constraints

### 4. Prescriptions
- Prescription list by patient/date
- Edit prescription action

## Patient Wireframe

### 1. Landing Page (`/`)
- Hero section
- Services and process sections
- CTA to register/login

### 2. Dashboard
- Active appointments, upcoming info, and status cards

### 3. Book Appointment
- Doctor cards with menu:
  - View doctor details
  - Book appointment
- Booking modal/form:
  - Date, time, doctor, reason, consent checkbox

### 4. My Appointments
- Appointment table with status and allowed actions

### 5. Billing and Payments
- Billing list with pending/completed status
- Payment processing action

## Navigation Map

```text
Public
  / -> Patient Landing
  /login
  /register

Doctor
  /doctor/dashboard
  /doctor/appointments
  /doctor/patients
  /doctor/medical-documents
  /doctor/prescriptions
  /doctor/analytics
  /doctor/settings/profile
  /doctor/settings/password

Receptionist
  /receptionist/dashboard
  /receptionist/queue
  /receptionist/appointments
  /receptionist/billing
  /receptionist/doctor-verification
  /receptionist/manage-staff
  /receptionist/manage-services
  /receptionist/settings/profile
  /receptionist/settings/password

Patient
  /patient/dashboard
  /patient/book-appointment
  /patient/appointments
  /patient/medical-documents
  /patient/lab-tests
  /patient/billing
  /patient/feedback
  /patient/settings/profile
  /patient/settings/password
```

## Status Flow Design

### Appointment lifecycle
- `scheduled` -> `arrived` -> `in-consultation` -> `pending-billing` -> `completed`

### Walk-in lifecycle
- `registered` -> `token-generated` -> `waiting` -> `in-consultation` -> `pending-billing` -> `completed`

### Queue behavior
- Scheduled patients added to priority segment (top order)
- Walk-in patients continue serial token order
