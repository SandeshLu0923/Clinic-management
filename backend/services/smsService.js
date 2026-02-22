const sendSMS = require('../config/twilio');

class SMSService {
  async sendAppointmentConfirmation(patientPhone, appointmentDate, doctorName) {
    try {
      // SMS notifications disabled - Twilio not configured
      console.log(`[SMS] Appointment confirmation would be sent to ${patientPhone}`);
      return { success: true, message: 'SMS notification logged' };
    } catch (error) {
      console.error(`Notification service: ${error.message}`);
      return { success: false, message: 'Could not send notification' };
    }
  }

  async sendQueueAlert(patientPhone, position, queueToken, doctorName) {
    try {
      // SMS notifications disabled - Twilio not configured
      console.log(`[SMS] Queue alert would be sent to ${patientPhone}`);
      return { success: true, message: 'SMS notification logged' };
    } catch (error) {
      console.error(`Notification service: ${error.message}`);
      return { success: false, message: 'Could not send notification' };
    }
  }

  async sendLabReportNotification(patientPhone, reportStatus) {
    try {
      // SMS notifications disabled - Twilio not configured
      console.log(`[SMS] Lab report notification would be sent to ${patientPhone}`);
      return { success: true, message: 'SMS notification logged' };
    } catch (error) {
      console.error(`Notification service: ${error.message}`);
      return { success: false, message: 'Could not send notification' };
    }
  }

  async sendPrescriptionNotification(patientPhone, medicineName) {
    try {
      // SMS notifications disabled - Twilio not configured
      console.log(`[SMS] Prescription notification would be sent to ${patientPhone}`);
      return { success: true, message: 'SMS notification logged' };
    } catch (error) {
      console.error(`Notification service: ${error.message}`);
      return { success: false, message: 'Could not send notification' };
    }
  }
}

module.exports = new SMSService();
