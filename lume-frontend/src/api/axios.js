import axios from 'axios';

const axiosInstance = axios.create({
  // Обрати внимание: теперь в конце есть /api
  baseURL: 'https://lume-5mof.onrender.com/api', 
  headers: { 'Content-Type': 'application/json' },
});

// Интерцептор для подстановки JWT токена
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