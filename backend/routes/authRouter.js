const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { validateUser, handle } = require('../middleware/validators');

router.post('/register', (req, res, next) => {
  req.body.role = 'patient';
  next();
}, validateUser, handle, authController.register);
router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, authController.updateProfile);
router.put('/change-password', protect, authController.changePassword);
router.post('/logout', protect, authController.logout);

module.exports = router;
