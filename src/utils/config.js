import Constants from 'expo-constants';

export const getConfig = () => {
  const config = {
    apiUrl: Constants.expoConfig?.extra?.apiUrl
  };

  if (!config.apiUrl) {
    console.warn('API URL not found in config');
    // Provide a development fallback
    config.apiUrl =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:9025'
        : 'https://api.wrkt.fitness';
  }

  return config;
};
