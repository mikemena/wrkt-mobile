import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Switch from cache directory to document directory for permanent storage
// Cache directory can be cleared by the OS, document directory persists until app uninstall
const BASE_DIR =
  Platform.OS === 'ios'
    ? FileSystem.documentDirectory
    : FileSystem.documentDirectory;

const CACHE_FOLDER = `${BASE_DIR}wrkt_exercise_images/`;
const CACHE_KEY_PREFIX = 'exercise_image_';
const CACHE_MANIFEST_KEY = 'exercise_image_manifest';
const CACHE_VERSION = '1.0.1'; // Increment when making breaking changes to the cache structure

// Configure longer expiration - 180 days (very long-term)
const CACHE_EXPIRY = 1000 * 60 * 60 * 24 * 180;

const DOWNLOAD_OPTIONS = {
  cache: true,
  headers: {
    'Cache-Control': 'max-age=31536000' // 1 year
  }
};

class ImageCache {
  constructor() {
    this.memoryCache = new Map();
    this.manifest = {
      version: CACHE_VERSION,
      lastFullSync: 0,
      entries: {}
    };
    this.initializeCache();
  }

  async initializeCache() {
    try {
      console.log('Initializing image cache...');

      // Ensure cache directory exists
      const dirInfo = await FileSystem.getInfoAsync(CACHE_FOLDER);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_FOLDER, {
          intermediates: true
        });
        console.log(`Created cache directory: ${CACHE_FOLDER}`);
      }

      // Load manifest
      await this.loadManifest();

      // Handle version migrations
      if (this.manifest.version !== CACHE_VERSION) {
        console.log(
          `Cache version mismatch: ${this.manifest.version} vs ${CACHE_VERSION}`
        );
        await this.migrateCache();
      }

      // Load and validate cache mapping from AsyncStorage
      const cacheKeys = await AsyncStorage.getAllKeys();
      const exerciseKeys = cacheKeys.filter(
        key => key.startsWith(CACHE_KEY_PREFIX) && key !== CACHE_MANIFEST_KEY
      );

