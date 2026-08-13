import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    if (!isDropdownOpen) {
      markAllAsRead();
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="bg-white/5 border-b border-white/10 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-50 gap-4">
      <Link to="/" className="text-xl font-bold bg-linear-to-r from-accent to-glow bg-clip-text text-transparent whitespace-nowrap">
        Lume
      </Link>
      
      {/* ПОИСКОВАЯ СТРОКА */}
      <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
        <input
          type="text"
          placeholder="Поиск пользователей или хэштегов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-black/40 border border-white/10 text-white rounded-full px-4 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-white/30"
        />
      </form>
      
      <div className="flex items-center gap-3 relative">
        {/* УВЕДОМЛЕНИЯ */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={toggleDropdown}
            className="relative text-white/60 hover:text-white transition text-xl p-1"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-dark animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-12 w-80 bg-dark/95 border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl z-60"
              >
                <div className="p-3 border-b border-white/10 flex justify-between items-center">
                  <span className="text-white font-semibold text-sm">Уведомления</span>
                </div>
                <div className="max-h-72 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 && (
                    <div className="p-6 text-center text-white/30 text-sm">Пока тишина...</div>
                  )}
                  {notifications.slice(0, 10).map((notif) => (
                    <div 
                      key={notif._id}
                      className={`p-3 border-b border-white/5 hover:bg-white/5 transition flex gap-3 items-start ${!notif.isRead ? 'bg-accent/5 border-l-2 border-accent' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white shrink-0 overflow-hidden">
                        {notif.sender?.avatar ? (
                          <img src={notif.sender.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          notif.sender?.username?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-white text-sm">
                          <span className="font-medium">@{notif.sender?.username}</span> {notif.text}
                        </div>
                        <div className="text-white/30 text-[10px]">
                          {new Date(notif.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-white/10 text-center">
                  <Link to="/profile/edit" className="text-white/30 text-xs hover:text-white transition">
                    Управлять уведомлениями
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Link to={`/profile/${user?._id}`} className="text-white/80 hidden sm:block hover:text-white transition">
          @{user?.username || 'Пользователь'}
        </Link>
        <button 
          onClick={logout}
          className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition"
        >
          Выйти
        </button>
      </div>
    </header>
  );
};

export default Header;