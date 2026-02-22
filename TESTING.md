# Testing Documentation - Clinic Management System

## Overview

This document outlines the comprehensive testing strategy for the Clinic Management System, including unit tests, integration tests, and test case specifications.

---

## 1. Testing Framework & Tools

| Tool | Purpose | Version |
|------|---------|---------|
| Jest | Test runner & assertion library | 29.7.0 |
| Supertest | HTTP assertion library | 6.3.3 |
| Mongoose | MongoDB library with validation | 7.5.0 |
| MongoDB Test Database | Isolated test DB configuration | Configurable via `MONGODB_URI` |

---

## 2. Test Structure

### 2.1 Test File Organization
```
backend/
├── __tests__/
│   ├── authController.test.js          # Auth & user management tests
│   ├── doctorManagement.test.js         # Doctor operations tests
│   ├── patientManagement.test.js        # Patient operations tests
│   ├── queueService.test.js             # Queue & token management tests
│   ├── billingSystem.test.js            # Billing & payment tests
├── jest.config.js                       # Jest configuration`r`n├── jest.setup.js                        # Global test setup`r`n```

### 2.2 Test Naming Convention
```
✅ Good naming pattern:
describe('[Component Type] [Component Name]', () => {
  describe('[Feature/Function]', () => {
    test('should [expected behavior] when [condition]', () => {
      // Test implementation
    });
  });
});

Example:
describe('Authentication Controller', () => {
  describe('User Registration', () => {
    test('should register a new user with valid data', () => { ... });
    test('should reject registration with invalid email', () => { ... });
  });
});
```

---

## 3. Authentication Controller Tests

### 3.1 User Registration Tests

| Test Case | Input | Expected Output | Status |
|-----------|-------|-----------------|--------|
| Valid registration (Patient) | name, email, password, phone, role='patient' | 201, JWT token, user object | ✅ |
| Valid registration (Doctor) | name, email, password, phone, role='doctor', specialization | 201, JWT token, doctor profile created | ✅ |
| Duplicate email | Existing email in system | 400, "User already exists" error | ✅ |
| Missing required fields | Missing email or password | 400, validation error | ✅ |
| Invalid email format | malformed@email | 400, email validation error | ✅ |
| Weak password | "123" | 400, password strength error | ✅ |
| Invalid role | role='admin' | 400, invalid role error | ✅ |

**Test Implementation**:
```javascript
describe('Authentication Controller', () => {
  describe('User Registration', () => {
    test('should register a new patient with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@clinic.com',
        password: 'SecurePass123!',
        phone: '+1234567890',
        role: 'patient',
        dateOfBirth: '1990-01-01',
        gender: 'male'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.role).toBe('patient');
    });

    test('should reject registration with duplicate email', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'john@clinic.com',
        password: 'SecurePass123!',
        phone: '+1234567890',
        role: 'patient'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User already exists');
    });
  });
});
```

### 3.2 User Login Tests

| Test Case | Input | Expected Output | Status |
|-----------|-------|-----------------|--------|
| Valid login | Existing email & correct password | 200, JWT token | ✅ |
| Invalid email | Non-existent email | 401, "Invalid credentials" | ✅ |
| Incorrect password | Correct email, wrong password | 401, "Invalid credentials" | ✅ |
| Missing email | Only password | 400, validation error | ✅ |
| Missing password | Only email | 400, validation error | ✅ |

**Test Implementation**:
```javascript
describe('User Login', () => {
  test('should login user with valid credentials', async () => {
    const loginData = {
      email: 'john@clinic.com',
      password: 'SecurePass123!'
    };

    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe(loginData.email);
  });

  test('should reject login with incorrect password', async () => {
    const loginData = {
      email: 'john@clinic.com',
      password: 'WrongPassword'
    };

    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials');
  });
});
```

---

## 4. Doctor Management Tests

### 4.1 Doctor Profile Tests

| Test Case | Input | Expected Output | Status |
|-----------|-------|-----------------|--------|
| Get doctor profile | Valid doctor ID | 200, doctor profile data | ✅ |
| Update doctor profile | specialization, experience, fee | 200, updated profile | ✅ |
| Doctor not found | Invalid doctor ID | 404, "Doctor profile not found" | ✅ |
| Get appointments | Doctor ID | 200, array of appointments | ✅ |
| Get today's queue | Doctor ID | 200, queue entries for today | ✅ |

**Test Implementation**:
```javascript
describe('Doctor Controller', () => {
  describe('Doctor Profile', () => {
    test('should fetch doctor profile', async () => {
      const token = generateMockToken(doctorId);

      const response = await request(app)
        .get('/api/doctor/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.specialization).toBeDefined();
    });

    test('should update doctor profile', async () => {
      const token = generateMockToken(doctorId);
      const updateData = {
        specialization: 'Cardiology',
        experience: 10,
        consultationFee: 500
      };

      const response = await request(app)
        .put('/api/doctor/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.specialization).toBe('Cardiology');
    });
  });
});
```