      if (exerciseKeys.length > 0) {
        console.log(`Found ${exerciseKeys.length} cached exercise images`);
        const cacheEntries = await AsyncStorage.multiGet(exerciseKeys);

        // Validate and populate memory cache
        await Promise.all(
          cacheEntries.map(async ([key, value]) => {
            const exerciseId = key.replace(CACHE_KEY_PREFIX, '');
            if (value) {
              const isValid = await this.validateCacheEntry(value);
              if (isValid) {
                this.memoryCache.set(exerciseId, value);

                // Update manifest if not already there
                if (!this.manifest.entries[exerciseId]) {
                  this.manifest.entries[exerciseId] = {
                    path: value,
                    timestamp: Date.now(),
                    lastAccessed: Date.now()
                  };
                }
              } else {
                await this.removeFromCache(exerciseId);
              }
            }
          })
        );

        // Save updated manifest
        await this.saveManifest();
      } else {
        console.log('No cached exercise images found');
      }
    } catch (error) {
      console.error('Failed to initialize cache:', error);
    }
  }

  async loadManifest() {
    try {
      const manifestJson = await AsyncStorage.getItem(CACHE_MANIFEST_KEY);
      if (manifestJson) {
        this.manifest = JSON.parse(manifestJson);
        console.log(`Loaded cache manifest, version: ${this.manifest.version}`);
      } else {
        console.log('No cache manifest found, creating new one');
        this.manifest = {
          version: CACHE_VERSION,
          lastFullSync: 0,
          entries: {}
        };
        await this.saveManifest();
      }
    } catch (error) {
      console.error('Failed to load cache manifest:', error);
      // Reset to default manifest
      this.manifest = {
        version: CACHE_VERSION,
        lastFullSync: 0,
        entries: {}
      };
      await this.saveManifest();
    }
  }

  async saveManifest() {
    try {
      await AsyncStorage.setItem(
        CACHE_MANIFEST_KEY,
        JSON.stringify(this.manifest)
      );
    } catch (error) {
      console.error('Failed to save cache manifest:', error);
    }
  }

  async migrateCache() {
    console.log('Migrating cache...');
    // Simple migration strategy - clear and rebuild
    // In a real app, you might want to do more sophisticated migration
    await this.clearCache();
    this.manifest = {
      version: CACHE_VERSION,
      lastFullSync: 0,
      entries: {}
    };
    await this.saveManifest();
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

  // Allow checking if the cache contains an entry without actually loading it
  hasInMemoryCache(exerciseId) {
    return this.memoryCache.has(exerciseId);
  }

  hasInManifest(exerciseId) {
    return !!this.manifest.entries[exerciseId];
  }

  async ensureValidFilename(exerciseId) {
    // Ensure filename is clean and safe
    const safeId = exerciseId.toString().replace(/[^a-zA-Z0-9]/g, '_');
    return `${CACHE_FOLDER}${safeId}.jpg`;
  }

  // Get the cache directory path - useful for diagnostic tools
  getCacheDirectory() {
    return CACHE_FOLDER;
  }

  async saveToCache(exerciseId, imageUrl) {
    if (!exerciseId || !imageUrl) {
      return null;
    }

    try {
      const filename = await this.ensureValidFilename(exerciseId);

      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        return null;
      }

      // Check if file already exists and is valid
      const existingFileInfo = await FileSystem.getInfoAsync(filename);
      if (existingFileInfo.exists && existingFileInfo.size > 0) {
        // Update manifest and return existing file
        this.manifest.entries[exerciseId] = {
          path: filename,
          timestamp: this.manifest.entries[exerciseId]?.timestamp || Date.now(),
          lastAccessed: Date.now()
        };
        await this.saveManifest();

        // Update memory cache
        this.memoryCache.set(exerciseId, filename);

        return filename;
      }

      // Download with retry logic
      let localUri = null;
      let attempts = 0;
      const maxAttempts = 3; // Increased from 2 to 3

      while (attempts < maxAttempts && !localUri) {
        try {
          console.log(
            `Downloading image for exercise ${exerciseId}, attempt ${attempts + 1}`
          );
          const downloadResult = await FileSystem.downloadAsync(
            imageUrl,
            filename,
            DOWNLOAD_OPTIONS
          );

          if (downloadResult.status === 200) {
            localUri = downloadResult.uri;
            console.log(`Successfully downloaded image: ${localUri}`);
          } else {
            throw new Error(
              `Download failed with status: ${downloadResult.status}`
            );
          }
        } catch (downloadError) {
          console.error(
            `Download attempt ${attempts + 1} failed:`,
            downloadError
          );
          attempts++;

          // Add a small delay between retries
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            throw downloadError;
          }
        }
      }

      if (!localUri) {
        throw new Error('Failed to download image after retries');
      }

      const isValid = await this.validateCacheEntry(localUri);

      if (!isValid) {
        console.log(`Downloaded file validation failed, deleting: ${filename}`);
        await FileSystem.deleteAsync(filename, { idempotent: true });
        throw new Error('Downloaded file validation failed');
      }

      // Save mapping to AsyncStorage and memory cache
      const key = `${CACHE_KEY_PREFIX}${exerciseId}`;

      await AsyncStorage.setItem(key, localUri);
      this.memoryCache.set(exerciseId, localUri);

      // Update manifest
      this.manifest.entries[exerciseId] = {
        path: localUri,
        timestamp: Date.now(),
        lastAccessed: Date.now()
      };
      await this.saveManifest();

      return localUri;
    } catch (error) {
      console.error(`Failed to save image for exercise ${exerciseId}:`, error);
      return null;
    }
  }

  async getFromCache(exerciseId) {
    if (!exerciseId) {
      console.log('No exerciseId provided to getFromCache');
      return null;
    }

    try {
      // First, check memory cache (fastest)
      const memoryUri = this.memoryCache.get(exerciseId);

      if (memoryUri) {
        const isValid = await this.validateCacheEntry(memoryUri);

        if (isValid) {
          // Update last accessed time in manifest
          if (this.manifest.entries[exerciseId]) {
            this.manifest.entries[exerciseId].lastAccessed = Date.now();
            await this.saveManifest();
          }
          return memoryUri;
        } else {
          console.log(
            `Memory cache entry invalid for ${exerciseId}: ${memoryUri}`
          );
        }
      }

      // Check AsyncStorage if not in memory or invalid
      const key = `${CACHE_KEY_PREFIX}${exerciseId}`;
      const uri = await AsyncStorage.getItem(key);

      if (uri) {
        const isValid = await this.validateCacheEntry(uri);

        if (isValid) {
          this.memoryCache.set(exerciseId, uri);

          // Update last accessed time in manifest
          if (this.manifest.entries[exerciseId]) {
            this.manifest.entries[exerciseId].lastAccessed = Date.now();
            await this.saveManifest();
          } else {
            // Add to manifest if missing
            this.manifest.entries[exerciseId] = {
              path: uri,
              timestamp: Date.now(),
              lastAccessed: Date.now()
            };
            await this.saveManifest();
          }

          return uri;
        } else {
          console.log(
            `AsyncStorage cache entry invalid for ${exerciseId}: ${uri}`
          );
        }
      }

      // If we reach here, the image needs to be removed from cache
      await this.removeFromCache(exerciseId);
      return null;
    } catch (error) {
      console.error(
        `Failed to retrieve from cache for ${exerciseId}:`,
        error.message
      );
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

      // Remove from manifest
      if (this.manifest.entries[exerciseId]) {
        delete this.manifest.entries[exerciseId];
        await this.saveManifest();
      }
    } catch (error) {
      console.error(`Failed to remove ${exerciseId} from cache:`, error);
    }
  }

  async clearCache() {
    try {
      // Get list of all cached files
      const cacheFiles = Object.values(this.manifest.entries).map(
        entry => entry.path
      );

      // Delete all files
      for (const uri of cacheFiles) {
        if (uri) {
          try {
            await FileSystem.deleteAsync(uri, { idempotent: true });
          } catch (err) {
            console.error(`Failed to delete file: ${uri}`, err);
          }
        }
      }

      // Get all AsyncStorage keys
      const keys = await AsyncStorage.getAllKeys();
      const exerciseKeys = keys.filter(
        key => key.startsWith(CACHE_KEY_PREFIX) && key !== CACHE_MANIFEST_KEY
      );

      // Clear AsyncStorage entries
      await AsyncStorage.multiRemove(exerciseKeys);
      this.memoryCache.clear();

      // Reset manifest but keep version
      this.manifest = {
        version: CACHE_VERSION,
        lastFullSync: 0,
        entries: {}
      };
      await this.saveManifest();

      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  // Get cache stats for diagnostic purposes
  async getCacheStats() {
    try {
      const totalEntries = Object.keys(this.manifest.entries).length;
      let totalSize = 0;
      let oldestEntry = Date.now();
      let newestEntry = 0;

      // Calculate total size and find oldest/newest entries
      for (const entry of Object.values(this.manifest.entries)) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(entry.path);
          if (fileInfo.exists) {
            totalSize += fileInfo.size;
          }

          if (entry.timestamp < oldestEntry) {
            oldestEntry = entry.timestamp;
          }

          if (entry.timestamp > newestEntry) {
            newestEntry = entry.timestamp;
          }
        } catch (err) {
          // Skip files with errors
        }
      }

      return {
        version: this.manifest.version,
        totalEntries,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        oldestEntry: new Date(oldestEntry).toISOString(),
        newestEntry: new Date(newestEntry).toISOString(),
        lastFullSync: new Date(this.manifest.lastFullSync).toISOString()
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        error: error.message
      };
    }
  }

  // New method to preload all exercise images
  async preloadImages(exercises, onProgress) {
    if (!exercises || !Array.isArray(exercises)) {
      return { success: false, message: 'Invalid exercises data' };
    }

    try {
      const total = exercises.length;
      let successful = 0;
      let failed = 0;

      for (let i = 0; i < total; i++) {
        const exercise = exercises[i];
        const exerciseId = exercise.id || exercise.catalogExerciseId;
        const imageUrl = exercise.imageUrl;

        if (exerciseId && imageUrl) {
          try {
            const result = await this.saveToCache(exerciseId, imageUrl);
            if (result) {
              successful++;
            } else {
              failed++;
            }
          } catch (err) {
            failed++;
          }
        } else {
          failed++;
        }

        // Report progress
        if (onProgress && typeof onProgress === 'function') {
          onProgress({
            current: i + 1,
            total,
            successful,
            failed,
            percent: Math.round(((i + 1) / total) * 100)
          });
        }
      }

      // Update manifest lastFullSync
      this.manifest.lastFullSync = Date.now();
      await this.saveManifest();

      return {
        success: true,
        total,
        successful,
        failed
      };
    } catch (error) {
      console.error('Failed to preload images:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

export const imageCache = new ImageCache();
