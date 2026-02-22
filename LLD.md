# Low-Level Design (LLD) Document - Clinic Management System

## 1. Introduction

This document provides detailed design specifications for the Clinic Management System, covering class diagrams, sequence diagrams, component interactions, and algorithm specifications.

---

## 2. Class Diagrams

### 2.1 User Management Classes

```
┌─────────────────────┐
│      User (Base)    │
├─────────────────────┤
│ - _id: ObjectId     │
│ - firstName: String │
│ - lastName: String  │
│ - email: String     │
│ - password: String  │
│ - role: String      │
│ - phone: String     │
│ - avatar: String    │
│ - isActive: Boolean │
│ - createdAt: Date   │
├─────────────────────┤
│ + register()        │
│ + login()           │
│ + updateProfile()   │
│ + logout()          │
│ + verifyEmail()     │
└─────────────────────┘
         △  △  △
         │  │  │
    ┌────┴─┬┴──┬────┐
    │      │   │    │
 ┌──┴──┐ │   │  │
 │Doctor│ ││  │  │
 └──────┘ ││  │  │
        ││  │  │
       ┌┴┴──┴──┴┐  
       │Patient │  
       ├─────────┤  
       │         │
    ┌──┴──────────────┐
    │Receptionist     │
    └─────────────────┘
```

### 2.2 Doctor Class

```
┌──────────────────────────────────┐
│          Doctor                   │
├──────────────────────────────────┤
│ - specialization: String          │
│ - licenseNumber: String           │
│ - yearsOfExperience: Number       │
│ - department: Department          │
│ - verificationStatus: String      │
│ - availableSchedule: Object       │
│ - rating: Number                  │
│ - qualifications: Array           │
│ - consultationFee: Number         │
├──────────────────────────────────┤
│ + viewPatientList(): Patient[]    │
│ + viewAppointments(): Appt[]      │
│ + viewPatientRecords(id): Record  │
│ + createPrescription(rx): Boolean │
│ + orderLabTest(test): Order       │
│ + updateSchedule(schedule): Bool  │
│ + getAnalytics(): Analytics       │
│ + ratePrescription(id, rating)    │
└──────────────────────────────────┘
      │
      │ has-many
      ├─────────────→ Appointment
      ├─────────────→ MedicalRecord
      └─────────────→ Feedback
```

### 2.3 Patient Class

```
┌──────────────────────────────────┐
│          Patient                  │
├──────────────────────────────────┤
│ - dateOfBirth: Date               │
│ - gender: String                  │
│ - address: String                 │
│ - emergencyContact: Object        │
│ - medicalHistory: String          │
│ - allergies: Array                │
│ - insuranceId: String             │
│ - medicalRecords: Array           │
├──────────────────────────────────┤
│ + bookAppointment(doc, time): Apt │
│ + viewAppointments(): Appt[]      │
│ + viewMedicalRecords(): Record[]  │
│ + viewBillingHistory(): Bill[]    │
│ + payBill(billId, amount): Bool   │
│ + submitFeedback(doc, rating): B  │
│ + downloadPrescription(id): File  │
│ + viewLabResults(testId): Result  │
└──────────────────────────────────┘
      │
      │ has-many
      ├─────────────→ Appointment
      ├─────────────→ Billing
      ├─────────────→ Queue
      ├─────────────→ MedicalRecord
      └─────────────→ Feedback
```

### 2.4 Receptionist Class

```
┌──────────────────────────────────┐
│       Receptionist                │
├──────────────────────────────────┤
│ - department: String              │
│ - employeeId: String              │
│ - shift: String                   │
│ - verified: Boolean               │
├──────────────────────────────────┤
│ + generateToken(patientId): Token │
│ + viewQueue(): QueueItem[]        │
│ + callNextPatient(): QueueItem    │
│ + createAppointment(appt): Appt   │
│ + generateInvoice(patient): Bill  │
│ + processBillPayment(bill, amt)   │
│ + verifyDoctor(doctorId, status)  │
│ + updateDoctorSchedule(doc, sch)  │
│ + sendReminder(patient, doc): Bool│
│ + generateDailyReport(): Report   │
└──────────────────────────────────┘
      │
      │ manages
      ├─────────────→ Queue
      ├─────────────→ Appointment
      ├─────────────→ Billing
      └─────────────→ Doctor (Verification)
```

### 2.5 Core Business Logic Classes

#### Queue Management Class

