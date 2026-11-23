import axios from 'axios';

const TOKEN_STORAGE_KEY = 'parkgrid_access_token';

export function setStoredToken(token) {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage restriction
  }
}

export function getStoredToken() {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

// export const api = axios.create({
//   baseURL: '/api',
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api.post('/auth/refresh').finally(() => {
            refreshPromise = null;
          });
        }
        const refreshRes = await refreshPromise;
        const newToken = refreshRes.data?.data?.accessToken;
        if (newToken) {
          setStoredToken(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch {
        setStoredToken(null);
      }
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  return err?.response?.data?.message || err?.message || fallback;
}
