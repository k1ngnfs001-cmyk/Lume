import {
  createContext,
  useState,
  useContext,
  useEffect
} from 'react';

import axios from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({
  children
}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // CHECK CURRENT USER
  // =========================================================

  useEffect(() => {
    const token =
      localStorage.getItem('lumeToken');

    if (!token) {
      setLoading(false);
      return;
    }

    axios
      .get('/auth/me')
      .then((response) => {
        const userData = response.data;

        localStorage.setItem(
          'lumeUser',
          JSON.stringify(userData)
        );

        setUser(userData);
      })
      .catch((error) => {
        if (
          error.response?.status === 401 ||
          error.response?.status === 403
        ) {
          localStorage.removeItem(
            'lumeToken'
          );

          localStorage.removeItem(
            'lumeUser'
          );

          setUser(null);
        } else {
          console.error(
            'Не удалось загрузить данные пользователя:',
            error
          );

          const savedUser =
            localStorage.getItem(
              'lumeUser'
            );

          if (savedUser) {
            try {
              setUser(
                JSON.parse(savedUser)
              );
            } catch {
              localStorage.removeItem(
                'lumeUser'
              );

              setUser(null);
            }
          }
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // =========================================================
  // REGISTER
  // =========================================================

  const register = async (
    username,
    email,
    password,
    confirmPassword
  ) => {
    try {
      const response =
        await axios.post(
          '/auth/register',
          {
            username,
            email,
            password,
            confirmPassword
          }
        );

      const {
        token,
        ...userData
      } = response.data;

      localStorage.setItem(
        'lumeToken',
        token
      );

      localStorage.setItem(
        'lumeUser',
        JSON.stringify(userData)
      );

      setUser(userData);

      return {
        success: true,
        data: userData
      };

    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          'Ошибка регистрации'
      };
    }
  };

  // =========================================================
  // LOGIN
  // =========================================================

  const login = async (
    email,
    password
  ) => {
    try {
      const response =
        await axios.post(
          '/auth/login',
          {
            email,
            password
          }
        );

      // Endi OTP yo'q.
      // Login response darhol token berishi kerak.

      const {
        token,
        ...userData
      } = response.data;

      if (!token) {
        return {
          success: false,
          message:
            'Сервер не вернул токен авторизации'
        };
      }

      localStorage.setItem(
        'lumeToken',
        token
      );

      localStorage.setItem(
        'lumeUser',
        JSON.stringify(userData)
      );

      setUser(userData);

      return {
        success: true,
        data: userData
      };

    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          'Ошибка входа'
      };
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {
    localStorage.removeItem(
      'lumeToken'
    );

    localStorage.removeItem(
      'lumeUser'
    );

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () =>
  useContext(AuthContext);