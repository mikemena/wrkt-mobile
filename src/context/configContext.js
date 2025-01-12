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
        // Force production URL if NODE_ENV is production
        const isProd =
          process.env.NODE_ENV === 'production' ||
          process.env.ENV === 'production' ||
          process.env.ENVFILE === '.env.production';

        console.log('Process ENV:', {
          NODE_ENV: process.env.NODE_ENV,
          ENV: process.env.ENV,
          ENVFILE: process.env.ENVFILE
        });

        // Always use production URL if any production flag is set
        const finalApiUrl = isProd
          ? 'https://api.wrkt.fitness'
          : 'http://192.168.1.229:9025';

        console.log('Final configuration:', {
          isProd,
          apiUrl: finalApiUrl
        });

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
    <ConfigContext.Provider value={{ ...config, setConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};
