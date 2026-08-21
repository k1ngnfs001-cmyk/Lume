import {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';

import io from 'socket.io-client';

import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  const {
    user,
    logout
  } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('lumeToken');

    if (!token || !user) {
      setSocket(null);
      return;
    }

    const newSocket = io(
      'https://lume-5mof.onrender.com',
      {
        auth: {
          token
        },
        reconnection: true,
        reconnectionAttempts: 5,
        timeout: 10000
      }
    );

    setSocket(newSocket);

    const handleBanned = (data) => {
      console.warn('🚫 USER BANNED EVENT', data);

      // 1. Socketni darhol uzamiz
      newSocket.disconnect();

      // 2. Auth state va localStorage
      localStorage.removeItem('lumeToken');
      localStorage.removeItem('lumeUser');

      try {
        logout();
      } catch (error) {
        console.error('Logout error:', error);
      }

      // 3. Avval redirect, keyin alert
      window.location.replace('/login');

      // Alert redirectdan oldin ko'rsatilishi kerak bo'lsa,
      // commentni olib tashlash mumkin.
    };

    const handleDeleted = (data) => {
      console.warn('🚫 ACCOUNT DELETED EVENT', data);

      newSocket.disconnect();

      localStorage.removeItem('lumeToken');
      localStorage.removeItem('lumeUser');

      try {
        logout();
      } catch (error) {
        console.error('Logout error:', error);
      }

      window.location.replace('/login');
    };

    newSocket.on('user-banned', handleBanned);
    newSocket.on('account-deleted', handleDeleted);

    newSocket.on('connect', () => {
      console.log(
        '✅ Socket connected:',
        newSocket.id
      );
    });

    newSocket.on('connect_error', (error) => {
      console.error(
        'Socket connection error:',
        error.message
      );
    });

    return () => {
      newSocket.off('user-banned', handleBanned);
      newSocket.off('account-deleted', handleDeleted);
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () =>
  useContext(SocketContext);