const express = require('express');
const router = express.Router();
const receptionistController = require('../controllers/receptionistController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../utils/fileUpload');

router.get('/doctors', protect, authorize('receptionist'), receptionistController.getDoctors);
router.get('/patient/walk-in/pending', protect, authorize('receptionist'), receptionistController.getPendingWalkInPatients);
router.post('/patient/check-in', protect, authorize('receptionist'), receptionistController.checkInPatient);
router.get('/queue/status', protect, authorize('receptionist'), receptionistController.getQueueStatus);
router.get('/appointments/scheduled', protect, authorize('receptionist'), receptionistController.getScheduledAppointments);
router.post('/appointments/:appointmentId/reschedule', protect, authorize('receptionist'), receptionistController.rescheduleScheduledAppointment);
router.post('/appointments/:appointmentId/cancel', protect, authorize('receptionist'), receptionistController.cancelScheduledAppointment);
router.get('/queue/walk-in', protect, authorize('receptionist'), receptionistController.getWalkInQueue);
router.get('/appointments/walk-in', protect, authorize('receptionist'), receptionistController.getWalkInAppointments);
router.get('/consultation/:appointmentId', protect, authorize('receptionist'), receptionistController.getConsultationSummary);

// Walk-in Patient Routes
router.post('/patient/walk-in/register', protect, authorize('receptionist'), receptionistController.registerWalkInPatient);
router.post('/patient/walk-in/appointment', protect, authorize('receptionist'), receptionistController.bookWalkInAppointment);
router.post('/patient/walk-in/token', protect, authorize('receptionist'), receptionistController.generateWalkInToken);
router.post('/queue/priority', protect, authorize('receptionist'), receptionistController.addPatientToQueueAtPriority);
router.post('/queue/reorder', protect, authorize('receptionist'), receptionistController.reorderQueue);
router.delete('/queue/:queueId', protect, authorize('receptionist'), receptionistController.removePatientFromQueue);

router.post('/billing', protect, authorize('receptionist'), receptionistController.createBilling);
router.get('/billings', protect, authorize('receptionist'), receptionistController.getBillings);
router.put('/billing/:billingId', protect, authorize('receptionist'), receptionistController.updateBillingStatus);
router.delete('/billing/:billingId', protect, authorize('receptionist'), receptionistController.deleteBilling);
router.post('/lab-report/upload', protect, authorize('receptionist'), upload.single('report'), receptionistController.uploadLabReport);
router.get('/report/daily', protect, authorize('receptionist'), receptionistController.getDailyReport);

// Staff Management Routes
router.post('/staff/doctor', protect, authorize('receptionist'), receptionistController.addDoctor);
router.put('/staff/doctor/:doctorId', protect, authorize('receptionist'), receptionistController.updateDoctor);
router.delete('/staff/doctor/:doctorId', protect, authorize('receptionist'), receptionistController.deleteDoctor);

// Service Management Routes
router.post('/services', protect, authorize('receptionist'), receptionistController.addService);
router.get('/services', protect, authorize('receptionist'), receptionistController.getServices);
router.put('/services/:serviceId', protect, authorize('receptionist'), receptionistController.updateService);
router.delete('/services/:serviceId', protect, authorize('receptionist'), receptionistController.deleteService);

module.exports = router;
