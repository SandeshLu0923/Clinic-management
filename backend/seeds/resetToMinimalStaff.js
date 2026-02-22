const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Doctor = require('../models/Doctor');

const REQUIRED_MODELS = [
  'users',
  'doctors',
];

async function clearAllCollections() {
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const collection of collections) {
    if (collection.name.startsWith('system.')) continue;
    await mongoose.connection.db.collection(collection.name).deleteMany({});
  }
}

async function createMinimalStaff() {
  const receptionist = await User.create({
    name: 'Emma White',
    email: 'receptionist@clinic.com',
    password: 'password123',
    phone: '98765432300',
    role: 'receptionist',
    isVerified: true,
    isActive: true,
  });

  const doctorUsers = await User.create([
    {
      name: 'Dr. Sarah Johnson',
      email: 'doctor1@clinic.com',
      password: 'password123',
      phone: '98765432101',
      role: 'doctor',
      isVerified: true,
      isActive: true,
    },
    {
      name: 'Dr. Michael Brown',
      email: 'doctor2@clinic.com',
      password: 'password123',
      phone: '98765432102',
      role: 'doctor',
      isVerified: true,
      isActive: true,
    },
  ]);

  const doctors = await Doctor.create([
    {
      userId: doctorUsers[0]._id,
      specialization: 'orthopedics',
      licenseNumber: 'LIC-ORTHO-0001',
      experience: 8,
      consultationFee: 600,
      isVerified: true,
      rating: 4.6,
      totalConsultations: 0,
    },
    {
      userId: doctorUsers[1]._id,
      specialization: 'neurology',
      licenseNumber: 'LIC-NEURO-0002',
      experience: 10,
      consultationFee: 650,
      isVerified: true,
      rating: 4.7,
      totalConsultations: 0,
    },
  ]);

  return { receptionist, doctors, doctorUsers };
}

async function run() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in backend/.env');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await clearAllCollections();
  console.log('Cleared all collections');

  const result = await createMinimalStaff();
  console.log('Created minimal staff');

  const usersCount = await User.countDocuments({});
  const doctorsCount = await Doctor.countDocuments({});

  if (usersCount !== 3 || doctorsCount !== 2) {
    throw new Error(`Unexpected seed counts - users: ${usersCount}, doctors: ${doctorsCount}`);
  }

  console.log('\nDone: database reset complete');
  console.log('Receptionist: receptionist@clinic.com');
  console.log('Doctor 1: doctor1@clinic.com');
  console.log('Doctor 2: doctor2@clinic.com');
  console.log('Password (all): password123');
  console.log(`Sanity: users=${usersCount}, doctors=${doctorsCount}`);
  console.log(`Models touched: ${REQUIRED_MODELS.join(', ')}`);

  await mongoose.disconnect();
}

run()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('Reset failed:', error.message);
    try {
      await mongoose.disconnect();
    } catch (_) {
      // ignore
    }
    process.exit(1);
  });

