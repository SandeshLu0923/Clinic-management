const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Queue = require('../models/Queue');
const Billing = require('../models/Billing');
const Doctor = require('../models/Doctor');
const Service = require('../models/Service');
const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const queueService = require('../services/queueService');
const slotService = require('../services/slotService');
const logger = require('../config/logger');

const VALID_PAYMENT_METHODS = new Set(['cash', 'card', 'upi', 'bank_transfer']);
const VALID_PAYMENT_STATUSES = new Set(['pending', 'paid', 'partial', 'overdue']);

const normalizePaymentMethod = (value) => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const normalized = String(value).trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (!VALID_PAYMENT_METHODS.has(normalized)) {
    return null;
  }

  return normalized;
};

exports.getDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find()
      .populate('userId', 'name email phone');

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    logger.error(`Get doctors error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error fetching doctors' });
  }
};

// Get pending walk-in patients (without tokens)
exports.getPendingWalkInPatients = async (req, res, next) => {
  try {
    // Get appointments for walk-in patients that don't have tokens yet
    const pendingAppointments = await Appointment.find({
      appointmentType: 'walk-in',
      $or: [{ queueToken: null }, { queueToken: { $exists: false } }],
      status: { $in: ['pending', 'accepted', 'scheduled', 'confirmed'] },
    })
      .populate('patientId')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name' }
      })
      .sort({ createdAt: -1 });

    const orphanAppointmentIds = [];
    const patientList = pendingAppointments.reduce((list, apt) => {
      const patient = apt.patientId;
      const doctor = apt.doctorId;

      // Defensive handling for orphaned refs to avoid 500s in receptionist queue.
      if (!patient || !doctor) {
        orphanAppointmentIds.push(apt._id);
        logger.warn(
          `Skipping pending walk-in appointment with missing references - Appointment ID: ${apt._id}, ` +
          `Patient exists: ${Boolean(patient)}, Doctor exists: ${Boolean(doctor)}`
        );
        return list;
      }

      list.push({
        appointmentId: apt._id,
        patientId: patient._id,
        patientName: patient.name || patient.userId?.name || 'Unknown',
        patientPhone: patient.phone || patient.userId?.phone || 'N/A',
        doctorId: doctor._id,
        doctorName: doctor.userId?.name || 'N/A',
        reason: apt.reason,
        createdAt: apt.createdAt,
      });

      return list;
    }, []);

    // Self-heal orphaned pending walk-ins in the same receptionist flow.
    // No extra role/endpoint required.
    if (orphanAppointmentIds.length > 0) {
      await Appointment.updateMany(
        { _id: { $in: orphanAppointmentIds } },
        {
          status: 'cancelled',
          queueToken: null,
          queuePosition: null,
          updatedAt: new Date(),
        }
      );

      await Queue.deleteMany({ appointmentId: { $in: orphanAppointmentIds } });
    }

    res.status(200).json({
      success: true,
      count: patientList.length,
      data: patientList,
    });
  } catch (error) {
    logger.error(`Get pending walk-in patients error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error fetching pending patients' });
  }
};

// Walk-in patient quick registration
exports.registerWalkInPatient = async (req, res, next) => {
  try {
    const { name, phone, age, gender } = req.body;

    logger.info(`Walk-in patient registration - Name: ${name}, Phone: ${phone}`);

    // Check if patient already exists by phone (to avoid duplicates)
    let patient = await Patient.findOne({ phone, patientType: 'walk-in' });

    if (patient) {
      logger.info(`Existing walk-in patient found - Patient ID: ${patient._id}`);
      return res.status(200).json({
        success: true,
        data: patient,
        message: 'Patient already registered',
      });
    }

    // Create new walk-in patient
    patient = await Patient.create({
      name,
      phone,
      age,
      gender,
      patientType: 'walk-in',
    });

    logger.info(`Walk-in patient registered successfully - Patient ID: ${patient._id}`);

    res.status(201).json({
      success: true,
      data: patient,
      message: 'Walk-in patient registered successfully',
    });
  } catch (error) {
    logger.error(`Register walk-in patient error: ${error.message}`);
    next(error);
  }
};

