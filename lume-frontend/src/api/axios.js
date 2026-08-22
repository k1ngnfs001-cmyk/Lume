import axios from 'axios';

const API = axios.create({
  baseURL: 'https://lume-5mof.onrender.com/api',
  timeout: 30000
});


// =========================================================
// REQUEST INTERCEPTOR
// =========================================================

API.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('lumeToken');

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    // FormData uchun Content-Type'ni browserga qoldiramiz.
    // Browser multipart/form-data boundary'ni o'zi qo'yadi.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    } else {
      config.headers['Content-Type'] =
        'application/json';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// =========================================================
// RESPONSE INTERCEPTOR
// =========================================================

API.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    const status =
      error.response?.status;

    const data =
      error.response?.data || {};

    const code =
      data.code;

    const message =
      data.message;


    // =======================================================
    // 401
    // Token yo'q / noto'g'ri / muddati tugagan
    // =======================================================

    if (status === 401) {
      console.warn(
        '🔐 Lume: session invalid or expired'
      );

      localStorage.removeItem(
        'lumeToken'
      );

      localStorage.removeItem(
        'lumeUser'
      );

      if (
        window.location.pathname !==
        '/auth'
      ) {
        alert(
          'Сессия истекла. Войдите снова.'
        );

        window.location.replace(
          '/auth'
        );
      }

      return Promise.reject(error);
    }


    // =======================================================
    // 403 + USER_BANNED
    // Faqat ban qilingan userni chiqaramiz
    // =======================================================

    if (
      status === 403 &&
      code === 'USER_BANNED'
    ) {
      console.warn(
        '🚫 Lume: user is banned'
      );

      localStorage.removeItem(
        'lumeToken'
      );

      localStorage.removeItem(
        'lumeUser'
      );

      if (
        window.location.pathname !==
        '/auth'
      ) {
        alert(
          message ||
          'Ваш аккаунт заблокирован администратором'
        );

        window.location.replace(
          '/auth'
        );
      }

      return Promise.reject(error);
    }


    // =======================================================
    // OTHER 403
    // MUHIM:
    // Bu yerda logout QILMAYMIZ.
    //
    // Masalan:
    // Admin Unban qilayotganda
    // permission xatosi bo'lsa,
    // admin sessioni o'chmasligi kerak.
    // =======================================================

    if (status === 403) {
      console.warn(
        '⚠️ Lume: 403 response',
        data
      );

      return Promise.reject(error);
    }


    // =======================================================
    // BOSHQA XATOLAR
    // =======================================================

    return Promise.reject(error);
  }
);


export default API;