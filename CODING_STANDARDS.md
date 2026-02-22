# Coding Standards & Guidelines - Clinic Management System

## Overview

This document outlines the coding standards and best practices for the Clinic Management System project. All developers must adhere to these guidelines to ensure code quality, maintainability, and consistency.

---

## 1. Code Quality Principles

### 1.1 Modularity
- **Single Responsibility Principle (SRP)**: Each function/class should have a single, well-defined responsibility
- **DRY (Don't Repeat Yourself)**: Eliminate code duplication by creating reusable functions and utilities
- **Separation of Concerns**: Clearly separate business logic (services), data access (models), and request handling (controllers)

**Example - Proper Modularity**:
```javascript
// ✅ Good: Service handles business logic
// services/queueService.js
class QueueService {
  async addToQueue(appointmentId, patientId, doctorId, date) {
    const token = await this.generateToken();
    const position = await this.calculatePosition(doctorId, date);
    return Queue.create({ appointmentId, patientId, doctorId, token, position, date });
  }
}

// ✅ Good: Controller handles HTTP request/response
// controllers/receptionistController.js
exports.checkInPatient = async (req, res, next) => {
  const { appointmentId } = req.body;
  const queueEntry = await queueService.addToQueue(appointmentId, ...);
  res.status(200).json({ success: true, data: queueEntry });
};
```

### 1.2 Code Safety
- **Input Validation**: Always validate user inputs before processing
- **Error Handling**: Use try-catch blocks and proper error propagation
- **No Hardcoded Values**: Use environment variables for configuration
- **SQL/NoSQL Injection Prevention**: Use parameterized queries and Mongoose validation

**Example - Input Validation**:
```javascript
// ✅ Good: Validate inputs
const { email, password } = req.body;
if (!email || !password) {
  return res.status(400).json({ message: 'Email and password required' });
}
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return res.status(400).json({ message: 'Invalid email format' });
}
```

### 1.3 Testability
- **Write Testable Code**: Functions should have clear inputs/outputs
- **Avoid Side Effects**: Functions should not depend on external state
- **Mock External Services**: Use mocks for database and API calls in tests
- **Unit Test Coverage**: Aim for 80%+ code coverage

**Example - Testable Function**:
```javascript
// ✅ Good: Pure function, easily testable
const calculateBillingAmount = (subtotal, tax, discount) => {
  return subtotal + tax - discount;
};

// Test
test('should calculate billing correctly', () => {
  expect(calculateBillingAmount(100, 10, 5)).toBe(105);
});
```

### 1.4 Maintainability
- **Clear Naming**: Use descriptive variable and function names
- **Comments**: Document complex logic, WHY not WHAT
- **Consistent Formatting**: Follow consistent indentation (2 spaces) and structure
- **No Magic Numbers**: Use named constants for magic numbers

**Example - Good Naming & Comments**:
```javascript
// ❌ Bad
const calcF = (p, r, t) => p * (1 + r) ** t;

// ✅ Good
const calculateCompoundInterest = (principal, annualRate, timeInYears) => {
  const rate = annualRate / 100;
  return principal * (1 + rate) ** timeInYears;
};

// Document complex logic
// Uses exponential formula for compound interest calculation
// Formula: A = P(1 + r/100)^t
```

### 1.5 Portability
- **Cross-Platform Compatibility**: Avoid OS-specific code (use path.join instead of hardcoded paths)
- **Environment Agnostic**: Code should work on Linux, Windows, macOS
- **Dependency Management**: Use npm/yarn, avoid local dependencies

**Example - Cross-Platform Paths**:
```javascript
// ❌ Bad: Windows-specific
const logsPath = 'D:\\logs\\app.log';

// ✅ Good: Cross-platform
const path = require('path');
const logsPath = path.join(__dirname, 'logs', 'app.log');
```

---

## 2. Naming Conventions

### 2.1 Variables & Functions
```javascript
// ✅ Good: camelCase for variables and functions
const patientName = 'John Doe';
const getDoctorList = () => { /* ... */ };

// ❌ Avoid: snake_case or PascalCase for non-classes
const patient_name = 'John Doe';
const GetDoctorList = () => { /* ... */ };
```

### 2.2 Classes & Constructors
```javascript
// ✅ Good: PascalCase for classes
class DoctorService {
  async createDoctor(data) { /* ... */ }
}

// ❌ Avoid: camelCase for classes
class doctorService { /* ... */ }
```

### 2.3 Constants
```javascript
// ✅ Good: UPPER_SNAKE_CASE for constants
const MAX_APPOINTMENT_DURATION = 30; // minutes
const QUEUE_TOKEN_PREFIX = 'TKN';
const DEFAULT_PAGE_SIZE = 10;

// ❌ Avoid: other cases
const maxAppointmentDuration = 30;
const MaxAppointmentDuration = 30;
```

### 2.4 File Names
```javascript
// ✅ Good conventions
models/Doctor.js              // Model files: PascalCase
controllers/doctorController.js // Controller files: camelCase + "Controller"
services/doctorService.js     // Service files: camelCase + "Service"
routes/doctorRouter.js        // Router files: camelCase + "Router"
utils/tokenGenerator.js       // Utility files: descriptive camelCase
config/database.js            // Config files: camelCase
__tests__/doctorController.test.js // Test files: descriptive + ".test.js"

// ❌ Avoid
models/doctor.js              // Lowercase model files
Doctor-Controller.js          // Hyphenated names
DoCtOr.js                      // Mixed case
```

---

## 3. Project Structure Standards

### 3.1 Backend Structure
```
backend/
├── config/           # Configuration files (database, logger, email)
├── controllers/      # Request handlers
├── models/          # Mongoose schemas
├── routes/          # Route definitions
├── middleware/      # Custom middleware
├── services/        # Business logic
├── utils/           # Helper functions and utilities
├── __tests__/       # Test files (mirror folder structure)
├── logs/            # Log files (generated at runtime)
├── .env.example     # Environment template
├── server.js        # Application entry point
├── jest.config.js   # Jest configuration
└── package.json
```

### 3.2 Frontend Structure
```
frontend/
├── src/
│   ├── pages/           # Page components (organized by role)
│   │   ├── doctor/
│   │   ├── patient/
│   │   └── receptionist/
│   ├── components/      # Reusable components
│   │   └── common/      # Common/shared components
│   ├── api/            # API integration
│   ├── context/        # React Context
│   ├── store/          # Redux store (state management)
│   │   └── slices/     # Redux slices
│   ├── App.jsx         # Main app component
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
├── public/            # Static assets
├── .env.example       # Environment template
└── package.json
```

---

## 4. Backend Coding Standards

### 4.1 Controllers
```javascript
// ✅ Good: Clear error handling and response structure
exports.createBilling = async (req, res, next) => {
  try {
    const { patientId, items, total } = req.body;
    
    logger.info(`Creating billing for patient ${patientId}`);
    
    // Validate inputs
    if (!patientId || !items || items.length === 0) {
      logger.warn('Invalid billing data provided');
      return res.status(400).json({ message: 'Invalid data' });
    }
    
    const billing = await Billing.create({
      patientId,
      items,
      total,
      paymentStatus: 'pending'
    });
    
    logger.info(`Billing created: ${billing._id}`);
    res.status(201).json({ success: true, data: billing });
  } catch (error) {
    logger.error(`Billing error: ${error.message}`);
    next(error);
  }
};
```

### 4.2 Services
```javascript
// ✅ Good: Business logic separated from HTTP layer
class QueueService {
  async addToQueue(appointmentId, patientId, doctorId, date) {
    logger.info(`Adding to queue: AppointmentId=${appointmentId}`);
    
    const tokenNumber = await this.generateNextToken(doctorId, date);
    const position = await this.getQueuePosition(doctorId, date);
    
    const queueEntry = new Queue({
      appointmentId,
      patientId,
      doctorId,
      tokenNumber,
      position,
      date,
      status: 'waiting'
    });
    
    await queueEntry.save();
    logger.info(`Queue entry created: ${queueEntry._id}`);
    return queueEntry;
  }
}

module.exports = new QueueService();
```

### 4.3 Logging Standards
```javascript
// ✅ Good: Structured logging with context
const logger = require('../config/logger');

// Log successful operations
logger.info(`User registered: ID=${user._id}, Email=${email}, Role=${role}`);
logger.info(`Appointment booked: ID=${appointment._id}, Doctor=${doctorId}, Date=${date}`);

// Log warnings
logger.warn(`Login failed: Invalid credentials for ${email}`);
logger.warn(`Appointment not found: ID=${appointmentId}`);

// Log errors with context
logger.error(`Database error: ${error.message}`, { userId, action: 'createBilling' });
logger.error(`Queue operation failed: ${error.message}`);

// Log important events
logger.info(`Payment processed: Amount=${amount}, Patient=${patientId}, Method=${paymentMethod}`);
logger.info(`Medical record updated: RecordId=${recordId}, Changes=${JSON.stringify(updates)}`);
```

---

## 5. Frontend Coding Standards

### 5.1 React Components
```javascript
// ✅ Good: Functional component with hooks
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    fetchAppointments();
  }, [user.id]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/doctor/appointments`);
      setAppointments(response.data.data);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="appointments-container">
      {loading && <div>Loading...</div>}
      {appointments.map(apt => (
        <AppointmentCard key={apt._id} appointment={apt} />
      ))}
    </div>
  );
};

