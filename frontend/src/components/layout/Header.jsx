import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBars, FaMoon, FaSun, FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import FFinance from '../../assets/F-finance.svg';

const Header = ({ isSidebarOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const profileMenuRef = useRef(null);
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    navigate('/login');
  };

  const navToSettings = () => {
    navigate('/settings');
    setShowProfileMenu(false);
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 h-16 z-40 ${
        isDark ? 'bg-gray-900' : 'bg-white'
      } shadow-md flex items-center justify-between px-2 sm:px-4`}
    >
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className={`p-1.5 sm:p-2 rounded-lg transition-colors duration-200 ${
            isDark 
              ? 'hover:bg-gray-800 text-gray-300' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          aria-label="Toggle Sidebar"
        >
          <FaBars className="text-lg sm:text-xl" />
        </button>
        
        <div className="flex items-center ml-2 sm:ml-4">
          <img 
            src={FFinance} 
            alt="Finance Logo" 
            className="h-6 sm:h-8 mr-1 sm:mr-2" 
          />
          <h1 className={`font-bold text-base sm:text-xl ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {isMobile ? 'F.Web' : 'Finance'}
          </h1>
        </div>
      </div>

      <div className="flex items-center">
        <motion.div
          className={`relative h-7 sm:h-8 w-14 sm:w-16 rounded-full p-1 cursor-pointer flex items-center mr-2 sm:mr-4 ${
            isDark ? 'bg-gray-700' : 'bg-blue-200'
          }`}
          onClick={toggleTheme}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className={`absolute w-6 sm:w-7 h-6 sm:h-7 rounded-full shadow-md ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}
            initial={false}
            animate={{
              x: isDark ? '100%' : '0%',
              transition: { type: "spring", stiffness: 300, damping: 20 }
            }}
          />
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.div
                key="moon"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
                className="w-full flex justify-end pr-1"
              >
                <FaMoon className="text-indigo-200 text-xs sm:text-sm z-10" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ opacity: 0, rotate: 90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -90 }}
                transition={{ duration: 0.2 }}
                className="w-full flex justify-start pl-1"
              >
                <FaSun className="text-blue-500 text-xs sm:text-sm z-10" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`flex items-center p-1.5 sm:p-2 rounded-full transition-colors duration-200 ${
              isDark 
                ? 'hover:bg-gray-800 text-gray-300' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
              isDark ? 'bg-primary-600' : 'bg-primary-500'
            }`}>
              <FaUser className="text-white text-sm sm:text-base" />
            </div>
            <span className="ml-2 font-medium hidden sm:block">
              {user?.name || 'User'}
            </span>
          </button>

          {showProfileMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`absolute right-0 mt-2 w-40 sm:w-48 rounded-md shadow-lg py-1 ${
                isDark ? 'bg-gray-800' : 'bg-white'
              } ring-1 ring-black ring-opacity-5 z-40`}
            >
              <button
                onClick={navToSettings}
                className={`flex items-center w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm ${
                  isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FaCog className="mr-2" />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className={`flex items-center w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm ${
                  isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FaSignOutAlt className="mr-2" />
                Logout
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;