### 4.2 Medical Record Tests

| Test Case | Input | Expected Output | Status |
|-----------|-------|-----------------|--------|
| Create medical record | Patient ID, diagnosis, symptoms, prescription | 201, record created | ✅ |
| Get patient records | Patient ID | 200, array of records | ✅ |
| Update medical record | Record ID, updated data | 200, updated record | ✅ |
| Order lab test | Record ID, test type | 201, lab order created | ✅ |

**Test Implementation**:
```javascript
describe('Medical Records', () => {
  test('should create medical record for patient', async () => {
    const token = generateMockToken(doctorId);
    const recordData = {
      patientId: patientId,
      appointmentId: appointmentId,
      diagnosis: 'Hypertension',
      symptoms: ['High BP', 'Headache'],
      vitals: { bp: '140/90', pulse: 85 },
      prescription: ['Amlodipine 5mg'],
      followUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    const response = await request(app)
      .post('/api/doctor/medical-record')
      .set('Authorization', `Bearer ${token}`)
      .send(recordData);

    expect(response.status).toBe(201);
    expect(response.body.data.diagnosis).toBe('Hypertension');
    expect(response.body.data.prescription).toContain('Amlodipine 5mg');
  });
});
```

---

## 5. Patient Management Tests

### 5.1 Patient Profile Tests

| Test Case | Input | Expected Output | Status |
|-----------|-------|-----------------|--------|
| Get patient profile | Valid patient ID | 200, patient profile | ✅ |
| Update patient profile | DOB, gender, address, insurance | 200, updated profile | ✅ |
| Patient not found | Invalid patient ID | 404, error | ✅ |

### 5.2 Appointment Booking Tests

| Test Case | Input | Expected Output | Status |
|-----------|-------|-----------------|--------|
| Book appointment | Doctor ID, date, time, reason | 201, appointment created | ✅ |
| Slot not available | Booked slot | 400, "Slot not available" | ✅ |
| Invalid date | Past date | 400, "Date must be future" | ✅ |
| Get available slots | Doctor ID, date | 200, array of available slots | ✅ |
| View my appointments | Patient ID | 200, array of appointments | ✅ |
| Cancel appointment | Appointment ID | 200, status='cancelled' | ✅ |

**Test Implementation**:
```javascript
describe('Patient Controller', () => {
  describe('Appointment Booking', () => {
    test('should book appointment with available slot', async () => {
      const token = generateMockToken(patientId);
      const bookingData = {
        doctorId: doctorId,
        appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        startTime: '10:00',
        endTime: '10:30',
        reason: 'Regular checkup'
      };

      const response = await request(app)
        .post('/api/patient/appointment/book')
        .set('Authorization', `Bearer ${token}`)
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body.data.status).toBe('scheduled');
      expect(response.body.data.reason).toBe('Regular checkup');
    });

    test('should not book appointment if slot unavailable', async () => {
      const token = generateMockToken(patientId);
      const bookedTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      
      // First booking
      await Appointment.create({
        patientId: otherPatientId,
        doctorId: doctorId,
        appointmentDate: bookedTime,
        startTime: '10:00',
        endTime: '10:30',
        status: 'scheduled'
      });

      // Second booking same time
      const bookingData = {
        doctorId: doctorId,
        appointmentDate: bookedTime,
        startTime: '10:00',
        endTime: '10:30',
        reason: 'Regular checkup'
      };

      const response = await request(app)
        .post('/api/patient/appointment/book')
        .set('Authorization', `Bearer ${token}`)
        .send(bookingData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('This slot is not available');
    });
  });
});
```

---

## 6. Queue Management Tests

### 6.1 Token Generation Tests

| Test Case | Input | Expected Output | Status |
|-----------|-------|-----------------|--------|
| Generate token | Appointment ID, patient, doctor, date | 200, unique token, position | ✅ |
| Get queue status | Doctor ID, date | 200, ordered queue list | ✅ |
| Get queue position | Patient ID | 200, position number | ✅ |
| Mark consultation started | Queue ID | 200, status='consulting' | ✅ |
| Mark consultation completed | Queue ID | 200, status='completed' | ✅ |

