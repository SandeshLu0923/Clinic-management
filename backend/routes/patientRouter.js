const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/auth');

router.get('/profile', protect, authorize('patient'), patientController.getPatientProfile);
router.put('/profile', protect, authorize('patient'), patientController.updatePatientProfile);
router.get('/doctors', protect, authorize('patient'), patientController.getDoctors);
router.get('/available-slots', protect, authorize('patient'), patientController.getAvailableSlots);
router.post('/appointment/book', protect, authorize('patient'), patientController.bookAppointment);
router.get('/appointments', protect, authorize('patient'), patientController.getMyAppointments);
router.delete('/appointment/:appointmentId', protect, authorize('patient'), patientController.cancelAppointment);
router.get('/medical-records', protect, authorize('patient'), patientController.getMedicalRecords);
router.get('/prescriptions', protect, authorize('patient'), patientController.getPrescriptions);
router.get('/billings', protect, authorize('patient'), patientController.getMyBillings);
router.post('/billing/:billingId/pay', protect, authorize('patient'), patientController.payBilling);

module.exports = router;
