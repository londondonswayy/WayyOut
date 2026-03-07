import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { venueAPI } from '../../services/api';

export const fetchVenues = createAsyncThunk('venues/fetch', async (params) => {
  const res = await venueAPI.list(params);
  return res.data;
});

export const fetchTrending = createAsyncThunk('venues/trending', async () => {
  const res = await venueAPI.trending();
  return res.data;
});

const venueSlice = createSlice({
  name: 'venues',
  initialState: { list: [], trending: [], loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVenues.pending, (state) => { state.loading = true; })
      .addCase(fetchVenues.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.results || action.payload;
      })
      .addCase(fetchTrending.fulfilled, (state, action) => {
        state.trending = action.payload;
      });
  },
});

export default venueSlice.reducer;
