const Doctor = require('../models/Doctor');
const MedicalRecord = require('../models/MedicalRecord');
const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const queueService = require('../services/queueService');
const logger = require('../config/logger');

exports.getDoctorProfile = async (req, res, next) => {
  try {
    logger.info(`Fetching doctor profile - Doctor User ID: ${req.user.id}`);
    const doctor = await Doctor.findOne({ userId: req.user.id }).populate('userId', 'name email phone');

    if (!doctor) {
      logger.warn(`Doctor profile not found - User ID: ${req.user.id}`);
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    logger.error(`Get doctor profile error: ${error.message}`);
    next(error);
  }
};

exports.updateDoctorProfile = async (req, res, next) => {
  try {
    const { specialization, experience, consultationFee, availability } = req.body;

    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.user.id },
      { specialization, experience, consultationFee, availability },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAppointments = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    const appointments = await Appointment.find({
      doctorId: doctor._id,
      appointmentType: 'scheduled',
    })
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name' },
      })
      .sort('-appointmentDate');

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
    });
  } catch (error) {
    logger.error(`Get appointments error: ${error.message}`);
    next(error);
  }
};

exports.getTodayQueue = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const queue = await queueService.getQueueStatus(doctor._id, today);
    const doctorVisibleQueue = queue.filter((entry) => ['waiting', 'in-consultation'].includes(entry.status));

    // Calculate Dashboard Stats
    const stats = {
      appointments: await Appointment.countDocuments({
        doctorId: doctor._id,
        appointmentDate: { $gte: today, $lte: endOfDay },
        appointmentType: 'scheduled'
      }),
      walkIns: await Appointment.countDocuments({
        doctorId: doctor._id,
        appointmentDate: { $gte: today, $lte: endOfDay },
        appointmentType: 'walk-in'
      }),
      pending: await Queue.countDocuments({
        doctorId: doctor._id,
        queueDate: { $gte: today, $lte: endOfDay },
        status: 'waiting'
      }),
      completed: await Appointment.countDocuments({
        doctorId: doctor._id,
        appointmentDate: { $gte: today, $lte: endOfDay },
        status: 'completed'
      })
    };

    res.status(200).json({
      success: true,
      data: {
        queue: doctorVisibleQueue,
        stats
      },
    });
  } catch (error) {
    logger.error(`Get today queue error: ${error.message}`);
    next(error);
  }
};

exports.startConsultation = async (req, res, next) => {
  try {
    const { queueId } = req.body;

    const updatedQueue = await queueService.markConsultationStarted(queueId);

    res.status(200).json({
      success: true,
      data: updatedQueue,
    });
  } catch (error) {
    next(error);
  }
};

exports.completeConsultation = async (req, res, next) => {
  try {
    const { queueId } = req.body;

    const updatedQueue = await queueService.markConsultationCompleted(queueId);

    res.status(200).json({
      success: true,
      data: updatedQueue,
    });
  } catch (error) {
    next(error);
  }
};

exports.createMedicalRecord = async (req, res, next) => {
  try {
    const { patientId, appointmentId, diagnosis, symptoms, vitals, prescription, labTests, notes, followUpDate } = req.body;

    logger.info(`Creating medical record - Patient ID: ${patientId}, Doctor ID: ${req.user.id}`);

    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    const medicalRecord = await MedicalRecord.create({
      patientId,
      doctorId: doctor._id,
      appointmentId,
      diagnosis,
      symptoms,
      vitals,
      prescription,
      labTests,
      notes,
      followUpDate,
      visitDate: new Date(),
    });

    logger.info(`Medical record created successfully - Record ID: ${medicalRecord._id}, Patient ID: ${patientId}`);

    res.status(201).json({
      success: true,
      data: medicalRecord,
    });
  } catch (error) {
    logger.error(`Create medical record error: ${error.message}`);
    next(error);
  }
};

