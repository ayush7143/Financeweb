import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentArrowUpIcon,
  ChartPieIcon,
  ChartBarIcon as ChartLineIcon,
  Cog6ToothIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { theme } = useTheme();
  const location = useLocation();
  const isDark = theme === 'dark';

  // Check for mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync with parent component's state
  useEffect(() => {
    if (isOpen !== undefined) {
      setIsCollapsed(!isOpen);
    }
  }, [isOpen]);

  // Handle collapse toggle
  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    if (toggleSidebar) {
      toggleSidebar();
    }
  };

  // Handle navigation click - auto close sidebar on mobile
  const handleNavClick = () => {
    if (isMobile && !isCollapsed) {
      handleToggle();
    }
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: HomeIcon },
    { path: '/expenses', label: 'Expenses', icon: BanknotesIcon },
    { path: '/income-entry', label: 'Income Entry', icon: ChartBarIcon },
    { path: '/excel-upload', label: 'Excel Upload', icon: DocumentArrowUpIcon },
    { path: '/reports', label: 'Reports', icon: ChartPieIcon },
    { path: '/categorization', label: 'Categorization', icon: ChartLineIcon },
    { path: '/settings', label: 'Settings', icon: Cog6ToothIcon }
  ];

  // Animation variants
  const sidebarVariants = {
    expanded: {
      width: isMobile ? '75vw' : '16rem',
      x: 0,
      transition: {
        duration: 0.3,
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
    collapsed: {
      width: isMobile ? '0' : '5rem',
      x: isMobile ? '-100%' : 0,
      transition: {
        duration: 0.3,
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const textVariants = {
    visible: { 
      opacity: 1,
      x: 0,
      transition: { 
        delay: 0.1,
        duration: 0.2
      }
    },
    hidden: { 
      opacity: 0,
      x: -10,
      transition: { 
        duration: 0.2
      }
    }
  };

  const iconVariants = {
    expanded: { 
      marginRight: '0.75rem',
      scale: 1,
      transition: { 
        duration: 0.3
      }
    },
    collapsed: { 
      marginRight: '0',
      scale: 1.2,
      transition: { 
        duration: 0.3
      }
    }
  };

  return (
    <motion.div
      initial={isCollapsed ? "collapsed" : "expanded"}
      animate={isCollapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      className={`fixed top-16 left-0 bottom-0 z-30 flex flex-col shadow-lg ${
        isMobile ? '' : 'rounded-r-2xl'
      } ${
        isDark 
          ? 'bg-gray-900/95 text-gray-100 border-r border-gray-800' 
          : 'bg-white text-gray-800 border-r border-gray-100'
      } overflow-hidden`}
    >
      <nav className="flex-1 overflow-y-auto py-3 md:py-5">
        <ul className="space-y-1 md:space-y-2 px-2 md:px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <motion.li
                key={item.path}
                whileHover={{ scale: 1.03, x: 3 }}
                whileTap={{ scale: 0.97 }}
                className="overflow-hidden"
              >
                <NavLink
                  to={item.path}
                  onClick={handleNavClick}
                  className={`flex items-center px-3 py-2 md:py-3 rounded-lg md:rounded-xl transition-all ${
                    isActive
                      ? isDark
                        ? 'bg-primary-700 text-white shadow-md shadow-primary-900/30'
                        : 'bg-primary-200 text-primary-700 shadow-sm'
                      : isDark
                      ? 'text-gray-300 hover:bg-gray-800/70'
                      : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                  }`}
                >
                  <motion.div
                    variants={iconVariants}
                    className="flex items-center justify-center"
                  >
                    <Icon className={`w-5 h-5 md:w-6 md:h-6 ${isCollapsed ? 'mx-auto' : ''}`} />
                  </motion.div>
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        variants={textVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="whitespace-nowrap font-medium text-xs md:text-sm"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              </motion.li>
            );
          })}
        </ul>
      </nav>
      
      {!isMobile && (
        <div className={`p-3 md:p-4 ${isDark ? 'border-t border-gray-800' : 'border-t border-gray-100'}`}>
          <motion.div 
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'}`}
            variants={{
              expanded: { opacity: 1 },
              collapsed: { opacity: 0.7 }
            }}
          >
            <div className={`h-7 w-7 md:h-8 md:w-8 rounded-full flex items-center justify-center ${
              isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}>
              {isCollapsed ? 'F' : 'FW'}
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="ml-3"
                >
                  <p className="text-xs font-medium">Finance Web v1.0</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">© 2023</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Sidebar; 