```
┌──────────────────────────────────┐
│        QueueManager               │
├──────────────────────────────────┤
│ - currentQueue: Queue[]           │
│ - nextTokenNumber: Number         │
│ - maxQueueSize: Number            │
├──────────────────────────────────┤
│ + generateToken(): Token          │
│ + addPatientToQueue(patient): Bool│
│ + removePatient(patient): Boolean │
│ + getQueuePosition(patient): Int  │
│ + estimateWaitTime(patient): Mins │
│ + getNextPatient(): Patient       │
│ + printToken(tokenNum): Boolean   │
│ + getCurrentQueueStatus(): Status │
│ + archiveQueue(): Boolean         │
└──────────────────────────────────┘
```

#### Appointment Manager Class

```
┌──────────────────────────────────┐
│     AppointmentManager            │
├──────────────────────────────────┤
│ - appointments: Appointment[]     │
│ - slotDuration: Minutes (30)      │
│ - workingHours: Object            │
├──────────────────────────────────┤
│ + getAvailableSlots(doc,date)[]  │
│ + bookAppointment(apt): Boolean   │
│ + cancelAppointment(apt): Boolean │
│ + rescheduleAppointment(apt): Bool│
│ + getPatientAppointments(id): []  │
│ + sendReminder(apt, hours): Bool  │
│ + markAsCompleted(apt): Boolean   │
│ + generateScheduleReport(): Report│
│ + detectConflicts(): Conflict[]   │
└──────────────────────────────────┘
```

#### Billing Manager Class

```
┌──────────────────────────────────┐
│      BillingManager               │
├──────────────────────────────────┤
│ - billItems: BillItem[]           │
│ - taxRate: Number (0.18)          │
│ - invoiceCounter: Number          │
├──────────────────────────────────┤
│ + createBill(patient, items): Bill│
│ + calculateTax(amount): Number    │
│ + applyDiscount(bill, %): Boolean │
│ + processPayment(bill, amt): Bool │
│ + generateInvoice(bill): Invoice  │
│ + getOutstandingBills(): Bill[]   │
│ + generateBillingReport(): Report │
│ + recordPayment(bill, receipt)    │
│ + generateReceipt(payment): File  │
└──────────────────────────────────┘
```

#### Medical Record Manager Class

```
┌──────────────────────────────────┐
│    MedicalRecordManager           │
├──────────────────────────────────┤
│ - records: MedicalRecord[]        │
│ - attachments: Attachment[]       │
├──────────────────────────────────┤
│ + createRecord(patient, doc): Rec │
│ + updateDiagnosis(record, dxn)    │
│ + addPrescription(rec, rx): Bool  │
│ + addLabTest(record, test): Bool  │
│ + getPatientHistory(id): Record[] │
│ + searchRecords(criteria): Rec[]  │
│ + uploadAttachment(rec, file): B  │
│ + generateHealthSummary(id): Rpt  │
│ + archiveOldRecords(): Boolean    │
└──────────────────────────────────┘
```

---

## 3. Sequence Diagrams

### 3.1 Patient Login Sequence

```
Patient          User Interface       Backend Server      Database
                        │                   │                  │
├──────Login Creds──────>│                   │                  │
│                        │──POST /login─────>│                  │
│                        │                   │──Query User──────>│
│                        │                   │                  │
│                        │                   │<─User Record────│
│                        │                   │                  │
│                        │──Hash & Compare──>│(bcrypt verify)   │
│                        │                   │                  │
│         [Success]      │<─Generate JWT────│                  │
│                        │<─JWT Token────────│                  │
│                        │                   │──Log Activity───>│
│                        │                   │                  │
│<─Redirect Dashboard───┤                   │                  │
│(Store token in Redux) │                   │                  │
```

### 3.2 Appointment Booking Sequence

```
Patient          Frontend          Backend          Database
                      │                │                │
├─Select Doctor──────>│                │                │
│                     │─Get Slots──────>│                │
│                     │               │──Query Schedule─>│
│                     │               │                │
│                     │               │<─Slots Array────┤
│                     │<─Display Slots─|                │
│                     │                │                │
├─Select Slot────────>│                │                │
│                     │─Book Appt─────>│                │
│                     │               │──Check Conflict-|
│                     │               │                │
│                     │               │<─Conflict Check-┤
│                     │               │ (if no conflict)│
│                     │               │──Save Appt────>│
│                     │               │                │
│                     │<─Confirmation──│                │
│                     │               │──Send Email───>│
│<─Confirm Message───┤               │                │
│                     │               │──Log Activity──>│
│                     │               │                │
```

