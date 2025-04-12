import React, { useState, useEffect, useRef } from 'react';
import { View, Image, ActivityIndicator, Text, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { imageCache } from '../src/utils/imageCache';
import { api } from '../src/services/api';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';

// Enhanced debug logging function
const logDebug = async (component, message, data = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    component,
    message,
    data: JSON.stringify(data)
  };

  console.log(`[${component}] ${message}`, data);

  // In production, save logs to AsyncStorage for later retrieval
  if (!__DEV__) {
    try {
      // Get existing logs
      const existingLogsString = await AsyncStorage.getItem('imageDebugLogs');
      const existingLogs = existingLogsString
        ? JSON.parse(existingLogsString)
        : [];

      // Add new log entry and limit to most recent 50 logs
      const updatedLogs = [logEntry, ...existingLogs].slice(0, 50);

      // Save back to AsyncStorage
      await AsyncStorage.getItem('imageDebugLogs', JSON.stringify(updatedLogs));
    } catch (error) {
      console.error('Failed to save debug log:', error);
    }
  }
};

// Function to expose logs in TestFlight
export const getDebugLogs = async () => {
  try {
    const logsString = await AsyncStorage.getItem('imageDebugLogs');
    return logsString ? JSON.parse(logsString) : [];
  } catch (error) {
    console.error('Failed to retrieve debug logs:', error);
    return [];
  }
};

