import React, { useState, useEffect, useRef } from "react";
import { View, Image, ActivityIndicator, Text, StyleSheet } from "react-native";
import * as FileSystem from "expo-file-system";
import { imageCache } from "../src/utils/imageCache";
import { api } from "../src/services/api";
import { useTheme } from "../src/hooks/useTheme";
import { getThemedStyles } from "../src/utils/themeUtils";

const ExerciseImage = ({
  exercise,
  style,
  resizeMode = "cover",
  showError = true,
  imageStyle = {},
  showOverlay = false,
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
    themeState.accentColor,
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
    if (!exercise?.catalog_exercise_id) {
      console.log("No exercise ID provided");
      setIsLoading(false);
      return;
    }

    // Check which ID to use (either catalog_exercise_id or catalogExerciseId or just id)
    const exerciseId =
      exercise?.catalog_exercise_id ||
      exercise?.catalogExerciseId ||
      exercise?.id;

    if (!exerciseId) {
      console.log("❌ No valid exercise ID provided");
      setIsLoading(false);
      setImageError(true);
      return;
    }

    setIsLoading(true);
    setImageError(false);
    setImageUri(null);
    retryCount.current = 0;
    loadImage();
  }, [exercise?.catalog_exercise_id, exercise?.imageUrl]);

  const verifyFileExists = async (uri) => {
    try {
      if (!uri) {
        console.log("❌ Cannot verify null or undefined uri");
        return false;
      }

      const fileInfo = await FileSystem.getInfoAsync(uri);

      return fileInfo.exists && fileInfo.size > 0;
    } catch (error) {
      console.log(`❌ Error verifying file: ${error.message}`);
      return false;
    }
  };

  const fetchImageFromApi = async () => {
    if (retryCount.current >= MAX_RETRIES) {
      // console.log('Max retries reached');
      return null;
    }

    try {
      const { imageUrl } = await api.get(
        `/api/exercise-catalog/${exercise.catalog_exercise_id}/image`,
      );
      if (imageUrl && isMounted.current) {
        const localUri = await imageCache.saveToCache(
          exercise.catalog_exercise_id,
          imageUrl,
        );
        const exists = await verifyFileExists(localUri);
        return exists ? localUri : null;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch image from API:", error);
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
      console.log("Cannot load image without valid exercise ID");
      return;
    }

    try {
      setIsLoading(true);
      setImageError(false);

      // Try to get from cache first
      let uri = await imageCache.getFromCache(exerciseId);

      // Verify the cached file exists
      if (uri) {
        const cacheExists = await verifyFileExists(uri);
        if (!cacheExists) {
          console.log("❌ Cached file does not exist or is invalid");
          uri = null;
        } else {
          console.log("Valid cached image found");
        }
      }

      // If not in cache or cache invalid, try the provided URL
      if (!uri && exercise.imageUrl) {
        uri = await imageCache.saveToCache(exerciseId, exercise.imageUrl);

        const exists = await verifyFileExists(uri);

        if (!exists) {
          console.log("❌ Failed to download from provided URL");
          uri = null;
        }
      }

      // If still no image, fetch from API
      if (!uri) {
        console.log("🔄 No cached image or URL, fetching from API");
        uri = await fetchImageFromApi();
      }

      if (uri && isMounted.current) {
        console.log(`✅ Setting image URI: ${uri}`);
        setImageUri(uri);
        setIsLoading(false);
      } else {
        console.log("❌ No valid URI obtained");
        throw new Error("Failed to load image");
      }
    } catch (error) {
      console.error(`❌ Image load error: ${error.message}`, error);
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
        zIndex: 1,
      }
    : null;

  return (
    <View
      style={[
        styles.container,
        style,
        { backgroundColor: themedStyles.secondaryBackgroundColor },
      ]}
    >
      {showOverlay && <View style={imageOverlayStyle} />}

      {isLoading && !imageError && (
        <ActivityIndicator
          style={styles.loadingIndicator}
          color={themedStyles.accentColor}
          size="small"
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
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "transparent",
    borderRadius: 5,
  },
  loadingIndicator: {
    position: "absolute",
    zIndex: 2,
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 5,
    zIndex: 2,
  },
  errorText: {
    fontSize: 12,
    textAlign: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "white",
  },
});

export default ExerciseImage;
