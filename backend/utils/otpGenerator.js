const crypto = require('crypto');

const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

const generateQueueToken = (date, position) => {
  // Format: DDMM-### where DD is day, MM is month, ### is sequential number
  // Resets every day at date change
  try {
    // Ensure position is a valid number
    const posNum = parseInt(position) || 1;
    
    // Create date object if not already
    let queueDate;
    if (typeof date === 'string') {
      queueDate = new Date(date);
    } else if (date instanceof Date) {
      queueDate = date;
    } else {
      queueDate = new Date();
    }
    
    // Validate the date
    if (isNaN(queueDate.getTime())) {
      console.error('Invalid date, using current date:', date);
      queueDate = new Date();
    }
    
    const day = String(queueDate.getDate()).padStart(2, '0');
    const month = String(queueDate.getMonth() + 1).padStart(2, '0');
    const sequential = String(posNum).padStart(3, '0');
    const token = `${day}${month}-${sequential}`;
    console.log('Token generated:', token, 'Date:', queueDate, 'Position:', posNum);
    return token;
  } catch (error) {
    console.error('Token generation error:', error);
    // Fallback token generation
    const now = new Date();
    const posNum = parseInt(position) || 1;
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const sequential = String(posNum).padStart(3, '0');
    return `${day}${month}-${sequential}`;
  }
};

module.exports = {
  generateOTP,
  generateQueueToken,
};
