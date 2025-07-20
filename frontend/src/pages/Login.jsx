import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LockClosedIcon, EnvelopeIcon as MailIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import GoogleOAuthButton from '../components/auth/GoogleOAuthButton';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const formRef = useRef(null);
  
  const { login, currentUser, loading, initialized } = useAuth();
  const navigate = useNavigate();
  
  // Memoize the background style
  const backgroundStyle = useMemo(() => ({
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url('https://images.unsplash.com/photo-1579621970795-87facc2f976d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  }), []);
  
  // Show snackbar when error message is set
  useEffect(() => {
    if (errorMessage) {
      setShowSnackbar(true);
      const timer = setTimeout(() => {
        setShowSnackbar(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);
  
  // Handle navigation after successful login
  useEffect(() => {
    if (currentUser && !loading && initialized) {
      navigate("/", { replace: true });
    }
  }, [currentUser, loading, initialized, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    
    setErrorMessage('');
    setIsLoading(true);
    
    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }
      
      const success = await login(email, password);
      if (!success) {
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  };
  
  // Prevent render if already authenticated
  if (currentUser && !loading && initialized) {
    return <Navigate to="/" replace />;
  }
  
  // Memoize the animations to reduce calculations
  const snackbarAnimation = useMemo(() => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { 
      type: "spring", 
      stiffness: 300,
      damping: 20,
      willChange: "transform, opacity"
    }
  }), []);
  
  const formAnimation = useMemo(() => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { 
      duration: 0.2,
      ease: "easeOut",
      willChange: "transform, opacity"
    }
  }), []);
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6" style={backgroundStyle}>
      <div className="absolute top-5 left-5 z-10">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wider">Finance Web</h1>
      </div>

      <AnimatePresence>
        {showSnackbar && errorMessage && (
          <motion.div 
            className="fixed top-4 right-4 z-50 max-w-sm will-change-transform"
            initial={snackbarAnimation.initial}
            animate={snackbarAnimation.animate}
            exit={snackbarAnimation.exit}
            transition={snackbarAnimation.transition}
          >
            <div className="bg-red-500 text-white p-4 rounded-lg shadow-lg backdrop-blur-sm flex items-start">
              <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 mr-2 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
              <button 
                onClick={() => setShowSnackbar(false)}
                className="ml-4 text-white hover:text-red-200 focus:outline-none transition"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="w-full max-w-sm sm:max-w-md backdrop-blur-sm bg-white/10 p-6 sm:p-10 rounded-xl shadow-2xl border border-white/20 will-change-transform"
        initial={formAnimation.initial}
        animate={formAnimation.animate}
        transition={formAnimation.transition}
      >
        <div>
          <h2 className="mt-2 text-center text-2xl sm:text-3xl font-extrabold text-white">Welcome back</h2>
          <p className="mt-2 text-center text-sm text-gray-200">
            Sign in to access your financial dashboard
          </p>
        </div>
        
        <form ref={formRef} className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-white mb-1">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MailIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-white">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-primary-300 hover:text-primary-200">
                Forgot password?
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-700 hover:to-primary-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform transition-all duration-300 hover:translate-y-[-2px] active:translate-y-0"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-white">Or continue with</span>
              </div>
            </div>
            
            <div className="w-full">
              <GoogleOAuthButton />
            </div>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-200">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary-300 hover:text-primary-200">
                Sign up now
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Login; 