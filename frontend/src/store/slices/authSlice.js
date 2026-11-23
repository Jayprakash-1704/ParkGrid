import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, getApiErrorMessage, setStoredToken } from '../../services/api.js';
import { joinRoleChannel } from '../../services/socket.js';

export const hydrateAuth = createAsyncThunk(
  'auth/hydrate',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/auth/me');
      const user = res.data?.data?.user;
      if (user) joinRoleChannel(user);
      return user;
    } catch {
      setStoredToken(null);
      return rejectWithValue(null);
    }
  }
);

export const loginUserThunk = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/login', credentials);
      const { user, accessToken } = res.data.data;
      if (accessToken) setStoredToken(accessToken);
      joinRoleChannel(user);
      return user;
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err, 'Invalid credentials.'));
    }
  }
);

export const registerUserThunk = createAsyncThunk(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/register', payload);
      const { user, accessToken } = res.data.data;
      if (accessToken) setStoredToken(accessToken);
      joinRoleChannel(user);
      return user;
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err, 'Registration failed.'));
    }
  }
);

export const logoutUserThunk = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    // ignore
  } finally {
    setStoredToken(null);
  }
});

export const updateProfileThunk = createAsyncThunk(
  'auth/updateProfile',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.patch('/auth/profile', payload);
      return res.data.data.user;
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err, 'Profile update failed.'));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    initialized: false,
    loading: false,
    error: null,
  },
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.initialized = true;
        state.loading = false;
      })
      .addCase(hydrateAuth.rejected, (state) => {
        state.user = null;
        state.initialized = true;
        state.loading = false;
      })
      .addCase(loginUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUserThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.initialized = true;
        state.loading = false;
      })
      .addCase(loginUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUserThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.initialized = true;
        state.loading = false;
      })
      .addCase(registerUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logoutUserThunk.fulfilled, (state) => {
        state.user = null;
        state.error = null;
      })
      .addCase(updateProfileThunk.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
