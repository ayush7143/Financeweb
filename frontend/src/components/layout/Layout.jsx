import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Header from './Header';
import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Set sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Auto-close sidebar on mobile, auto-open on desktop
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Initial check
    handleResize();

    // Listen for window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Create overlay for mobile sidebar
  const Overlay = () => (
    <AnimatePresence>
      {isMobile && isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black z-20"
          onClick={toggleSidebar}
        />
      )}
    </AnimatePresence>
  );

  return (
    <div className={`flex flex-col min-h-screen ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <Overlay />
      
      <div className="flex flex-1 pt-16">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            marginLeft: isMobile ? 0 : (isSidebarOpen ? '16rem' : '5rem'),
            width: isMobile ? '100%' : (isSidebarOpen ? 'calc(100% - 16rem)' : 'calc(100% - 5rem)')
          }}
          transition={{ 
            duration: 0.4,
            type: "spring",
            stiffness: 100,
            damping: 15
          }}
          className="flex-1 overflow-x-hidden"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location?.pathname || 'page'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={`p-3 sm:p-4 md:p-6 mx-auto ${
                isDark 
                  ? 'bg-gray-800/80 backdrop-blur-sm' 
                  : 'bg-white'
              } rounded-xl shadow-sm m-2 sm:m-3 md:m-4`}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </motion.main>
      </div>
    </div>
  );
};

export default Layout; 