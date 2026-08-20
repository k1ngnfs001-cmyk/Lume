import {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from 'react';

import axios from '../api/axios';

const NotificationContext =
  createContext();

export const NotificationProvider = ({
  children,
}) => {
  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  // Bir vaqtning o'zida ikkita request ketishiga yo'l qo'ymaymiz
  const isFetchingRef = useRef(false);

  // Component unmount bo'lganini kuzatamiz
  const mountedRef = useRef(true);

  // Network errorni console'da qayta-qayta chiqarib yubormaslik
  const lastNetworkErrorRef =
    useRef(0);

  // ---------------------------------------------------------
  // Fetch notifications
  // ---------------------------------------------------------

  const fetchNotifications =
    useCallback(async () => {
      const token =
        localStorage.getItem(
          'lumeToken'
        );

      // Login qilinmagan bo'lsa request yubormaymiz
      if (!token) {
        return;
      }

      // Oldingi request hali davom etayotgan bo'lsa
      // yangi request yubormaymiz
      if (isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;

      try {
        const res =
          await axios.get(
            '/notifications'
          );

        if (!mountedRef.current) {
          return;
        }

        const data =
          Array.isArray(
            res.data
          )
            ? res.data
            : [];

        setNotifications(data);

        const unread =
          data.filter(
            (notification) =>
              !notification.isRead
          ).length;

        setUnreadCount(unread);

        // Request muvaffaqiyatli bo'lsa
        // network error timestampini reset qilamiz
        lastNetworkErrorRef.current = 0;
      } catch (error) {
        // 401 -> token yaroqsiz yoki yo'q
        if (
          error.response?.status ===
          401
        ) {
          return;
        }

        // Network error
        const isNetworkError =
          !error.response ||
          error.code ===
            'ERR_NETWORK' ||
          error.message ===
            'Network Error';

        if (isNetworkError) {
          const now =
            Date.now();

          // Faqat har 60 sekundda bir marta
          // network xatosini console'ga chiqaramiz
          if (
            now -
              lastNetworkErrorRef.current >
            60000
          ) {
            console.warn(
              'Lume: server bilan vaqtinchalik aloqa yo‘q. Keyingi urinish avtomatik amalga oshiriladi.'
            );

            lastNetworkErrorRef.current =
              now;
          }

          return;
        }

        // Boshqa server xatolarini ko'rsatamiz
        console.error(
          'Ошибка загрузки уведомлений:',
          error
        );
      } finally {
        isFetchingRef.current =
          false;
      }
    }, []);

  // ---------------------------------------------------------
  // Initial fetch + polling
  // ---------------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;

    fetchNotifications();

    // Har 30 sekundda tekshiramiz
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // ---------------------------------------------------------
  // Mark notification as read
  // ---------------------------------------------------------

  const markAsRead = async (
    id
  ) => {
    if (!id) {
      return;
    }

    try {
      await axios.put(
        `/notifications/${id}/read`
      );

      if (
        !mountedRef.current
      ) {
        return;
      }

      setNotifications(
        (prev) =>
          prev.map(
            (notification) =>
              notification._id === id
                ? {
                    ...notification,
                    isRead: true,
                  }
                : notification
          )
      );

      setUnreadCount(
        (prev) =>
          Math.max(
            0,
            prev - 1
          )
      );
    } catch (error) {
      const isNetworkError =
        !error.response ||
        error.code ===
          'ERR_NETWORK' ||
        error.message ===
          'Network Error';

      if (!isNetworkError) {
        console.error(
          'Ошибка отметки прочитанным:',
          error
        );
      }
    }
  };

  // ---------------------------------------------------------
  // Provider
  // ---------------------------------------------------------

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// ---------------------------------------------------------
// Hook
// ---------------------------------------------------------

export const useNotifications =
  () =>
    useContext(
      NotificationContext
    );