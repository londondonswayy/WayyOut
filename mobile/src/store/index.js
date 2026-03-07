import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import venueReducer from './slices/venueSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    venues: venueReducer,
  },
});
