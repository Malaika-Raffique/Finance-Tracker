import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [currency, setCurrency] = useState({ symbol: 'Rs.', code: 'PKR', name: 'Pakistani Rupee' });
  const [passcode, setPasscode] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await api.getSettings();
      if (settings.currency) setCurrency(settings.currency);
      if (settings.passcode) {
        setPasscode(settings.passcode);
        setIsLocked(true);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const updateCurrency = async (newCurrency) => {
    setCurrency(newCurrency);
    await api.updateSetting('currency', newCurrency);
  };

  const updatePasscode = async (newPasscode) => {
    setPasscode(newPasscode);
    await api.updateSetting('passcode', newPasscode);
    if (!newPasscode) setIsLocked(false);
  };

  const unlockApp = (inputPin) => {
    if (inputPin === passcode) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <AppContext.Provider value={{
      currency,
      updateCurrency,
      passcode,
      updatePasscode,
      isLocked,
      unlockApp,
      activeTab,
      setActiveTab,
      selectedMonth,
      setSelectedMonth,
      refreshTrigger,
      triggerRefresh
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
