import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { config } from '../src/utils/config';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import { cacheImage, getCachedImage } from '../src/utils/imageCache';

const ExerciseImage = ({ exercise }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );
  const isMounted = useRef(true);
  const retryCount = useRef(0);
  const MAX_RETRIES = 2;

  const refreshImageUrl = async () => {
    if (retryCount.current >= MAX_RETRIES) {
      return null;
    }

    try {
      const response = await fetch(
        `${config.apiUrl}/api/exercise-catalog/${exercise.id}/image`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.imageUrl && isMounted.current) {
        cacheImage(exercise.id, data.imageUrl);
        return data.imageUrl;
      }
      return null;
    } catch (error) {
      console.error('URL refresh error:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadImage = async () => {
      if (!exercise?.id) return;

      // First try cached image
      const cachedUrl = getCachedImage(exercise.id);
      if (cachedUrl) {
        setImageUrl(cachedUrl);
        setIsLoading(false);
        return;
      }

      // Then try provided URL
      if (exercise.imageUrl) {
        setImageUrl(exercise.imageUrl);
        setIsLoading(true);
        return;
      }

      // Finally try refreshing from API
      const newUrl = await refreshImageUrl();
      if (newUrl && isMounted.current) {
        setImageUrl(newUrl);
        setIsLoading(true);
      } else {
        setImageError(true);
        setIsLoading(false);
      }
    };

    loadImage();
  }, [exercise?.id, exercise?.imageUrl]);

  const handleImageError = useCallback(async () => {
    if (!isMounted.current) return;

    retryCount.current += 1;

    try {
      const newUrl = await refreshImageUrl();

      if (newUrl && isMounted.current) {
        setImageUrl(newUrl);
        setIsLoading(true);
        setImageError(false);
        return;
      }
    } catch (error) {
      console.error('Refresh attempt failed:', error);
    }

    if (isMounted.current) {
      setImageError(true);
      setIsLoading(false);
    }
  }, [exercise]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      retryCount.current = 0;
    };
  }, []);

  const handleLoadStart = () => {
    if (isMounted.current) {
      setIsLoading(true);
      setImageError(false);
    }
  };

  const handleLoadSuccess = () => {
    if (isMounted.current) {
      setIsLoading(false);
      setImageError(false);
      retryCount.current = 0;
    }
  };

  const imageOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `rgba(0,0,0,${themedStyles.overlayOpacity})`,
    zIndex: 1
  };

  return (
    <View
      style={[
        styles.imageContainer,
        { backgroundColor: themedStyles.secondaryBackgroundColor }
      ]}
    >
      <View style={imageOverlayStyle} />
      {isLoading && !imageError && (
        <ActivityIndicator
          style={styles.loadingIndicator}
          color={themedStyles.accentColor}
          size='small'
        />
      )}
      {imageError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: themedStyles.textColor }]}>
            Unable to load image
          </Text>
        </View>
      ) : imageUrl ? (
        <Image
          source={{
            uri: imageUrl,
            headers: {
              'Cache-Control': 'max-age=86400'
            }
          }}
          style={styles.exerciseImage}
          onLoadStart={handleLoadStart}
          onLoad={handleLoadSuccess}
          onError={handleImageError}
          resizeMode='cover'
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
    borderRadius: 5
  },
  loadingIndicator: {
    position: 'absolute'
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%'
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
    padding: 5
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
    borderRadius: 5
  }
});

export default ExerciseImage;
