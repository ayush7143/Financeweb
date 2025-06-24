import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Switch } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { authApi } from '../api/apiService';
import EditProfile from '../components/profile/EditProfile';
import { 
  MoonIcon, 
  SunIcon, 
  BellIcon, 
  LockClosedIcon, 
  UserCircleIcon, 
  GlobeAltIcon,
  ComputerDesktopIcon as DesktopComputerIcon,
  Cog6ToothIcon as CogIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const currencyOptions = {
  INR: { label: 'INR (₹)', symbol: '₹' },
  USD: { label: 'USD ($)', symbol: '$' },
  EUR: { label: 'EUR (€)', symbol: '€' },
  GBP: { label: 'GBP (£)', symbol: '£' },
  JPY: { label: 'JPY (¥)', symbol: '¥' }
};

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { user: currentUser } = useAuth();
  const { settings, updateSettings } = useSettings();
  const isDark = theme === 'dark';
  const [showEditProfile, setShowEditProfile] = useState(false);
  
  // State for user data
  const [userData, setUserData] = useState(null);
  
  // Fetch current user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data } = await authApi.getCurrentUser();
        if (data.user) {
          setUserData(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
    
    fetchUserData();
  }, []);

  // Use userData if available, otherwise fall back to currentUser
  const displayUser = userData || currentUser;
  
  // State for notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    monthlyReports: true,
    securityAlerts: true
  });
  
  // State for language preference
  const [language, setLanguage] = useState(settings.language || 'english');
  
  // State for currency format
  const [currencyFormat, setCurrencyFormat] = useState(settings.currency || 'USD');
  
  // State for data privacy options
  const [dataPrivacy, setDataPrivacy] = useState({
    shareAnalytics: true,
    rememberSessions: true
  });
  
  // State for snackbar
  const [snackbar, setSnackbar] = useState({
    show: false,
    message: '',
    type: 'success' // 'success' or 'error'
  });
  
  // Handle toggle changes
  const handleToggleChange = (setting) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };
  
  // Handle data privacy changes
  const handlePrivacyChange = (setting) => {
    setDataPrivacy(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };
  
  // Auto hide snackbar after 5 seconds
  useEffect(() => {
    if (snackbar.show) {
      const timer = setTimeout(() => {
        setSnackbar(prev => ({ ...prev, show: false }));
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [snackbar.show]);
  
  // Save settings function
  const saveSettings = async () => {
    try {
      setSnackbar({ show: true, message: 'Saving your settings...', type: 'info' });
      
      // Update settings in context
      updateSettings({
        language,
        currency: currencyFormat,
        dateFormat: settings.dateFormat,
        numberFormat: settings.numberFormat
      });
      
      setSnackbar({
        show: true,
        message: 'Settings saved successfully!',
        type: 'success'
      });
    } catch (error) {
      setSnackbar({
        show: true,
        message: 'Failed to save settings. Please try again.',
        type: 'error'
      });
    }
  };
  
  const handleCurrencyChange = (value) => {
    setCurrencyFormat(value);
    updateSettings({
      currency: value,
      currencySymbol: currencyOptions[value].symbol
    });
  };

  // Snackbar animation variants
  const snackbarVariants = {
    initial: { opacity: 0, y: -20, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage your account settings and preferences
            </p>
          </div>
          
          {/* Profile Section */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center space-x-5">
                <div className="flex-shrink-0">
                  {displayUser?.avatar?.url ? (
                    <img
                      src={displayUser.avatar.url}
                      alt={displayUser.name}
                      className="h-16 w-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-800 dark:text-primary-200 font-medium text-2xl border-2 border-primary-200 dark:border-primary-700">
                      {displayUser?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{displayUser?.name || 'Loading...'}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{displayUser?.email || 'Loading...'}</p>
                  <div className="mt-2">
                    <button 
                      onClick={() => setShowEditProfile(true)}
                      className="inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                    >
                      <UserCircleIcon className="h-4 w-4 mr-1" />
                      Edit profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Appearance Section */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center">
                <DesktopComputerIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                Appearance
              </h3>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isDark ? 'Dark mode is enabled' : 'Light mode is enabled'}
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex items-center p-3 rounded-full focus:outline-none ${
                    isDark ? 'bg-gray-700 text-yellow-300' : 'bg-blue-100 text-blue-800'
                  } transition-colors duration-200`}
                >
                  {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                </button>
              </div>
              
              <div className="mt-6">
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Language
                </label>
                <select
                  id="language"
                  name="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                >
                  <option value="english">English</option>
                  <option value="spanish">Spanish</option>
                  <option value="french">French</option>
                  <option value="german">German</option>
                  <option value="chinese">Chinese</option>
                </select>
              </div>
              
              <div className="mt-6">
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Currency Format
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={currencyFormat}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                >
                  {Object.entries(currencyOptions).map(([value, { label }]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Notifications Section */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center">
                <BellIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                Notifications
              </h3>
              <div className="mt-6 space-y-4">
                <Switch.Group>
                  <div className="flex items-center justify-between">
                    <Switch.Label className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Notifications</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Receive email notifications about your account</span>
                    </Switch.Label>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onChange={() => handleToggleChange('emailNotifications')}
                      className={`${
                        notificationSettings.emailNotifications ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
                    >
                      <span
                        className={`${
                          notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </Switch>
                  </div>
                </Switch.Group>
                
                <Switch.Group>
                  <div className="flex items-center justify-between">
                    <Switch.Label className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Push Notifications</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Receive push notifications on your devices</span>
                    </Switch.Label>
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onChange={() => handleToggleChange('pushNotifications')}
                      className={`${
                        notificationSettings.pushNotifications ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
                    >
                      <span
                        className={`${
                          notificationSettings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </Switch>
                  </div>
                </Switch.Group>
              </div>
            </div>
          </div>
          
          {/* Privacy Section */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                Privacy
              </h3>
              <div className="mt-6 space-y-4">
                <Switch.Group>
                  <div className="flex items-center justify-between">
                    <Switch.Label className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Share Analytics</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Help us improve by sharing anonymous usage data</span>
                    </Switch.Label>
                    <Switch
                      checked={dataPrivacy.shareAnalytics}
                      onChange={() => handlePrivacyChange('shareAnalytics')}
                      className={`${
                        dataPrivacy.shareAnalytics ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
                    >
                      <span
                        className={`${
                          dataPrivacy.shareAnalytics ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </Switch>
                  </div>
                </Switch.Group>
              </div>
            </div>
          </div>
          
          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && (
          <EditProfile onClose={() => setShowEditProfile(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;