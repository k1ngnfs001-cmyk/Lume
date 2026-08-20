import { createContext, useState, useContext, useEffect } from 'react';
import axios from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('lumeToken');
    if (token) {
      axios.get('/auth/me')
        .then(response => {
          const userData = response.data;
          localStorage.setItem('lumeUser', JSON.stringify(userData));
          setUser(userData);
        })
        .catch(error => {
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
          JSON.parse(
            savedUser
          )
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
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const register = async (username, email, password) => {
    try {
      const response = await axios.post('/auth/register', { username, email, password });
      const { token, ...userData } = response.data;
      localStorage.setItem('lumeToken', token);
      localStorage.setItem('lumeUser', JSON.stringify(userData));
      setUser(userData);
      return { success: true, data: userData };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Ошибка регистрации' };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      if (response.data.requireOtp) {
        return { success: true, requireOtp: true, message: response.data.message };
      }
      const { token, ...userData } = response.data;
      localStorage.setItem('lumeToken', token);
      localStorage.setItem('lumeUser', JSON.stringify(userData));
      setUser(userData);
      return { success: true, data: userData };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Ошибка входа' };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const response = await axios.post('/auth/verify-otp', { email, otp });
      const { token, ...userData } = response.data;
      localStorage.setItem('lumeToken', token);
      localStorage.setItem('lumeUser', JSON.stringify(userData));
      setUser(userData);
      return { success: true, data: userData };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Неверный или истекший код' };
    }
  };

  const logout = () => {
    localStorage.removeItem('lumeToken');
    localStorage.removeItem('lumeUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, verifyOtp, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);