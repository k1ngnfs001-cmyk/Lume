import { createContext, useState, useContext, useEffect } from 'react';
import axios from '../api/axios';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    // ===== ГЛАВНОЕ ИСПРАВЛЕНИЕ: Если нет токена, просто выходим! =====
    const token = localStorage.getItem('lumeToken');
    if (!token) return; 

    try {
      const res = await axios.get('/notifications');
      setNotifications(res.data);
      const unread = res.data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      // Игнорируем ошибку 401, так как она возникает только когда пользователь не авторизован
      if (error.response?.status !== 401) {
        console.error('Ошибка загрузки уведомлений:', error);
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('lumeToken');
    if (token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Обновлять каждые 30 сек
      return () => clearInterval(interval);
    }
  }, []);

  const markAsRead = async (id) => {
    try {
      await axios.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Ошибка отметки прочитанным:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);