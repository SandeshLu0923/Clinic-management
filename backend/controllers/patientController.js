const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Doctor = require('../models/Doctor');
const Billing = require('../models/Billing');
const Queue = require('../models/Queue');
const slotService = require('../services/slotService');
const logger = require('../config/logger');

const getPatientByUserId = async (userId) => {
  const patient = await Patient.findOne({ userId });
  return patient || null;
};

exports.getPatientProfile = async (req, res, next) => {
  try {
    const patient = await getPatientByUserId(req.user.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePatientProfile = async (req, res, next) => {
  try {
    const { dateOfBirth, gender, address, allergies, emergencyContact } = req.body;
    const normalizedGender = gender ? String(gender).trim().toLowerCase() : undefined;

    const patient = await Patient.findOneAndUpdate(
      { userId: req.user.id },
      { dateOfBirth, gender: normalizedGender, address, allergies, emergencyContact },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDoctors = async (req, res, next) => {
  try {
    const { specialization } = req.query;

    let query = { isVerified: true };
    if (specialization) {
      query.specialization = specialization;
    }

    let doctors = await Doctor.find(query)
      .populate('userId', 'name email phone')
      .select('userId specialization rating consultationFee experience availability licenseNumber qualifications totalConsultations');

    // Fallback for environments where doctors are not yet verified
    if (!doctors.length) {
      doctors = await Doctor.find(specialization ? { specialization } : {})
        .populate('userId', 'name email phone')
        .select('userId specialization rating consultationFee experience availability licenseNumber qualifications totalConsultations');
    }

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;

    const slots = await slotService.getAvailableSlots(doctorId, date);

    res.status(200).json({
      success: true,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

exports.bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, appointmentDate, startTime, endTime, reason, medicalRecordConsent } = req.body;

    logger.info(`Appointment booking initiated - Patient ID: ${req.user.id}, Doctor ID: ${doctorId}, Date: ${appointmentDate}`);

    // Check slot availability
    const isAvailable = await slotService.checkSlotAvailability(doctorId, appointmentDate, startTime);

    if (!isAvailable) {
      logger.warn(`Appointment booking failed: Slot not available - Doctor ID: ${doctorId}, Date: ${appointmentDate}, Time: ${startTime}`);
      return res.status(400).json({ message: 'This slot is not available' });
    }

    // Get patient
    const patient = await getPatientByUserId(req.user.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    // Get doctor with userId
    const doctor = await Doctor.findById(doctorId).populate('userId');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patientId: patient._id,
      doctorId,
      appointmentDate,
      startTime,
      endTime,
      reason,
      status: 'scheduled',
      medicalRecordConsent: Boolean(medicalRecordConsent),
    });

    logger.info(`Appointment booked successfully - Appointment ID: ${appointment._id}, Patient ID: ${patient._id}, Doctor ID: ${doctorId}, Date: ${appointmentDate}`);

    res.status(201).json({
      success: true,
      data: {
        appointment,
      },
    });
  } catch (error) {
    logger.error(`Book appointment error: ${error.message}`);
    next(error);
  }
};

exports.getMyAppointments = async (req, res, next) => {
  try {
    const patient = await getPatientByUserId(req.user.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const appointments = await Appointment.find({ patientId: patient._id })
      .populate({
        path: 'doctorId',
        select: 'userId specialization consultationFee',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .sort('-appointmentDate');

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const patient = await getPatientByUserId(req.user.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const appointment = await Appointment.findOne({ _id: appointmentId, patientId: patient._id });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (['completed', 'cancelled', 'in-consultation'].includes(appointment.status)) {
      return res.status(400).json({ message: `Cannot cancel appointment with status: ${appointment.status}` });
    }

    appointment.status = 'cancelled';
    appointment.updatedAt = new Date();
    await appointment.save();

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMedicalRecords = async (req, res, next) => {
  try {
    const patient = await getPatientByUserId(req.user.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const records = await MedicalRecord.find({ patientId: patient._id })
      .populate('doctorId', 'userId')
      .sort('-visitDate');

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

exports.getPrescriptions = async (req, res, next) => {
  try {
    const patient = await getPatientByUserId(req.user.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const records = await MedicalRecord.find({ patientId: patient._id, prescription: { $exists: true, $ne: [] } })
      .select('prescription visitDate')
      .sort('-visitDate');

    res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyBillings = async (req, res, next) => {
  try {
    const patient = await getPatientByUserId(req.user.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const billings = await Billing.find({ patientId: patient._id })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: billings.length,
      data: billings.map((billing) => ({
        _id: billing._id,
        invoiceNumber: billing.invoiceNumber || `INV-${String(billing._id).substring(0, 6).toUpperCase()}`,
        billDate: billing.createdAt,
        items: billing.items || [],
        subtotal: Number(billing.subtotal || 0),
        tax: Number(billing.tax || 0),
        discount: Number(billing.discount || 0),
        total: Number(billing.total || 0),
        paymentStatus: billing.paymentStatus || 'pending',
        paymentMethod: billing.paymentMethod || null,
        paymentDate: billing.paymentDate || null,
        dueDate: billing.dueDate || null,
      })),
    });
  } catch (error) {
    next(error);
  }
};

exports.payBilling = async (req, res, next) => {
  try {
    const { billingId } = req.params;
    const { paymentMethod = 'card' } = req.body;
    const patient = await getPatientByUserId(req.user.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const billing = await Billing.findOne({ _id: billingId, patientId: patient._id });
    if (!billing) {
      return res.status(404).json({ message: 'Billing record not found' });
    }

    if (billing.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Billing is already paid' });
    }

    billing.paymentStatus = 'paid';
    billing.paymentMethod = ['cash', 'card', 'upi', 'bank_transfer'].includes(String(paymentMethod)) ? paymentMethod : 'card';
    billing.paymentDate = new Date();
    billing.updatedAt = new Date();
    await billing.save();

    if (billing.appointmentId) {
      await Queue.findOneAndDelete({ appointmentId: billing.appointmentId });
      await Appointment.findByIdAndUpdate(
        billing.appointmentId,
        { status: 'completed', queuePosition: null, updatedAt: new Date() },
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      data: billing,
      message: 'Payment processed successfully',
    });
  } catch (error) {
    next(error);
  }
};
