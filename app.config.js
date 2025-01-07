const path = require('path');
const dotenv = require('dotenv');

const envFile = process.env.ENVFILE || '.env.development';
console.log(`Loading environment from: ${envFile}`);

const env = dotenv.config({ path: path.resolve(__dirname, envFile) }).parsed;
console.log('Loaded environment variables:', env);

// Ensure env is an object even if .env file is missing
const envVars = env || {};

module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      apiUrl:
        process.env.API_URL || envVars.API_URL || 'http://192.168.1.229:9025'
    }
  };
};
