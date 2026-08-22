import axios from 'axios';

const API = axios.create({
  baseURL: 'https://lume-5mof.onrender.com/api',
  timeout: 30000
});

API.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('lumeToken');

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    } else {
      config.headers['Content-Type'] =
        'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,

  (error) => {
    const status =
      error.response?.status;

    const data =
      error.response?.data || {};

    const requestUrl =
      error.config?.url || '';

    // =====================================================
    // LOGIN / REGISTER / OTP uchun avtomatik redirect YO'Q
    // =====================================================

    const isAuthRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/verify-otp');

    // =====================================================
    // 401 — faqat authenticated requestlar
    // =====================================================

    if (
      status === 401 &&
      !isAuthRequest
    ) {
      localStorage.removeItem(
        'lumeToken'
      );

      localStorage.removeItem(
        'lumeUser'
      );

      if (
        window.location.pathname !== '/auth'
      ) {
        alert(
          'Сессия истекла. Войдите снова.'
        );

        window.location.replace(
          '/auth'
        );
      }
    }

    // =====================================================
    // 403 + USER_BANNED
    // =====================================================

    if (
      status === 403 &&
      data.code === 'USER_BANNED'
    ) {
      localStorage.removeItem(
        'lumeToken'
      );

      localStorage.removeItem(
        'lumeUser'
      );

      if (
        window.location.pathname !== '/auth'
      ) {
        alert(
          data.message ||
          'Ваш аккаунт заблокирован администратором'
        );

        window.location.replace(
          '/auth'
        );
      }
    }

    // Boshqa 403'larda logout qilinmaydi.

    return Promise.reject(error);
  }
);

export default API;