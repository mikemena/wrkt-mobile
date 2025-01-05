import Config from 'react-native-config';
const { API_URL } = Config;
import {
  transformRequestData,
  transformResponseData
} from '../utils/apiTransformers';

let userId = null;

export const setUser = id => {
  userId = id;
};

export const getPrograms = async userId => {
  if (!userId) return [];
  try {
    const response = await fetch(`${API_URL}/api/users/${userId}/programs`);
    if (response.status === 404) return [];
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    return transformResponseData(data);
  } catch (error) {
    console.error('Error fetching programs:', error);
    return [];
  }
};

export const getActiveProgram = async userId => {
  if (!userId) return null;
  try {
    const response = await fetch(
      `${API_URL}/api/active-program/user/${userId}`
    );
    if (response.status === 404) return null;
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    return data ? { activeProgram: data } : null;
  } catch (error) {
    console.error('Error fetching active program:', error);
    return null;
  }
};

export const getProgram = async programId => {
  try {
    const response = await fetch(`${API_URL}/api/programs/${programId}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      throw new Error(`Server responded with ${response.status}: ${errorText}`);
    }

    const rawData = await response.json();

    const transformedData = transformResponseData(rawData);

    return transformedData;
  } catch (error) {
    console.error('Error api.js getProgram fetching active program:', error);
    throw error;
  }
};

export const createActiveProgram = async programData => {
  if (!programData?.userId || !programData?.programId) {
    throw new Error('Both userId and programId are required');
  }

  const backendData = transformRequestData({
    userId: programData.userId,
    programId: programData.programId
  });

  const response = await fetch(`${API_URL}/api/active-program`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(backendData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Server responded with ${response.status}: ${errorText}`);
  }

  return transformResponseData(await response.json());
};

export const deleteActiveProgram = async userId => {
  try {
    const response = await fetch(`${API_URL}/api/active-program/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    });

    // First check if the response is ok
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with ${response.status}: ${errorText}`);
    }

    // For successful responses, handle both 204 and 200
    if (response.status === 204) {
      return { message: 'Active program deleted successfully' };
    }

    const data = await response.json();
    return data; // Return the raw response data
  } catch (error) {
    console.error('API Error:', error);
    // Make sure we're throwing the actual error object
    throw error;
  }
};

export const createProgram = async programData => {
  try {
    // Transform to snake_case for backend
    const backendData = transformRequestData(programData);

    const response = await fetch(`${API_URL}/api/programs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(backendData)
    });

    // Handle non-200 responses
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return transformResponseData(data);
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const updateProgram = async programData => {
  try {
    // Transform to snake_case for backend
    const backendData = transformRequestData(programData);

    const response = await fetch(`${API_URL}/api/programs/${programData.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(backendData)
    });

    // Handle non-200 responses
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // If it's just a success message, return it directly
    if (data.message) {
      return data;
    }

    // Otherwise, transform the response data
    return transformResponseData(data);
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const deleteProgram = async programId => {
  try {
    if (!programId) {
      throw new Error('Program ID is required for deletion');
    }

    const response = await fetch(`${API_URL}/api/programs/${programId}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response body:', errorText);
      throw new Error(`Server responded with ${response.status}: ${errorText}`);
    }

    // If the backend returns data after deletion, transform it
    if (response.status !== 204) {
      // 204 means no content
      const data = await response.json();
      return transformResponseData(data);
    }

    return { success: true };
  } catch (error) {
    console.error('Delete API Error:', error);
    throw error;
  }
};
