const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const generateToken = require('../utils/tokenGenerator');
const logger = require('../config/logger');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const role = 'patient';
    const normalizedGender = String(req.body.gender || 'other').trim().toLowerCase();
    const gender = ['male', 'female', 'other'].includes(normalizedGender) ? normalizedGender : 'other';

    logger.info(`User registration attempt - Email: ${email}, Role: ${role}`);

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      logger.warn(`Registration failed: User already exists - Email: ${email}`);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    user = await User.create({
      name,
      email,
      password,
      phone,
      role,
    });

    logger.info(`New user registered successfully - ID: ${user._id}, Email: ${email}, Role: ${role}`);

    // If doctor, create doctor profile
    if (role === 'doctor') {
      await Doctor.create({
        userId: user._id,
        specialization: req.body.specialization || 'General',
        licenseNumber: req.body.licenseNumber || '',
      });
      logger.info(`Doctor profile created - Doctor ID: ${user._id}`);
    }

    // If patient, create patient profile
    if (role === 'patient') {
      await Patient.create({
        userId: user._id,
        name: name,
        phone: phone,
        dateOfBirth: req.body.dateOfBirth || undefined,
        gender,
        age: req.body.age || null,
        patientType: 'registered',
      });
      logger.info(`Patient profile created - Patient ID: ${user._id}`);
    }

    // Create JWT token
    const token = generateToken(user._id);

    const userPayload = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    res.status(201).json({
      success: true,
      token,
      user: userPayload,
      data: userPayload,
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get role-specific data
    let profileData = { ...user.toObject() };

    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId });
      profileData.doctor = doctor;
    } else if (user.role === 'patient') {
      const patient = await Patient.findOne({ userId });
      profileData.patient = patient;
    }

    res.status(200).json({ success: true, data: profileData });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, phone, profileImage, ...roleSpecificData } = req.body;

    // Update user basic info
    const user = await User.findByIdAndUpdate(
      userId,
      { name, phone, profileImage, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update role-specific data
    let profileData = { ...user.toObject() };

    if (user.role === 'doctor') {
      const doctorUpdateData = { ...roleSpecificData };
      
      // Handle qualifications parsing
      if (roleSpecificData.qualifications) {
        // Parse format: "MD from Harvard (2015); BS from MIT (2011)"
        doctorUpdateData.qualifications = roleSpecificData.qualifications
          .split(';')
          .map(qual => {
            const match = qual.match(/(.+?)\s+from\s+(.+?)\s*\((\d+)\)/);
            if (match) {
              return {
                degree: match[1].trim(),
                institution: match[2].trim(),
                year: parseInt(match[3]),
              };
            }
            return null;
          })
          .filter(qual => qual !== null);
      }
      
      const doctor = await Doctor.findOneAndUpdate(
        { userId },
        doctorUpdateData,
        { new: true, runValidators: true }
      );
      profileData.doctor = doctor;
    } else if (user.role === 'patient') {
      // Prepare structured patient data
      const patientUpdateData = { ...roleSpecificData };
      
      // Handle nested address object
      if (roleSpecificData.street || roleSpecificData.city || roleSpecificData.state || roleSpecificData.zipCode || roleSpecificData.country) {
        patientUpdateData.address = {
          street: roleSpecificData.street,
          city: roleSpecificData.city,
          state: roleSpecificData.state,
          zipCode: roleSpecificData.zipCode,
          country: roleSpecificData.country,
        };
        delete patientUpdateData.street;
        delete patientUpdateData.city;
        delete patientUpdateData.state;
        delete patientUpdateData.zipCode;
        delete patientUpdateData.country;
      }
      
      // Handle nested emergency contact object
      if (roleSpecificData.emergencyContactName || roleSpecificData.emergencyContactPhone || roleSpecificData.emergencyContactRelation) {
        patientUpdateData.emergencyContact = {
          name: roleSpecificData.emergencyContactName,
          phone: roleSpecificData.emergencyContactPhone,
          relation: roleSpecificData.emergencyContactRelation,
        };
        delete patientUpdateData.emergencyContactName;
        delete patientUpdateData.emergencyContactPhone;
        delete patientUpdateData.emergencyContactRelation;
      }
      
      // Handle medical history (comma-separated string to array)
      if (roleSpecificData.medicalHistory) {
        patientUpdateData.medicalHistory = roleSpecificData.medicalHistory
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0);
      }
      
      // Handle allergies (comma-separated string to array)
      if (roleSpecificData.allergies) {
        patientUpdateData.allergies = roleSpecificData.allergies
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0);
      }
      
      const patient = await Patient.findOneAndUpdate(
        { userId },
        patientUpdateData,
        { new: true, runValidators: true }
      );
      profileData.patient = patient;
    }

    logger.info(`Profile updated - User ID: ${userId}`);
    res.status(200).json({ success: true, message: 'Profile updated successfully', data: profileData });
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check current password
    const isPasswordMatch = await user.matchPassword(currentPassword);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed - User ID: ${userId}`);
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    logger.error(`Change password error: ${error.message}`);
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    logger.info(`Login attempt - Email: ${email}`);

    // Validate email and password
    if (!email || !password) {
      logger.warn(`Login failed: Missing credentials - Email: ${email}`);
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      logger.warn(`Login failed: User not found - Email: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      logger.warn(`Login failed: Invalid password - Email: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = generateToken(user._id);

    logger.info(`User logged in successfully - ID: ${user._id}, Email: ${email}, Role: ${user.role}`);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    logger.info(`Fetching user profile - User ID: ${req.user.id}`);
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error(`Get user profile error: ${error.message}`);
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  logger.info(`User logout - User ID: ${req.user.id}`);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};
