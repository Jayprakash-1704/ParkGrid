import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import parkingReducer from './slices/parkingSlice.js';
import bookingReducer from './slices/bookingSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    parking: parkingReducer,
    bookings: bookingReducer,
  },
});
