const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);

    const allowWithoutDb = String(process.env.ALLOW_START_WITHOUT_DB || 'false').toLowerCase() === 'true';
    if (allowWithoutDb && process.env.NODE_ENV !== 'production') {
      console.log('ALLOW_START_WITHOUT_DB=true: starting server in degraded mode (database unavailable).');
      return null;
    }

    throw error;
  }
};

module.exports = connectDB;
