const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  specialization: {
    type: String,
    required: true,
    enum: ['cardiology', 'neurology', 'orthopedics', 'pediatrics', 'dermatology', 'general'],
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
  },
  qualifications: [{
    degree: String,
    institution: String,
    year: Number,
  }],
  experience: {
    type: Number,
    default: 0,
  },
  consultationFee: {
    type: Number,
    default: 500,
  },
  availability: {
    type: {
      monday: {
        from: { type: String, default: '09:00' },
        to: { type: String, default: '17:00' },
        isAvailable: { type: Boolean, default: true },
      },
      tuesday: {
        from: { type: String, default: '09:00' },
        to: { type: String, default: '17:00' },
        isAvailable: { type: Boolean, default: true },
      },
      wednesday: {
        from: { type: String, default: '09:00' },
        to: { type: String, default: '17:00' },
        isAvailable: { type: Boolean, default: true },
      },
      thursday: {
        from: { type: String, default: '09:00' },
        to: { type: String, default: '17:00' },
        isAvailable: { type: Boolean, default: true },
      },
      friday: {
        from: { type: String, default: '09:00' },
        to: { type: String, default: '17:00' },
        isAvailable: { type: Boolean, default: true },
      },
      saturday: {
        from: { type: String, default: '09:00' },
        to: { type: String, default: '13:00' },
        isAvailable: { type: Boolean, default: true },
      },
      sunday: {
        isAvailable: { type: Boolean, default: false },
      },
    },
    default: {},
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalConsultations: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Doctor', DoctorSchema);
