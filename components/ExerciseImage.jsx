import React, { useState, useEffect, useRef } from 'react';
import { View, Image, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import * as FileSystem from 'expo-file-system';

// Configuration
const IMAGE_CACHE_DIR = `${FileSystem.cacheDirectory}exercise-images/`;
// Increase cache TTL to 7 days
const CACHE_TTL = 7 * 24 * 3600 * 1000;
// Keep track of cached image URIs in memory to avoid file system checks
const inMemoryCache = new Map();

const ExerciseImage = ({
  exercise,
  style,
  resizeMode = 'cover',
  showError = true,
  imageStyle = {},
  showOverlay = false
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const isMounted = useRef(true);
  const retryCount = useRef(0);
  const MAX_RETRIES = 2;

  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );

  const ensureCacheDirectoryExists = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(IMAGE_CACHE_DIR, {
          intermediates: true
        });
      }
    } catch (error) {
      console.error('Error creating cache directory:', error);
    }
  };

  const generateDirectUrl = imageName => {
    return `https://pub-510e01a4de414aa79526e42373110829.r2.dev/${imageName}`;
  };

  const getImageName = () => {
    if (!exercise) return null;
    if (exercise.image_name) return exercise.image_name;
    if (exercise.imageUrl) return exercise.imageUrl;
    console.log('No image name found for exercise:', exercise.id);
    return null;
  };

  // Generate a unique cache key for this image
  const getCacheKey = () => {
    const imageName = getImageName();
    if (!imageName) return null;
    return `exercise_image_${imageName}`;
  };

  const loadImage = async () => {
    if (!isMounted.current) return;

    setIsLoading(true);
    setImageError(false);
    setErrorMessage('');

    try {
      const imageName = getImageName();
      if (!imageName) {
        throw new Error('No image available');
      }

      const cacheKey = getCacheKey();

      // Check in-memory cache first
      if (cacheKey && inMemoryCache.has(cacheKey)) {
        const cachedUri = inMemoryCache.get(cacheKey);
        // Verify the file still exists
        const fileInfo = await FileSystem.getInfoAsync(cachedUri);
        if (fileInfo.exists) {
          if (isMounted.current) {
            setImageUri(cachedUri);
            // Immediately set loading to false when using cached image
            setIsLoading(false);
          }
          return;
        } else {
          // File doesn't exist anymore, remove from memory cache
          inMemoryCache.delete(cacheKey);
        }
      }

      // Ensure cache directory exists
      await ensureCacheDirectoryExists();

      // Local cache path
      const cacheFileName = imageName.replace(/[/\\?%*:|"<>]/g, '_');
      const localFilePath = `${IMAGE_CACHE_DIR}${cacheFileName}`;

      // Check if file exists in cache
      const fileInfo = await FileSystem.getInfoAsync(localFilePath);

      if (fileInfo.exists) {
        // Check if cache is still valid
        const cacheMetadataPath = `${localFilePath}.meta`;
        try {
          const metadataStr =
            await FileSystem.readAsStringAsync(cacheMetadataPath);
          const metadata = JSON.parse(metadataStr);

          if (metadata.timestamp + CACHE_TTL > Date.now()) {
            // Use cached file and store in memory cache
            if (isMounted.current) {
              if (cacheKey) {
                inMemoryCache.set(cacheKey, fileInfo.uri);
              }
              setImageUri(fileInfo.uri);
              // Immediately set loading to false when using cached image
              setIsLoading(false);
            }
            return;
          }
        } catch (e) {
          // Metadata doesn't exist or is invalid, continue to download
          console.log('Cache metadata invalid, downloading fresh image');
        }
      }

      // Download the image
      const imageUrl = generateDirectUrl(imageName);

      // Download file to cache
      const downloadResult = await FileSystem.downloadAsync(
        imageUrl,
        localFilePath
      );

      if (downloadResult.status === 200) {
        // Save metadata
        const metadata = {
          timestamp: Date.now(),
          url: imageUrl
        };
        await FileSystem.writeAsStringAsync(
          `${localFilePath}.meta`,
          JSON.stringify(metadata)
        );

        if (isMounted.current) {
          if (cacheKey) {
            inMemoryCache.set(cacheKey, downloadResult.uri);
          }
          setImageUri(downloadResult.uri);
          // Don't set loading to false here - let onLoad handle it
        }
      } else {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }
    } catch (error) {
      console.error('Error loading image:', error);

      if (isMounted.current) {
        setErrorMessage(error.message || 'Failed to load image');
        setImageError(true);
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!exercise) return;
    loadImage();
  }, [exercise]);

  const handleImageError = async error => {
    if (!isMounted.current) return;

    console.error(
      'Image loading error:',
      error?.nativeEvent?.error || 'Unknown error'
    );

    retryCount.current += 1;

    if (retryCount.current < MAX_RETRIES) {
      // Clear cache for this image
      const cacheKey = getCacheKey();
      if (cacheKey) {
        inMemoryCache.delete(cacheKey);
      }

      // Reset states and force a new URL generation
      setIsLoading(true);
      setImageError(false);
      setImageUri(null);

      // Small delay before retrying
      setTimeout(() => {
        loadImage();
      }, 500);
    } else {
      setImageError(true);
      setErrorMessage('Failed after multiple attempts');
      setIsLoading(false);
    }
  };

  const handleImageLoad = () => {
    if (isMounted.current) {
      setIsLoading(false);
    }
  };

  const imageOverlayStyle = showOverlay
    ? {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: `rgba(0,0,0,${themedStyles.overlayOpacity || 0.3})`,
        zIndex: 1
      }
    : null;

  return (
    <View
      style={[
        styles.container,
        style,
        { backgroundColor: themedStyles.secondaryBackgroundColor }
      ]}
    >
      {showOverlay && <View style={imageOverlayStyle} />}

      {isLoading && !imageError && (
        <ActivityIndicator
          style={styles.loadingIndicator}
          color={themedStyles.accentColor}
          size='small'
        />
      )}

      {imageError && showError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: themedStyles.textColor }]}>
            {errorMessage || 'Unable to load image'}
          </Text>
        </View>
      ) : null}

      {imageUri && !imageError ? (
        <Image
          source={{ uri: imageUri }}
          style={[styles.image, imageStyle]}
          onError={handleImageError}
          onLoad={handleImageLoad}
          onLoadEnd={() => {
            // Fallback in case onLoad doesn't fire
            if (isMounted.current && isLoading) {
              setIsLoading(false);
            }
          }}
          resizeMode={resizeMode}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderRadius: 5
  },
  loadingIndicator: {
    position: 'absolute',
    zIndex: 2
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    zIndex: 2
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center'
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white'
  }
});

export default ExerciseImage;