### 3.3 Queue Management Sequence

```
Patient         Receptionist       Backend           Database
                      │                │                │
├─Arrives at Clinic──>│                │                │
│                     │─Generate Token>│                │
│                     │              │──Increment──────>│
│                     │              │ Token Counter   │
│                     │              │                │
│                     │              │<─New Token #────┤
│                     │<─Return Token─|                │
│<─Token Displayed───┤              │──Save to Queue─>│
│(Wait in Queue)      │              │                │
│                     │              │──Calculate Wait─|
│<─Display Wait Time─┤              │ Time & Position │
│(Real-time Updates) │<─Queue Status|<─Queue Data────┤
│                     │              │                │
│[Doctor calls token] │─Call Patient>│                │
│                     │              │──Update Status─>│
│<─Called to Clinic──┤              │ (In Progress)   │
│                     │              │                │
```

### 3.4 Billing Process Sequence

```
Receptionist      Backend Serv er        Database
       │                 │                   │
├─Generate Bill─────────>│                   │
│                        │──Fetch Items────>│
│                        │                  │
│                        │<─Bill Items──────┤
│                        │                  │
│                        │--Calculate Total │
│                        │ (with tax)       │
│                        │                  │
│                        │──Save Invoice───>│
│                        │                  │
│<─Invoice Generated────┤┌─Log Activity───>│
│                        │                  │
├─Patient Pays──────────>│                  │
│                        │──Validate Payment│
│                        │──Update Status──>│
│                        │                  │
│<─Payment Confirmed────┤                  │
│                        │──Generate Receipt|
│<─Receipt Generated────┤        │         │
│                        │──Send Email─────>│
│                        │       (To Patient)
```

---

## 4. Component Interaction Diagrams

### 4.1 Authentication Flow Component Interaction

```
┌─────────────────────────────────────────────────────┐
│              Authentication Flow                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Input Validation                   Error Handling  │
│      ↓                                     ↑         │
│  express-validator              errorHandler.js     │
│      │                                     │         │
│      └─────────→ authRouter.js ←──────────┘         │
│                       │                              │
│                       ↓                              │
│                 authController.js                    │
│                  (login/register)                    │
│                       │                              │
│         ┌─────────────┼─────────────┐               │
│         ↓             ↓             ↓               │
│      bcryptjs    User Model    JWT Token            │
│    (validate)   (find/create)  (generate)           │
│         │             │             │               │
│         └─────────────┼─────────────┘               │
│                       ↓                              │
│                 Response → Frontend                 │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 4.2 Queue Management Component Interaction

```
┌─────────────────────────────────────────────────────┐
│          Queue Management Flow                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  receptionistRouter.js                              │
│       │                                              │
│       ↓                                              │
│  receptionistController.js                          │
│       │                                              │
│  ┌────┼────┬─────────────┐                         │
│  │    │    │             │                         │
│  ↓    ↓    ↓             ↓                         │
│Queue Appt  Billing  Doctor                        │
│Model Model Model   Verification                  │
│  │    │    │             │                         │
│  ├────┼────┼─────────────┤                         │
│  │    │    │             │                         │
│  └────┴────┴─────────────┘                         │
│       │                                              │
│       ↓                                              │
│  queueService.js                                    │
│       │                                              │
│  ┌────┼────────────────┐                           │
│  │    │                │                           │
│  ↓    ↓                ↓                           │
│Token  Wait Time  Position                        │
│Gen.   Calc.     Calc.                            │
│       │                └──→ Real-time Updates    │
│       └────────────────────→ Frontend            │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 4.3 Appointment Booking Component Interaction

