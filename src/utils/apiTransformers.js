// This function converts snake_case backend data to camelCase for frontend use
export const transformResponseData = data => {
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => transformResponseData(item));
  }

  // Handle null or non-object values
  if (data === null || typeof data !== 'object') {
    return data;
  }

  // Transform each property in the object
  return Object.keys(data).reduce((camelCase, snake_case) => {
    // Convert specific known fields that need special handling
    if (snake_case === 'catalog_exercise_id') {
      camelCase['catalogExerciseId'] = data[snake_case];
      return camelCase;
    }

    // Handle all other fields
    const camelKey = snake_case.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase()
    );
    camelCase[camelKey] = transformResponseData(data[snake_case]);
    return camelCase;
  }, {});
};

// This function converts camelCase frontend data to snake_case for backend requests
export const transformRequestData = data => {
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => transformRequestData(item));
  }

  // Handle null or non-object values
  if (data === null || typeof data !== 'object') {
    return data;
  }

  // Transform each property in the object
  return Object.keys(data).reduce((snake_case, camelCase) => {
    // Convert specific known fields that need special handling
    if (camelCase === 'catalogExerciseId') {
      snake_case['catalog_exercise_id'] = data[camelCase];
      return snake_case;
    }

    // Handle all other fields
    const snakeKey = camelCase.replace(
      /[A-Z]/g,
      letter => `_${letter.toLowerCase()}`
    );
    snake_case[snakeKey] = transformRequestData(data[camelCase]);
    return snake_case;
  }, {});
};