export default DoctorAppointments;
```

### 5.2 Redux Store
```javascript
// ✅ Good: Redux Toolkit slice structure
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchAppointments = createAsyncThunk(
  'appointments/fetchAppointments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/doctor/appointments');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default appointmentSlice.reducer;
```

---

## 6. Database Standards

### 6.1 Model Design
```javascript
// ✅ Good: Clear schema with validation
const appointmentSchema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required'],
    index: true
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Doctor ID is required'],
    index: true
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required'],
    validate: {
      validator: (date) => date > new Date(),
      message: 'Appointment date must be in future'
    }
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled',
    index: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

// Add indexes for frequently queried fields
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ patientId: 1, createdAt: -1 });
```

---

## 7. Error Handling Standards

### 7.1 Consistent Error Responses
```javascript
// ✅ Standard error response format
{
  success: false,
  message: "Error message",
  code: "ERROR_CODE",
  errors: [
    { field: "email", message: "Invalid email format" }
  ]
}

// Example
exports.createBilling = async (req, res, next) => {
  try {
    // ... implementation
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: Object.values(error.errors).map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }
    next(error);
  }
};
```

### 7.2 Logging Errors
```javascript
// ✅ Good: Log errors with context
try {
  await processPayment(patientId, amount);
} catch (error) {
  logger.error('Payment processing failed', {
    patientId,
    amount,
    error: error.message,
    stack: error.stack
  });
  return res.status(500).json({ message: 'Payment failed' });
}
```

---

## 8. Security Standards

### 8.1 Authentication & Authorization
```javascript
// ✅ Good: Protect sensitive routes
const { protect, authorize } = require('../middleware/auth');

