import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../api/endpoints';

const normalizeApiError = (error, fallbackMessage) => {
  const responseData = error?.response?.data;
  if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
    return responseData.errors.map((entry) => entry.msg).filter(Boolean).join(', ') || fallbackMessage;
  }
  if (Array.isArray(responseData?.message)) {
    return responseData.message.join(', ') || fallbackMessage;
  }
  return responseData?.message || fallbackMessage;
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      return rejectWithValue(normalizeApiError(error, 'Login failed'));
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(data);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      return rejectWithValue(normalizeApiError(error, 'Registration failed'));
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Best effort logout. We still clear local auth state below.
      console.warn('Logout request failed, clearing local auth state anyway.', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return null;
  }
);

const initialState = {
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthState: (state) => {
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { clearAuthState } = authSlice.actions;
export default authSlice.reducer;
