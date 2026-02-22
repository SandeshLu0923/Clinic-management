const mongoose = require('mongoose');

const QueueSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
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
  queueDate: {
    type: Date,
    required: true,
  },
  tokenNumber: {
    type: String,
    required: true,
    unique: true,
  },
  position: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['waiting', 'in-consultation', 'pending-transaction', 'completed', 'no-show', 'cancelled'],
    default: 'waiting',
  },
  checkInTime: Date,
  consultationStartTime: Date,
  consultationEndTime: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Queue', QueueSchema);
