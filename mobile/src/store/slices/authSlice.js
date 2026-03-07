import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../../services/api';

export const loginUser = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.login(data);
    const { access, refresh, user } = res.data;
    await AsyncStorage.multiSet([['access_token', access], ['refresh_token', refresh]]);
    return { user, tokens: { access, refresh } };
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Login failed' });
  }
});

export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.register(data);
    const { user, tokens } = res.data;
    await AsyncStorage.multiSet([['access_token', tokens.access], ['refresh_token', tokens.refresh]]);
    return { user, tokens };
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Registration failed' });
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, isAuthenticated: false, loading: false, error: null },
  reducers: {
    logout: async (state) => {
      state.user = null;
      state.isAuthenticated = false;
      await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      });
  },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;