```
┌─────────────────────────────────────────────────────┐
│    Appointment Booking Component Interaction         │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Patient Request (Frontend)                         │
│         │                                            │
│         ↓                                            │
│  appointmentRouter.js                              │
│         │                                            │
│         ├─→ Validation Middleware                  │
│         │         │                                  │
│         │         ↓                                  │
│         ├─→ appointmentController.js                │
│             │                                        │
│     ┌───────┼───────────────────┐                  │
│     │       │                   │                  │
│     ↓       ↓                   ↓                  │
│  slotService Doctor Model  Appointment       │
│  (get slots) (check schedule) Model           │
│     │       │                   │                  │
│     └───────┼───────────────────┘                  │
│             │                                        │
│             ↓                                        │
│  Check Conflict Detection                         │
│  Verify Patient Info                              │
│             │                                        │
│             ↓                                        │
│  Save to Database                                 │
│             │                                        │
│     ┌───────┴──────────────┐                      │
│     │                      │                      │
│     ↓                      ↓                      │
│  Send Email           Log Activity               │
│  (Confirmation)       (Winston Logger)           │
│                                                      │
│  Return Response → Frontend (Redux Update)        │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 5. Database Design Details

### 5.1 User Collection Indexes

```javascript
// Index Definitions
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ phone: 1 })
db.users.createIndex({ role: 1 })
db.users.createIndex({ createdAt: -1 })
```

### 5.2 Appointment Collection Indexes

```javascript
db.appointments.createIndex({ patientId: 1, status: 1 })
db.appointments.createIndex({ doctorId: 1, date: 1 })
db.appointments.createIndex({ appointmentDate: 1 })
db.appointments.createIndex({ status: 1 })
```

### 5.3 Queue Collection Indexes

```javascript
db.queues.createIndex({ departmentId: 1, status: 1 })
db.queues.createIndex({ patientId: 1 })
db.queues.createIndex({ createdAt: 1 })
db.queues.createIndex({ tokenNumber: 1 }, { unique: true })
```

### 5.4 Billing Collection Indexes

```javascript
db.billings.createIndex({ invoiceNumber: 1 }, { unique: true })
db.billings.createIndex({ patientId: 1, paymentStatus: 1 })
db.billings.createIndex({ createdAt: -1 })
db.billings.createIndex({ paymentStatus: 1 })
```

---

## 6. Algorithm Specifications

### 6.1 Token Generation Algorithm

```
Algorithm: GenerateToken
Input: patientId, departmentId
Output: tokenNumber (integer)

1. BEGIN
2.    currentDate ← Today's Date
3.    tokenCounter ← Fetch today's token count from Queue
4.    
5.    IF tokenNumber >= maxTokensPerDay (100) THEN
6.       RETURN ErrorMessage "Queue Full"
7.    END IF
8.    
9.    nextToken ← tokenCounter + 1
10.   
11.   // Create Queue Document
12.   queueRecord ← {
13.      tokenNumber: nextToken,
14.      patientId: patientId,
15.      departmentId: departmentId,
16.      status: "waiting",
17.      arrivalTime: CurrentTime(),
18.      createdAt: CurrentDate()
19.   }
20.   
21.   Save queueRecord to database
22.   Update tokenCounter in departmentQueue
23.   
24.   RETURN nextToken
25. END
```

### 6.2 Appointment Slot Generation Algorithm

```
Algorithm: GenerateAvailableSlots
Input: doctorId, date
Output: availableSlots (array of time strings)

1. BEGIN
2.    availableSlots ← Empty Array
3.    
4.    // Fetch doctor schedule
5.    doctorSchedule ← GetDoctorSchedule(doctorId, date)
6.    
7.    IF doctorSchedule is NULL THEN
8.       RETURN [] // Doctor not available
9.    END IF
10.   
11.   startTime ← doctorSchedule.startTime (e.g., 09:00)
12.   endTime ← doctorSchedule.endTime (e.g., 17:00)
13.   slotDuration ← 30 // minutes
14.   
15.   // Generate all possible slots for the day
16.   currentTime ← startTime
17.   WHILE currentTime < endTime DO
18.      
19.      // Check if slot already booked
20.      existingAppointment ← FindAppointment(
21.         doctorId, date, currentTime
22.      )
23.      
24.      IF existingAppointment is NULL THEN
25.         ADD currentTime to availableSlots
26.      END IF
27.      
28.      currentTime ← currentTime + slotDuration
29.   END WHILE
30.   
31.   RETURN availableSlots
32. END
```

### 6.3 Wait Time Estimation Algorithm

```
Algorithm: EstimateWaitTime
Input: patientPosition (in queue)
Output: estimatedWaitTime (in minutes)

1. BEGIN
2.    CONST avgConsultationTime ← 15 // minutes per patient
3.    CONST bufferTime ← 5 // minutes between patients
4.    
5.    IF patientPosition ≤ 0 THEN
6.       RETURN 0
7.    END IF
8.    
9.    // Calculate position-based wait time
10.   estimatedTime ← (patientPosition - 1) × 
11.                    (avgConsultationTime + bufferTime)
12.   
13.   // Adjust for actual consultation times (dynamic)
14.   actualConsultationTime ← GetAverageConsultationTime()
15.   
16.   estimatedTime ← (patientPosition - 1) × 
17.                    (actualConsultationTime + bufferTime)
18.   
19.   RETURN CeilingValues(estimatedTime, 5) // Round up to nearest 5 mins
20. END
```

### 6.4 Billing Calculation Algorithm

```
Algorithm: CalculateBill
Input: billItems (array), discountPercentage (optional)
Output: billTotal (number)

