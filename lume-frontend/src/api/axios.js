import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://lume-5mof.onrender.com', // Жёстко прописываем ссылку на бэкенд
  headers: { 'Content-Type': 'application/json' },
});

// ОБЯЗАТЕЛЬНО: Интерцептор для подстановки JWT токена
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