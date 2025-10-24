import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSave, FiTrash2 } from 'react-icons/fi';

const ToastNotification = ({ toast, onClose }) => {
  if (!toast) return null;

  const autoCloseTimeout = setTimeout(() => {
    onClose();
  }, 3000);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}
        onClick={() => {
          clearTimeout(autoCloseTimeout);
          onClose();
        }}
      >
        {toast.type === 'error' ? (
          <FiTrash2 className="w-5 h-5 flex-shrink-0" />
        ) : (
          <FiSave className="w-5 h-5 flex-shrink-0" />
        )}
        <span className="font-medium select-none">{toast.message}</span>
      </motion.div>
    </AnimatePresence>
  );
};

export default ToastNotification;