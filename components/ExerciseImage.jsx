import React, { useState, useEffect, useRef } from 'react';
import { View, Image, ActivityIndicator, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';

// R2 configuration
const R2_CONFIG = {
  region: 'auto',
  endpoint: 'https://pub-510e01a4de414aa79526e42373110829.r2.dev',
  credentials: {
    // IMPORTANT: These should be stored securely, ideally using environment variables
    // or a secure storage mechanism. For development purposes only!
    accessKeyId: '140c882768e81c08c6afd2d1004ab296',
    secretAccessKey:
      'f5ef273c4096aaa1ca9b7e7fb484a3a6fbeb913ec2f1ca7662264e469fd13ed0'
  },
  forcePathStyle: true
};

// Cache TTL in milliseconds (1 hour)
const CACHE_TTL = 3600 * 1000;

// Initialize S3 client for R2
const s3Client = new S3Client(R2_CONFIG);

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

  // Generate a direct URL (without pre-signed URL)
  const generateDirectUrl = imageName => {
    // Just return the direct URL to the image on Cloudflare R2
    return `https://pub-510e01a4de414aa79526e42373110829.r2.dev/${imageName}`;
  };

  // Generate a pre-signed URL for R2
  const generatePresignedUrl = async imageName => {
    try {
      // Log the image name for debugging
      console.log('Generating presigned URL for image name:', imageName);

      // Important: Use the filename directly as the Key, NOT in an 'images/' subfolder
      const command = new GetObjectCommand({
        Bucket: 'wrkt-images',
        Key: imageName, // Use the image name directly, not in a subfolder
        ResponseContentType: 'image/gif',
        ResponseCacheControl: 'public, max-age=86400'
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      console.log('Generated presigned URL:', url);
      return url;
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw error;
    }
  };

  // Extract image name from exercise
  const getImageName = () => {
    if (!exercise) return null;

    // If we have an image name, use it
    if (exercise.image_name) {
      console.log('Found image_name:', exercise.image_name);
      return exercise.image_name;
    }

    // Fallback to imageUrl if available
    if (exercise.imageUrl) {
      console.log('Using imageUrl as fallback:', exercise.imageUrl);
      return exercise.imageUrl;
    }

    console.log('No image name found for exercise:', exercise.id);
    return null;
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadImage = async () => {
    if (!isMounted.current) return;

    setIsLoading(true);
    setImageError(false);
    setErrorMessage('');

    try {
      // Get image name
      const imageName = getImageName();
      console.log('Loading image with name:', imageName);

      if (!imageName) {
        throw new Error('No image available');
      }

      // For testing: try using direct URL approach first
      const directUrl = generateDirectUrl(imageName);
      console.log('Using direct URL:', directUrl);

      if (isMounted.current) {
        setImageUri(directUrl);
        setIsLoading(false);
      }

      // Skip the presigned URL approach since we're trying direct URLs
      /*
      // Try to get from AsyncStorage cache first
      const cacheKey = `presigned_url_${imageName}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);

      if (cachedData) {
        const { url, timestamp } = JSON.parse(cachedData);
        // Check if the URL is still valid (not expired)
        if (timestamp + CACHE_TTL > Date.now()) {
          setImageUri(url);
          setIsLoading(false);
          return;
        }
      }

      // Generate a new pre-signed URL
      const presignedUrl = await generatePresignedUrl(imageName);

      // Save to cache
      await AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({
          url: presignedUrl,
          timestamp: Date.now()
        })
      );

      if (isMounted.current) {
        setImageUri(presignedUrl);
        setIsLoading(false);
      }
      */
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
    if (!exercise) return;
    loadImage();
  }, [exercise]);

  // Improved error handling for the handleImageError function
  const handleImageError = async error => {
    if (!isMounted.current) return;

    console.error('Image loading error:', {
      exerciseId: exercise?.id,
      imageName: getImageName(),
      imageUri,
      error: error?.nativeEvent?.error || 'Unknown error'
    });

    retryCount.current += 1;

    if (retryCount.current < MAX_RETRIES) {
      // Clear cache for this image
      const imageName = getImageName();
      if (imageName) {
        await AsyncStorage.removeItem(`presigned_url_${imageName}`);
      }

      // Reset states and force a new URL generation
      setIsLoading(true);
      setImageError(false);
      setImageUri(null);

      // Small delay before retrying
      setTimeout(() => {
        loadImage(); // Call loadImage again (make sure loadImage is extracted to a named function)
      }, 500);
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
          onLoad={() => console.log('Image loaded successfully:', imageUri)}
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
