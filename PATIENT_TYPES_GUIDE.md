# Patient Types and Queue Management Guide

This document clarifies the distinction between scheduled appointments, walk-in patients, and queue management in the Clinic Management System.

## Three Types of Patients

### 1. **Scheduled Appointments** 
**Location:** Appointments Page → `ReceptionistAppointments`  
**When Patient Books:** Patients book appointments in advance (days/weeks before)  
**Appointment Type:** `scheduled`  
**Characteristics:**
- Pre-booked appointment slots with specific date & time
- Shows in "Scheduled Appointments" page
- No token generated at registration time
- Patient arrives at booked time

**Data Flow:**
```
Patient books via Portal → Appointment created (type='scheduled') 
→ Status: pending/accepted
→ NOT in queue until check-in day
```

**Reception Actions:**
- View scheduled appointments by date/month
- Confirm or cancel appointments
- Check patient details and history

---

### 2. **Walk-In Patients**
**Location:** Walk-In Check-In Page → `WalkInCheckIn`  
**When Patient Arrives:** Patients walk in without prior appointment  
**Appointment Type:** `walk-in`  
**Characteristics:**
- No pre-booked slot
- Registered at clinic counter immediately
- Can select doctor at registration time
- Token generated upon check-in
- Enters queue immediately with token

**Data Flow:**
```
Walk-in Patient Arrives → Two Options:
├─ NEW PATIENT
│  └─ Register patient info → Create walk-in appointment (type='walk-in') 
│     → Select doctor → Generate token → Add to queue
│
└─ EXISTING PATIENT (Registered before)
   └─ Select from pending list → Select doctor → Generate token → Add to queue
```

**Reception Actions:**
- Register new walk-in patients (name, phone, age, gender)
- Select appropriate doctor for patient
- Generate token for queue
- Print token (80mm × 100mm format)

---

### 3. **Real-Time Queue Management**
**Location:** Queue Management Page → `ReceptionistQueue`  
**Shows:** Only walk-in patients currently in queue with tokens  
**Token Format:** `DDMM-###` (e.g., `2002-001` = Feb 20, Position 1)  
**Characteristics:**
- Shows only walk-in patients (those checked in same day)
- Real-time queue status per doctor
- Tokens reset daily (DDMM prefix changes with date)
- Managed by Queue Service

**Data Flow:**
```
Walk-in with Token → Queue Model Entry Created
├─ queueDate: Today's start of day (00:00:00)
├─ tokenNumber: DDMM-### (e.g., 2002-001)
├─ position: Sequential per doctor per day (1, 2, 3...)
├─ status: waiting/in-consultation/completed
└─ Displayed in Queue Management page
```

**Reception Actions:**
- View real-time queue status
- Search patients by token
- Mark patients as in-consultation
- Mark consultation complete
- **Remove patient from queue** (permanent deletion from database)

---

## Key Differences

| Aspect | Scheduled Appointment | Walk-In Patient | Queue Entry |
|--------|----------------------|-----------------|------------|
| **Booking Time** | Days/weeks in advance | Same day, at clinic | Same day, at check-in |
| **Page** | Appointments | Walk-In Check-In | Queue Management |
| **Token** | No token initially | Generated at check-in | Has DDMM-### token |
| **Data Model** | Appointment only | Appointment + Queue | Queue model |
| **appearIn** | appointmentType='scheduled' | appointmentType='walk-in' | Linked via appointmentId |
| **Status Tracking** | By appointment status | By queue position/token | By queue status |

---

## Database Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                    APPOINTMENT MODEL                         │
├─────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                               │
│ patientId: ref:Patient                                      │
│ doctorId: ref:Doctor                                        │
│ appointmentDate: Date                                       │
│ status: pending/accepted/completed/cancelled                │
│ appointmentType: 'scheduled' or 'walk-in' ✨ NEW FIELD      │
│ queueToken: String (null until checked in)                  │
│ queuePosition: Number (null until checked in)               │
│ reason: String                                              │
└─────────────────────────────────────────────────────────────┘
              ↓                               ↓
      (appointmentId)              (if walk-in with token)
              ↓                               ↓
    ┌─────────────────┐           ┌────────────────────┐
    │  PATIENT MODEL  │           │  QUEUE MODEL       │
    ├─────────────────┤           ├────────────────────┤
    │ name            │           │ _id: ObjectId      │
    │ phone           │           │ appointmentId:ref  │
    │ email           │           │ patientId: ref     │
    │ age             │           │ doctorId: ref      │
    │ gender          │           │ queueDate: Date    │
    └─────────────────┘           │ tokenNumber: DDMM- 
                                  │ position: 1, 2, 3..
                                  │ status: waiting/...
                                  │ checkInTime: Date
                                  └────────────────────┘
```

---

## API Endpoints Summary

### Scheduled Appointments
```
GET  /receptionist/appointments/scheduled?date=2026-02-20&status=pending
     → Returns only scheduled appointments (appointmentType='scheduled')
```

### Walk-In Patients
```
POST /receptionist/patient/walk-in/register
     → Register new walk-in patient

POST /receptionist/patient/walk-in/appointment
     → Create appointment for walk-in patient (type='walk-in')

POST /receptionist/patient/walk-in/token
     → Generate token and add to queue

GET  /receptionist/patient/walk-in/pending
     → Get patients registered but without tokens
```

### Queue Management
```
GET  /receptionist/queue/walk-in?date=2026-02-20
     → Get walk-in queue with tokens for today

DELETE /receptionist/queue/:queueId
       → Permanently remove patient from queue

GET  /receptionist/queue/status
     → Get all queue entries (for backward compatibility)
```

---

## Workflow Examples

### Example 1: Scheduled Patient Arrival
```
1. Patient booked appointment on Feb 18 for Feb 20, 10:00 AM
   → Appointment created with type='scheduled'
   
2. Feb 20, 9:55 AM - Patient arrives
   → Receptionist views Appointments page
   → Finds patient in "Scheduled" list
   → (Optional) Confirms patient presence
   
3. Patient waits for doctor
   → (Doctor-side) Gets queue when ready
   → Patient seen at booked time
```

### Example 2: Walk-In Patient
```
1. Patient arrives without appointment
   → Goes to Walk-In Check-In page
   
2. Receptionist registers patient
   → Enter: Name, Phone, Age, Gender
   → Select: Appropriate doctor
   → System creates appointment with type='walk-in'
   
3. Walk-in token generated
   → Display: "2002-001"
   → Print token (80mm × 100mm)
   → Patient joins queue
   
4. Queue Management page updated
   → Patient visible in queue
   → Doctor calls token when ready
   → Mark as "In Consultation"
   → Mark as "Completed"
   → Remove from queue (permanent database delete)
```

---

## Important Implementation Notes

### ✅ What's Fixed
1. **Appointment Type Field** - Now distinguishes scheduled vs walk-in
2. **Separate Endpoints** - Scheduled and walk-in data fetched separately
3. **Queue Removal** - Permanent deletion (not just UI filtering)
4. **Date Range Queries** - Properly create Date objects (not timestamps)

### ⚠️ For Developers
- Always set `appointmentType` when creating appointments
- Use `getScheduledAppointments` for appointment page
- Use `getWalkInQueue` for queue page
- Queue deletion calls `removePatientFromQueue` (backend required)
- Token format: Always DDMM-### (reset daily)

### 🔄 Future Enhancements
- Add appointment confirmation/no-show tracking
- Implement automatic queue reset at midnight
- Add SMS notification for walk-in token
- Export queue reports per doctor per day
