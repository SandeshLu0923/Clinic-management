require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(helmet({
  // Allow frontend app (different origin/port) to embed uploaded files in previews.
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      'http://127.0.0.1:5176',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:3003',
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files.
// Remove frame/embed-restrictive headers for static uploads so frontend previews work across localhost ports.
app.use('/uploads', (req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Content-Security-Policy');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Rate limiting (lenient for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs (increased for development)
  skip: (req) => process.env.NODE_ENV !== 'production', // Skip in development
});
app.use('/api/', limiter);

// Routes
const authRouter = require('./routes/authRouter');
const doctorRouter = require('./routes/doctorRouter');
const patientRouter = require('./routes/patientRouter');
const receptionistRouter = require('./routes/receptionistRouter');
const medicalDocumentRouter = require('./routes/medicalDocumentRouter');

app.use('/api/auth', authRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/patient', patientRouter);
app.use('/api/receptionist', receptionistRouter);
app.use('/api/medical-documents', medicalDocumentRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Set a different PORT in backend/.env.`);
    process.exit(1);
  }
  throw error;
});
