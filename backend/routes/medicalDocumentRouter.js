const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const medicalDocumentController = require('../controllers/medicalDocumentController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '../uploads/medical-documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Allow PDFs, images, and common document formats
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, images, and documents are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Patient routes
router.post(
  '/upload',
  protect,
  upload.single('file'),
  medicalDocumentController.uploadMedicalDocument
);

router.get('/', protect, medicalDocumentController.getPatientDocuments);

router.put(
  '/:documentId/grant-access',
  protect,
  medicalDocumentController.grantDoctorAccess
);

router.put(
  '/:documentId/revoke-access/:doctorId',
  protect,
  medicalDocumentController.revokeDoctorAccess
);

router.delete('/:documentId', protect, medicalDocumentController.deleteMedicalDocument);

// Doctor route
router.get('/doctor/accessible', protect, medicalDocumentController.getDoctorAccessibleDocuments);

// Get all available doctors for access management
router.get('/doctors/available', protect, medicalDocumentController.getAvailableDoctors);

module.exports = router;