// Book appointment for walk-in patient
exports.bookWalkInAppointment = async (req, res, next) => {
  try {
    const { patientId, doctorId, reason, medicalRecordConsent } = req.body;

    logger.info(`Booking walk-in appointment - Patient ID: ${patientId}, Doctor ID: ${doctorId}`);

    const patient = await Patient.findById(patientId);
    const doctor = await Doctor.findById(doctorId);

    if (!patient || !doctor) {
      return res.status(404).json({
        success: false,
        message: 'Patient or Doctor not found',
      });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Idempotent behavior: reuse an existing pending walk-in appointment for the same patient+doctor today.
    const existingAppointment = await Appointment.findOne({
      patientId,
      doctorId,
      appointmentType: 'walk-in',
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'accepted', 'scheduled', 'confirmed'] },
      $or: [{ queueToken: null }, { queueToken: { $exists: false } }],
    }).sort({ createdAt: -1 });

    if (existingAppointment) {
      if (typeof medicalRecordConsent === 'boolean') {
        existingAppointment.medicalRecordConsent = medicalRecordConsent;
      }
      if (reason) {
        existingAppointment.reason = reason;
      }
      await existingAppointment.save();

      logger.info(`Reusing existing walk-in appointment - Appointment ID: ${existingAppointment._id}`);
      return res.status(200).json({
        success: true,
        data: existingAppointment,
        message: 'Existing walk-in appointment reused',
      });
    }

    // Create appointment for current time (immediate consultation)
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      appointmentDate: new Date(),
      startTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      endTime: new Date(Date.now() + 30 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      status: 'accepted',
      reason: reason || 'Walk-in consultation',
      appointmentType: 'walk-in',
      medicalRecordConsent: medicalRecordConsent !== undefined ? medicalRecordConsent : true, // Default true for walk-ins
    });

    logger.info(`Walk-in appointment created - Appointment ID: ${appointment._id}`);

    res.status(201).json({
      success: true,
      data: appointment,
      message: 'Appointment booked for walk-in patient',
    });
  } catch (error) {
    logger.error(`Book walk-in appointment error: ${error.message}`);
    next(error);
  }
};

// Generate token for walk-in patient (after appointment is booked)
exports.generateWalkInToken = async (req, res, next) => {
  try {
    const { appointmentId } = req.body;

    logger.info(`Generating token for walk-in - Appointment ID: ${appointmentId}`);

    const appointment = await Appointment.findById(appointmentId)
      .populate('patientId')
      .populate('doctorId');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Idempotent behavior: if token already generated for this appointment, return it.
    const existingQueueEntry = await Queue.findOne({ appointmentId });
    if (existingQueueEntry) {
      const responseData = {
        _id: existingQueueEntry._id,
        tokenNumber: existingQueueEntry.tokenNumber,
        position: existingQueueEntry.position,
        queueDate: existingQueueEntry.queueDate,
        status: existingQueueEntry.status,
      };

      return res.status(200).json({
        success: true,
        data: responseData,
        message: 'Token already generated for this appointment',
      });
    }

    // Add to queue with token generation
    const queueEntry = await queueService.addToQueue(
      appointmentId,
      appointment.patientId._id,
      appointment.doctorId._id,
      new Date(appointment.appointmentDate)
    );

    // Ensure queueEntry has all required fields
    const responseData = {
      _id: queueEntry._id,
      tokenNumber: queueEntry.tokenNumber,
      position: queueEntry.position,
      queueDate: queueEntry.queueDate,
      status: queueEntry.status,
    };

    logger.info(`Token generated for walk-in - Token: ${queueEntry.tokenNumber}, Patient: ${appointment.patientId.name}`);

    res.status(200).json({
      success: true,
      data: responseData,
      message: 'Token generated successfully',
    });
  } catch (error) {
    logger.error(`Generate walk-in token error: ${error.message}`);
    next(error);
  }
};