1. BEGIN
2.    subtotal ← 0
3.    
4.    // Calculate subtotal
5.    FOR EACH item IN billItems DO
6.       subtotal ← subtotal + (item.amount × item.quantity)
7.    END FOR
8.    
9.    // Apply discount if provided
10.   IF discountPercentage > 0 THEN
11.      discount ← (subtotal × discountPercentage) / 100
12.      subtotal ← subtotal - discount
13.   ELSE
14.      discount ← 0
15.   END IF
16.   
17.   // Calculate tax (GST = 18%)
18.   CONST taxRate ← 0.18
19.   taxAmount ← subtotal × taxRate
20.   
21.   // Calculate final total
22.   totalAmount ← subtotal + taxAmount
23.   
24.   RETURN {
25.      subtotal: subtotal,
26.      discount: discount,
27.      taxAmount: taxAmount,
28.      totalAmount: totalAmount
29.   }
30. END
```

### 6.5 Doctor Verification Algorithm

```
Algorithm: VerifyDoctor
Input: doctorId, verificationData
Output: verificationStatus (approved/rejected)

1. BEGIN
2.    doctor ← FetchDoctor(doctorId)
3.    
4.    // Validate required fields
5.    requiredFields ← ["firstName", "email", "specialization", 
6.                      "licenseNumber", "yearsOfExperience"]
7.    
8.    FOR EACH field IN requiredFields DO
9.       IF doctor[field] is NULL or EMPTY THEN
10.         RETURN "rejected" with reason "Missing " + field
11.      END IF
12.   END FOR
13.   
14.   // Verify license number format
15.   IF NOT ValidateLicenseFormat(doctor.licenseNumber) THEN
16.      RETURN "rejected" with reason "Invalid license format"
17.   END IF
18.   
19.   // Check years of experience (minimum 2 years)
20.   IF doctor.yearsOfExperience < 2 THEN
21.      RETURN "rejected" with reason "Insufficient experience"
22.   END IF
23.   
24.   // Update status
25.   UpdateDoctorStatus(doctorId, "approved")
26.   LogActivity("Doctor " + doctorId + " verified")
27.   
28.   RETURN "approved"
29. END
```

---

## 7. Error Handling & Exceptions

### 7.1 Error Codes

| Code | Message | HTTP Status | Reason |
|------|---------|-------------|--------|
| AUTH_001 | Invalid credentials | 401 | Email/password mismatch |
| AUTH_002 | Token expired | 401 | JWT token lifetime exceeded |
| AUTH_003 | Unauthorized | 403 | User lacks required role |
| APPT_001 | Slot not available | 400 | Appointment slot already booked |
| APPT_002 | Invalid date | 400 | Appointment date in past |
| APPT_003 | Doctor unavailable | 400 | Doctor not available on date |
| QUEUE_001 | Queue full | 400 | Daily token limit exceeded |
| BILL_001 | Invalid amount | 400 | Payment amount mismatch |
| BILL_002 | Payment failed | 500 | Payment processing error |
| DB_001 | Database error | 500 | MongoDB connection/query error |
| VALIDATION_001 | Invalid input | 400 | Form validation failed |

### 7.2 Exception Handling Strategy

```javascript
// Global error handling middleware
try {
   // Business logic
} catch (error) {
   if (error.name === 'ValidationError') {
      // Handle validation errors
      return sendErrorResponse(400, 'VALIDATION_001', error.details)
   } else if (error.name === 'MongooseError') {
      // Handle database errors
      return sendErrorResponse(500, 'DB_001', 'Database error')
   } else if (error.name === 'JwtError') {
      // Handle JWT errors
      return sendErrorResponse(401, 'AUTH_002', 'Token invalid/expired')
   } else {
      // Generic error handling
      return sendErrorResponse(500, 'INTERNAL_ERROR', 'Internal server error')
   }
}
```

---

## 8. Code Quality Standards

### 8.1 Naming Conventions

- **Variables**: camelCase (e.g., `patientId`, `appointmentDate`)
- **Classes**: PascalCase (e.g., `QueueManager`, `BillingController`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_QUEUE_SIZE`, `TAX_RATE`)
- **Functions**: camelCase (e.g., `generateToken()`, `calculateBill()`)
- **Files**: camelCase for utilities/services, PascalCase for models (e.g., `Doctor.js`)

