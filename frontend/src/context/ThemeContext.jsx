import React, { createContext, useContext, useState, useEffect } from 'react';

// Create a context for the theme
const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  // Check for user preference in localStorage, or use system preference as default
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });
  
  // Apply theme to document with transition
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Add a transition class before changing theme
    root.classList.add('theme-transition');
    
    // Remove previous theme class
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    
    // Remove the transition class after the transition is complete
    const transitionTimeout = setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 300); // Match this with CSS transition duration
    
    // Theme is ready
    if (!isThemeLoaded) {
      setIsThemeLoaded(true);
    }
    
    return () => clearTimeout(transitionTimeout);
  }, [theme, isThemeLoaded]);

  // Handle system theme change
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (!localStorage.getItem('theme')) {
        setTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    
    // Use the proper event listener based on browser support
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // For older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);
  
  // Toggle between light and dark mode
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  // Prevent rendering until theme is loaded
  if (!isThemeLoaded) {
    // Return an invisible container that takes the same space
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="h-0 w-0 overflow-hidden" />
      </div>
    );
  }
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isThemeLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext; 