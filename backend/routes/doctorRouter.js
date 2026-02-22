const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

router.get('/profile', protect, authorize('doctor'), doctorController.getDoctorProfile);
router.put('/profile', protect, authorize('doctor'), doctorController.updateDoctorProfile);
router.get('/patients', protect, authorize('doctor'), doctorController.getPatients);
router.get('/appointments', protect, authorize('doctor'), doctorController.getAppointments);
router.post('/appointment/:appointmentId/accept', protect, authorize('doctor'), doctorController.acceptAppointment);
router.post('/appointment/:appointmentId/cancel', protect, authorize('doctor'), doctorController.cancelAppointment);
router.post('/appointment/:appointmentId/reschedule', protect, authorize('doctor'), doctorController.rescheduleAppointment);
router.post('/appointment/:appointmentId/complete', protect, authorize('doctor'), doctorController.completeAppointment);
router.get('/queue/today', protect, authorize('doctor'), doctorController.getTodayQueue);
router.post('/consultation/start', protect, authorize('doctor'), doctorController.startConsultation);
router.post('/consultation/complete', protect, authorize('doctor'), doctorController.completeConsultation);
router.post('/medical-record', protect, authorize('doctor'), doctorController.createMedicalRecord);
router.get('/medical-records/:patientId', protect, authorize('doctor'), doctorController.getMedicalRecords);
router.put('/medical-record/:recordId', protect, authorize('doctor'), doctorController.updateMedicalRecord);

module.exports = router;
