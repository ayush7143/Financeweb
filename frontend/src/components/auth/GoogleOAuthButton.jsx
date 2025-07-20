import { FcGoogle } from 'react-icons/fc';

const GoogleOAuthButton = ({ className = "" }) => {
  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className={`w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 transform hover:scale-105 ${className}`}
    >
      <FcGoogle className="h-5 w-5 mr-3" />
      Continue with Google
    </button>
  );
};

export default GoogleOAuthButton;
