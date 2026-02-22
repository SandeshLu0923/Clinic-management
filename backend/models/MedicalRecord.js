const mongoose = require('mongoose');

const MedicalRecordSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
  },
  visitDate: {
    type: Date,
    default: Date.now,
  },
  diagnosis: String,
  symptoms: [String],
  vitals: {
    bloodPressure: String,
    temperature: Number,
    heartRate: Number,
    respiratoryRate: Number,
    weight: Number,
    height: Number,
  },
  prescription: [{
    medicineId: mongoose.Schema.Types.ObjectId,
    medicineName: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String,
  }],
  labTests: [{
    testId: mongoose.Schema.Types.ObjectId,
    testName: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    result: String,
    reportUrl: String,
    createdAt: Date,
  }],
  notes: String,
  followUpDate: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema);
