module.exports = ({ config }) => {
  // Explicitly check the ENVFILE to determine environment
  const isProd = process.env.ENVFILE === '.env.production';
  const apiUrl = isProd
    ? 'https://api.wrkt.fitness'
    : 'http://192.168.1.229:9025';

  console.log('Environment:', isProd ? 'production' : 'development');
  console.log('Using API URL:', apiUrl);

  return {
    ...config,
    extra: {
      ...config.extra,
      apiUrl,
      env: isProd ? 'production' : 'development'
    }
  };
};
