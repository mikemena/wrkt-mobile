// src/context/configContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import Constants from 'expo-constants';
import { initializeApi } from '../services/api';

// Create the context
const ConfigContext = createContext(undefined);

// Custom hook to use config
export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

// Provider component
export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState({
    apiUrl: null,
    isLoading: true
  });

  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Get apiUrl from Expo constants or environment
        const apiUrl = Constants.expoConfig?.extra?.apiUrl;
        console.log('Initial API URL:', apiUrl);

        // Use the environment-specific URL
        const finalApiUrl =
          apiUrl ||
          (process.env.ENVFILE === '.env.production'
            ? 'https://api.wrkt.fitness'
            : 'http://192.168.1.229:9025');

        console.log('Final API URL:', finalApiUrl);

        // Set config and initialize API
        setConfig({
          apiUrl: finalApiUrl,
          isLoading: false
        });

        initializeApi({ apiUrl: finalApiUrl });
      } catch (error) {
        console.error('Configuration error:', error);
        setConfig(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadConfig();
  }, []);

  // Provide both the config object and a way to update it
  const value = {
    ...config,
    setConfig
  };

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
};

// Make sure both are exported
export default {
  ConfigProvider,
  useConfig
};
