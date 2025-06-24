import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, ExclamationCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';

const icons = {
  success: <CheckCircleIcon className="w-6 h-6" />,
  error: <XCircleIcon className="w-6 h-6" />,
  warning: <ExclamationCircleIcon className="w-6 h-6" />,
  info: <InformationCircleIcon className="w-6 h-6" />
};

const colors = {
  success: 'bg-green-50 text-green-800 border-green-500',
  error: 'bg-red-50 text-red-800 border-red-500',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-500',
  info: 'bg-blue-50 text-blue-800 border-blue-500'
};

const Snackbar = ({ message, type = 'info', isOpen, onClose, autoHideDuration = 3000 }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, autoHideDuration]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: 50 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20 
          }}
          className="fixed bottom-4 right-4 z-50"
        >
          <div className={`flex items-center p-4 rounded-lg shadow-lg border-l-4 ${colors[type]}`}>
            <span className="mr-2">{icons[type]}</span>
            <p className="mr-4">{message}</p>
            <button
              onClick={onClose}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              <XCircleIcon className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Snackbar;
