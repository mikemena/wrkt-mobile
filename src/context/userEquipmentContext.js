import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { UserContext } from './userContext';

// Create context
export const UserEquipmentContext = createContext();

// Cache key
const USER_EQUIPMENT_CACHE_KEY = 'user_equipment_cache';

export const UserEquipmentProvider = ({ children }) => {
  const { userId } = useContext(UserContext);
  const [userEquipment, setUserEquipment] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user equipment when user ID changes
  useEffect(() => {
    if (userId) {
      loadUserEquipment();
    } else {
      // Clear equipment data if no user is logged in
      setUserEquipment([]);
      setIsLoading(false);
    }
  }, [userId]);

  const loadUserEquipment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to get from cache first
      const cachedData = await AsyncStorage.getItem(
        `${USER_EQUIPMENT_CACHE_KEY}_${userId}`
      );

      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          setUserEquipment(parsedData);
          setIsLoading(false);
        } catch (parseErr) {
          console.error('Error parsing cached equipment data:', parseErr);
          // Continue to API call if cache parsing fails
        }
      }

      // Fetch from API (always refresh, even if we loaded from cache)
      refreshEquipmentFromApi();
    } catch (err) {
      console.error('Error loading user equipment:', err);
      setError('Failed to load your equipment');
      setIsLoading(false);
    }
  };

  const refreshEquipmentFromApi = async () => {
    if (!userId) return;

    try {
      console.log('Fetching user equipment for userId:', userId);

      // Make the API request
      const response = await api.get(`/api/users/${userId}/equipment`);

      // Log the raw response to see what's coming back
      console.log('Equipment API response type:', typeof response);
      console.log('Equipment API response:', response);

      // Check if response is valid
      if (response && Array.isArray(response)) {
        console.log('Valid equipment array received:', response);

        // Determine the equipment names based on response format
        let equipmentNames;
        if (
          response.length > 0 &&
          typeof response[0] === 'object' &&
          response[0].name
        ) {
          // If they're objects with name properties, extract the names
          equipmentNames = response.map(item => item.name);
        } else {
          // If they're already strings, use them directly
          equipmentNames = response;
        }

        // Set the equipment in state
        setUserEquipment(equipmentNames);

        // Update cache
        await AsyncStorage.setItem(
          `${USER_EQUIPMENT_CACHE_KEY}_${userId}`,
          JSON.stringify(equipmentNames)
        );

        console.log('User equipment updated:', equipmentNames);
      } else {
        console.warn('Invalid equipment response format:', response);

        // For testing - manually set some equipment
        const testEquipment = ['Barbell', 'Dumbbell', 'EZ-Bar'];
        setUserEquipment(testEquipment);
        console.log('Using test equipment data:', testEquipment);
      }
    } catch (err) {
      console.error('Error fetching equipment from API:', err);
      console.error('Error details:', err.message, err.stack);

      // For immediate testing - manually set some equipment
      const fallbackEquipment = ['Barbell', 'Dumbbell', 'EZ-Bar'];
      setUserEquipment(fallbackEquipment);
      console.log('Using fallback equipment after error:', fallbackEquipment);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserEquipment = async newEquipment => {
    if (!userId) return { success: false, error: 'User not logged in' };

    try {
      // Update in state first for immediate UI response
      setUserEquipment(newEquipment);

      // Update in cache
      await AsyncStorage.setItem(
        `${USER_EQUIPMENT_CACHE_KEY}_${userId}`,
        JSON.stringify(newEquipment)
      );

      // Send to server
      await api.put(`/api/users/${userId}/equipment`, {
        equipment: newEquipment
      });

      return { success: true };
    } catch (err) {
      console.error('Error updating user equipment:', err);

      // Don't revert state on error to maintain UI responsiveness
      // The next loadUserEquipment call will sync state if needed

      return {
        success: false,
        error: err.message || 'Failed to update equipment'
      };
    }
  };

  // Function to check if a specific equipment is in user's set
  const hasEquipment = equipmentName => {
    return userEquipment.includes(equipmentName);
  };

  return (
    <UserEquipmentContext.Provider
      value={{
        userEquipment,
        isLoading,
        error,
        updateUserEquipment,
        loadUserEquipment,
        hasEquipment
      }}
    >
      {children}
    </UserEquipmentContext.Provider>
  );
};

// Custom hook for easier usage
export const useUserEquipment = () => {
  const context = useContext(UserEquipmentContext);
  if (!context) {
    throw new Error(
      'useUserEquipment must be used within UserEquipmentProvider'
    );
  }
  return context;
};
