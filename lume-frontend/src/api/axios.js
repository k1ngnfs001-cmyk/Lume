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
    if (error.response && error.response.status === 403) {
      const message = error.response.data?.message || 'Sizning akkauntingiz bloklangan!';

      localStorage.removeItem('lumeToken');
      localStorage.removeItem('lumeUser');

      alert(message);
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default API;