### 8.2 Code Documentation Standards

```javascript
/**
 * Brief description of what the function does
 * @param {Type} paramName - Description of parameter
 * @returns {Type} Description of return value
 * @throws {ErrorType} Description of exception
 * @example
 * // Usage example
 * const result = functionName(param);
 */
function functionName(paramName) {
   // Implementation
}
```

### 8.3 Module Structure

```javascript
// Imports at top
const express = require('express');
const logger = require('../config/logger');

// Configuration
const CONSTANTS = {
   TIMEOUT: 5000,
   MAX_RETRIES: 3
};

// Main function/class
module.exports = function() {
   // Implementation
};
```

---

## 9. Performance Optimization Techniques

### 9.1 Database Query Optimization

```javascript
// ❌ Inefficient - Multiple queries
const doctor = await Doctor.findById(doctorId);
const appointments = await Appointment.find({ doctorId });
const feedback = await Feedback.find({ doctorId });

// ✓ Efficient - Single query with population
const doctor = await Doctor.findById(doctorId)
   .populate('appointments')
   .populate('feedback');
```

### 9.2 Pagination Implementation

```javascript
// Get page 2 with 20 items per page
const page = 2;
const limit = 20;
const skip = (page - 1) * limit;

const results = await Model.find()
   .skip(skip)
   .limit(limit)
   .sort({ createdAt: -1 });
```

### 9.3 Caching Strategy

```javascript
// Simple in-memory cache for frequently accessed data
const cache = new Map();

function getCachedData(key, fetcher) {
   if (cache.has(key)) {
      return cache.get(key);
   }
   const data = fetcher();
   cache.set(key, data);
   return data;
}

// Clear cache after 1 hour
setTimeout(() => cache.clear(), 3600000);
```

---

## 10. Security Implementation Details

### 10.1 Password Hashing

```javascript
const bcrypt = require('bcryptjs');

// Hash password before saving
const saltRounds = 10;
user.password = await bcrypt.hash(password, saltRounds);

// Compare passwords during login
const isMatch = await bcrypt.compare(inputPassword, user.password);
```

### 10.2 JWT Token Structure

```javascript
// Token payload
{
   userId: "507f1f77bcf86cd799439011",
   email: "doctor@clinic.com",
   role: "doctor",
   iat: 1234567890,      // Issued at
   exp: 1234571490       // Expires in 1 hour
}

// Token signed with secret
const token = jwt.sign(payload, process.env.JWT_SECRET, {
   expiresIn: '1h'
});
```

### 10.3 Input Validation Rules

```javascript
// Example validation rules
const rules = [
   body('email').isEmail().normalizeEmail(),
   body('password').isLength({ min: 8 }).matches(/^(?=.*[A-Za-z])(?=.*\d)/),
   body('phone').isMobilePhone('en-IN'),
   body('dateOfBirth').isISO8601()
];
```

---

## 11. Testing Strategy

### 11.1 Unit Test Structure

```javascript
describe('QueueService', () => {
   describe('generateToken', () => {
      test('should generate valid token', () => {
         const token = generateToken();
         expect(token).toBeGreaterThan(0);
         expect(token).toBeLessThan(10000);
      });

      test('should throw error when queue full', () => {
         expect(() => generateToken()).toThrow('Queue full');
      });
   });
});
```

### 11.2 Test Coverage Targets

- **Line Coverage**: 70%+
- **Branch Coverage**: 70%+
- **Function Coverage**: 80%+
- **Statement Coverage**: 70%+

---

## 12. Monitoring & Logging Implementation

### 12.1 Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| ERROR | Errors that need attention | Database connection failed |
| WARN | Warnings about potential issues | High response time detected |
| INFO | General application events | User logged in successfully |
| DEBUG | Detailed diagnostic information | SQL query execution time |

### 12.2 Logging Code Example

```javascript
const logger = require('../config/logger');

// Log successful operation
logger.info('Patient appointment booked', {
   patientId: patient._id,
   appointmentId: appointment._id,
   doctorId: doctor._id
});

// Log error
logger.error('Payment processing failed', {
   error: err.message,
   billId: bill._id,
   amount: bill.totalAmount
});
```

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-18 | Initial LLD document |

