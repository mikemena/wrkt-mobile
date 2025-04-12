export const debugApiRequest = async (apiFunction, endpoint, userId) => {
  console.log(`API Request: ${endpoint} for userId: ${userId}`);

  try {
    // Add timestamp to track how long requests take
    const startTime = Date.now();
    const response = await apiFunction(endpoint);
    const endTime = Date.now();

    console.log(`API Response succeeded in ${endTime - startTime}ms`);
    console.log('Response data:', JSON.stringify(response, null, 2));

    return response;
  } catch (error) {
    // Enhanced error logging
    console.error(`API Error for ${endpoint}:`, error);

    if (error.response) {
      // Server responded with an error status
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received from server');
    } else {
      // Error setting up the request
      console.error('Error message:', error.message);
    }

    // Rethrow the error for the component to handle
    throw error;
  }
};

// Mock data for testing when API is down
export const getMockProgressData = () => {
  return {
    monthlyCount: 12,
    weeklyWorkouts: [
      { day: 'mon', day_name: 'Mon', minutes: 30 },
      { day: 'tue', day_name: 'Tue', minutes: 45 },
      { day: 'wed', day_name: 'Wed', minutes: 60 },
      { day: 'thu', day_name: 'Thu', minutes: 0 },
      { day: 'fri', day_name: 'Fri', minutes: 75 },
      { day: 'sat', day_name: 'Sat', minutes: 90 },
      { day: 'sun', day_name: 'Sun', minutes: 30 }
    ]
  };
};

export const getMockRecordsData = () => {
  return {
    records: [
      {
        name: 'Bench Press',
        weight: 185,
        reps: 8,
        date: new Date().toISOString()
      },
      {
        name: 'Squat',
        weight: 225,
        reps: 6,
        date: new Date().toISOString()
      },
      {
        name: 'Deadlift',
        weight: 275,
        reps: 5,
        date: new Date().toISOString()
      }
    ]
  };
};

// Function to check server connection
export const checkServerConnection = async api => {
  try {
    // Try a simple endpoint that should return quickly
    await api.get('/api/health-check');
    return true;
  } catch (error) {
    console.error('Server connection check failed:', error);
    return false;
  }
};
