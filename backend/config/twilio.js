const axios = require('axios');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const useTwilio = String(process.env.SMS_PROVIDER || '').toLowerCase() === 'twilio';

const isConfigured = Boolean(useTwilio && accountSid && authToken && fromNumber);

const sendSMS = async ({ to, body }) => {
  if (!isConfigured) {
    return {
      success: false,
      skipped: true,
      message: 'SMS provider is not configured',
    };
  }

  try {
    const payload = new URLSearchParams({
      To: to,
      From: fromNumber,
      Body: body,
    });

    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      payload.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
          username: accountSid,
          password: authToken,
        },
        timeout: 10000,
      }
    );

    return {
      success: true,
      messageId: response.data?.sid,
    };
  } catch (error) {
    const detail = error.response?.data?.message || error.message;
    return {
      success: false,
      skipped: false,
      message: detail,
    };
  }
};

module.exports = {
  sendSMS,
  isConfigured,
};
