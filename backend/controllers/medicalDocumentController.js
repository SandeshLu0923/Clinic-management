const MedicalDocument = require('../models/MedicalDocument');
const Patient = require('../models/Patient');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/medical-documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Upload Medical Document
exports.uploadMedicalDocument = async (req, res, next) => {
  try {
    const { documentType, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) {
      fs.unlinkSync(req.file.path); // Delete uploaded file
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    // Create file URL (relative path for serving)
    const fileUrl = `/uploads/medical-documents/${req.file.filename}`;

    const medicalDocument = new MedicalDocument({
      patientId: patient._id,
      userId: req.user.id,
      fileName: req.file.originalname,
      fileUrl: fileUrl,
      documentType,
      description,
      grantedDoctorIds: [],
    });

    await medicalDocument.save();

    logger.info(
      `Medical document uploaded - Patient ID: ${patient._id}, Document: ${medicalDocument.fileName}`
    );

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: medicalDocument,
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path); // Delete file on error
    }
    logger.error(`Document upload error: ${error.message}`);
    next(error);
  }
};

// Get Patient's Medical Documents
exports.getPatientDocuments = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const documents = await MedicalDocument.find({ patientId: patient._id })
      .populate('grantedDoctorIds', 'name email specialization')
      .sort({ uploadedAt: -1 });

    res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    logger.error(`Get patient documents error: ${error.message}`);
    next(error);
  }
};

// Grant Doctor Access to Document
exports.grantDoctorAccess = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { doctorIds } = req.body; // Array of doctor user IDs

    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const document = await MedicalDocument.findOne({
      _id: documentId,
      patientId: patient._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Add doctors to granted access list (avoid duplicates)
    const newDoctors = doctorIds.filter(
      (doctorId) => !document.grantedDoctorIds.includes(doctorId)
    );

    document.grantedDoctorIds = [
      ...document.grantedDoctorIds,
      ...newDoctors,
    ];
    document.updatedAt = new Date();
    await document.save();

    const updatedDoc = await document.populate(
      'grantedDoctorIds',
      'name email specialization'
    );

    logger.info(
      `Access granted - Document: ${documentId}, Doctors: ${newDoctors.length}`
    );

    res.status(200).json({
      success: true,
      message: 'Access granted successfully',
      data: updatedDoc,
    });
  } catch (error) {
    logger.error(`Grant access error: ${error.message}`);
    next(error);
  }
};

// Revoke Doctor Access to Document
exports.revokeDoctorAccess = async (req, res, next) => {
  try {
    const { documentId, doctorId } = req.params;

    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const document = await MedicalDocument.findOne({
      _id: documentId,
      patientId: patient._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Remove doctor from granted access
    document.grantedDoctorIds = document.grantedDoctorIds.filter(
      (id) => id.toString() !== doctorId
    );
    document.updatedAt = new Date();
    await document.save();

    const updatedDoc = await document.populate(
      'grantedDoctorIds',
      'name email specialization'
    );

    logger.info(`Access revoked - Document: ${documentId}, Doctor: ${doctorId}`);

    res.status(200).json({
      success: true,
      message: 'Access revoked successfully',
      data: updatedDoc,
    });
  } catch (error) {
    logger.error(`Revoke access error: ${error.message}`);
    next(error);
  }
};

// Delete Medical Document
exports.deleteMedicalDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const document = await MedicalDocument.findOne({
      _id: documentId,
      patientId: patient._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', document.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await MedicalDocument.findByIdAndDelete(documentId);

    logger.info(`Medical document deleted - Document ID: ${documentId}`);

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    logger.error(`Delete document error: ${error.message}`);
    next(error);
  }
};

// Get Accessible Documents for Doctor
exports.getDoctorAccessibleDocuments = async (req, res, next) => {
  try {
    // Get all documents where this doctor has access
    const documents = await MedicalDocument.find({
      grantedDoctorIds: req.user.id,
    })
      .populate('userId', 'name email phone')
      .populate('grantedDoctorIds', 'name email specialization')
      .sort({ uploadedAt: -1 });

    res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    logger.error(`Get doctor documents error: ${error.message}`);
    next(error);
  }
};

// Get all doctors for access control
exports.getAvailableDoctors = async (req, res, next) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select(
      '-password'
    );

    res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    logger.error(`Get available doctors error: ${error.message}`);
    next(error);
  }
};