exports.addPatientToQueueAtPriority = async (req, res, next) => {
  try {
    const { appointmentId, patientId, doctorId } = req.body;

    logger.info(`Adding patient to queue at priority - Appointment ID: ${appointmentId}`);

    // Add to queue with priority (at the top)
    const queueEntry = await queueService.addPriorityToQueue(
      appointmentId,
      patientId,
      doctorId,
      new Date()
    );

    const responseData = {
      _id: queueEntry._id,
      tokenNumber: queueEntry.tokenNumber,
      position: queueEntry.position,
      queueDate: queueEntry.queueDate,
      status: queueEntry.status,
    };

    logger.info(`Patient added to priority queue - Token: ${queueEntry.tokenNumber}, Position: ${queueEntry.position}`);

    res.status(200).json({
      success: true,
      data: responseData,
      message: 'Patient added to queue at priority',
    });
  } catch (error) {
    logger.error(`Add to priority queue error: ${error.message}`);
    next(error);
  }
};

exports.checkInPatient = async (req, res, next) => {
  try {
    const { appointmentId } = req.body;

    logger.info(`Patient check-in initiated - Appointment ID: ${appointmentId}`);

    // Get appointment details
    const appointment = await Appointment.findById(appointmentId)
      .populate('patientId')
      .populate('doctorId');

    if (!appointment) {
      logger.warn(`Check-in failed: Appointment not found - Appointment ID: ${appointmentId}`);
      return res.status(404).json({ message: 'Appointment not found' });
    }

    let queueEntry;

    // Check if it's a scheduled appointment to apply priority logic
    if (appointment.appointmentType === 'scheduled') {
      // Add to queue with priority (pushed to top of waiting list)
      queueEntry = await queueService.addPriorityToQueue(
        appointmentId,
        appointment.patientId._id,
        appointment.doctorId._id,
        new Date(appointment.appointmentDate)
      );
      logger.info(`Scheduled patient checked in with priority - Token: ${queueEntry.tokenNumber}`);
    } else {
      // Normal walk-in check-in (append to end)
      queueEntry = await queueService.addToQueue(
        appointmentId,
        appointment.patientId._id,
        appointment.doctorId._id,
        new Date(appointment.appointmentDate)
      );
    }

    logger.info(`Patient checked in successfully - Token: ${queueEntry.tokenNumber}, Patient: ${appointment.patientId._id}, Doctor: ${appointment.doctorId._id}`);

    res.status(200).json({
      success: true,
      data: queueEntry,
      message: `Patient checked in. Token: ${queueEntry.tokenNumber}, Position: ${queueEntry.position}`,
    });
  } catch (error) {
    logger.error(`Check-in error: ${error.message}`);
    next(error);
  }
};

exports.getQueueStatus = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;

    // Use provided date or today's date
    const queueDate = date ? new Date(date) : new Date();

    const queue = await queueService.getQueueStatus(doctorId, queueDate);
    const activeQueue = queue.filter((entry) => ['waiting', 'in-consultation', 'pending-transaction'].includes(entry.status));

    res.status(200).json({
      success: true,
      count: activeQueue.length,
      data: activeQueue,
    });
  } catch (error) {
    console.error('Error in getQueueStatus:', error);
    next(error);
  }
};

