import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { patientAPI, doctorAPI } from '../../api/endpoints';

export const bookAppointment = createAsyncThunk(
  'appointment/bookAppointment',
  async (data, { rejectWithValue }) => {
    try {
      const response = await patientAPI.bookAppointment(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to book appointment');
    }
  }
);

export const getAppointments = createAsyncThunk(
  'appointment/getAppointments',
  async (role, { rejectWithValue }) => {
    try {
      let response;
      if (role === 'patient') {
        response = await patientAPI.getAppointments();
      } else if (role === 'doctor') {
        response = await doctorAPI.getAppointments();
      }
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch appointments');
    }
  }
);

const initialState = {
  appointments: [],
  currentAppointment: null,
  loading: false,
  error: null,
};

const appointmentSlice = createSlice({
  name: 'appointment',
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(bookAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bookAppointment.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAppointment = action.payload.data;
        state.appointments.push(action.payload.data);
      })
      .addCase(bookAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
      })
      .addCase(getAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default appointmentSlice.reducer;
