import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://lume-5mof.onrender.com/api',
  timeout: 30000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('lumeToken');

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    // FormData bo'lsa, Content-Type ni qo'lda bermaymiz.
    // Browser o'zi multipart/form-data boundary qo'yadi.
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

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    const status =
      error.response?.status;

    const responseData =
      error.response?.data;

    // Faqat BAN qilingan user uchun
    // avtomatik logout qilamiz.
    const isBanned =
      status === 403 &&
      (
        responseData?.code ===
          'USER_BANNED' ||
        responseData?.message ===
          'Ваш аккаунт заблокирован администратором'
      );

    if (isBanned) {
      console.warn(
        '🚫 Lume: пользователь заблокирован'
      );

      // Token va userni tozalash
      localStorage.removeItem(
        'lumeToken'
      );

      localStorage.removeItem(
        'lumeUser'
      );

      // Login sahifasiga hard redirect
      // reload bilan
      if (
        window.location.pathname !==
        '/login'
      ) {
        window.location.replace(
          '/login'
        );
      }
    }

    return Promise.reject(error);
  }
);


export default axiosInstance;