// Get scheduled appointments only (not walk-in)
exports.getScheduledAppointments = async (req, res, next) => {
  try {
    const { date, doctorId, status } = req.query;

    let query = { appointmentType: 'scheduled' };

    // Filter by date if provided
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.appointmentDate = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    } else {
      // If no date is provided, show appointments from today onwards
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.appointmentDate = { $gte: today };
    }

    // Filter by doctor if provided
    if (doctorId) {
      query.doctorId = doctorId;
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate({
        path: 'patientId',
        populate: { path: 'userId' },
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name' }
      })
      .sort({ appointmentDate: 1 });

    const appointmentIds = appointments.map((appointment) => appointment._id);
    const queueEntries = appointmentIds.length
      ? await Queue.find({ appointmentId: { $in: appointmentIds } })
        .select('appointmentId status tokenNumber position')
        .lean()
      : [];
    const queueByAppointmentId = new Map(
      queueEntries.map((entry) => [String(entry.appointmentId), entry])
    );

    const enrichedAppointments = appointments.map((appointment) => {
      const appointmentObj = appointment.toObject();
      const queueEntry = queueByAppointmentId.get(String(appointment._id));

      return {
        ...appointmentObj,
        queueStatus: queueEntry?.status || (appointmentObj.status === 'arrived' ? 'waiting' : null),
        queueToken: queueEntry?.tokenNumber || appointmentObj.queueToken || null,
        queuePosition: queueEntry?.position ?? appointmentObj.queuePosition ?? null,
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedAppointments.length,
      data: enrichedAppointments,
      message: 'Scheduled appointments retrieved successfully',
    });
  } catch (error) {
    logger.error(`Get scheduled appointments error: ${error.message}`);
    next(error);
  }
};

exports.rescheduleScheduledAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { date, startTime, endTime, rescheduleReason } = req.body;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Date, startTime and endTime are required',
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    if (appointment.appointmentType !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Only scheduled appointments can be rescheduled here',
      });
    }

    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule appointment with status: ${appointment.status}`,
      });
    }

    const targetDate = new Date(date);
    const currentDate = new Date(appointment.appointmentDate);
    const currentDateOnly = currentDate.toISOString().split('T')[0];
    const targetDateOnly = targetDate.toISOString().split('T')[0];
    const sameSlot =
      currentDateOnly === targetDateOnly &&
      appointment.startTime === startTime;

    if (!sameSlot) {
      const isAvailable = await slotService.checkSlotAvailability(
        appointment.doctorId,
        targetDate,
        startTime
      );

      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Selected time slot is not available',
        });
      }
    }

    appointment.appointmentDate = targetDate;
    appointment.startTime = startTime;
    appointment.endTime = endTime;
    appointment.status = 'rescheduled';
    appointment.notes = rescheduleReason || appointment.notes;
    appointment.updatedAt = new Date();
    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate({
        path: 'patientId',
        populate: { path: 'userId' },
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name' },
      });

    logger.info(`Receptionist rescheduled appointment - Appointment ID: ${appointmentId}`);
    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: updatedAppointment,
    });
  } catch (error) {
    logger.error(`Reschedule scheduled appointment error: ${error.message}`);
    next(error);
  }
};

exports.cancelScheduledAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    if (appointment.appointmentType !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Only scheduled appointments can be cancelled here',
      });
    }

    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel appointment with status: ${appointment.status}`,
      });
    }

    await Queue.findOneAndDelete({ appointmentId });

    appointment.status = 'cancelled';
    appointment.notes = cancellationReason || appointment.notes;
    appointment.queueToken = null;
    appointment.queuePosition = null;
    appointment.updatedAt = new Date();
    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate({
        path: 'patientId',
        populate: { path: 'userId' },
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name' },
      });

    logger.info(`Receptionist cancelled appointment - Appointment ID: ${appointmentId}`);
    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: updatedAppointment,
    });
  } catch (error) {
    logger.error(`Cancel scheduled appointment error: ${error.message}`);
    next(error);
  }
};

