import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

export const useFormStyles = () => {
  const { isDarkMode } = useTheme();

  const inputStyles = `w-full px-4 py-2 rounded-lg border ${
    isDarkMode
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500'
  } focus:outline-none focus:ring-1 transition-colors duration-200`;

  const labelStyles = `block text-sm font-medium mb-1 ${
    isDarkMode ? 'text-gray-300' : 'text-gray-700'
  }`;

  const selectStyles = `w-full px-4 py-2 rounded-lg border ${
    isDarkMode
      ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500'
      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500'
  } focus:outline-none focus:ring-1 transition-colors duration-200`;

  const buttonStyles = `px-4 py-2 rounded-lg font-medium ${
    isDarkMode
      ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
      : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
  } focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200`;

  return {
    inputStyles,
    labelStyles,
    selectStyles,
    buttonStyles
  };
};

export const useCurrencyFormat = () => {
  const { settings } = useSettings();
  return (amount, showSymbol = true) => {
    // Handle invalid amounts
    if (amount === null || amount === undefined || isNaN(parseFloat(amount))) {
      return showSymbol ? 
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: settings.currency || 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(0) : '0.00';
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings.currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
};

export const useDateFormat = () => {
  const formatDate = (date, format = 'default') => {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const options = {
      default: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      },
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      },
      long: {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      },
      time: {
        hour: '2-digit',
        minute: '2-digit'
      }
    };

    return d.toLocaleDateString('en-US', options[format] || options.default);
  };

  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';

    const startStr = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    
    const endStr = end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return `${startStr} - ${endStr}`;
  };

  return { formatDate, formatDateRange };
}; 