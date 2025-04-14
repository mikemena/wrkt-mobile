import React, { useState, useEffect, useRef } from 'react';
import { View, Image, ActivityIndicator, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import Constants from 'expo-constants';

// Get API URL from app config
const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  'https://wrkt-backend-development.up.railway.app';

// Enhanced debug logging function
const logDebug = (message, data = {}) => {
  const component = 'ExerciseImage';

  // In TestFlight/production, save logs to AsyncStorage for later retrieval
  if (!__DEV__) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        component,
        message,
        data: JSON.stringify(data)
      };

      AsyncStorage.getItem('imageDebugLogs')
        .then(existingLogsString => {
          const existingLogs = existingLogsString
            ? JSON.parse(existingLogsString)
            : [];
          const updatedLogs = [logEntry, ...existingLogs].slice(0, 100);
          AsyncStorage.setItem('imageDebugLogs', JSON.stringify(updatedLogs));
        })
        .catch(err => console.error('Failed to save debug log:', err));
    } catch (error) {
      console.error('Failed to save debug log:', error);
    }
  }
};

// Helper function to extract image name from a URL
const getImageNameFromUrl = url => {
  if (!url) return null;

  try {
    // Try to extract the filename from the URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const matches = pathname.match(/\/([^/]+)$/);
    return matches ? matches[1] : null;
  } catch (error) {
    // If URL parsing fails, try a simpler approach
    const parts = url.split('/');
    return parts[parts.length - 1].split('?')[0];
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

  // Creates a proxied URL for an image
  const createProxiedUrl = imageUrl => {
    if (!imageUrl) return null;

    // Extract the image filename from the URL
    const imageName = getImageNameFromUrl(imageUrl);
    if (!imageName) {
      logDebug('Could not extract image name from URL', { imageUrl });
      return null;
    }

    return `${API_URL}/api/exercise-images/${imageName}`;
  };

  // Main image loading effect
  useEffect(() => {
    if (!exercise) return;

    const loadImage = async () => {
      setIsLoading(true);
      setImageError(false);
      setErrorMessage('');

      try {
        // Get the correct exercise ID
        const exerciseId =
          exercise.catalog_exercise_id ||
          exercise.catalogExerciseId ||
          exercise.id;

        if (!exerciseId) {
          throw new Error('No valid exercise ID provided');
        }

        // If we have an imageUrl, create a proxied URL
        if (exercise.imageUrl) {
          const proxiedUrl = createProxiedUrl(exercise.imageUrl);

          if (proxiedUrl) {
            setImageUri(proxiedUrl);
            setIsLoading(false);
            return;
          } else {
            setImageUri(exercise.imageUrl);
            setIsLoading(false);
            return;
          }
        } else {
          throw new Error('No image URL available');
        }
      } catch (error) {
        logDebug('Error loading image', { error: error.message });
        if (isMounted.current) {
          setErrorMessage(error.message || 'Image load failed');
          setImageError(true);
          setIsLoading(false);
        }
      }
    };

    loadImage();
  }, [exercise]);

  const handleImageError = () => {
    if (!isMounted.current) return;

    retryCount.current += 1;
    logDebug('Image error occurred', {
      retryCount: retryCount.current,
      uri: imageUri
    });

    if (retryCount.current < MAX_RETRIES) {
      // If using a proxied URL and it failed, try the direct URL
      if (
        imageUri &&
        imageUri.includes('/api/exercise-images/') &&
        exercise?.imageUrl
      ) {
        setImageUri(exercise.imageUrl);
      }
    } else {
      setImageError(true);
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
          onLoad={() =>
            logDebug('Image loaded successfully', { uri: imageUri })
          }
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
