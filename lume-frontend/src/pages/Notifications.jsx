import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import { motion } from 'framer-motion';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await axios.get('/notifications');
        setNotifications(res.data);
      } catch (error) {
        console.error('Ошибка загрузки уведомлений:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, []);

  const markAllAsRead = async () => {
    try {
      await axios.put('/notifications/read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Ошибка пометки:', error);
    }
  };

  if (loading) return <div className="w-full h-screen flex items-center justify-center bg-dark text-white/50">Загрузка уведомлений...</div>;

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center p-6 pt-10">
      <div className="w-full max-w-150 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <h2 className="text-white text-2xl font-bold">Уведомления</h2>
          <button onClick={markAllAsRead} className="text-xs text-white/50 hover:text-white transition">Отметить все как прочитанные</button>
        </div>
        
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <p className="text-white/40 text-center py-10">У вас пока нет уведомлений.</p>
          ) : (
            notifications.map((notif) => (
              <motion.div 
                key={notif._id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 p-4 rounded-xl transition ${notif.isRead ? 'opacity-60' : 'bg-accent/5 border-l-2 border-accent'}`}
              >
                <Link to={`/profile/${notif.sender?._id}`} className="shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold overflow-hidden">
                    {notif.sender?.avatar ? (
                      <img src={notif.sender.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      notif.sender?.username?.charAt(0).toUpperCase()
                    )}
                  </div>
                </Link>
                <div className="flex-1">
                  <Link to={`/profile/${notif.sender?._id}`} className="text-white font-medium hover:underline">
                    @{notif.sender?.username}
                  </Link>
                  <span className="text-white/70 text-sm ml-1">{notif.text}</span>
                  <div className="text-white/30 text-xs mt-1">{new Date(notif.createdAt).toLocaleString()}</div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;