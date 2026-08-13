import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import Auth from './pages/Auth';
import Feed from './pages/Feed';
import FollowingFeed from './pages/FollowingFeed';
import Upload from './pages/Upload';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Chats from './pages/Chats';
import Search from './pages/Search';
import AdminPanel from './pages/AdminPanel';
import LeftSidebar from './components/LeftSidebar';
import { FiChevronsRight } from 'react-icons/fi';
import { useState, cloneElement } from 'react';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-white/40 text-2xl animate-pulse font-light">
          Lume загружается...
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/auth" replace />;
};

// Обёртка для страниц с сайдбаром (с сохранением состояния)
const LayoutWithSidebar = ({ children, scrollLock = false }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-dark flex relative w-full">
      {/* ===== САЙДБАР С ВЫСОКИМ Z-INDEX ===== */}
      <div className="z-[9998] relative">
        <LeftSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      </div>
      
      {/* Контент. margin-left гарантирует, что сайдбар НЕ перекроет видео */}
      <div className={`flex-1 w-full transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-[260px]' : 'ml-0'} ${scrollLock ? 'h-screen overflow-hidden' : 'min-h-screen overflow-y-auto'}`}>
        {/* Передаём isSidebarOpen в дочерние компоненты для динамического отступа плеера */}
        {cloneElement(children, { isSidebarOpen, setIsSidebarOpen })}
      </div>

      {/* Плавающая кнопка для открытия сайдбара (если он закрыт) */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-4 left-4 z-[9999] bg-black/80 backdrop-blur-md p-2.5 rounded-full border border-white/10 text-white hover:bg-black/60 transition-all duration-200 shadow-lg"
        >
          <FiChevronsRight size={22} />
        </button>
      )}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              
              <Route path="/" element={<ProtectedRoute><LayoutWithSidebar scrollLock={true}><Feed /></LayoutWithSidebar></ProtectedRoute>} />
              <Route path="/following" element={<ProtectedRoute><LayoutWithSidebar><FollowingFeed /></LayoutWithSidebar></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute><LayoutWithSidebar><Upload /></LayoutWithSidebar></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><LayoutWithSidebar><Notifications /></LayoutWithSidebar></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><LayoutWithSidebar><Search /></LayoutWithSidebar></ProtectedRoute>} />
              <Route path="/chats" element={<ProtectedRoute><LayoutWithSidebar><Chats /></LayoutWithSidebar></ProtectedRoute>} />
              <Route path="/chats/:userId" element={<ProtectedRoute><LayoutWithSidebar><Chats /></LayoutWithSidebar></ProtectedRoute>} />
              <Route path="/profile/:id" element={<ProtectedRoute><LayoutWithSidebar><Profile /></LayoutWithSidebar></ProtectedRoute>} />
              <Route path="/profile/edit" element={<ProtectedRoute><LayoutWithSidebar><EditProfile /></LayoutWithSidebar></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><LayoutWithSidebar><AdminPanel /></LayoutWithSidebar></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;