import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/api',
});

axiosInstance.interceptors.request.use(
  (config) => {
    // Всегда берем токен напрямую из localStorage перед отправкой запроса
    const token = localStorage.getItem('lumeToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;