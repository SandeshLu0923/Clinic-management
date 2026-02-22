const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    unique: true,
    sparse: true,
  },
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
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  appointmentDate: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'pending-bill', 'completed', 'cancelled', 'rescheduled', 'no-show', 'scheduled', 'confirmed', 'arrived', 'in-consultation'],
    default: 'pending',
  },
  doctorAcceptedAt: {
    type: Date,
    default: null,
  },
  acceptanceSentAt: {
    type: Date,
    default: null,
  },
  notes: String,
  reason: String,
  appointmentType: {
    type: String,
    enum: ['scheduled', 'walk-in'],
    default: 'scheduled',
    description: 'scheduled: booked in advance, walk-in: immediate check-in'
  },
  medicalRecordConsent: {
    type: Boolean,
    default: false,
  },
  queueToken: {
    type: String,
    default: null,
  },
  queuePosition: {
    type: Number,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to generate unique appointment ID
AppointmentSchema.pre('save', async function(next) {
  if (!this.appointmentId) {
    let uniqueId;
    let isUnique = false;
    const min = 1000;
    const max = 9999;
    
    while (!isUnique) {
      uniqueId = String(Math.floor(Math.random() * (max - min + 1)) + min);
      const existing = await mongoose.model('Appointment').findOne({ appointmentId: uniqueId });
      if (!existing) {
        isUnique = true;
      }
    }
    
    this.appointmentId = uniqueId;
  }
  next();
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
