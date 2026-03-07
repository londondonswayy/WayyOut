import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { venueAPI } from '../../services/api';

export const fetchVenues = createAsyncThunk('venues/fetch', async (params, { rejectWithValue }) => {
  try {
    const response = await venueAPI.list(params);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const fetchTrending = createAsyncThunk('venues/trending', async (_, { rejectWithValue }) => {
  try {
    const response = await venueAPI.trending();
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const fetchCategories = createAsyncThunk('venues/categories', async (_, { rejectWithValue }) => {
  try {
    const response = await venueAPI.categories();
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

const venueSlice = createSlice({
  name: 'venues',
  initialState: {
    list: [],
    trending: [],
    categories: [],
    selectedVenue: null,
    loading: false,
    error: null,
    filters: {
      city: '',
      category: '',
      is_open: false,
      vibe: '',
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setSelectedVenue: (state, action) => {
      state.selectedVenue = action.payload;
    },
    clearVenues: (state) => {
      state.list = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVenues.pending, (state) => { state.loading = true; })
      .addCase(fetchVenues.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.results || action.payload;
      })
      .addCase(fetchVenues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchTrending.fulfilled, (state, action) => {
        state.trending = action.payload.results || action.payload;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload.results || action.payload;
      });
  },
});

export const { setFilters, setSelectedVenue, clearVenues } = venueSlice.actions;
export default venueSlice.reducer;