exports.getPatients = async (req, res, next) => {
  try {
    const { search, date } = req.query;
    logger.info(`Fetching doctor's patients - Doctor User ID: ${req.user.id}`);
    
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    const appointmentQuery = { doctorId: doctor._id };
    const queueQuery = { doctorId: doctor._id };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      if (!Number.isNaN(startOfDay.getTime())) {
        appointmentQuery.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
        queueQuery.queueDate = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    // Build a combined patient list from both scheduled appointments and walk-ins.
    const [appointments, queueEntries] = await Promise.all([
      Appointment.find(appointmentQuery)
        .populate({
          path: 'patientId',
          populate: {
            path: 'userId',
            select: 'name'
          }
        })
        .sort('-appointmentDate'),
      Queue.find(queueQuery)
        .populate({
          path: 'patientId',
          populate: { path: 'userId', select: 'name' },
        })
        .populate('appointmentId', 'appointmentDate')
        .sort('-queueDate'),
    ]);

    // Extract unique patients and their last visit info
    const patientMap = new Map();
    const upsertPatient = (patient, visitDate, visitKey) => {
      if (!patient?._id) return;
      const patientId = patient._id.toString();

      if (!patientMap.has(patientId)) {
        const derivedAge = Number.isFinite(patient.age)
          ? patient.age
          : (patient.dateOfBirth
            ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
            : null);

        patientMap.set(patientId, {
          _id: patient._id,
          name: patient.userId?.name || patient.name || 'Unknown',
          age: derivedAge,
          gender: patient.gender,
          patientType: patient.patientType || 'registered',
          lastVisit: visitDate,
          totalAppointments: 0,
          _visitKeys: new Set(),
        });
      }

      const entry = patientMap.get(patientId);
      if (!entry._visitKeys.has(visitKey)) {
        entry._visitKeys.add(visitKey);
        entry.totalAppointments += 1;
      }

      if (new Date(visitDate) > new Date(entry.lastVisit)) {
        entry.lastVisit = visitDate;
      }
    };

    appointments.forEach((appointment) => {
      const visitKey = `visit:${appointment._id.toString()}`;
      upsertPatient(appointment.patientId, appointment.appointmentDate, visitKey);
    });

      queueEntries.forEach((entry) => {
        const visitDate = entry.appointmentId?.appointmentDate || entry.queueDate || entry.createdAt;
        const appointmentId = entry.appointmentId?._id || entry.appointmentId || entry._id;
        const visitKey = `visit:${appointmentId.toString()}`;
        upsertPatient(entry.patientId, visitDate, visitKey);
      });

    let patients = Array.from(patientMap.values()).map((patient) => {
      const { _visitKeys, ...safePatient } = patient;
      return safePatient;
    });

    // Filter patients if search term is provided
      if (search) {
        const searchTerm = search.toLowerCase();
        patients = patients.filter((p) => p.name.toLowerCase().includes(searchTerm));
      }

    logger.info(`Fetched ${patients.length} patients for doctor with search term: "${search || ''}"`);
    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    logger.error(`Get patients error: ${error.message}`);
    next(error);
  }
};

exports.getMedicalRecords = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // Check if doctor has consent to view records
    // We check if there is at least one appointment between this doctor and patient
    // where medicalRecordConsent is true.
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const hasConsent = await Appointment.findOne({
      patientId,
      doctorId: doctor._id,
      $or: [
        { medicalRecordConsent: true },
        // Backward compatibility: older walk-ins were saved before consent field existed.
        { appointmentType: 'walk-in', medicalRecordConsent: { $exists: false } },
      ],
    });

    const hasDoctorRecord = await MedicalRecord.findOne({
      patientId,
      doctorId: doctor._id,
    });

    if (!hasConsent && !hasDoctorRecord) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Patient has not provided consent to view medical records.'
      });
    }

    const records = await MedicalRecord.find({ patientId })
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

