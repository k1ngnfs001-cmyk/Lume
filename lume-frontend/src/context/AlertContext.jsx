import { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AlertContext = createContext(null);

export const AlertProvider = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Отмена',
    showCancel: false,
    onConfirm: null,
    onCancel: null,
  });

  // =========================================================
  // ODDIY ALERT
  // =========================================================

  const showAlert = ({
    title = 'Уведомление',
    message = '',
    confirmText = 'OK',
    onConfirm = null,
  }) => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText: 'Отмена',
      showCancel: false,
      onConfirm,
      onCancel: null,
    });
  };

  // =========================================================
  // CONFIRM
  // =========================================================

  const onConfirm = ({
    title = 'Подтверждение',
    message = '',
    confirmText = 'Подтвердить',
    cancelText = 'Отмена',
    onConfirm: confirmCallback = null,
    onCancel: cancelCallback = null,
  }) => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      showCancel: true,
      onConfirm: confirmCallback,
      onCancel: cancelCallback,
    });
  };

  // =========================================================
  // CLOSE
  // =========================================================

  const closeAlert = () => {
    setAlertConfig((prev) => ({
      ...prev,
      isOpen: false,
      onConfirm: null,
      onCancel: null,
    }));
  };

  // =========================================================
  // CONFIRM BUTTON
  // =========================================================

  const handleConfirm = async () => {
    const callback = alertConfig.onConfirm;

    closeAlert();

    if (callback) {
      try {
        await callback();
      } catch (error) {
        console.error(
          'Ошибка callback AlertContext:',
          error
        );
      }
    }
  };

  // =========================================================
  // CANCEL BUTTON
  // =========================================================

  const handleCancel = () => {
    const callback = alertConfig.onCancel;

    closeAlert();

    if (callback) {
      try {
        callback();
      } catch (error) {
        console.error(
          'Ошибка callback отмены:',
          error
        );
      }
    }
  };

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        onConfirm,
        closeAlert,
      }}
    >
      {children}

      <AnimatePresence>
        {alertConfig.isOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">

            {/* BACKDROP */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={
                alertConfig.showCancel
                  ? handleCancel
                  : closeAlert
              }
              className="
                absolute
                inset-0
                bg-black/70
                backdrop-blur-md
              "
            />

            {/* MODAL */}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.9,
                y: 15,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
                y: 15,
              }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 300,
              }}
              className="
                relative
                w-full
                max-w-[380px]
                bg-[#121214]
                border
                border-white/10
                rounded-[28px]
                p-6
                shadow-2xl
                text-center
                text-white
                overflow-hidden
              "
            >

              {/* TOP GLOW */}
              <div
                className="
                  absolute
                  top-[-80px]
                  left-1/2
                  -translate-x-1/2
                  w-48
                  h-32
                  bg-[#6C63FF]/20
                  blur-[60px]
                  rounded-full
                  pointer-events-none
                "
              />

              {/* TITLE */}
              {alertConfig.title && (
                <h3 className="
                  relative
                  text-xl
                  font-bold
                  tracking-tight
                  mb-2
                ">
                  {alertConfig.title}
                </h3>
              )}

              {/* MESSAGE */}
              {alertConfig.message && (
                <p className="
                  relative
                  text-zinc-400
                  text-sm
                  leading-relaxed
                  mb-6
                ">
                  {alertConfig.message}
                </p>
              )}

              {/* BUTTONS */}
              <div className="relative flex items-center gap-3 mt-4">

                {/* CANCEL */}
                {alertConfig.showCancel && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="
                      flex-1
                      py-3
                      px-4
                      bg-[#222224]
                      hover:bg-[#2c2c2e]
                      active:scale-95
                      text-white
                      text-sm
                      font-semibold
                      rounded-full
                      transition-all
                      duration-150
                    "
                  >
                    {alertConfig.cancelText}
                  </button>
                )}

                {/* CONFIRM / OK */}
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="
                    flex-1
                    py-3
                    px-4
                    bg-white
                    hover:bg-zinc-200
                    active:scale-95
                    text-black
                    text-sm
                    font-semibold
                    rounded-full
                    shadow-lg
                    transition-all
                    duration-150
                  "
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

export const useAlert = () => {
  const context = useContext(AlertContext);

  if (!context) {
    throw new Error(
      'useAlert must be used inside AlertProvider'
    );
  }

  return context;
};