import { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Подтвердить',
    cancelText: 'Отмена',
    showCancel: false,
    onConfirm: null,
    onCancel: null,
  });

  const showAlert = ({
    title = 'Уведомление',
    message = '',
    confirmText = 'Подтвердить',
    cancelText = 'Отмена',
    showCancel = false,
    onConfirm = null,
    onCancel = null,
  }) => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      showCancel,
      onConfirm,
      onCancel,
    });
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    if (alertConfig.onConfirm) alertConfig.onConfirm();
    closeAlert();
  };

  const handleCancel = () => {
    if (alertConfig.onCancel) alertConfig.onCancel();
    closeAlert();
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}

      <AnimatePresence>
        {alertConfig.isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-[360px] bg-[#121214] border border-white/10 rounded-[28px] p-6 shadow-2xl text-center text-white overflow-hidden"
            >
              {/* Title */}
              {alertConfig.title && (
                <h3 className="text-xl font-bold tracking-tight mb-2">
                  {alertConfig.title}
                </h3>
              )}

              {/* Message */}
              {alertConfig.message && (
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  {alertConfig.message}
                </p>
              )}

              {/* Buttons */}
              <div className="flex items-center gap-3 mt-4">
                {alertConfig.showCancel && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 py-3 px-4 bg-[#222224] hover:bg-[#2c2c2e] active:scale-95 text-white text-sm font-semibold rounded-full transition-all duration-150"
                  >
                    {alertConfig.cancelText}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 py-3 px-4 bg-white hover:bg-zinc-200 active:scale-95 text-black text-sm font-semibold rounded-full shadow-lg transition-all duration-150"
                >
                  {alertConfig.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);