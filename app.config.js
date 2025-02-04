import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envFile = process.env.ENVFILE || '.env.development';
console.log(`Using environment file: ${envFile}`);
if (fs.existsSync(path.resolve(__dirname, envFile))) {
  dotenv.config({ path: envFile });
} else {
  console.warn(`Environment file ${envFile} not found!`);
}

module.exports = ({ config }) => {
  const isProd = process.env.ENV === 'production';
  const iconDir = isProd
    ? './assets/app-icons/production'
    : './assets/app-icons/development';

  const extraConfig = {
    ...config.extra,
    apiUrl: process.env.API_URL,
    env: process.env.ENV,
    isProd: isProd,
    environment: process.env.ENV
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
