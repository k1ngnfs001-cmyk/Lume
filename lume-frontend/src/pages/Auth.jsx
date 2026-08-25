import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LumeLogo from '../assets/logo.png';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, login } = useAuth();
  const navigate = useNavigate();

  const changeMode = (loginMode) => {
    setIsLogin(loginMode);

    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading) return;

    setIsLoading(true);

    try {
      // =====================================================
      // LOGIN
      // =====================================================

      if (isLogin) {
        const result = await login(
          email.trim(),
          password
        );

        if (result.success) {
          navigate('/');
          return;
        }

        alert(
          result.message ||
          'Ошибка входа'
        );

        return;
      }

      // =====================================================
      // REGISTER
      // =====================================================

      if (!username.trim()) {
        alert('Введите имя пользователя');
        return;
      }

      if (!email.trim()) {
        alert('Введите email');
        return;
      }

      if (!password) {
        alert('Введите пароль');
        return;
      }

      if (password.length < 6) {
        alert(
          'Пароль должен содержать минимум 6 символов'
        );

        return;
      }

      if (password !== confirmPassword) {
        alert(
          'Пароли не совпадают'
        );

        return;
      }

      const result = await register(
        username.trim(),
        email.trim(),
        password,
        confirmPassword
      );

      if (result.success) {
        alert(
          'Регистрация успешна!'
        );

        // O'zi login tabiga qaytamiz
        setIsLogin(true);

        setPassword('');
        setConfirmPassword('');
        setEmail('');
        setUsername('');

        return;
      }

      alert(
        result.message ||
        'Ошибка регистрации'
      );

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">

      <div
        className="
          absolute
          top-[-20%]
          left-[-10%]
          w-96
          h-96
          bg-[#6C63FF]/30
          rounded-full
          blur-[80px]
          pointer-events-none
        "
      />

      <div
        className="
          absolute
          bottom-[-20%]
          right-[-10%]
          w-96
          h-96
          bg-[#3b82f6]/30
          rounded-full
          blur-[80px]
          pointer-events-none
        "
      />

      <motion.div
        initial={{
          opacity: 0,
          y: 20
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        className="
          relative
          bg-white/5
          border
          border-white/10
          backdrop-blur-xl
          p-10
          rounded-3xl
          w-full
          max-w-md
          shadow-2xl
        "
      >

        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <img
            src={LumeLogo}
            alt="Lume"
            className="w-16 h-auto object-contain"
          />
        </div>

        {/* LOGIN / REGISTER */}
        <div
          className="
            flex
            gap-4
            mb-8
            bg-white/5
            p-1
            rounded-xl
          "
        >
          <button
            type="button"
            onClick={() => changeMode(true)}
            className={`
              flex-1
              py-2
              rounded-lg
              transition-all
              ${
                isLogin
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/60'
              }
            `}
          >
            Вход
          </button>

          <button
            type="button"
            onClick={() => changeMode(false)}
            className={`
              flex-1
              py-2
              rounded-lg
              transition-all
              ${
                !isLogin
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/60'
              }
            `}
          >
            Регистрация
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          {/* USERNAME */}
          {!isLogin && (
            <input
              type="text"
              placeholder="Имя пользователя"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              className="
                w-full
                bg-white/5
                border
                border-white/10
                text-white
                rounded-xl
                px-4
                py-3
                outline-none
                focus:ring-2
                focus:ring-[#6C63FF]/50
                transition-all
                placeholder:text-white/40
              "
              required
            />
          )}

          {/* EMAIL */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="
              w-full
              bg-white/5
              border
              border-white/10
              text-white
              rounded-xl
              px-4
              py-3
              outline-none
              focus:ring-2
              focus:ring-[#6C63FF]/50
              transition-all
              placeholder:text-white/40
            "
            required
          />

          {/* PASSWORD */}
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="
              w-full
              bg-white/5
              border
              border-white/10
              text-white
              rounded-xl
              px-4
              py-3
              outline-none
              focus:ring-2
              focus:ring-[#6C63FF]/50
              transition-all
              placeholder:text-white/40
            "
            required
          />

          {/* CONFIRM PASSWORD */}
          {!isLogin && (
            <input
              type="password"
              placeholder="Подтвердите пароль"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              className="
                w-full
                bg-white/5
                border
                border-white/10
                text-white
                rounded-xl
                px-4
                py-3
                outline-none
                focus:ring-2
                focus:ring-[#6C63FF]/50
                transition-all
                placeholder:text-white/40
              "
              required
            />
          )}

          {/* BUTTON */}
          <button
            type="submit"
            disabled={isLoading}
            className={`
              w-full
              text-white
              font-semibold
              py-3
              rounded-xl
              shadow-lg
              transition-all
              mt-2
              ${
                isLoading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#6C63FF] to-[#3b82f6] hover:shadow-[#6C63FF]/25'
              }
            `}
          >
            {isLoading
              ? 'Загрузка...'
              : isLogin
                ? 'Войти в Lume'
                : 'Создать аккаунт'}
          </button>

        </form>
      </motion.div>
    </div>
  );
};

export default Auth;