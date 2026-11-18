import axios from 'axios';
import { supabase } from './supabase.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://cineticket-9sgk.onrender.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Supabase access token to every outgoing request
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    console.warn('[API INTERCEPTOR WARN] Could not attach auth token:', error);
  }
  return config;
}, (error) => Promise.reject(error));

// Extract normalized error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error?.message || error.message || 'Network request failed';
    const code = error.response?.data?.error?.code || 'UNKNOWN_ERROR';
    const customError = new Error(message);
    customError.code = code;
    customError.status = error.response?.status;
    return Promise.reject(customError);
  }
);

export default api;
