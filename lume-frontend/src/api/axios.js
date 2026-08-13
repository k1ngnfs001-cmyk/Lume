import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/api',
});

const axiosInstance = axios.create({
  baseURL: 'https://lume-5mof.onrender.com', // Жёстко прописываем ссылку на бэкенд
  headers: { 'Content-Type': 'application/json' },
});

export default axiosInstance;