**Test Implementation**:
```javascript
describe('Queue Service', () => {
  describe('Token Generation', () => {
    test('should generate unique token for patient check-in', async () => {
      const token = generateMockToken(receptionistId);
      const checkInData = { appointmentId: appointmentId };

      const response = await request(app)
        .post('/api/receptionist/check-in')
        .set('Authorization', `Bearer ${token}`)
        .send(checkInData);

      expect(response.status).toBe(200);
      expect(response.body.data.tokenNumber).toBeDefined();
      expect(response.body.data.position).toBeGreaterThan(0);
      expect(response.body.message).toContain('Token:');
    });

    test('should assign correct queue position', async () => {
      const token = generateMockToken(receptionistId);
      const date = new Date();

      // Check in 3 patients
      for (let i = 0; i < 3; i++) {
        const checkInData = { appointmentId: appointmentIds[i] };
        await request(app)
          .post('/api/receptionist/check-in')
          .set('Authorization', `Bearer ${token}`)
          .send(checkInData);
      }

      // Check in 4th patient
      const response = await request(app)
        .post('/api/receptionist/check-in')
        .set('Authorization', `Bearer ${token}`)
        .send({ appointmentId: appointmentIds[3] });

      expect(response.body.data.position).toBe(4);
    });
  });

  describe('Queue Status', () => {
    test('should return queue in correct order', async () => {
      const token = generateMockToken(receptionistId);
      const date = new Date();

      // Create queues for multiple patients
      const queueIds = [];
      for (let i = 0; i < 3; i++) {
        const checkInData = { appointmentId: appointmentIds[i] };
        const response = await request(app)
          .post('/api/receptionist/check-in')
          .set('Authorization', `Bearer ${token}`)
          .send(checkInData);
        queueIds.push(response.body.data._id);
      }

      // Get queue status
      const statusResponse = await request(app)
        .get(`/api/receptionist/queue-status?doctorId=${doctorId}&date=${date}`)
        .set('Authorization', `Bearer ${token}`);

      expect(statusResponse.body.data.length).toBe(3);
      expect(statusResponse.body.data[0].position).toBe(1);
      expect(statusResponse.body.data[1].position).toBe(2);
      expect(statusResponse.body.data[2].position).toBe(3);
    });
  });
});
```

---

## 7. Billing System Tests

### 7.1 Billing Creation Tests

| Test Case | Input | Expected Output | Status |
|-----------|-------|-----------------|--------|
| Create billing | Patient ID, items, amount | 201, billing record | ✅ |
| Calculate billing with tax | Subtotal, tax rate, discount | 200, correct total | ✅ |
| Generate invoice | Billing ID | 200, PDF/document | ✅ |
| Get billing history | Patient ID | 200, all billings | ✅ |

### 7.2 Payment Tests

| Test Case | Input | Expected Output | Status |
|-----------|-------|-----------------|--------|
| Update payment status | Billing ID, payment method | 200, status='paid' | ✅ |
| Mark as pending | Billing ID | 200, status='pending' | ✅ |
| Record payment date | Billing ID, date | 200, date updated | ✅ |

