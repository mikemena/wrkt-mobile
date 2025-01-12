module.exports = ({ config }) => {
  const isProd =
    process.env.ENVFILE === '.env.production' ||
    process.env.ENV === 'production' ||
    process.env.NODE_ENV === 'production';

  console.log('Environment variables:', {
    ENVFILE: process.env.ENVFILE,
    ENV: process.env.ENV,
    NODE_ENV: process.env.NODE_ENV
  });

  const extraConfig = {
    ...config.extra,
    apiUrl: isProd ? 'https://api.wrkt.fitness' : 'http://192.168.1.229:9025',
    env: isProd ? 'production' : 'development',
    isProd: isProd,
    environment: isProd ? 'production' : 'development'
  };

  const updatedConfig = {
    ...config,
    extra: extraConfig
  };

  console.log(
    'Final config being generated:',
    JSON.stringify(updatedConfig, null, 2)
  );

  return updatedConfig;
};
