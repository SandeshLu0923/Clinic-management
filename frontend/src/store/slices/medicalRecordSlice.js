import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  records: [],
  currentRecord: null,
  loading: false,
  error: null,
};

const medicalRecordSlice = createSlice({
  name: 'medicalRecord',
  initialState,
  reducers: {
    addRecord: (state, action) => {
      state.records.push(action.payload);
    },
    setCurrentRecord: (state, action) => {
      state.currentRecord = action.payload;
    },
    clearRecords: (state) => {
      state.records = [];
      state.currentRecord = null;
    },
  },
});

export const { addRecord, setCurrentRecord, clearRecords } = medicalRecordSlice.actions;
export default medicalRecordSlice.reducer;
