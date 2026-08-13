import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LumeLogo from '../assets/logo.png'; // Верни импорт своего логотипа

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // 1 = Email/Pass, 2 = OTP
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Защита от двойного клика

  const { register, login, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return; // Не даём нажать дважды

    setIsLoading(true);

    if (step === 1) {
      if (isLogin) {
        const result = await login(email, password);
        if (result.success && result.requireOtp) {
          setStep(2); // Переключаем на ввод кода
          alert('Код отправлен на вашу почту!');
        } else if (result.success) {
          navigate('/');
        } else {
          alert(result.message);
        }
      } else {
        const result = await register(username, email, password);
        if (result.success) {
          alert('Регистрация успешна!');
        } else {
          alert(result.message);
        }
      }
    } else if (step === 2) {
      const result = await verifyOtp(email, otp);
      if (result.success) {
        navigate('/'); // Успешный вход
      } else {
        alert(result.message);
      }
    }

    setIsLoading(false);
  };

  const resetLogin = () => {
    setStep(1);
    setOtp('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-accent/30 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-glow/30 rounded-full blur-[80px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="relative bg-white/10 border border-white/20 backdrop-blur-2xl p-10 rounded-3xl w-full max-w-md shadow-2xl shadow-accent/10"
      >
        <div className="flex justify-center mb-6">
          <img src={LumeLogo} alt="Lume" className="w-16 h-auto object-contain" />
        </div>
        
        {step === 1 && (
          <div className="flex gap-4 mb-8 bg-white/5 p-1 rounded-xl">
            <button 
              onClick={() => setIsLogin(true)} 
              className={`flex-1 py-2 rounded-lg transition-all ${isLogin ? 'bg-white/10 text-white shadow-sm' : 'text-white/60'}`}
            >
              Вход
            </button>
            <button 
              onClick={() => setIsLogin(false)} 
              className={`flex-1 py-2 rounded-lg transition-all ${!isLogin ? 'bg-white/10 text-white shadow-sm' : 'text-white/60'}`}
            >
              Регистрация
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                {!isLogin && (
                  <input 
                    type="text" 
                    placeholder="Имя пользователя" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/50 transition-all placeholder:text-white/40"
                    required 
                  />
                )}
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/50 transition-all placeholder:text-white/40"
                  required 
                />
                <input 
                  type="password" 
                  placeholder="Пароль" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/50 transition-all placeholder:text-white/40"
                  required 
                />
                
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className={`w-full text-white font-semibold py-3 rounded-xl shadow-lg transition-all mt-2 ${
                    isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-linear-to-r from-accent to-glow hover:shadow-accent/50'
                  }`}
                >
                  {isLoading ? 'Загрузка...' : (isLogin ? 'Войти в Lume' : 'Создать аккаунт')}
                </button>
              </motion.div>
            ) : (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
                  <p className="text-white/80 text-sm">Код отправлен на <br/><span className="font-bold text-white">{email}</span></p>
                </div>

                <input 
                  type="text" 
                  placeholder="Введите код из письма" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/50 transition-all placeholder:text-white/40 tracking-widest text-center text-xl font-bold"
                  required 
                  maxLength={6}
                />
                
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className={`w-full text-white font-semibold py-3 rounded-xl shadow-lg transition-all mt-2 ${
                    isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-linear-to-r from-accent to-glow hover:shadow-accent/50'
                  }`}
                >
                  {isLoading ? 'Проверка...' : 'Подтвердить вход'}
                </button>

                <button 
                  type="button"
                  onClick={resetLogin}
                  className="w-full text-sm text-white/40 hover:text-white transition-colors underline decoration-white/20 hover:decoration-white/60"
                >
                  Назад (ввести данные заново)
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