import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiSave, FiAlertCircle, FiX } from 'react-icons/fi';

const GlassmorphicToast = ({
  type = 'success',
  message,
  description = null,
  isVisible,
  onClose,
  duration = 3000
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const getToastConfig = (type) => {
    switch (type) {
      case 'success':
        return {
          gradient: 'from-emerald-400/20 to-green-500/20',
          borderGradient: 'from-emerald-400/50 to-green-500/50',
          iconGradient: 'from-emerald-400 to-green-600',
          textColor: 'text-green-700',
          icon: FiCheckCircle
        };
      case 'save':
        return {
          gradient: 'from-blue-400/20 to-indigo-500/20',
          borderGradient: 'from-blue-400/50 to-indigo-500/50',
          iconGradient: 'from-blue-400 to-indigo-600',
          textColor: 'text-blue-700',
          icon: FiSave
        };
      case 'error':
        return {
          gradient: 'from-red-400/20 to-pink-500/20',
          borderGradient: 'from-red-400/50 to-pink-500/50',
          iconGradient: 'from-red-400 to-pink-600',
          textColor: 'text-red-700',
          icon: FiAlertCircle
        };
      default:
        return {
          gradient: 'from-gray-400/20 to-slate-500/20',
          borderGradient: 'from-gray-400/50 to-slate-500/50',
          iconGradient: 'from-gray-400 to-slate-600',
          textColor: 'text-gray-700',
          icon: FiCheckCircle
        };
    }
  };

  const config = getToastConfig(type);
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
            mass: 0.8
          }}
          className="fixed top-6 right-6 z-[99999] pointer-events-auto"
        >
          <motion.div
            className="relative group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Glassmorphic Toast Container */}
            <div className={`
              relative backdrop-blur-xl bg-white/60 border border-white/30 rounded-2xl
              shadow-2xl backdrop-filter
              ${config.borderGradient} bg-gradient-to-br ${config.gradient}
              p-4 min-w-[320px] max-w-[400px]
            `}>
              {/* Animated Border Glow */}
              <div className={`
                absolute inset-0 rounded-2xl bg-gradient-to-r ${config.borderGradient}
                opacity-30 blur-md group-hover:opacity-50 transition-opacity duration-300
              `} />

              {/* Toast Content */}
              <div className="relative flex items-start gap-3">
                {/* Icon Container */}
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: 0.1
                  }}
                  className={`
                    flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${config.iconGradient}
                    flex items-center justify-center shadow-lg
                  `}
                >
                  <Icon className="w-5 h-5 text-white" />
                </motion.div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <motion.h4
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`font-bold text-sm ${config.textColor} leading-tight`}
                  >
                    {message}
                  </motion.h4>
                  {description && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-xs text-gray-600 mt-1 leading-relaxed"
                    >
                      {description}
                    </motion.p>
                  )}
                </div>

                {/* Close Button */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={onClose}
                  className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600
                           hover:bg-gray-200/50 transition-all duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiX className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Progress Bar */}
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: duration / 1000, ease: "linear" }}
                className={`
                  absolute bottom-0 left-0 h-1 bg-gradient-to-r ${config.iconGradient}
                  rounded-b-2xl
                `}
              />
            </div>

            {/* Hover Glow Effect */}
            <div className={`
              absolute inset-0 rounded-2xl bg-gradient-to-r ${config.borderGradient}
              opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300
              pointer-events-none
            `} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlassmorphicToast;