const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Logger Configuration
 * Provides structured logging for all application activities
 * Logs to both console and file with different levels
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.metadata(),
    winston.format.json()
  ),
  defaultMeta: { service: 'clinic-management-api' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          let metaStr = '';
          if (Object.keys(meta).length > 0 && meta.service !== 'clinic-management-api') {
            metaStr = JSON.stringify(meta, null, 2);
          }
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      )
    }),
    // Error log file transport
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: winston.format.json()
    }),
    // Combined log file transport
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: winston.format.json()
    }),
    // Activity log file transport
    new winston.transports.File({
      filename: path.join(logsDir, 'activity.log'),
      level: 'info',
      format: winston.format.json()
    })
  ]
});

// Export logger
module.exports = logger;
