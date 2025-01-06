import * as FileSystem from 'expo-file-system';

const parseEnvFile = content => {
  const result = {};
  const lines = content.split('\n');

  lines.forEach(line => {
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) return;

    const [key, ...valueParts] = line.split('=');
    if (!key) return;

    // Join back in case value contained = signs
    const value = valueParts.join('=');

    // Clean up key/value and store
    result[key.trim()] = value.trim().replace(/["']/g, '');
  });

  return result;
};

export const getEnvVars = async () => {
  try {
    const envFile = process.env.ENVFILE || '.env.development';
    const content = await FileSystem.readAsStringAsync(
      FileSystem.documentDirectory + envFile,
      { encoding: FileSystem.EncodingType.UTF8 }
    );

    return parseEnvFile(content);
  } catch (error) {
    console.warn('Failed to load env file:', error);
    // Fallback values
    return {
      API_URL: 'https://api.wrkt.fitness' // Production fallback
    };
  }
};
