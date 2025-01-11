export const IMAGE_CACHE = new Map();

export const cacheImage = (exerciseId, imageUrl) => {
  if (!exerciseId || !imageUrl) {
    console.warn('[Cache] Invalid exerciseId or imageUrl');
    return false;
  }

  if (!IMAGE_CACHE.has(exerciseId)) {
    IMAGE_CACHE.set(exerciseId, imageUrl);
    console.log(`[Cache] Added image for exercise ${exerciseId}`);
    console.log(`[Cache] Current cache size: ${IMAGE_CACHE.size} images`);
    return true;
  }
  return false;
};

export const getCachedImage = exerciseId => {
  if (!exerciseId) {
    console.warn('[Cache] Invalid exerciseId');
    return null;
  }

  const cachedUrl = IMAGE_CACHE.get(exerciseId);
  if (cachedUrl) {
    console.log(`[Cache] HIT: Found cached image for exercise ${exerciseId}`);
  } else {
    console.log(`[Cache] MISS: No cached image for exercise ${exerciseId}`);
  }
  return cachedUrl;
};

export const debugCache = () => {
  console.log('\n[Cache] Current contents:');
  console.log(`Total items: ${IMAGE_CACHE.size}`);
  IMAGE_CACHE.forEach((url, id) => {
    console.log(`Exercise ${id}: ${url.substring(0, 50)}...`);
  });
  console.log('\n');
};
