const { sendSMS, isConfigured } = require('../config/twilio');
const logger = require('../config/logger');

class SMSService {
  async sendOrFallback(patientPhone, message) {
    if (!patientPhone) {
      return { success: false, message: 'Patient phone number is missing' };
    }

    const result = await sendSMS({ to: patientPhone, body: message });

    if (result.success) {
      logger.info(`SMS sent successfully - To: ${patientPhone}`);
      return { success: true, message: 'SMS sent successfully' };
    }

    if (result.skipped) {
      logger.warn(`SMS skipped (provider not configured) - To: ${patientPhone}`);
      return { success: true, message: 'SMS skipped (provider not configured)' };
    }

    logger.error(`SMS delivery failed - To: ${patientPhone}, Error: ${result.message}`);
    return { success: false, message: result.message || 'Could not send notification' };
  }

  async sendAppointmentConfirmation(patientPhone, appointmentDate, doctorName) {
    try {
      const message = `Appointment confirmed with Dr. ${doctorName || 'Doctor'} on ${appointmentDate || 'scheduled date'}.`;
      return await this.sendOrFallback(patientPhone, message);
    } catch (error) {
      logger.error(`Notification service: ${error.message}`);
      return { success: false, message: 'Could not send notification' };
    }
  }

  async sendQueueAlert(patientPhone, position, queueToken, doctorName) {
    try {
      const message = `Queue update: token ${queueToken || 'N/A'}, position ${position || 'N/A'} for Dr. ${doctorName || 'Doctor'}.`;
      return await this.sendOrFallback(patientPhone, message);
    } catch (error) {
      logger.error(`Notification service: ${error.message}`);
      return { success: false, message: 'Could not send notification' };
    }
  }

  async sendLabReportNotification(patientPhone, reportStatus) {
    try {
      const message = `Your lab report status: ${reportStatus || 'updated'}. Please check your patient portal.`;
      return await this.sendOrFallback(patientPhone, message);
    } catch (error) {
      logger.error(`Notification service: ${error.message}`);
      return { success: false, message: 'Could not send notification' };
    }
  }

  async sendPrescriptionNotification(patientPhone, medicineName) {
    try {
      const message = `Prescription updated${medicineName ? `: ${medicineName}` : ''}. Please check your patient portal.`;
      return await this.sendOrFallback(patientPhone, message);
    } catch (error) {
      logger.error(`Notification service: ${error.message}`);
      return { success: false, message: 'Could not send notification' };
    }
  }
}

if (!isConfigured) {
  logger.warn('SMS provider is not configured. Set SMS_PROVIDER=twilio and Twilio credentials to enable delivery.');
}

module.exports = new SMSService();
