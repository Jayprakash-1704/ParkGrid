import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, getApiErrorMessage } from '../../services/api.js';

export const fetchParkingLotsThunk = createAsyncThunk(
  'parking/fetchLots',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/parking-lots', { params });
      return res.data.data.lots;
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err, 'Failed to load parking locations.'));
    }
  }
);

export const fetchParkingLotDetailThunk = createAsyncThunk(
  'parking/fetchLotDetail',
  async (lotId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/parking-lots/${lotId}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err, 'Failed to load parking details.'));
    }
  }
);

const parkingSlice = createSlice({
  name: 'parking',
  initialState: {
    lots: [],
    currentLot: null,
    currentSlots: [],
    loading: false,
    detailLoading: false,
    error: null,
  },
  reducers: {
    slotUpdatedRealtime(state, action) {
      const { parkingLotId, slot, availableSlots, totalSlots } = action.payload || {};
      if (slot && state.currentLot && state.currentLot._id === parkingLotId) {
        const idx = state.currentSlots.findIndex((s) => s._id === slot._id);
        if (idx >= 0) {
          state.currentSlots[idx] = { ...state.currentSlots[idx], ...slot };
        } else {
          state.currentSlots.push(slot);
        }
        if (typeof availableSlots === 'number') {
          state.currentLot.availableSlots = availableSlots;
        }
        if (typeof totalSlots === 'number') {
          state.currentLot.totalSlots = totalSlots;
        }
      }

      const lotIdx = state.lots.findIndex((l) => l._id === parkingLotId);
      if (lotIdx >= 0) {
        if (typeof availableSlots === 'number') {
          state.lots[lotIdx].availableSlots = availableSlots;
        }
        if (typeof totalSlots === 'number') {
          state.lots[lotIdx].totalSlots = totalSlots;
        }
      }
    },
    occupancyUpdatedRealtime(state, action) {
      const { parkingLotId, availableSlots, totalSlots } = action.payload || {};
      const lotIdx = state.lots.findIndex((l) => l._id === parkingLotId);
      if (lotIdx >= 0) {
        if (typeof availableSlots === 'number') {
          state.lots[lotIdx].availableSlots = availableSlots;
        }
        if (typeof totalSlots === 'number') {
          state.lots[lotIdx].totalSlots = totalSlots;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchParkingLotsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParkingLotsThunk.fulfilled, (state, action) => {
        state.lots = action.payload;
        state.loading = false;
      })
      .addCase(fetchParkingLotsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchParkingLotDetailThunk.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchParkingLotDetailThunk.fulfilled, (state, action) => {
        state.currentLot = action.payload.lot;
        state.currentSlots = action.payload.slots;
        state.detailLoading = false;
      })
      .addCase(fetchParkingLotDetailThunk.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      });
  },
});

export const { slotUpdatedRealtime, occupancyUpdatedRealtime } = parkingSlice.actions;
export default parkingSlice.reducer;
