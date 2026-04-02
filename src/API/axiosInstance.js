import axios from 'axios';

// This is your common host configuration
const API = axios.create({
  baseURL: "http://localhost:3001/api/auth/", // Replace with your MongoDB backend URL
  headers: {
    "Content-Type": "application/json",
  }
});

// Optional: Automatically add the token to every request if it exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("userToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;