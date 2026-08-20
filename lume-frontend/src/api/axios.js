import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://lume-5mof.onrender.com/api',
  timeout: 30000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lumeToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // FormData yuborilganda Content-Type ni qo'lda bermaymiz.
    // Browser o'zi multipart/form-data va boundary qo'yadi.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    } else {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;