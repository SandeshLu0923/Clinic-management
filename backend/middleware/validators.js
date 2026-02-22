const { body, validationResult } = require('express-validator');

exports.validateUser = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('role').optional({ nullable: true, checkFalsy: true }).isIn(['patient']).withMessage('Invalid role'),
  body('dateOfBirth').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Valid date of birth is required'),
  body('gender').optional({ nullable: true, checkFalsy: true }).isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
];

exports.validateDoctor = [
  body('licenseNumber').notEmpty().withMessage('License number is required'),
  body('specialization').notEmpty().withMessage('Specialization is required'),
  body('experience').isNumeric().withMessage('Experience must be a number'),
];

exports.validatePatient = [
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
];

exports.validateAppointment = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('endTime').notEmpty().withMessage('End time is required'),
];

exports.handle = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
