import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const CACHE_KEY_PREFIX = 'exercise_image_';
const CACHE_FOLDER = `${FileSystem.cacheDirectory}exercise_images/`;

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

      // Load cache mapping from AsyncStorage
      const cacheKeys = await AsyncStorage.getAllKeys();
      const exerciseKeys = cacheKeys.filter(key =>
        key.startsWith(CACHE_KEY_PREFIX)
      );
      const cacheEntries = await AsyncStorage.multiGet(exerciseKeys);

      // Populate memory cache
      cacheEntries.forEach(([key, value]) => {
        const exerciseId = key.replace(CACHE_KEY_PREFIX, '');
        if (value) {
          this.memoryCache.set(exerciseId, value);
        }
      });
    } catch (error) {
      console.error('Failed to initialize cache:', error);
    }
  }

  async saveToCache(exerciseId, imageUrl) {
    if (!exerciseId || !imageUrl) return null;

    try {
      // Generate a unique filename
      const filename = `${CACHE_FOLDER}${exerciseId}.jpg`;

      // Download and save the image
      const { uri: localUri } = await FileSystem.downloadAsync(
        imageUrl,
        filename
      );

      // Save mapping to AsyncStorage and memory cache
      await AsyncStorage.setItem(`${CACHE_KEY_PREFIX}${exerciseId}`, localUri);
      this.memoryCache.set(exerciseId, localUri);

      return localUri;
    } catch (error) {
      console.error('Failed to save image to cache:', error);
      return null;
    }
  }

  async getFromCache(exerciseId) {
    if (!exerciseId) return null;

    try {
      // Check memory cache first
      const memoryUri = this.memoryCache.get(exerciseId);
      if (memoryUri) {
        // Verify file still exists
        const fileInfo = await FileSystem.getInfoAsync(memoryUri);
        if (fileInfo.exists) {
          return memoryUri;
        }
      }

      // Check AsyncStorage if not in memory
      const uri = await AsyncStorage.getItem(
        `${CACHE_KEY_PREFIX}${exerciseId}`
      );
      if (uri) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists) {
          this.memoryCache.set(exerciseId, uri);
          return uri;
        }
      }

      // If file doesn't exist, clean up cache entries
      await this.removeFromCache(exerciseId);
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
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}

export const imageCache = new ImageCache();
