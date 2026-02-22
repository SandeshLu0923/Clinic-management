const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional for walk-in patients
  },
  patientType: {
    type: String,
    enum: ['registered', 'walk-in'],
    default: 'registered',
  },
  name: {
    type: String,
    required: true, // Required for both registered and walk-in
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false, // Not required for walk-ins
  },
  dateOfBirth: {
    type: Date,
    required: false,
  },
  age: {
    type: Number,
    required: false, // For walk-ins who prefer to give age instead of DOB
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  medicalHistory: [String],
  allergies: [String],
  emergencyContact: {
    name: String,
    phone: String,
    relation: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Patient', PatientSchema);
