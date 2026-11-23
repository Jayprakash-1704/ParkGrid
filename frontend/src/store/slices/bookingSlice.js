import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, getApiErrorMessage } from '../../services/api.js';

export const fetchBookingsThunk = createAsyncThunk(
  'bookings/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/reservations', { params });
      return res.data.data.bookings;
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err, 'Failed to load reservations.'));
    }
  }
);

export const fetchPaymentsThunk = createAsyncThunk(
  'bookings/fetchPayments',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/payments/history');
      return res.data.data.payments;
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err, 'Failed to load payment history.'));
    }
  }
);

export const cancelBookingThunk = createAsyncThunk(
  'bookings/cancel',
  async ({ bookingId, reason }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/reservations/${bookingId}/cancel`, { reason });
      return res.data.data.booking;
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err, 'Could not cancel reservation.'));
    }
  }
);

const bookingSlice = createSlice({
  name: 'bookings',
  initialState: {
    items: [],
    payments: [],
    loading: false,
    paymentsLoading: false,
    error: null,
  },
  reducers: {
    upsertBookingRealtime(state, action) {
      const incoming = action.payload;
      if (!incoming?._id) return;
      const idx = state.items.findIndex((b) => b._id === incoming._id);
      if (idx >= 0) {
        state.items[idx] = incoming;
      } else {
        state.items.unshift(incoming);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookingsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingsThunk.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchBookingsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchPaymentsThunk.pending, (state) => {
        state.paymentsLoading = true;
      })
      .addCase(fetchPaymentsThunk.fulfilled, (state, action) => {
        state.payments = action.payload;
        state.paymentsLoading = false;
      })
      .addCase(fetchPaymentsThunk.rejected, (state) => {
        state.paymentsLoading = false;
      })
      .addCase(cancelBookingThunk.fulfilled, (state, action) => {
        const idx = state.items.findIndex((b) => b._id === action.payload._id);
        if (idx >= 0) {
          state.items[idx] = action.payload;
        }
      });
  },
});

export const { upsertBookingRealtime } = bookingSlice.actions;
export default bookingSlice.reducer;
