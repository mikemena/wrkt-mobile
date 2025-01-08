import Constants from 'expo-constants';

export const getConfig = () => {
  const config = {
    apiUrl: Constants.expoConfig?.extra?.apiUrl
  };

  console.log('Config loaded:', config); // Debug log

  if (!config.apiUrl) {
    console.warn('API URL not found in config');
    // Provide a development fallback
    config.apiUrl =
      process.env.NODE_ENV === 'development'
        ? 'http://192.168.1.229:9025'
        : 'https://api.wrkt.fitness';
  }

  return config;
};