// Get walk-in queue (with tokens)
exports.getWalkInQueue = async (req, res, next) => {
  try {
    const { date, doctorId } = req.query;

    const queueDate = date ? new Date(date) : new Date();

    // Create proper date range
    const startOfDay = new Date(queueDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queueDate);
    endOfDay.setHours(23, 59, 59, 999);

    let query = {
      queueDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: { $in: ['waiting', 'in-consultation', 'pending-transaction'] },
    };

    const walkInAppointments = await Appointment.find({
      appointmentType: 'walk-in',
    }).select('_id');
    query.appointmentId = { $in: walkInAppointments.map((apt) => apt._id) };

    // Filter by doctor if provided
    if (doctorId) {
      query.doctorId = doctorId;
    }

    logger.info(`Fetching walk-in queue for date: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    const queue = await Queue.find(query)
      .populate({
        path: 'patientId',
        model: 'Patient',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .populate({
        path: 'appointmentId',
        model: 'Appointment',
        select: 'reason appointmentType status appointmentDate startTime endTime'
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name' }
      })
      .sort('position');

    res.status(200).json({
      success: true,
      count: queue.length,
      data: queue,
      message: 'Walk-in queue retrieved successfully',
    });
  } catch (error) {
    logger.error(`Get walk-in queue error: ${error.message}`);
    next(error);
  }
};

// Get all walk-in appointments (history/list) for a selected date
exports.getWalkInAppointments = async (req, res, next) => {
  try {
    const { date, doctorId } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
      appointmentType: 'walk-in',
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    };

    if (doctorId) {
      query.doctorId = doctorId;
    }

    const walkIns = await Appointment.find(query)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name phone' },
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name' },
      })
      .sort({ appointmentDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: walkIns.length,
      data: walkIns,
      message: 'Walk-in appointments retrieved successfully',
    });
  } catch (error) {
    logger.error(`Get walk-in appointments error: ${error.message}`);
    next(error);
  }
};

exports.getConsultationSummary = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const medicalRecord = await MedicalRecord.findOne({ appointmentId })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name' },
      })
      .populate('patientId');

    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: 'Consultation record not found for this appointment',
      });
    }

    res.status(200).json({
      success: true,
      data: medicalRecord,
    });
  } catch (error) {
    logger.error(`Get consultation summary error: ${error.message}`);
    next(error);
  }
};

exports.createBilling = async (req, res, next) => {
  try {
    const {
      patientId,
      appointmentId,
      items,
      tax,
      discount,
      total,
      dueDate,
      paymentMethod,
    } = req.body;

    if (!patientId || !Array.isArray(items) || items.length === 0 || total === undefined) {
      return res.status(400).json({
        success: false,
        message: 'patientId, items, and total are required to create billing',
      });
    }

    logger.info(`Creating billing - Patient ID: ${patientId}, Amount: ${total}, Items: ${items.length}`);

    let normalizedItems = items
      .map((item) => ({
        description: String(item.description || '').trim(),
        amount: Number(item.amount || 0),
        quantity: Number(item.quantity || 1),
      }))
      .filter((item) => item.description && item.amount >= 0 && item.quantity > 0);

    if (!normalizedItems.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one valid billing item is required',
      });
    }

    let doctorConsultationFee = null;
    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId).populate('doctorId', 'consultationFee');
      doctorConsultationFee = Number(appointment?.doctorId?.consultationFee);
      if (!Number.isFinite(doctorConsultationFee) || doctorConsultationFee < 0) {
        doctorConsultationFee = null;
      }
    }

    if (doctorConsultationFee !== null) {
      const consultationIndex = normalizedItems.findIndex((item) =>
        String(item.description || '').toLowerCase().includes('consultation')
      );

      if (consultationIndex >= 0) {
        normalizedItems[consultationIndex] = {
          ...normalizedItems[consultationIndex],
          description: normalizedItems[consultationIndex].description || 'Consultation Fee',
          amount: doctorConsultationFee,
          quantity: Number(normalizedItems[consultationIndex].quantity || 1),
        };
      } else {
        normalizedItems.unshift({
          description: 'Consultation Fee',
          amount: doctorConsultationFee,
          quantity: 1,
        });
      }
    }

    const parsedTax = Number(tax || 0);
    const parsedDiscount = Number(discount || 0);
    const computedSubtotal = normalizedItems.reduce(
      (sum, item) => sum + Number(item.amount) * Number(item.quantity),
      0
    );
    const computedTotal = Math.max(computedSubtotal + parsedTax - parsedDiscount, 0);

    const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);
    if (paymentMethod !== undefined && normalizedPaymentMethod === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Allowed values: cash, card, upi, bank_transfer',
      });
    }

    const billing = await Billing.create({
      patientId,
      appointmentId,
      items: normalizedItems,
      subtotal: computedSubtotal,
      tax: parsedTax,
      discount: parsedDiscount,
      total: computedTotal,
      dueDate,
      processedBy: req.user?.id,
      description: normalizedItems[0]?.description || 'Consultation',
      paymentStatus: 'pending',
      ...(normalizedPaymentMethod ? { paymentMethod: normalizedPaymentMethod } : {}),
    });

    logger.info(`Billing created successfully - Billing ID: ${billing._id}, Patient ID: ${patientId}, Total: ${total}`);

    res.status(201).json({
      success: true,
      data: billing,
    });
  } catch (error) {
    logger.error(`Create billing error: ${error.message}`);
    next(error);
  }
};

exports.getBillings = async (req, res, next) => {
  try {
    const { patientId, date } = req.query;
    
    let query = {};
    
    // Filter by patient if provided
    if (patientId) {
      query.patientId = patientId;
    }
    
    // Filter by date if provided
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    const billings = await Billing.find(query)
      .populate('patientId')
      .populate('appointmentId')
      .populate('processedBy', 'name')
      .sort('-createdAt');

    // Transform data for frontend
    const formattedBillings = billings.map(billing => ({
      _id: billing._id,
      invoiceNumber: billing.invoiceNumber || `INV-${String(billing._id).substring(0, 6).toUpperCase()}`,
      patientId: billing.patientId,
      appointmentId: billing.appointmentId,
      items: billing.items || [],
      serviceType: billing.items && billing.items.length > 0 
        ? billing.items[0].description 
        : 'Service',
      totalAmount: billing.total,
      total: billing.total,
      status: billing.paymentStatus === 'paid' ? 'completed' : 'pending',
      paymentStatus: billing.paymentStatus,
      paymentMethod: billing.paymentMethod,
      dueDate: billing.dueDate,
      billDate: billing.createdAt,
      processedBy: billing.processedBy,
      description: billing.description,
      subtotal: billing.subtotal,
      tax: billing.tax,
      discount: billing.discount
    }));

    res.status(200).json({
      success: true,
      count: formattedBillings.length,
      data: formattedBillings,
    });
  } catch (error) {
    logger.error(`Get billings error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error fetching billings' });
  }
};

exports.updateBillingStatus = async (req, res, next) => {
  try {
    const { billingId } = req.params;
    const { paymentStatus, paymentMethod, paymentDate, items, tax, discount, dueDate, notes } = req.body;

    const billing = await Billing.findById(billingId);
    if (!billing) {
      return res.status(404).json({
        success: false,
        message: 'Billing record not found',
      });
    }

    const updatePayload = { updatedAt: new Date() };

    if (paymentStatus !== undefined) {
      if (!VALID_PAYMENT_STATUSES.has(String(paymentStatus))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment status. Allowed values: pending, paid, partial, overdue',
        });
      }
      updatePayload.paymentStatus = paymentStatus;
    }

    if (paymentMethod !== undefined) {
      const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);
      if (normalizedPaymentMethod === null) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment method. Allowed values: cash, card, upi, bank_transfer',
        });
      }
      updatePayload.paymentMethod = normalizedPaymentMethod;
    }

    if (paymentDate !== undefined) {
      updatePayload.paymentDate = paymentDate;
    }

    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'items must be a non-empty array',
        });
      }

      let normalizedItems = items
        .map((item) => ({
          description: String(item.description || '').trim(),
          amount: Number(item.amount || 0),
          quantity: Number(item.quantity || 1),
        }))
        .filter((item) => item.description && item.amount >= 0 && item.quantity > 0);

      if (normalizedItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one valid billing item is required',
        });
      }

      let doctorConsultationFee = null;
      if (billing.appointmentId) {
        const appointment = await Appointment.findById(billing.appointmentId).populate('doctorId', 'consultationFee');
        doctorConsultationFee = Number(appointment?.doctorId?.consultationFee);
        if (!Number.isFinite(doctorConsultationFee) || doctorConsultationFee < 0) {
          doctorConsultationFee = null;
        }
      }

      const hasConsultation = normalizedItems.some((item) =>
        item.description.toLowerCase().includes('consultation')
      );

      if (!hasConsultation) {
        const existingConsultation = (billing.items || []).find((item) =>
          String(item.description || '').toLowerCase().includes('consultation')
        );
        const consultationService = await Service.findOne({ category: 'Consultation', isActive: true });

        normalizedItems.unshift({
          description: 'Consultation Fee',
          amount: Number(
            doctorConsultationFee ??
            existingConsultation?.amount ??
            consultationService?.price ??
            500
          ),
          quantity: Number(existingConsultation?.quantity ?? 1),
        });
      } else if (doctorConsultationFee !== null) {
        normalizedItems = normalizedItems.map((item) => (
          String(item.description || '').toLowerCase().includes('consultation')
            ? { ...item, amount: doctorConsultationFee }
            : item
        ));
      }

      const computedSubtotal = normalizedItems.reduce(
        (sum, item) => sum + (Number(item.amount) * Number(item.quantity)),
        0
      );
      const parsedTax = tax !== undefined ? Number(tax || 0) : Number(billing.tax || 0);
      const parsedDiscount = discount !== undefined ? Number(discount || 0) : Number(billing.discount || 0);
      const computedTotal = computedSubtotal + parsedTax - parsedDiscount;

      updatePayload.items = normalizedItems;
      updatePayload.subtotal = computedSubtotal;
      updatePayload.tax = parsedTax;
      updatePayload.discount = parsedDiscount;
      updatePayload.total = computedTotal >= 0 ? computedTotal : 0;
      updatePayload.description = normalizedItems[0]?.description || billing.description;
    }

    if (dueDate !== undefined) {
      updatePayload.dueDate = dueDate;
    }

    if (notes !== undefined) {
      updatePayload.notes = notes;
    }

    logger.info(`Updating billing status - Billing ID: ${billingId}, Payload: ${JSON.stringify(updatePayload)}`);

    const updatedBilling = await Billing.findByIdAndUpdate(billingId, updatePayload, { new: true, runValidators: true });

    if (updatePayload.paymentStatus === 'paid' && billing.appointmentId) {
      await Queue.findOneAndDelete({ appointmentId: billing.appointmentId });
      await Appointment.findByIdAndUpdate(
        billing.appointmentId,
        { status: 'completed', queueToken: null, queuePosition: null, updatedAt: new Date() },
        { new: true }
      );
    }

    logger.info(`Billing updated successfully - Billing ID: ${billingId}, New Status: ${paymentStatus}`);

    res.status(200).json({
      success: true,
      data: updatedBilling,
    });
  } catch (error) {
    logger.error(`Update billing error: ${error.message}`);
    next(error);
  }
};

