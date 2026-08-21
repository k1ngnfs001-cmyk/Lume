import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('lumeToken');

    if (!token || !user?._id) {
      setSocket(null);
      return;
    }

    const newSocket = io('https://lume-5mof.onrender.com', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 10000
    });

    setSocket(newSocket);

    // USER BANNED
    const handleUserBanned = (data) => {
      newSocket.disconnect();
      localStorage.removeItem('lumeToken');
      localStorage.removeItem('lumeUser');

      try {
        logout();
      } catch (error) {
        console.error('Logout error:', error);
      }

      alert(data?.message || 'Sizning akkauntingiz bloklandi!');
      window.location.href = '/auth';
    };

    // ACCOUNT DELETED
    const handleAccountDeleted = (data) => {
      newSocket.disconnect();
      localStorage.removeItem('lumeToken');
      localStorage.removeItem('lumeUser');

      try {
        logout();
      } catch (error) {
        console.error('Logout error:', error);
      }

      alert(data?.message || 'Sizning akkauntingiz o‘chirildi!');
      window.location.href = '/auth';
    };

    newSocket.on('user-banned', handleUserBanned);
    newSocket.on('account-deleted', handleAccountDeleted);

    return () => {
      newSocket.off('user-banned', handleUserBanned);
      newSocket.off('account-deleted', handleAccountDeleted);
      newSocket.disconnect();
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);