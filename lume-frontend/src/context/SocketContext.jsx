import {
  createContext,
  useContext,
  useEffect,
  useState
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

  const [
    socket,
    setSocket
  ] = useState(null);

  const {
    user,
    logout
  } = useAuth();


  useEffect(() => {

    const token =
      localStorage.getItem(
        'lumeToken'
      );


    // -------------------------------------------------------
    // No auth
    // -------------------------------------------------------

    if (
      !token ||
      !user?._id
    ) {

      setSocket(
        null
      );

      return;
    }


    console.log(
      '🔌 Creating socket for user:',
      user._id
    );


    const newSocket =
      io(
        'https://lume-5mof.onrender.com',
        {
          auth: {
            token
          },

          reconnection:
            true,

          reconnectionAttempts:
            5,

          timeout:
            10000
        }
      );


    setSocket(
      newSocket
    );


    // =======================================================
    // CONNECT
    // =======================================================

    newSocket.on(
      'connect',
      () => {

        console.log(
          '======================================'
        );

        console.log(
          '✅ SOCKET CONNECTED'
        );

        console.log(
          'SOCKET ID:',
          newSocket.id
        );

        console.log(
          'USER ID:',
          user._id
        );

        console.log(
          '======================================'
        );

      }
    );


    // =======================================================
    // USER BANNED
    // =======================================================

    const handleUserBanned =
      (data) => {

        console.log(
          '======================================'
        );

        console.log(
          '🚫🚫🚫 USER BANNED EVENT RECEIVED'
        );

        console.log(
          'DATA:',
          data
        );

        console.log(
          '======================================'
        );


        // ---------------------------------------------------
        // Disconnect socket
        // ---------------------------------------------------

        newSocket.disconnect();


        // ---------------------------------------------------
        // Clear authentication
        // ---------------------------------------------------

        localStorage.removeItem(
          'lumeToken'
        );

        localStorage.removeItem(
          'lumeUser'
        );


        // ---------------------------------------------------
        // Logout React state
        // ---------------------------------------------------

        try {

          logout();

        } catch (error) {

          console.error(
            'Logout error:',
            error
          );

        }


        // ---------------------------------------------------
        // Redirect
        // ---------------------------------------------------

        window.location.replace(
          '/login'
        );

      };


    newSocket.on(
      'user-banned',
      handleUserBanned
    );


    // =======================================================
    // ACCOUNT DELETED
    // =======================================================

    const handleAccountDeleted =
      (data) => {

        console.warn(
          '🗑 ACCOUNT DELETED:',
          data
        );


        newSocket.disconnect();


        localStorage.removeItem(
          'lumeToken'
        );

        localStorage.removeItem(
          'lumeUser'
        );


        try {

          logout();

        } catch (error) {

          console.error(
            'Logout error:',
            error
          );

        }


        window.location.replace(
          '/login'
        );

      };


    newSocket.on(
      'account-deleted',
      handleAccountDeleted
    );


    // =======================================================
    // CONNECT ERROR
    // =======================================================

    newSocket.on(
      'connect_error',
      (error) => {

        console.error(
          '❌ SOCKET CONNECTION ERROR:',
          error.message
        );

      }
    );


    // =======================================================
    // DISCONNECT
    // =======================================================

    newSocket.on(
      'disconnect',
      (reason) => {

        console.log(
          '🔴 SOCKET DISCONNECTED:',
          reason
        );

      }
    );


    // =======================================================
    // CLEANUP
    // =======================================================

    return () => {

      console.log(
        '🧹 Cleaning socket'
      );

      newSocket.off(
        'user-banned',
        handleUserBanned
      );

      newSocket.off(
        'account-deleted',
        handleAccountDeleted
      );

      newSocket.disconnect();

    };

  }, [
    user?._id,
    logout
  ]);


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