exports.deleteBilling = async (req, res, next) => {
  try {
    const { billingId } = req.params;

    const deletedBilling = await Billing.findByIdAndDelete(billingId);
    if (!deletedBilling) {
      return res.status(404).json({
        success: false,
        message: 'Billing record not found',
      });
    }

    logger.info(`Billing deleted successfully - Billing ID: ${billingId}`);
    res.status(200).json({
      success: true,
      message: 'Billing deleted successfully',
    });
  } catch (error) {
    logger.error(`Delete billing error: ${error.message}`);
    next(error);
  }
};

exports.uploadLabReport = async (req, res, next) => {
  try {
    const { medicalRecordId } = req.body;
    const filePath = req.file ? req.file.path : null;

    if (!filePath) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // The original implementation was critically flawed and would not work.
    // This corrected version uses arrayFilters to correctly update all pending lab tests
    // for a given medical record, which seems to be the original intent.
    const record = await MedicalRecord.findByIdAndUpdate(
      medicalRecordId,
      {
        $set: {
          'labTests.$[elem].status': 'completed',
          'labTests.$[elem].reportUrl': filePath,
        },
      },
      {
        arrayFilters: [{ 'elem.status': 'pending' }],
        new: true,
      }
    );

    if (!record) {
      return res.status(404).json({ message: 'Medical record not found or no pending tests to update.' });
    }

    res.status(200).json({
      success: true,
      message: 'Lab report uploaded successfully for all pending tests.',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDailyReport = async (req, res, next) => {
  try {
    const { date } = req.query;
    const parsedDate = date ? new Date(date) : new Date();
    const reportDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    if (date && Number.isNaN(parsedDate.getTime())) {
      logger.warn(`Invalid daily report date received: ${date}. Falling back to current date.`);
    }

    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.countDocuments({
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    const completedAppointments = await Appointment.countDocuments({
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: 'completed',
    });

    const totalBilling = await Billing.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalAppointments: appointments,
        completedAppointments,
        totalBilling: totalBilling[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
// Staff Management - Add Doctor
exports.addDoctor = async (req, res, next) => {
  try {
    const { name, email, specialization, phone, consultationFee, availability } = req.body;
    const normalizedSpecialization = String(specialization || '').toLowerCase();

    // Validate required fields
    if (!name || !email || !normalizedSpecialization || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: name, email, specialization, phone' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      role: 'doctor',
      password: 'tempPassword123' // Should be sent via email
    });

    // Create doctor profile
    const doctor = await Doctor.create({
      userId: user._id,
      specialization: normalizedSpecialization,
      consultationFee: consultationFee || 500,
      availability: availability || {},
      licenseNumber: `${email}-${Date.now()}`, // Unique license number
      experience: 0
    });

    res.status(201).json({
      success: true,
      message: 'Doctor added successfully',
      data: await doctor.populate('userId')
    });
  } catch (error) {
    logger.error(`Add doctor error: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error adding doctor' 
    });
  }
};

// Staff Management - Update Doctor
exports.updateDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { name, email, specialization, phone, consultationFee, availability } = req.body;
    const normalizedSpecialization = specialization ? String(specialization).toLowerCase() : undefined;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Update user if provided
    if (name || email || phone) {
      await User.findByIdAndUpdate(doctor.userId, {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone })
      });
    }

    // Update doctor profile
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctorId,
      {
        ...(normalizedSpecialization && { specialization: normalizedSpecialization }),
        ...(consultationFee && { consultationFee }),
        ...(availability && { availability })
      },
      { new: true }
    ).populate('userId');

    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      data: updatedDoctor
    });
  } catch (error) {
    logger.error(`Update doctor error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error updating doctor' });
  }
};

// Staff Management - Delete Doctor
exports.deleteDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findByIdAndDelete(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Delete associated user
    await User.findByIdAndDelete(doctor.userId);

    res.status(200).json({
      success: true,
      message: 'Doctor deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete doctor error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error deleting doctor' });
  }
};

// Service Management - Add Service
exports.addService = async (req, res, next) => {
  try {
    const { name, description, category, price } = req.body;

    const service = await Service.create({
      name,
      description,
      category,
      price
    });

    res.status(201).json({
      success: true,
      message: 'Service added successfully',
      data: service
    });
  } catch (error) {
    logger.error(`Add service error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error adding service' });
  }
};

// Service Management - Get Services
exports.getServices = async (req, res, next) => {
  try {
    const services = await Service.find({ isActive: true });

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    logger.error(`Get services error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error fetching services' });
  }
};

// Service Management - Update Service
exports.updateService = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { name, description, category, price } = req.body;

    const service = await Service.findByIdAndUpdate(
      serviceId,
      {
        ...(name && { name }),
        ...(description && { description }),
        ...(category && { category }),
        ...(price && { price })
      },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    logger.error(`Update service error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error updating service' });
  }
};

// Service Management - Delete Service
exports.deleteService = async (req, res, next) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findByIdAndUpdate(
      serviceId,
      { isActive: false },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete service error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error deleting service' });
  }
};

// Remove patient from queue permanently
exports.removePatientFromQueue = async (req, res, next) => {
  try {
    const { queueId } = req.params;

    logger.info(`Removing patient from queue - Queue ID: ${queueId}`);

    // Find the queue entry
    const queueEntry = await Queue.findById(queueId);

    if (!queueEntry) {
      return res.status(404).json({
        success: false,
        message: 'Queue entry not found',
      });
    }

    // Delete the queue entry
    await Queue.findByIdAndDelete(queueId);

    // Clear the queue reference from the appointment
    await Appointment.findByIdAndUpdate(
      queueEntry.appointmentId,
      { queueToken: null, queuePosition: null },
      { new: true }
    );

    logger.info(`Patient removed from queue successfully - Queue ID: ${queueId}`);

    res.status(200).json({
      success: true,
      message: 'Patient removed from queue permanently',
    });
  } catch (error) {
    logger.error(`Remove patient from queue error: ${error.message}`);
    next(error);
  }
};

// Reorder queue manually
exports.reorderQueue = async (req, res, next) => {
  try {
    const { queueItems } = req.body;

    logger.info(`Reordering queue - Items count: ${queueItems.length}`);

    await queueService.updateQueueOrder(queueItems);

    res.status(200).json({
      success: true,
      message: 'Queue reordered successfully',
    });
  } catch (error) {
    logger.error(`Reorder queue error: ${error.message}`);
    next(error);
  }
};
