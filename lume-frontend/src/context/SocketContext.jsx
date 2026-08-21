import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef
} from 'react';

import io from 'socket.io-client';

import {
  useAuth
} from './AuthContext';

const SocketContext =
  createContext(null);

export const SocketProvider = ({
  children
}) => {
  const [socket, setSocket] =
    useState(null);

  const {
    user,
    logout
  } = useAuth();

  const handlingBanRef =
    useRef(false);

  useEffect(() => {
    const token =
      localStorage.getItem(
        'lumeToken'
      );

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

    // =======================================================
    // CONNECT
    // =======================================================

    newSocket.on(
      'connect',
      () => {
        console.log(
          '✅ Lume Socket connected:',
          newSocket.id
        );
      }
    );

    // =======================================================
    // BAN
    // =======================================================

    const handleUserBanned =
      async (data) => {
        if (handlingBanRef.current) {
          return;
        }

        handlingBanRef.current =
          true;

        console.warn(
          '🚫 USER BANNED'
        );

        // Avval socketni yopamiz
        newSocket.disconnect();

        // Auth ma'lumotlarini tozalaymiz
        try {
          logout();
        } catch (error) {
          console.error(
            'Logout error:',
            error
          );
        }

        // LocalStorage'ni majburan tozalaymiz
        localStorage.removeItem(
          'lumeToken'
        );

        localStorage.removeItem(
          'lumeUser'
        );

        // Alert
        alert(
          data?.message ||
          'Ваш аккаунт был заблокирован администратором'
        );

        // Hard redirect
        window.location.href =
          '/login';
      };

    newSocket.on(
      'user-banned',
      handleUserBanned
    );

    // =======================================================
    // ACCOUNT DELETED
    // =======================================================

    const handleAccountDeleted =
      async (data) => {
        if (
          handlingBanRef.current
        ) {
          return;
        }

        handlingBanRef.current =
          true;

        newSocket.disconnect();

        try {
          logout();
        } catch (error) {
          console.error(
            'Logout error:',
            error
          );
        }

        localStorage.removeItem(
          'lumeToken'
        );

        localStorage.removeItem(
          'lumeUser'
        );

        alert(
          data?.message ||
          'Ваш аккаунт был удалён'
        );

        window.location.href =
          '/login';
      };

    newSocket.on(
      'account-deleted',
      handleAccountDeleted
    );

    // =======================================================
    // SOCKET ERROR
    // =======================================================

    newSocket.on(
      'connect_error',
      (error) => {
        console.error(
          'Socket connection error:',
          error.message
        );
      }
    );

    return () => {
      newSocket.off(
        'user-banned',
        handleUserBanned
      );

      newSocket.off(
        'account-deleted',
        handleAccountDeleted
      );

      newSocket.disconnect();

      handlingBanRef.current =
        false;
    };
  }, [user, logout]);

  return (
    <SocketContext.Provider
      value={{
        socket
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket =
  () =>
    useContext(
      SocketContext
    );