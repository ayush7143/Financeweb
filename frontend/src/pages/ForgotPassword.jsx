import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EnvelopeIcon as MailIcon, ExclamationCircleIcon, CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { authApi } from '../api/apiService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: '', message: '' });
    
    try {
      // Validate email
      if (!email) {
        throw new Error('Please enter your email address');
      }
      
      // Call the API to send reset email
      const response = await authApi.forgotPassword(email);
      
      setStatus({
        type: 'success',
        message: response.data.message || 'Password reset instructions have been sent to your email address.'
      });
      
      // Clear form
      setEmail('');
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Failed to send reset instructions. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(102, 126, 234, 0.8), rgba(118, 75, 162, 0.8)), url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>

      <div className="absolute top-5 left-5 z-10">
        <Link to="/login" className="flex items-center text-white hover:text-gray-200 transition-colors">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          <span className="text-lg font-semibold">Back to Login</span>
        </Link>
      </div>
      
      <motion.div 
        className="w-full max-w-md backdrop-blur-lg bg-white/10 p-8 rounded-2xl shadow-2xl border border-white/20"
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <MailIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Forgot Password?</h2>
          <p className="text-gray-200">
            No worries! Enter your email and we'll send you reset instructions.
          </p>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          {status.message && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`rounded-xl p-4 ${
                status.type === 'error' 
                  ? 'bg-red-500/90 backdrop-blur-sm' 
                  : 'bg-green-500/90 backdrop-blur-sm'
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {status.type === 'error' ? (
                    <ExclamationCircleIcon className="h-5 w-5 text-white" />
                  ) : (
                    <CheckCircleIcon className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{status.message}</p>
                </div>
              </div>
            </motion.div>
          )}
          
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-white mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MailIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
                placeholder="Enter your email address"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform transition-all duration-300 hover:scale-105 active:scale-95"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Sending Instructions...
              </>
            ) : (
              <>
                <MailIcon className="h-5 w-5 mr-2" />
                Send Reset Instructions
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-200">
              Remember your password?{' '}
              <Link 
                to="/login" 
                className="font-medium text-white hover:text-gray-200 underline decoration-2 underline-offset-4 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-white/20">
          <div className="text-center">
            <p className="text-xs text-gray-300">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="font-medium text-white hover:text-gray-200 underline decoration-1 underline-offset-2 transition-colors"
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword; 