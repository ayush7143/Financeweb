import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LockClosedIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { authApi } from '../api/apiService';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: '', message: '' });
    
    try {
      // Validate passwords
      if (!password || !confirmPassword) {
        throw new Error('Please fill in all fields');
      }
      
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      // Call API to reset password
      const response = await authApi.resetPassword(token, password);
      
      setStatus({
        type: 'success',
        message: 'Password reset successful! Redirecting to login...'
      });
      
      // Clear form
      setPassword('');
      setConfirmPassword('');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Failed to reset password. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const response = await axios.post('/api/auth/reset-password', {
        token,
        newPassword: password
      });

      if (response.data.success) {
        setStatus({
          type: 'success',
          message: 'Password reset successful. You will be redirected to login.'
        });
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url('https://images.unsplash.com/photo-1606870825632-52ea26d794df?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>

      <div className="absolute top-5 left-5 z-10">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wider">Finance Web</h1>
      </div>
      
      <motion.div 
        className="w-full max-w-sm sm:max-w-md backdrop-blur-sm bg-white/10 p-6 sm:p-10 rounded-xl shadow-2xl border border-white/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h2 className="mt-2 text-center text-2xl sm:text-3xl font-extrabold text-white">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-200">
            Enter your new password below
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handlePasswordReset}>
          {status.message && (
            <div className={`rounded-md ${status.type === 'error' ? 'bg-red-400/80' : 'bg-green-400/80'} backdrop-blur-sm p-4 animate-pulse`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {status.type === 'error' ? (
                    <ExclamationCircleIcon className="h-5 w-5 text-white" aria-hidden="true" />
                  ) : (
                    <CheckCircleIcon className="h-5 w-5 text-white" aria-hidden="true" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-white">{status.message}</h3>
                </div>
              </div>
            </div>
          )}
          
          <div className="rounded-md space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-1">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Enter new password"
                  minLength="6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm new password"
                  minLength="6"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 mt-6">
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
                  Resetting password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
