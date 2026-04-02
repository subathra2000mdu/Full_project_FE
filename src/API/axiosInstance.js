import axios from 'axios';

// Create axios instance with backend base URL
const API = axios.create({
  baseURL: 'http://localhost:3001/api/auth', // Change 5000 to your backend port if different
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('userToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;