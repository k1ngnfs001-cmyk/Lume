import {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  useCallback
} from 'react';

import {
  motion,
  AnimatePresence
} from 'framer-motion';

import axios from '../api/axios';
import { useSocket } from './SocketContext';

const NotificationContext =
  createContext(null);

export const NotificationProvider = ({
  children
}) => {
  const { socket } = useSocket();

  const [
    notifications,
    setNotifications
  ] = useState([]);

  const [
    unreadCount,
    setUnreadCount
  ] = useState(0);

  const [
    toast,
    setToast
  ] = useState(null);

  const isFetchingRef =
    useRef(false);

  const mountedRef =
    useRef(true);

  const toastTimerRef =
    useRef(null);

  const lastNetworkErrorRef =
    useRef(0);

  // =========================================================
  // FETCH NOTIFICATIONS
  // =========================================================

  const fetchNotifications =
    useCallback(async () => {
      const token =
        localStorage.getItem(
          'lumeToken'
        );

      if (!token) {
        return;
      }

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
          Array.isArray(res.data)
            ? res.data
            : [];

        setNotifications(data);

        const unread =
          data.filter(
            (notification) =>
              !notification.isRead
          ).length;

        setUnreadCount(unread);

        lastNetworkErrorRef.current = 0;
      } catch (error) {
        if (
          error.response?.status === 401
        ) {
          return;
        }

        const isNetworkError =
          !error.response ||
          error.code === 'ERR_NETWORK' ||
          error.message === 'Network Error';

        if (isNetworkError) {
          const now = Date.now();

          if (
            now -
              lastNetworkErrorRef.current >
            60000
          ) {
            console.warn(
              'Lume: server bilan vaqtinchalik aloqa yo‘q.'
            );

            lastNetworkErrorRef.current =
              now;
          }

          return;
        }

        console.error(
          'Ошибка загрузки уведомлений:',
          error
        );
      } finally {
        isFetchingRef.current = false;
      }
    }, []);

  // =========================================================
  // INITIAL FETCH + POLLING
  // =========================================================

  useEffect(() => {
    mountedRef.current = true;

    fetchNotifications();

    const interval =
      setInterval(() => {
        fetchNotifications();
      }, 30000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // =========================================================
  // REAL-TIME SOCKET NOTIFICATION
  // =========================================================

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleNewNotification =
      (notification) => {
        if (!notification) {
          return;
        }

        setNotifications((prev) => {
          const exists = prev.some(
            (item) =>
              item._id === notification._id
          );

          if (exists) {
            return prev;
          }

          return [
            notification,
            ...prev
          ];
        });

        setUnreadCount((prev) => prev + 1);

        setToast(notification);

        if (toastTimerRef.current) {
          clearTimeout(
            toastTimerRef.current
          );
        }

        toastTimerRef.current =
          setTimeout(() => {
            setToast(null);
          }, 5000);
      };

    socket.on(
      'new_notification',
      handleNewNotification
    );

    return () => {
      socket.off(
        'new_notification',
        handleNewNotification
      );

      if (toastTimerRef.current) {
        clearTimeout(
          toastTimerRef.current
        );
      }
    };
  }, [socket]);

  // =========================================================
  // MARK ONE AS READ
  // =========================================================

  const markAsRead = async (id) => {
    if (!id) {
      return;
    }

    try {
      const target =
        notifications.find(
          (notification) =>
            notification._id === id
        );

      if (
        !target ||
        target.isRead
      ) {
        return;
      }

      await axios.put(
        `/notifications/${id}/read`
      );

      if (!mountedRef.current) {
        return;
      }

      setNotifications((prev) =>
        prev.map(
          (notification) =>
            notification._id === id
              ? {
                  ...notification,
                  isRead: true
                }
              : notification
        )
      );

      setUnreadCount((prev) =>
        Math.max(0, prev - 1)
      );
    } catch (error) {
      console.error(
        'Ошибка отметки уведомления:',
        error
      );
    }
  };

  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  const markAllAsRead = async () => {
    try {
      await axios.put(
        '/notifications/read'
      );

      if (!mountedRef.current) {
        return;
      }

      setNotifications((prev) =>
        prev.map(
          (notification) => ({
            ...notification,
            isRead: true
          })
        )
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        'Ошибка отметки всех уведомлений:',
        error
      );
    }
  };

  // =========================================================
  // CLOSE TOAST
  // =========================================================

  const closeToast = () => {
    setToast(null);

    if (toastTimerRef.current) {
      clearTimeout(
        toastTimerRef.current
      );
    }
  };

  // =========================================================
  // ICON
  // =========================================================

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return '❤️';

      case 'save':
        return '🔖';

      case 'comment':
        return '💬';

      case 'comment_like':
        return '❤️';

      case 'reply':
        return '↩️';

      case 'message':
        return '💬';

      case 'follow':
        return '👤';

      case 'story':
        return '⭕';

      default:
        return '🔔';
    }
  };

  // =========================================================
  // PROVIDER
  // =========================================================

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead
      }}
    >
      {children}

      {/* =====================================================
          TOP RIGHT GLASS NOTIFICATION
      ====================================================== */}

      <div
        className="
          fixed
          top-5
          right-5
          z-[99990]
          w-[min(390px,calc(100vw-32px))]
          pointer-events-none
        "
      >
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{
                opacity: 0,
                x: 80,
                scale: 0.95
              }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1
              }}
              exit={{
                opacity: 0,
                x: 80,
                scale: 0.95
              }}
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 28
              }}
              className="
                pointer-events-auto
                relative
                overflow-hidden
                rounded-2xl
                border
                border-white/15
                bg-white/10
                backdrop-blur-2xl
                shadow-2xl
                p-4
                text-white
              "
            >
              <div
                className="
                  pointer-events-none
                  absolute
                  inset-0
                  bg-gradient-to-br
                  from-white/15
                  via-transparent
                  to-transparent
                "
              />

              <div
                className="
                  relative
                  flex
                  gap-3
                  items-start
                "
              >
                {/* Avatar */}
                <div
                  className="
                    w-11
                    h-11
                    shrink-0
                    rounded-full
                    overflow-hidden
                    border
                    border-white/20
                    bg-white/10
                    flex
                    items-center
                    justify-center
                  "
                >
                  {toast.sender?.avatar ? (
                    <img
                      src={toast.sender.avatar}
                      alt="Avatar"
                      className="
                        w-full
                        h-full
                        object-cover
                      "
                    />
                  ) : (
                    <span className="
                      text-sm
                      font-bold
                      text-white
                    ">
                      {toast.sender?.username
                        ?.charAt(0)
                        .toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div
                  className="
                    flex-1
                    min-w-0
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <span className="text-lg">
                      {getNotificationIcon(
                        toast.type
                      )}
                    </span>

                    <span
                      className="
                        font-semibold
                        text-sm
                        truncate
                      "
                    >
                      @{toast.sender?.username}
                    </span>
                  </div>

                  <p
                    className="
                      text-white/70
                      text-sm
                      mt-1
                      leading-relaxed
                    "
                  >
                    {toast.text}
                  </p>

                  <p
                    className="
                      text-white/35
                      text-[10px]
                      mt-2
                    "
                  >
                    Сейчас
                  </p>
                </div>

                {/* Close */}
                <button
                  onClick={closeToast}
                  className="
                    shrink-0
                    text-white/40
                    hover:text-white
                    transition
                    text-lg
                  "
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications =
  () =>
    useContext(
      NotificationContext
    );