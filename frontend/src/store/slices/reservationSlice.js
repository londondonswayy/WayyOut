import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reservationAPI } from '../../services/api';

export const fetchMyReservations = createAsyncThunk('reservations/fetchMy', async (params, { rejectWithValue }) => {
  try {
    const response = await reservationAPI.myReservations(params);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const createReservation = createAsyncThunk('reservations/create', async (data, { rejectWithValue }) => {
  try {
    const response = await reservationAPI.create(data);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

const reservationSlice = createSlice({
  name: 'reservations',
  initialState: {
    list: [],
    loading: false,
    error: null,
    success: null,
  },
  reducers: {
    clearReservationState: (state) => {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyReservations.pending, (state) => { state.loading = true; })
      .addCase(fetchMyReservations.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.results || action.payload;
      })
      .addCase(fetchMyReservations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createReservation.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createReservation.fulfilled, (state, action) => {
        state.loading = false;
        state.success = 'Reservation request sent!';
        state.list.unshift(action.payload);
      })
      .addCase(createReservation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearReservationState } = reservationSlice.actions;
export default reservationSlice.reducer;
