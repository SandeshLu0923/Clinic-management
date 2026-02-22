const mongoose = require('mongoose');

const BillingSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
  },
  items: [{
    description: String,
    amount: Number,
    quantity: {
      type: Number,
      default: 1,
    },
  }],
  subtotal: {
    type: Number,
    required: true,
  },
  tax: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'overdue'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank_transfer'],
    default: undefined,
  },
  paymentDate: {
    type: Date,
    default: null,
  },
  dueDate: {
    type: Date,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  description: String,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

BillingSchema.pre('validate', function generateInvoiceNumber(next) {
  if (!this.invoiceNumber) {
    const stamp = Date.now().toString().slice(-8);
    const suffix = Math.floor(100 + Math.random() * 900);
    this.invoiceNumber = `INV-${stamp}-${suffix}`;
  }
  next();
});

module.exports = mongoose.model('Billing', BillingSchema);
