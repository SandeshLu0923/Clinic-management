import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import appointmentReducer from './slices/appointmentSlice';
import medicalRecordReducer from './slices/medicalRecordSlice';
import billingReducer from './slices/billingSlice';
import queueReducer from './slices/queueSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    appointment: appointmentReducer,
    medicalRecord: medicalRecordReducer,
    billing: billingReducer,
    queue: queueReducer,
  },
});

export default store;
