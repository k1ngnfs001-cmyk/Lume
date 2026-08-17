import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://lume-5mof.onrender.com/api', // <--- ВАЖНО: /api в конце
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lumeToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;