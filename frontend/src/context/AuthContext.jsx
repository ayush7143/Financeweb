import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { authApi } from '../api/apiService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    token: null,
    isLoading: true,
    isInitialized: false,
    error: null
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
          setAuthState(prev => ({ ...prev, isLoading: false, isInitialized: true }));
          return;
        }

        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        try {
          const { data } = await authApi.getCurrentUser();
          if (data.user) {
            setAuthState({
              user: data.user,
              token,
              isLoading: false,
              isInitialized: true,
              error: null
            });
          } else {
            throw new Error('Invalid user data');
          }
        } catch (error) {
          console.error('Auth validation failed:', error);
          handleLogout();
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        handleLogout();
      }
    };

    initAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
      isInitialized: true,
      error: null
    });
  };

  const handleLogin = async (email, password) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const { data } = await authApi.login({ email, password });
      const { user, token } = data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setAuthState({
        user,
        token,
        isLoading: false,
        isInitialized: true,
        error: null
      });

      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return false;
    }
  };

  const handleRegister = async (name, email, password) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      const { data } = await authApi.register({ name, email, password });
      const { user, token } = data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setAuthState({
        user,
        token,
        isLoading: false,
        isInitialized: true,
        error: null
      });
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return false;
    }
  };

  const updateUser = (updatedUser) => {
    setAuthState(prev => ({
      ...prev,
      user: updatedUser
    }));
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const loginWithToken = async (token) => {
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const { data } = await authApi.getCurrentUser();
      
      if (data.user) {
        setAuthState({
          user: data.user,
          token,
          isLoading: false,
          isInitialized: true,
          error: null
        });
        localStorage.setItem('user', JSON.stringify(data.user));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token login failed:', error);
      handleLogout();
      return false;
    }
  };

  const value = {
    user: authState.user,
    isAuthenticated: !!authState.user,
    isLoading: authState.isLoading,
    isInitialized: authState.isInitialized,
    error: authState.error,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister,
    updateUser,
    loginWithToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;