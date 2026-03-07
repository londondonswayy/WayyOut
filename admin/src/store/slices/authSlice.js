import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../services/api';

const savedAdmin = (() => {
  try { return JSON.parse(localStorage.getItem('admin_user')); } catch { return null; }
})();

export const adminLogin = createAsyncThunk('auth/adminLogin', async (data, { rejectWithValue }) => {
  try {
    const res = await adminAPI.login(data);
    const { access, user } = res.data;
    if (user.role !== 'admin') throw new Error('Unauthorized');
    localStorage.setItem('admin_token', access);
    localStorage.setItem('admin_user', JSON.stringify(user));
    return { user, token: access };
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Login failed' });
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    admin: savedAdmin,
    token: localStorage.getItem('admin_token'),
    isAuthenticated: !!localStorage.getItem('admin_token'),
    loading: false,
    error: null,
  },
  reducers: {
    adminLogout: (state) => {
      state.admin = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminLogin.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.admin = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { adminLogout } = authSlice.actions;
export default authSlice.reducer;