exports.updateMedicalRecord = async (req, res, next) => {
  try {
    const { recordId } = req.params;
    const { diagnosis, symptoms, vitals, prescription, labTests, notes, followUpDate } = req.body;

    const record = await MedicalRecord.findByIdAndUpdate(
      recordId,
      { diagnosis, symptoms, vitals, prescription, labTests, notes, followUpDate, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

// Accept appointment appointment
exports.acceptAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Verify the appointment belongs to this doctor
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept this appointment' });
    }

    const allowedStatuses = new Set(['pending', 'scheduled', 'confirmed', 'arrived']);
    if (!allowedStatuses.has(appointment.status)) {
      return res.status(400).json({ message: `Cannot accept appointment with status: ${appointment.status}` });
    }

    appointment.status = 'accepted';
    appointment.doctorAcceptedAt = new Date();
    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate('patientId', 'userId')
      .populate('doctorId');

    logger.info(`Appointment accepted by doctor - Appointment ID: ${appointmentId}`);

    res.status(200).json({
      success: true,
      message: 'Appointment accepted',
      data: updatedAppointment,
    });
  } catch (error) {
    logger.error(`Accept appointment error: ${error.message}`);
    next(error);
  }
};

// Cancel appointment
exports.cancelAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Verify the appointment belongs to this doctor
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({ message: `Cannot cancel appointment with status: ${appointment.status}` });
    }

    appointment.status = 'cancelled';
    appointment.notes = cancellationReason || appointment.notes;
    appointment.updatedAt = new Date();
    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate('patientId', 'userId')
      .populate('doctorId');

    logger.info(`Appointment cancelled by doctor - Appointment ID: ${appointmentId}`);

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled',
      data: updatedAppointment,
    });
  } catch (error) {
    logger.error(`Cancel appointment error: ${error.message}`);
    next(error);
  }
};

// Reschedule appointment
exports.rescheduleAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { appointmentDate, startTime, endTime, rescheduleReason } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Verify the appointment belongs to this doctor
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reschedule this appointment' });
    }

    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({ message: `Cannot reschedule appointment with status: ${appointment.status}` });
    }

    // Check slot availability
    const slotService = require('../services/slotService');
    const isAvailable = await slotService.checkSlotAvailability(
      appointment.doctorId,
      appointmentDate,
      startTime
    );

    if (!isAvailable) {
      return res.status(400).json({ message: 'New time slot is not available' });
    }

    appointment.appointmentDate = appointmentDate;
    appointment.startTime = startTime;
    appointment.endTime = endTime;
    appointment.status = 'rescheduled';
    appointment.notes = rescheduleReason || appointment.notes;
    appointment.updatedAt = new Date();
    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate('patientId', 'userId')
      .populate('doctorId');

    logger.info(`Appointment rescheduled by doctor - Appointment ID: ${appointmentId}, New Date: ${appointmentDate}`);

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled',
      data: updatedAppointment,
    });
  } catch (error) {
    logger.error(`Reschedule appointment error: ${error.message}`);
    next(error);
  }
};

// Mark appointment as completed
exports.completeAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Verify the appointment belongs to this doctor
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to complete this appointment' });
    }

    if (appointment.status !== 'accepted' && appointment.status !== 'in-consultation') {
      return res.status(400).json({ message: 'Can only complete accepted or in-consultation appointments' });
    }

    appointment.status = 'pending-bill';
    appointment.updatedAt = new Date();
    await appointment.save();

    await Queue.findOneAndUpdate(
      { appointmentId: appointment._id },
      { status: 'pending-transaction', consultationEndTime: new Date() },
      { new: true }
    );

    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate('patientId', 'userId')
      .populate('doctorId');

    logger.info(`Appointment moved to pending billing - Appointment ID: ${appointmentId}`);

    res.status(200).json({
      success: true,
      message: 'Consultation completed and moved to pending billing',
      data: updatedAppointment,
    });
  } catch (error) {
    logger.error(`Complete appointment error: ${error.message}`);
    next(error);
  }
};
