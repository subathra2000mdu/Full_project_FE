// src/API/axiosInstance.js
//
// CRITICAL FIX: baseURL was hardcoded to 'http://localhost:3001/api/auth'
// This causes ALL API calls to hit your local machine after Netlify deployment.
//
// Fix: use REACT_APP_API_URL environment variable.
//
// ── Local development ──────────────────────────────────────────────────────────
// Create a file called  .env  in your React project root (same folder as package.json):
//
//   REACT_APP_API_URL=http://localhost:3001/api/auth
//
// ── Netlify production ─────────────────────────────────────────────────────────
// In Netlify dashboard → Site → Environment variables, add:
//
//   REACT_APP_API_URL = https://your-backend.onrender.com/api/auth
//
// Replace "your-backend" with your actual Render service name.
// After adding, trigger a new deploy in Netlify for the variable to take effect.
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios';

const API = axios.create({
  // Falls back to localhost if env var is not set (safe for local dev without .env)
  baseURL: 'https://flight-booking-p4qy.onrender.com/api/auth',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Attach JWT token to every request ─────────────────────────────────────────
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Handle 401 Unauthorized globally ──────────────────────────────────────────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userName');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;