import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LockClosedIcon, EnvelopeIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1 for email verification, 2 for password reset
  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');

  useEffect(() => {
    if (!token) {
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const verifyEmailAndToken = async () => {
    try {
      const response = await axios.post('/api/auth/verify-reset-token', {
        token,
        email
      });
      
      if (response.data.success) {
        setStep(2);
      } else {
        throw new Error('Invalid or expired reset link');
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'Invalid reset attempt'
      });
      setTimeout(() => navigate('/forgot-password'), 3000);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await verifyEmailAndToken();
    setIsLoading(false);
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
      <motion.div 
        className="w-full max-w-sm sm:max-w-md backdrop-blur-sm bg-white/10 p-6 sm:p-10 rounded-xl shadow-2xl border border-white/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {step === 1 ? (
          // Email Verification Step
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Verify Your Email</h2>
              <p className="text-sm text-gray-200 mb-4">Please enter your email to verify the reset link</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        ) : (
          // Password Reset Step
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Set New Password</h2>
              <p className="text-sm text-gray-200 mb-4">Create a strong password for your account</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  required
                />
              </div>
            </div>

            {status.message && (
              <div className={`rounded-md ${status.type === 'error' ? 'bg-red-400/80' : 'bg-green-400/80'} p-4`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {status.type === 'error' ? (
                      <ExclamationCircleIcon className="h-5 w-5 text-white" />
                    ) : (
                      <CheckCircleIcon className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-white">{status.message}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export { ResetPassword };
export default ResetPassword;
