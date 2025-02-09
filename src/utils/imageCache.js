export const IMAGE_CACHE = new Map();

export const cacheImage = (exerciseId, imageUrl) => {
  if (!exerciseId || !imageUrl) {
    return false;
  }

  if (!IMAGE_CACHE.has(exerciseId)) {
    IMAGE_CACHE.set(exerciseId, imageUrl);
    return true;
  }
  return false;
};

export const getCachedImage = exerciseId => {
  if (!exerciseId) {
    return null;
  }

  const cachedUrl = IMAGE_CACHE.get(exerciseId);
  // if (cachedUrl) {
  //   console.log(`[Cache] HIT: Found cached image for exercise ${exerciseId}`);
  // } else {
  //   console.log(`[Cache] MISS: No cached image for exercise ${exerciseId}`);
  // }
  return cachedUrl;
};

export const debugCache = () => {
  IMAGE_CACHE.forEach((url, id) => {
    console.log(`Exercise ${id}: ${url.substring(0, 50)}...`);
  });
  console.log('\n');
};
