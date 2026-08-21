import axios from 'axios';

const API = axios.create({
  baseURL: 'https://lume-5mof.onrender.com/api'
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('lumeToken');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;

      // 401: Token eski yoki yo'q / 403: Ban berilgan
      if (status === 401 || status === 403) {
        localStorage.removeItem('lumeToken');
        localStorage.removeItem('lumeUser');

        const message = status === 403
          ? (error.response.data?.message || 'Sizning akkauntingiz bloklangan!')
          : 'Sessiya muddati tugadi. Qaytadan tizimga kiring!';

        alert(message);
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export default API;