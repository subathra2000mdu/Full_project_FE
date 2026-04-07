import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://flight-booking-p4qy.onrender.com/api/auth',
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken'); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;