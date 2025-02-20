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
      console.log('Missing exerciseId or imageUrl');
      return null;
    }

    try {
      const filename = await this.ensureValidFilename(exerciseId);
      console.log('Attempting to download and cache:', imageUrl);

      // Download with retry logic
      let localUri = null;
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts && !localUri) {
        try {
          const downloadResult = await FileSystem.downloadAsync(
            imageUrl,
            filename,
            DOWNLOAD_OPTIONS
          );

          if (downloadResult.status === 200) {
            localUri = downloadResult.uri;
          }
        } catch (downloadError) {
          console.warn(
            `Download attempt ${attempts + 1} failed:`,
            downloadError
          );
          attempts++;
          if (attempts === maxAttempts) throw downloadError;
        }
      }

      if (!localUri) {
        throw new Error('Failed to download image after retries');
      }

      // Validate the downloaded file
      const isValid = await this.validateCacheEntry(localUri);
      if (!isValid) {
        await FileSystem.deleteAsync(filename, { idempotent: true });
        throw new Error('Downloaded file validation failed');
      }

      // Save mapping to AsyncStorage and memory cache
      const key = `${CACHE_KEY_PREFIX}${exerciseId}`;
      await AsyncStorage.setItem(key, localUri);
      this.memoryCache.set(exerciseId, localUri);

      console.log('Successfully cached image:', localUri);
      return localUri;
    } catch (error) {
      console.error('Failed to save image to cache:', error);
      return null;
    }
  }

  async getFromCache(exerciseId) {
    if (!exerciseId) {
      console.log('No exerciseId provided to getFromCache');
      return null;
    }

    try {
      // Check memory cache first
      const memoryUri = this.memoryCache.get(exerciseId);
      if (memoryUri) {
        const isValid = await this.validateCacheEntry(memoryUri);
        if (isValid) {
          console.log('Cache hit from memory:', memoryUri);
          return memoryUri;
        }
      }

      // Check AsyncStorage if not in memory or invalid
      const key = `${CACHE_KEY_PREFIX}${exerciseId}`;
      const uri = await AsyncStorage.getItem(key);

      if (uri) {
        const isValid = await this.validateCacheEntry(uri);
        if (isValid) {
          this.memoryCache.set(exerciseId, uri);
          console.log('Cache hit from storage:', uri);
          return uri;
        }
      }

      // If we get here, the cache entry is invalid or missing
      await this.removeFromCache(exerciseId);
      console.log('Cache miss for exerciseId:', exerciseId);
      return null;
    } catch (error) {
      console.error('Failed to retrieve from cache:', error);
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
      console.log('Removed from cache:', exerciseId);
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
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}

export const imageCache = new ImageCache();
