import { BrowserRouter as Router } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { createTestUsers } from './utils/testUsers';
import apiService from './api/apiService';
import AppRoutes from './routes';
import { SnackbarProvider } from './context/SnackbarContext';

// App Initializer
const AppInitializer = ({ children }) => {
  useEffect(() => {
    // Only create test users if explicitly enabled in development
    if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_TEST_USERS === 'true') {
      const timer = setTimeout(() => {
        createTestUsers(apiService);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  return children;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <ThemeProvider>
            <SnackbarProvider>
              <AppInitializer>
                <div className="flex flex-col min-h-screen">
                  <AppRoutes />
                </div>
              </AppInitializer>
            </SnackbarProvider>
          </ThemeProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
