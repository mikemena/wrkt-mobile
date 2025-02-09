module.exports = ({ config }) => {
  const isProd =
    process.env.ENV === 'production' || process.env.NODE_ENV === 'production';

  const iconDir = isProd
    ? './assets/app-icons/production'
    : './assets/app-icons/development';

  console.log('Environment variables:', {
    ENVFILE: process.env.ENVFILE,
    ENV: process.env.ENV,
    NODE_ENV: process.env.NODE_ENV
  });

  const extraConfig = {
    ...config.extra,
    apiUrl: isProd ? 'https://api.wrkt.fitness' : 'http://localhost:9025',
    // apiUrl: isProd ? 'https://api.wrkt.fitness' : 'http://192.168.1.229:9025',
    env: isProd ? 'production' : 'development',
    isProd: isProd,
    environment: isProd ? 'production' : 'development'
  };

  const updatedConfig = {
    ...config,
    icon: `${iconDir}/icon_1024.png`,
    ios: {
      ...config.ios,
      icons: {
        app: {
          ios: {
            120: `${iconDir}/icon_120.png`,
            180: `${iconDir}/icon_180.png`
          },
          ipad: {
            152: `${iconDir}/icon-152.png`,
            167: `${iconDir}/icon-167.png`
          },
          spotlight: {
            80: `${iconDir}/icon-80.png`
          },
          settings: {
            58: `${iconDir}/icon-58.png`,
            87: `${iconDir}/icon-87.png`
          }
        }
      }
    },
    android: {
      ...config.android,
      adaptiveIcon: {
        foregroundImage: `${iconDir}/icon_1024.png`,
        backgroundColor: '#ffffff'
      }
    },
    extra: extraConfig
  };

  return updatedConfig;
};