router.post('/billing', protect, authorize('receptionist'), createBilling);
router.get('/appointments', protect, authorize('doctor', 'patient'), getAppointments);
```

### 8.2 Password Security
```javascript
// ✅ Good: Hash passwords before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
```

### 8.3 Environment Variables
```bash
# .env file - Never commit!
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/clinic
JWT_SECRET=your_secret_key_min_32_chars
NODE_ENV=production
API_URL=https://api.clinicmanagement.com
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
```

---

## 9. Testing Standards

### 9.1 Test File Organization
```javascript
// ✅ Good: Organized test structure
describe('Authentication Controller', () => {
  describe('User Login', () => {
    test('should login user with valid credentials', async () => {
      // Arrange
      const loginData = { email: 'doctor@clinic.com', password: 'SecurePass123!' };
      
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });

    test('should reject login with invalid password', async () => {
      const loginData = { email: 'doctor@clinic.com', password: 'wrong' };
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);
      
      expect(response.status).toBe(401);
    });
  });
});
```

---

## 10. Documentation Standards

### 10.1 Inline Comments
```javascript
// ✅ Good: Explain WHY, not WHAT
class QueueService {
  // Calculate position considering only patients with 'waiting' status
  // to exclude those already being served by other doctors
  async getQueuePosition(doctorId, date) {
    return await Queue.countDocuments({
      doctorId,
      date: { $gte: startOfDay(date), $lte: endOfDay(date) },
      status: 'waiting'
    });
  }
}
```

### 10.2 Function Documentation
```javascript
/**
 * Generate a unique queue token for a patient
 * @param {string} doctorId - The doctor's ID
 * @param {Date} date - The appointment date
 * @returns {Promise<string>} The generated token number
 * @throws {Error} If token generation fails
 * 
 * @example
 * const token = await generateToken('doctor123', new Date());
 * // Returns: 'TKN20240218001'
 */
async function generateToken(doctorId, date) {
  // Implementation
}
```

---

## 11. Performance Standards

### 11.1 Database Queries
```javascript
// ❌ Bad: N+1 query problem
const doctors = await Doctor.find();
for (let doctor of doctors) {
  const appointments = await Appointment.find({ doctorId: doctor._id });
}

// ✅ Good: Use .populate() to fetch related data
const doctors = await Doctor.find()
  .populate('appointments')
  .lean(); // Use .lean() for read-only queries
```

### 11.2 Pagination
```javascript
// ✅ Good: Implement pagination for large datasets
exports.getAppointments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const appointments = await Appointment.find()
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    const total = await Appointment.countDocuments();

    res.json({
      success: true,
      data: appointments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};
```

---

## 12. Checklist Before Committing Code

- [ ] Code follows naming conventions
- [ ] Code is properly indented (2 spaces)
- [ ] No `console.log()` statements (use logger)
- [ ] No hardcoded values (use constants/env variables)
- [ ] All functions have JSDoc comments
- [ ] Error handling implemented with proper logging
- [ ] No unused imports or variables
- [ ] Input validation on all endpoints
- [ ] Security best practices followed
- [ ] Tests written and passing
- [ ] `.env` file NOT committed

---

## References

- [JavaScript Coding Standards](https://google.github.io/styleguide/jsguide.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Hooks Best Practices](https://react.dev/reference/rules/rules-of-hooks)
- [MongoDB Best Practices](https://www.mongodb.com/blog/post/schema-design-best-practices)

