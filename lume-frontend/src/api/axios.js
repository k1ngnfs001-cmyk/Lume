import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://lume-5mof.onrender.com/api',
  timeout: 30000, // <--- 30 секунд. Если Render засыпает, запрос оборвется и выкинет тебя из "Загрузки"
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