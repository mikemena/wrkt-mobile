import React, { createContext, useState, useContext, useEffect } from 'react';
import { getEnvVars } from '../utils/env';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState({
    apiUrl: null,
    isLoading: true
  });

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const env = await getEnvVars();
        setConfig({
          apiUrl: env.API_URL,
          isLoading: false
        });
      } catch (error) {
        console.error('Failed to load configuration:', error);
        setConfig(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadConfig();
  }, []);

  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
