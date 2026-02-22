import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  queue: [],
  currentQueue: null,
  loading: false,
  error: null,
};

const queueSlice = createSlice({
  name: 'queue',
  initialState,
  reducers: {
    setQueue: (state, action) => {
      state.queue = action.payload;
    },
    addToQueue: (state, action) => {
      state.queue.push(action.payload);
    },
    setCurrentQueue: (state, action) => {
      state.currentQueue = action.payload;
    },
    clearQueue: (state) => {
      state.queue = [];
      state.currentQueue = null;
    },
  },
});

export const { setQueue, addToQueue, setCurrentQueue, clearQueue } = queueSlice.actions;
export default queueSlice.reducer;