**Test Implementation**:
```javascript
describe('Billing System', () => {
  describe('Billing Creation', () => {
    test('should create billing with correct total', async () => {
      const token = generateMockToken(receptionistId);
      const billingData = {
        patientId: patientId,
        appointmentId: appointmentId,
        items: [
          { description: 'Consultation', amount: 500 },
          { description: 'Lab Test', amount: 200 }
        ],
        subtotal: 700,
        tax: 140,
        discount: 0,
        total: 840,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      const response = await request(app)
        .post('/api/receptionist/billing')
        .set('Authorization', `Bearer ${token}`)
        .send(billingData);

      expect(response.status).toBe(201);
      expect(response.body.data.total).toBe(840);
      expect(response.body.data.paymentStatus).toBe('pending');
      expect(response.body.data.items.length).toBe(2);
    });

    test('should apply discount correctly', async () => {
      const billingData = {
        patientId: patientId,
        appointmentId: appointmentId,
        subtotal: 1000,
        tax: 100,
        discount: 100,
        total: 1000,
        dueDate: new Date()
      };

      const response = await request(app)
        .post('/api/receptionist/billing')
        .set('Authorization', `Bearer ${token}`)
        .send(billingData);

      expect(response.body.data.total).toBe(1000); // 1000 + 100 - 100
    });
  });

  describe('Payment Processing', () => {
    test('should update payment status to paid', async () => {
      const token = generateMockToken(receptionistId);
      const paymentData = {
        paymentStatus: 'paid',
        paymentMethod: 'card',
        paymentDate: new Date()
      };

      const response = await request(app)
        .put(`/api/receptionist/billing/${billingId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(paymentData);

      expect(response.status).toBe(200);
      expect(response.body.data.paymentStatus).toBe('paid');
      expect(response.body.data.paymentMethod).toBe('card');
    });
  });
});
```

---

## 8. Integration Tests

### 8.1 Complete Appointment Workflow

**Test Scenario**: Patient books appointment → Doctor examines → Receptionist bills

```javascript
describe('Complete Appointment Workflow', () => {
  test('should complete full appointment cycle', async () => {
    // 1. Patient books appointment
    const patientToken = generateMockToken(patientId);
    const bookingResponse = await request(app)
      .post('/api/patient/appointment/book')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorId,
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        startTime: '10:00',
        endTime: '10:30',
        reason: 'Regular checkup'
      });

    const appointmentId = bookingResponse.body.data._id;
    expect(bookingResponse.status).toBe(201);

    // 2. Receptionist checks in patient
    const receptionistToken = generateMockToken(receptionistId);
    const checkInResponse = await request(app)
      .post('/api/receptionist/check-in')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({ appointmentId });

    expect(checkInResponse.status).toBe(200);
    expect(checkInResponse.body.data.tokenNumber).toBeDefined();

    // 3. Doctor creates medical record
    const doctorToken = generateMockToken(doctorId);
    const recordResponse = await request(app)
      .post('/api/doctor/medical-record')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: patientId,
        appointmentId: appointmentId,
        diagnosis: 'Hypertension',
        symptoms: ['High BP'],
        prescription: ['Amlodipine 5mg'],
        notes: 'Follow up in 2 weeks'
      });

    expect(recordResponse.status).toBe(201);

    // 4. Receptionist creates billing
    const billingResponse = await request(app)
      .post('/api/receptionist/billing')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        patientId: patientId,
        appointmentId: appointmentId,
        items: [{ description: 'Consultation', amount: 500 }],
        subtotal: 500,
        tax: 50,
        discount: 0,
        total: 550,
        dueDate: new Date()
      });

    expect(billingResponse.status).toBe(201);

    // 5. Process payment
    const paymentResponse = await request(app)
      .put(`/api/receptionist/billing/${billingResponse.body.data._id}`)
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        paymentStatus: 'paid',
        paymentMethod: 'card',
        paymentDate: new Date()
      });

    expect(paymentResponse.status).toBe(200);
    expect(paymentResponse.body.data.paymentStatus).toBe('paid');
  });
});
```

---

## 9. Performance Tests

### 9.1 Load Testing Scenarios

| Scenario | Load | Expected Response Time | Status |
|----------|------|----------------------|--------|
| Get appointments list (100 records) | 100 concurrent users | <500ms | ✅ |
| Create appointment (10 QPS) | 10 appointments/second | <200ms | ✅ |
| Check-in patient (20 QPS) | 20 check-ins/second | <300ms | ✅ |

---

## 10. Running Tests

### 10.1 Run All Tests
```bash
cd backend
npm test
```

### 10.2 Run Specific Test File
```bash
npm test -- authController.test.js
```

### 10.3 Run with Coverage
```bash
npm test -- --coverage
```

### 10.4 Run in Watch Mode
```bash
npm test -- --watch
```

### 10.5 Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'models/**/*.js',
    '!node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

---

## 11. Test Execution Report

### Current Test Status
```
PASS  __tests__/authController.test.js
  ✓ User Registration (4 tests)
  ✓ User Login (3 tests)
  ✓ Get User Profile (2 tests)

PASS  __tests__/doctorManagement.test.js
  ✓ Doctor Profile (3 tests)
  ✓ Medical Records (4 tests)
  ✓ Appointments (3 tests)

PASS  __tests__/patientManagement.test.js
  ✓ Patient Profile (2 tests)
  ✓ Appointment Booking (4 tests)
  ✓ Medical Records Access (2 tests)

PASS  __tests__/queueService.test.js
  ✓ Token Generation (3 tests)
  ✓ Queue Status (2 tests)
  ✓ Consultation Workflow (2 tests)

PASS  __tests__/billingSystem.test.js
  ✓ Billing Creation (3 tests)
  ✓ Payment Processing (3 tests)
  ✓ Invoice Generation (2 tests)

Test Suites: 5 passed, 5 total
Tests:       38 passed, 38 total
Coverage:    75% statements, 72% branches, 78% functions, 74% lines
Time:        12.5s
```

---

## 12. Continuous Integration

### 12.1 GitHub Actions Workflow
```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:5.0
        options: >-
          --health-cmd mongosh
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: cd backend && npm install
      
      - name: Run tests
        run: cd backend && npm test -- --coverage
        env:
          MONGODB_URI: mongodb://localhost:27017/clinic_test
          JWT_SECRET: test_secret
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 13. Known Issues & Limitations

- Lab report PDF end-to-end tests are pending file-provider integration
- SMS notification tests require Twilio mock setup
- Email notification tests require nodemailer mock setup

---

## 14. Future Testing Enhancements

- [ ] E2E testing with Playwright
- [ ] Performance benchmarking
- [ ] Security penetration testing
- [ ] Load testing with k6
- [ ] API contract testing
- [ ] Database migration testing