// Function to clear logs
export const clearDebugLogs = async () => {
  try {
    await AsyncStorage.setItem('imageDebugLogs', JSON.stringify([]));
    return true;
  } catch (error) {
    console.error('Failed to clear debug logs:', error);
    return false;
  }
};

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
  const loadAttempted = useRef(false);
  const isTestFlight = !__DEV__;

  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );

  // Cleanup function
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  //Debug logging helper
  const logDebug = (message, data = {}) => {
    if (__DEV__) {
      console.log(`[ExerciseImage] ${message}`, data);
    } else {
      console.warn(`[ExerciseImage] ${message}`, JSON.stringify(data));
    }
  };

  // Main image loading effect
  useEffect(() => {
    // Reset state for new exercise data
    if (!loadAttempted.current || exercise?.id !== imageUri?.exerciseId) {
      setIsLoading(true);
      setImageError(false);
      setImageUri(null);
      setErrorMessage('');
      retryCount.current = 0;
      loadAttempted.current = true;

      // Determine which ID to use
      const exerciseId =
        exercise?.catalog_exercise_id ||
        exercise?.catalogExerciseId ||
        exercise?.id;

      if (!exerciseId) {
        const errorMsg = 'No valid exercise ID provided';
        logDebug(errorMsg, { exercise });
        setIsLoading(false);
        setImageError(true);
        setErrorMessage(errorMsg);
        return;
      }

      logDebug('Loading image for exercise', {
        exerciseId,
        hasImageUrl: !!exercise?.imageUrl,
        isTestFlight
      });

      loadImage();
    }
  }, [
    exercise?.catalog_exercise_id,
    exercise?.catalogExerciseId,
    exercise?.id,
    exercise?.imageUrl
  ]);

  const verifyFileExists = async uri => {
    try {
      if (!uri) {
        logDebug('Cannot verify null or undefined uri');
        return false;
      }

      logDebug('Verifying file exists', { uri });
      const fileInfo = await FileSystem.getInfoAsync(uri);
      logDebug('File info result', fileInfo);

      return fileInfo.exists && fileInfo.size > 0;
    } catch (error) {
      logDebug(`Error verifying file: ${error.message}`, { uri });
      return false;
    }
  };

  const fetchImageFromApi = async () => {
    if (retryCount.current >= MAX_RETRIES) {
      logDebug('Max retries reached for API fetch');
      return null;
    }

    try {
      const exerciseId =
        exercise?.catalog_exercise_id ||
        exercise?.catalogExerciseId ||
        exercise?.id;

      if (!exerciseId) {
        logDebug('No valid exercise ID for API fetch');
        return null;
      }

      logDebug('Fetching image from API', { exerciseId });

      // Make the API call with proper error handling
      const response = await api
        .get(`/api/exercise-catalog/${exerciseId}/image`)
        .catch(err => {
          logDebug('API fetch error', {
            error: err?.message || 'Unknown error'
          });
          return null;
        });

      if (!response) {
        logDebug('No response from API');
        return null;
      }

      const { imageUrl } = response;

      if (!imageUrl) {
        logDebug('No imageUrl in API response', { response });
        return null;
      }

      logDebug('Got imageUrl from API', { imageUrl });

      if (imageUrl && isMounted.current) {
        try {
          const localUri = await imageCache.saveToCache(exerciseId, imageUrl);
          logDebug('Saved image to cache', { localUri });

          const exists = await verifyFileExists(localUri);
          logDebug('Cache file exists check', { exists });

          return exists ? localUri : null;
        } catch (cacheError) {
          logDebug('Error saving to cache', { error: cacheError?.message });
          // If caching fails, return the direct URL as fallback
          return imageUrl;
        }
      }
      return null;
    } catch (error) {
      logDebug('Failed to fetch image from API', { error: error?.message });
      return null;
    }
  };

  const loadImage = async () => {
    // Get the correct exercise ID
    const exerciseId =
      exercise?.catalog_exercise_id ||
      exercise?.catalogExerciseId ||
      exercise?.id;

    if (!exerciseId) {
      logDebug('Cannot load image without valid exercise ID');
      setErrorMessage('Missing exercise ID');
      setImageError(true);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setImageError(false);

      // Try direct URL first if available (fastest path)
      if (isTestFlight && exercise.imageUrl) {
        logDebug('TestFlight: Using direct imageUrl', {
          url: exercise.imageUrl
        });
        setImageUri(exercise.imageUrl);
        setIsLoading(false);
        return;
      }

      // Try direct URL first if available (fastest path)
      if (exercise.imageUrl) {
        logDebug('Using direct imageUrl', { url: exercise.imageUrl });

        // Don't limit this path to TestFlight only
        setImageUri(exercise.imageUrl);
        setIsLoading(false);
        return;
      }

      // Try to get from cache
      let uri;
      try {
        uri = await imageCache.getFromCache(exerciseId);
        logDebug('Cache lookup result', { uri });

        // Verify the cached file exists
        if (uri) {
          const cacheExists = await verifyFileExists(uri);
          if (!cacheExists) {
            logDebug('Cached file does not exist or is invalid');
            uri = null;
          } else {
            logDebug('Valid cached image found');
          }
        }
      } catch (cacheError) {
        logDebug('Cache error', { error: cacheError?.message });
        uri = null;
      }

      // If not in cache or cache invalid, try the provided URL
      if (!uri && exercise.imageUrl) {
        logDebug('Saving URL to cache', { url: exercise.imageUrl });
        try {
          uri = await imageCache.saveToCache(exerciseId, exercise.imageUrl);
          logDebug('Save to cache result', { uri });

          const exists = await verifyFileExists(uri);
          logDebug('Saved file exists check', { exists });

          if (!exists) {
            logDebug('Failed to download from provided URL');
            // If saving to cache fails, use direct URL as fallback
            setImageUri(exercise.imageUrl);
            setIsLoading(false);
            return;
          }
        } catch (saveError) {
          logDebug('Error saving to cache', { error: saveError?.message });
          // If saving to cache fails, use direct URL as fallback
          if (exercise.imageUrl) {
            setImageUri(exercise.imageUrl);
            setIsLoading(false);
            return;
          }
          uri = null;
        }
      }

      // If still no image, fetch from API
      if (!uri) {
        logDebug('No cached image or URL, fetching from API');
        uri = await fetchImageFromApi();
      }

      if (uri && isMounted.current) {
        logDebug('Setting image URI', { uri });
        setImageUri(uri);
        setIsLoading(false);
      } else {
        logDebug('No valid URI obtained');
        // Final fallback - use direct URL in production if available
        if (exercise.imageUrl) {
          setImageUri(exercise.imageUrl);
          setIsLoading(false);
          return;
        }

        throw new Error('Failed to load image');
      }
    } catch (error) {
      logDebug('Image load error', { error: error?.message });
      if (isMounted.current) {
        setErrorMessage(error?.message || 'Image load failed');
        setImageError(true);
        setIsLoading(false);
      }
    }
  };

  const handleImageError = async () => {
    if (!isMounted.current) return;

    logDebug('Image error occurred', {
      retryCount: retryCount.current,
      uri: imageUri
    });
    retryCount.current += 1;

    // For production builds, try direct URL as final fallback
    if (
      isTestFlight &&
      exercise.imageUrl &&
      retryCount.current >= MAX_RETRIES
    ) {
      logDebug('Falling back to direct URL after error');
      setImageUri(exercise.imageUrl);
      return;
    }

    if (retryCount.current < MAX_RETRIES) {
      await loadImage();
    } else {
      setImageError(true);
      setIsLoading(false);
      setErrorMessage('Failed after multiple attempts');
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
