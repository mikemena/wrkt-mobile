import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const CACHE_KEY_PREFIX = 'exercise_image_';
const CACHE_FOLDER = `${FileSystem.cacheDirectory}exercise_images/`;
const DOWNLOAD_OPTIONS = {
  cache: true,
  headers: {
    'Cache-Control': 'max-age=31536000'
  }
};

class ImageCache {
  constructor() {
    this.memoryCache = new Map();
    this.initializeCache();
  }

  async initializeCache() {
    try {
      // Ensure cache directory exists
      const dirInfo = await FileSystem.getInfoAsync(CACHE_FOLDER);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_FOLDER, {
          intermediates: true
        });
      }

      // Load and validate cache mapping from AsyncStorage
      const cacheKeys = await AsyncStorage.getAllKeys();
      const exerciseKeys = cacheKeys.filter(key =>
        key.startsWith(CACHE_KEY_PREFIX)
      );
      const cacheEntries = await AsyncStorage.multiGet(exerciseKeys);

      // Validate and populate memory cache
      await Promise.all(
        cacheEntries.map(async ([key, value]) => {
          const exerciseId = key.replace(CACHE_KEY_PREFIX, '');
          if (value) {
            const isValid = await this.validateCacheEntry(value);
            if (isValid) {
              this.memoryCache.set(exerciseId, value);
            } else {
              await this.removeFromCache(exerciseId);
            }
          }
        })
      );
    } catch (error) {
      console.error('Failed to initialize cache:', error);
    }
  }

  async validateCacheEntry(uri) {
    try {
      if (!uri || typeof uri !== 'string') return false;

      // Basic URI validation
      if (!uri.startsWith('file://')) {
        return false;
      }

      // Check if file exists and has content
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.exists && fileInfo.size > 0;
    } catch (error) {
      console.error('Error validating cache entry:', error);
      return false;
    }
  }

  async ensureValidFilename(exerciseId) {
    // Ensure filename is clean and safe
    const safeId = exerciseId.toString().replace(/[^a-zA-Z0-9]/g, '_');
    return `${CACHE_FOLDER}${safeId}.jpg`;
  }

  async saveToCache(exerciseId, imageUrl) {
    if (!exerciseId || !imageUrl) {
      console.log('❌ Missing exerciseId or imageUrl in saveToCache');
      console.log('  exerciseId:', exerciseId);
      console.log('  imageUrl:', imageUrl);
      return null;
    }

    try {
      console.log(`📥 saveToCache called for exerciseId: ${exerciseId}`);
      console.log(`🔗 Image URL: ${imageUrl}`);

      const filename = await this.ensureValidFilename(exerciseId);
      console.log(`📄 Target filename: ${filename}`);

      // Verify the URL is valid
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        console.log('❌ Invalid URL format:', imageUrl);
        return null;
      }

      // Download with retry logic
      let localUri = null;
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts && !localUri) {
        try {
          console.log(`🌐 Download attempt ${attempts + 1} for: ${imageUrl}`);
          console.log(`📥 Destination: ${filename}`);

          const downloadResult = await FileSystem.downloadAsync(
            imageUrl,
            filename,
            DOWNLOAD_OPTIONS
          );

          console.log(`📥 Download result:`, downloadResult);

          if (downloadResult.status === 200) {
            localUri = downloadResult.uri;
            console.log(`✅ Download successful: ${localUri}`);
          } else {
            console.log(
              `❌ Download returned non-200 status: ${downloadResult.status}`
            );
          }
        } catch (downloadError) {
          console.warn(
            `❌ Download attempt ${attempts + 1} failed:`,
            downloadError.message
          );
          attempts++;
          if (attempts === maxAttempts) throw downloadError;
        }
      }

      if (!localUri) {
        throw new Error('Failed to download image after retries');
      }

      // Validate the downloaded file
      console.log(`🔍 Validating downloaded file: ${localUri}`);
      const isValid = await this.validateCacheEntry(localUri);
      console.log(`📄 File validation result: ${isValid}`);

      if (!isValid) {
        console.log(
          `❌ Downloaded file validation failed, deleting: ${filename}`
        );
        await FileSystem.deleteAsync(filename, { idempotent: true });
        throw new Error('Downloaded file validation failed');
      }

      // Save mapping to AsyncStorage and memory cache
      const key = `${CACHE_KEY_PREFIX}${exerciseId}`;
      console.log(`💾 Saving to AsyncStorage with key: ${key}`);
      await AsyncStorage.setItem(key, localUri);
      this.memoryCache.set(exerciseId, localUri);
      console.log(`📦 Added to memory cache: ${exerciseId} => ${localUri}`);

      console.log(`✅ Successfully cached image: ${localUri}`);
      return localUri;
    } catch (error) {
      console.error(`❌ Failed to save image to cache:`, error.message);
      console.error(error);
      return null;
    }
  }

  async getFromCache(exerciseId) {
    if (!exerciseId) {
      console.log('❌ No exerciseId provided to getFromCache');
      return null;
    }

    console.log(`🔍 getFromCache called for exerciseId: ${exerciseId}`);

    try {
      // Check memory cache first
      console.log(`📦 Checking memory cache for: ${exerciseId}`);
      const memoryUri = this.memoryCache.get(exerciseId);

      if (memoryUri) {
        console.log(`📦 Found in memory cache: ${memoryUri}`);
        const isValid = await this.validateCacheEntry(memoryUri);
        console.log(`🔍 Memory cache validation result: ${isValid}`);

        if (isValid) {
          console.log(`✅ Cache hit from memory: ${memoryUri}`);
          return memoryUri;
        } else {
          console.log(`❌ Memory cache entry invalid: ${memoryUri}`);
        }
      } else {
        console.log(`❌ Not found in memory cache`);
      }

      // Check AsyncStorage if not in memory or invalid
      const key = `${CACHE_KEY_PREFIX}${exerciseId}`;
      console.log(`🔍 Checking AsyncStorage with key: ${key}`);
      const uri = await AsyncStorage.getItem(key);

      if (uri) {
        console.log(`📦 Found in AsyncStorage: ${uri}`);
        const isValid = await this.validateCacheEntry(uri);
        console.log(`🔍 AsyncStorage validation result: ${isValid}`);

        if (isValid) {
          console.log(`✅ Adding valid URI to memory cache: ${uri}`);
          this.memoryCache.set(exerciseId, uri);
          return uri;
        } else {
          console.log(`❌ AsyncStorage cache entry invalid: ${uri}`);
        }
      } else {
        console.log(`❌ Not found in AsyncStorage`);
      }

      // If we get here, the cache entry is invalid or missing
      console.log(`🧹 Removing invalid cache entry for: ${exerciseId}`);
      await this.removeFromCache(exerciseId);
      return null;
    } catch (error) {
      console.error(`❌ Failed to retrieve from cache:`, error.message);
      return null;
    }
  }

  async removeFromCache(exerciseId) {
    try {
      const key = `${CACHE_KEY_PREFIX}${exerciseId}`;
      const uri = await AsyncStorage.getItem(key);

      if (uri) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }

      await AsyncStorage.removeItem(key);
      this.memoryCache.delete(exerciseId);
    } catch (error) {
      console.error('Failed to remove from cache:', error);
    }
  }

  async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const exerciseKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));

      // Remove all cached files
      await Promise.all(
        exerciseKeys.map(async key => {
          const uri = await AsyncStorage.getItem(key);
          if (uri) {
            await FileSystem.deleteAsync(uri, { idempotent: true });
          }
        })
      );

      // Clear AsyncStorage entries
      await AsyncStorage.multiRemove(exerciseKeys);
      this.memoryCache.clear();
      // console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}

export const imageCache = new ImageCache();
