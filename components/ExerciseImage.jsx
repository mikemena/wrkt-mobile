import React, { useState, useEffect, useRef } from 'react';
import { View, Image, ActivityIndicator, Text, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { imageCache } from '../src/utils/imageCache';
import { api } from '../src/services/api';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';

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

  // Main image loading effect
  useEffect(() => {
    if (!exercise?.id) {
      console.log('No exercise ID provided');
      setIsLoading(false);
      return;
    }

    console.log('Exercise changed:', {
      exerciseId: exercise?.id,
      imageUrl: exercise?.imageUrl
    });

    setIsLoading(true);
    setImageError(false);
    setImageUri(null);
    retryCount.current = 0;
    loadImage();

    return () => {
      console.log('Cleaning up image component for exercise:', exercise?.id);
    };
  }, [exercise?.id, exercise?.imageUrl]);

  const verifyFileExists = async uri => {
    try {
      if (!uri) return false;
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.exists;
    } catch (error) {
      console.log('Error verifying file:', error);
      return false;
    }
  };

  const fetchImageFromApi = async () => {
    if (retryCount.current >= MAX_RETRIES) {
      console.log('Max retries reached');
      return null;
    }

    try {
      console.log('Fetching from API for exercise:', exercise.id);
      const { imageUrl } = await api.get(
        `/api/exercise-catalog/${exercise.id}/image`
      );
      console.log('API returned imageUrl:', imageUrl);
      if (imageUrl && isMounted.current) {
        const localUri = await imageCache.saveToCache(exercise.id, imageUrl);
        const exists = await verifyFileExists(localUri);
        console.log('Saved API result to cache:', localUri, 'Exists:', exists);
        return exists ? localUri : null;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch image from API:', error);
      return null;
    }
  };

  const loadImage = async () => {
    if (!exercise?.id) return;

    try {
      console.log('Starting image load for exercise:', exercise.id);
      setIsLoading(true);
      setImageError(false);

      // Try to get from cache first
      let uri = await imageCache.getFromCache(exercise.id);
      console.log('Cache result:', uri);

      // Verify the cached file exists
      const cacheExists = await verifyFileExists(uri);
      if (!cacheExists) {
        console.log('Cached file does not exist or is invalid');
        uri = null;
      }

      // If not in cache or cache invalid, try the provided URL
      if (!uri && exercise.imageUrl) {
        console.log('Trying to cache image URL:', exercise.imageUrl);
        uri = await imageCache.saveToCache(exercise.id, exercise.imageUrl);
        const exists = await verifyFileExists(uri);
        if (!exists) uri = null;
      }

      // If still no image, fetch from API
      if (!uri) {
        console.log('No cached image or URL, fetching from API');
        uri = await fetchImageFromApi();
      }

      if (uri && isMounted.current) {
        console.log('Setting image URI:', uri);
        setImageUri(uri);
        setIsLoading(false);
      } else {
        console.log('No valid URI obtained');
        throw new Error('Failed to load image');
      }
    } catch (error) {
      console.error('Image load error:', error);
      if (isMounted.current) {
        setImageError(true);
        setIsLoading(false);
      }
    }
  };

  const handleImageError = async () => {
    if (!isMounted.current) return;

    retryCount.current += 1;
    if (retryCount.current < MAX_RETRIES) {
      await loadImage();
    } else {
      setImageError(true);
      setIsLoading(false);
    }
  };

  const imageOverlayStyle = showOverlay
    ? {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: `rgba(0,0,0,${themedStyles.overlayOpacity})`,
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
            Unable to load image
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
