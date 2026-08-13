import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import axios from '../api/axios';
import logo from '../assets/logo.png';
import { 
  FiHome, 
  FiUsers, 
  FiSend, 
  FiBell, 
  FiUser, 
  FiSettings, 
  FiLogOut,
  FiSearch,
  FiPlusSquare,
  FiShield,
  FiChevronsLeft // Добавили иконку для сворачивания
} from 'react-icons/fi';

const LeftSidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [followingList, setFollowingList] = useState([]);

  useEffect(() => {
    const loadFollowing = async () => {
      if (!user || !user.following || user.following.length === 0) {
        setFollowingList([]);
        return;
      }
      try {
        const res = await axios.get('/users/following');
        setFollowingList(res.data);
      } catch (error) {
        // Fallback
      }
    };
    loadFollowing();
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const mainMenuItems = [
    { label: 'Главный', icon: <FiHome size={22} />, path: '/' },
    { label: 'Подписки', icon: <FiUsers size={22} />, path: '/following' },
    { label: 'Загрузить', icon: <FiPlusSquare size={22} />, path: '/upload' },
    { label: 'Сообщения', icon: <FiSend size={22} />, path: '/chats' },
    { label: 'Уведомления', icon: <FiBell size={22} />, path: '/notifications' },
    { label: 'Профиль', icon: <FiUser size={22} />, path: `/profile/${user?._id}` },
  ];

  const isAdminUser = user?.isAdmin === true || user?.role === 'admin';

  return (
    <div 
      id="lume-sidebar" 
      onWheel={(e) => e.stopPropagation()}
      // ========= ИЗМЕНЕНИЕ: z-40 заменено на z-[9998] =========
      className={`fixed top-0 left-0 z-[9998] h-screen bg-[#0a0a0a] border-r border-white/10 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} w-[260px] shadow-2xl`}
    >
      <div className="w-[260px] h-full overflow-y-auto scrollbar-hide p-4 flex flex-col">
        
        <div className="flex justify-between items-center mb-6 pl-2">
          <Link to="/">
            <img src={logo} alt="Lume" className="h-35px w-auto object-contain" />
          </Link>
          {/* Кнопка сворачивания сайдбара */}
          <button 
            onClick={() => setIsOpen(false)}
            className="hidden md:flex text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            <FiChevronsLeft size={22} />
          </button>
        </div>

        <form onSubmit={handleSearch} className="relative mb-6">
          <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-full px-4 py-3 flex items-center gap-3">
            <FiSearch className="text-white/40 text-lg" />
            <input
              type="text"
              placeholder="Поиск"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-white outline-none placeholder:text-white/40 text-sm"
            />
          </div>
        </form>

        <div className="flex flex-col gap-1 flex-1">
          {mainMenuItems.map((item) => {
            const isActive = item.path === '/' && window.location.pathname === '/';
            return (
              <Link 
                key={item.label}
                to={item.path}
                className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group ${
                  isActive ? 'text-white bg-white/5' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`group-hover:scale-110 transition-transform ${isActive ? 'text-white' : 'text-white/60'}`}>
                  {item.icon}
                </span>
                <span className={`font-medium text-base ${isActive ? 'text-white' : ''}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="border-t border-white/10 my-3"></div>

        <div className="flex flex-col gap-1">
          <Link 
            to="/profile/edit"
            className="flex items-center gap-4 px-3 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200 group"
          >
            <span className="group-hover:scale-110 transition-transform"><FiSettings size={22} /></span>
            <span className="font-medium text-base">Настройки</span>
          </Link>

          {isAdminUser && (
            <Link 
              to="/admin"
              className="flex items-center gap-4 px-3 py-3 text-accent/80 hover:text-accent hover:bg-accent/10 rounded-xl transition-all duration-200 group"
            >
              <span className="group-hover:scale-110 transition-transform"><FiShield size={22} /></span>
              <span className="font-medium text-base">Админ панель</span>
            </Link>
          )}
        </div>

        <div className="border-t border-white/10 my-3"></div>

        <div className="mb-2">
          <h3 className="text-white/40 text-xs font-semibold px-3 py-2">Подписки на аккаунты</h3>
          <div className="flex flex-col gap-1 mt-1">
            {followingList.length > 0 ? (
              followingList.slice(0, 3).map((followed) => (
                <Link 
                  key={followed._id}
                  to={`/profile/${followed._id}`}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-xl transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs overflow-hidden">
                    {followed.avatar ? (
                      <img src={followed.avatar} alt="Avatar" className="w-full h-full object-cover" crossOrigin="anonymous" />
                    ) : (
                      followed.username?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white/80 text-sm font-medium">@{followed.username || 'Пользователь'}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="flex items-center gap-3 px-3 py-2 opacity-60">
                <div className="w-8 h-8 rounded-full bg-gray-800"></div>
                <span className="text-white/40 text-sm">Нет подписок</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto border-t border-white/10 pt-3">
          <button 
            onClick={() => { logout(); navigate('/auth'); }}
            className="flex items-center gap-4 px-3 py-3 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 w-full text-left group"
          >
            <FiLogOut size={22} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium text-base">Выйти</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;