import {
  useState
} from 'react';

import {
  useAuth
} from '../context/AuthContext';

import {
  motion,
  AnimatePresence
} from 'framer-motion';

import {
  useNavigate
} from 'react-router-dom';

import LumeLogo
  from '../assets/logo.png';


const Auth = () => {

  const [
    isLogin,
    setIsLogin
  ] = useState(true);

  const [
    step,
    setStep
  ] = useState(1);

  const [
    email,
    setEmail
  ] = useState('');

  const [
    password,
    setPassword
  ] = useState('');

  const [
    confirmPassword,
    setConfirmPassword
  ] = useState('');

  const [
    username,
    setUsername
  ] = useState('');

  const [
    otp,
    setOtp
  ] = useState('');

  const [
    isLoading,
    setIsLoading
  ] = useState(false);


  const {
    register,
    login,
    verifyOtp
  } = useAuth();

  const navigate =
    useNavigate();


  // =======================================================
  // CHANGE LOGIN / REGISTER MODE
  // =======================================================

  const changeMode = (
    loginMode
  ) => {

    setIsLogin(
      loginMode
    );

    setStep(1);

    setOtp('');

    setPassword('');

    setConfirmPassword('');

  };


  // =======================================================
  // SUBMIT
  // =======================================================

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      if (isLoading) {
        return;
      }

      setIsLoading(true);


      try {

        // =================================================
        // STEP 1
        // =================================================

        if (step === 1) {


          // ===============================================
          // LOGIN
          // ===============================================

          if (isLogin) {

            const result =
              await login(
                email.trim(),
                password
              );


            if (
              result.success &&
              result.requireOtp
            ) {

              setStep(2);

              return;

            }


            if (
              result.success
            ) {

              navigate('/');

              return;

            }


            alert(
              result.message
            );

            return;
          }


          // ===============================================
          // REGISTER
          // ===============================================

          if (
            password !==
            confirmPassword
          ) {

            alert(
              'Пароли не совпадают'
            );

            return;
          }


          if (
            password.length < 6
          ) {

            alert(
              'Пароль должен содержать минимум 6 символов'
            );

            return;
          }


          const result =
            await register(
              username.trim(),
              email.trim(),
              password,
              confirmPassword
            );


          if (
            result.success
          ) {

            alert(
              'Регистрация успешна!'
            );

            setIsLogin(
              true
            );

            setStep(1);

            setPassword('');

            setConfirmPassword('');

            return;

          }


          alert(
            result.message
          );

          return;
        }


        // =================================================
        // STEP 2 — OTP
        // =================================================

        if (
          step === 2
        ) {

          if (
            otp.length !== 6
          ) {

            alert(
              'Введите 6-значный код'
            );

            return;
          }


          const result =
            await verifyOtp(
              email.trim(),
              otp.trim()
            );


          if (
            result.success
          ) {

            navigate('/');

            return;
          }


          alert(
            result.message
          );
        }

      } finally {

        setIsLoading(
          false
        );

      }
    };


  // =======================================================
  // BACK FROM OTP
  // =======================================================

  const resetLogin = () => {

    setStep(1);

    setOtp('');

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
            className="
              w-16
              h-auto
              object-contain
            "
          />

        </div>


        {/* LOGIN / REGISTER TABS */}

        {step === 1 && (

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
              onClick={() =>
                changeMode(true)
              }
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
              onClick={() =>
                changeMode(false)
              }
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
        )}


        {/* FORM */}

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-4"
        >

          <AnimatePresence
            mode="wait"
          >


            {/* ================================================= */}
            {/* STEP 1 */}
            {/* ================================================= */}

            {step === 1 && (

              <motion.div
                key="step1"
                initial={{
                  opacity: 0,
                  x: -20
                }}
                animate={{
                  opacity: 1,
                  x: 0
                }}
                exit={{
                  opacity: 0,
                  x: 20
                }}
                className="space-y-4"
              >


                {/* USERNAME */}

                {!isLogin && (

                  <input
                    type="text"
                    placeholder="Имя пользователя"
                    value={username}
                    onChange={
                      e =>
                        setUsername(
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


                {/* EMAIL */}

                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={
                    e =>
                      setEmail(
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


                {/* PASSWORD */}

                <input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={
                    e =>
                      setPassword(
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


                {/* CONFIRM PASSWORD */}

                {!isLogin && (

                  <input
                    type="password"
                    placeholder="Подтвердите пароль"
                    value={
                      confirmPassword
                    }
                    onChange={
                      e =>
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


                {/* SUBMIT */}

                <button
                  type="submit"
                  disabled={
                    isLoading
                  }
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

              </motion.div>

            )}


            {/* ================================================= */}
            {/* STEP 2 — OTP */}
            {/* ================================================= */}

            {step === 2 && (

              <motion.div
                key="step2"
                initial={{
                  opacity: 0,
                  x: 20
                }}
                animate={{
                  opacity: 1,
                  x: 0
                }}
                exit={{
                  opacity: 0,
                  x: -20
                }}
                className="space-y-4"
              >

                <div
                  className="
                    bg-white/5
                    border
                    border-white/10
                    p-4
                    rounded-xl
                    text-center
                  "
                >

                  <p
                    className="
                      text-white/80
                      text-sm
                    "
                  >
                    Код подтверждения
                    отправлен на
                    <br />

                    <span
                      className="
                        font-bold
                        text-white
                      "
                    >
                      {email}
                    </span>

                  </p>

                </div>


                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Введите код из email"
                  value={otp}
                  onChange={
                    e => {
                      const value =
                        e.target.value
                          .replace(
                            /\D/g,
                            ''
                          )
                          .slice(
                            0,
                            6
                          );

                      setOtp(
                        value
                      );
                    }
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
                    tracking-widest
                    text-center
                    text-xl
                    font-bold
                  "
                  required
                  maxLength={6}
                />


                <button
                  type="submit"
                  disabled={
                    isLoading
                  }
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
                    ? 'Проверка...'
                    : 'Подтвердить вход'}
                </button>


                <button
                  type="button"
                  onClick={
                    resetLogin
                  }
                  className="
                    w-full
                    text-sm
                    text-white/40
                    hover:text-white
                    transition-colors
                    underline
                    decoration-white/20
                    hover:decoration-white/60
                  "
                >
                  Назад
                  (ввести данные заново)
                </button>

              </motion.div>

            )}

          </AnimatePresence>

        </form>

      </motion.div>

    </div>
  );
};


export default Auth;