import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../context/ThemeContext';

const FloatingButton = ({ onClick, label = 'Add', isVisible = true }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          onClick={onClick}
          className={`fixed bottom-8 right-8 flex items-center justify-center w-16 h-16 rounded-full shadow-lg z-20 ${
            isDark 
              ? 'bg-primary-600 text-white hover:bg-primary-700' 
              : 'bg-primary-500 text-white hover:bg-primary-600'
          }`}
          whileHover={{ scale: 1.05, boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.2)" }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20, transition: { duration: 0.3 } }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          aria-label={`${label} Button`}
        >
          <PlusIcon className="w-7 h-7" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default FloatingButton; 