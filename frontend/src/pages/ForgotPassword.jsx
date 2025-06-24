import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EnvelopeIcon as MailIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

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
      
      // In a real app, this would call your API to send a reset email
      // For demo purposes, we'll just simulate success after a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStatus({
        type: 'success',
        message: 'Password reset instructions have been sent to your email address.'
      });
      
      // Clear form
      setEmail('');
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to send reset instructions. Please try again.'
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
          <h2 className="mt-2 text-center text-2xl sm:text-3xl font-extrabold text-white">Reset your password</h2>
          <p className="mt-2 text-center text-sm text-gray-200">
            Enter your email and we'll send you instructions to reset your password
          </p>
        </div>
        
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
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
                  placeholder="Enter your email address"
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
                  Sending instructions...
                </>
              ) : (
                'Send reset instructions'
              )}
            </button>
          </div>
          
          <div className="text-center mt-6 flex flex-col sm:flex-row sm:justify-between items-center space-y-4 sm:space-y-0">
            <Link to="/login" className="font-medium text-primary-300 hover:text-primary-200 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to sign in
            </Link>
            <Link to="/register" className="font-medium text-primary-300 hover:text-primary-200">
              Create account
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ForgotPassword; 