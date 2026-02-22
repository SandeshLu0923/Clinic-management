import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  billings: [],
  currentBilling: null,
  loading: false,
  error: null,
};

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    addBilling: (state, action) => {
      state.billings.push(action.payload);
    },
    setBillings: (state, action) => {
      state.billings = action.payload;
    },
    setCurrentBilling: (state, action) => {
      state.currentBilling = action.payload;
    },
    clearBillings: (state) => {
      state.billings = [];
      state.currentBilling = null;
    },
  },
});

export const { addBilling, setBillings, setCurrentBilling, clearBillings } = billingSlice.actions;
export default billingSlice.reducer;
