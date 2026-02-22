const mongoose = require('mongoose');

const MedicalDocumentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  documentType: {
    type: String,
    enum: ['Report', 'Lab Test', 'Prescription', 'Medical History', 'X-Ray', 'Scan', 'Other'],
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  grantedDoctorIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('MedicalDocument', MedicalDocumentSchema);
