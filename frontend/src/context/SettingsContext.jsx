import { createContext, useContext, useState, useEffect } from 'react';

export const SettingsContext = createContext();

const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥'
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('appSettings');
    const defaultSettings = {
      currency: 'INR',
      dateFormat: 'MM/DD/YYYY',
      numberFormat: 'en-IN',
      language: 'english',
      theme: 'light'
    };
    
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      return {
        ...parsed,
        currencySymbol: CURRENCY_SYMBOLS[parsed.currency] || CURRENCY_SYMBOLS['INR']
      };
    }
    return {
      ...defaultSettings,
      currencySymbol: CURRENCY_SYMBOLS[defaultSettings.currency]
    };
  });

  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
      currencySymbol: CURRENCY_SYMBOLS[newSettings.currency] || prev.currencySymbol
    }));
  };

  const formatCurrency = (value) => {
    if (typeof value !== 'number' || isNaN(value)) {
      value = 0;
    }
    
    // Use explicit currency symbol instead of relying on Intl formatter
    const formatted = new Intl.NumberFormat(settings.numberFormat, {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
    
    return `${settings.currencySymbol}${formatted}`;
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, formatCurrency }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};