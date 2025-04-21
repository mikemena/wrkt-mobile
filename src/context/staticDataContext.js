// src/context/staticDataContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import exercisesData from '../../assets/data/exercises.json';
import musclesData from '../../assets/data/muscles.json';
import equipmentData from '../../assets/data/equipments.json';

// Constants for cache keys and durations
const CACHE_KEYS = {
  VERSION: 'static_data_version',
  LAST_UPDATE: 'static_data_last_update'
};
const CACHE_VERSION = '1.0.0'; // Increment when data structure changes
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Cloudflare R2 Configuration
const CLOUDFLARE_BASE_URL =
  'https://pub-510e01a4de414aa79526e42373110829.r2.dev';

const CLOUDFLARE_BUCKET = 'wrkt-images';

const StaticDataContext = createContext();

export const StaticDataProvider = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [data, setData] = useState({
    exercises: [],
    muscles: [],
    equipment: [],
    muscleGroups: [],
    musclesByGroup: {},
    exercisesByMuscle: {},
    exercisesByEquipment: {},
    imageUrlMap: {}
  });

  // Initialize data when the component mounts
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      console.log('StaticDataContext: Initializing data...');
      console.log('Exercises data length:', exercisesData?.length || 0);
      console.log('Muscles data length:', musclesData?.length || 0);
      console.log('Equipment data length:', equipmentData?.length || 0);

      // Check if we need to refresh cache
      const needsRefresh = await checkCache();

      let processedData;

      if (needsRefresh) {
        processedData = processImportedData();
        await updateCacheMetadata();
      } else {
        processedData = processImportedData();
      }

      setData(processedData);
      setIsLoaded(true);
      console.log('StaticDataContext: Data initialized and ready');
    } catch (error) {
      console.error('Error initializing static data:', error);
      // Fallback to direct processing without caching
      const processedData = processImportedData();
      setData(processedData);
      setIsLoaded(true);
    }
  };

  const checkCache = async () => {
    try {
      const version = await AsyncStorage.getItem(CACHE_KEYS.VERSION);
      const lastUpdate = await AsyncStorage.getItem(CACHE_KEYS.LAST_UPDATE);

      // If version has changed or cache duration exceeded, refresh data
      if (
        version !== CACHE_VERSION ||
        !lastUpdate ||
        Date.now() - parseInt(lastUpdate) > CACHE_DURATION
      ) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking cache:', error);
      return true; // Refresh on error
    }
  };

  const updateCacheMetadata = async () => {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.VERSION, CACHE_VERSION);
      await AsyncStorage.setItem(CACHE_KEYS.LAST_UPDATE, Date.now().toString());
    } catch (error) {
      console.error('Error updating cache metadata:', error);
    }
  };

  const processImportedData = () => {
    console.log('Processing imported data...');

    // Filter out any empty items
    const exercises = exercisesData.filter(exercise => exercise.id !== '');
    const muscles = musclesData.filter(muscle => muscle.id !== '');
    const equipment = equipmentData.filter(equip => equip.id !== '');

    console.log('Filtered exercises length:', exercises.length);
    console.log('Filtered muscles length:', muscles.length);
    console.log('Filtered equipment length:', equipment.length);

    if (exercises.length > 0) {
      console.log('Sample exercise:', JSON.stringify(exercises[0], null, 2));
    }

    if (muscles.length > 0) {
      console.log('Sample muscle:', JSON.stringify(muscles[0], null, 2));
    }

    if (equipment.length > 0) {
      console.log('Sample equipment:', JSON.stringify(equipment[0], null, 2));
    }

    // Create unique muscle groups list
    const muscleGroups = [...new Set(muscles.map(m => m.muscle_group))].sort();
    console.log('Muscle groups:', muscleGroups);

    // Create lookup maps
    const musclesByGroup = muscles.reduce((acc, muscle) => {
      if (!acc[muscle.muscle_group]) {
        acc[muscle.muscle_group] = [];
      }
      acc[muscle.muscle_group].push(muscle);
      return acc;
    }, {});

    const exercisesByMuscle = exercises.reduce((acc, exercise) => {
      const muscleId = exercise.muscle_group_id;
      if (!acc[muscleId]) {
        acc[muscleId] = [];
      }
      acc[muscleId].push(exercise);
      return acc;
    }, {});

    const exercisesByEquipment = exercises.reduce((acc, exercise) => {
      const equipmentId = exercise.equipment_id;
      if (!acc[equipmentId]) {
        acc[equipmentId] = [];
      }
      acc[equipmentId].push(exercise);
      return acc;
    }, {});

    // Create image URL mapping for CloudFlare R2
    const imageUrlMap = exercises.reduce((acc, exercise) => {
      if (exercise.image_id) {
        acc[exercise.id] =
          `${CLOUDFLARE_BASE_URL}/${CLOUDFLARE_BUCKET}/images/${exercise.image_id}.gif`;
      }
      return acc;
    }, {});

    // Helper function to get image URL
    const getImageUrl = exerciseId => {
      return imageUrlMap[exerciseId] || null;
    };

    console.log('Data processing complete');

    return {
      exercises,
      muscles,
      equipment,
      muscleGroups,
      musclesByGroup,
      exercisesByMuscle,
      exercisesByEquipment,
      imageUrlMap,
      getImageUrl
    };
  };

  // Helper functions that match your existing API structure
  const getFormattedExercises = () => {
    console.log('Getting formatted exercises');
    return data.exercises.map(exercise => {
      const muscle = data.muscles.find(m => m.id === exercise.muscle_group_id);
      const equipItem = data.equipment.find(
        e => e.id === exercise.equipment_id
      );

      return {
        id: exercise.id,
        name: exercise.name,
        muscle: muscle?.muscle || '',
        muscle_group: muscle?.muscle_group || '',
        equipment: equipItem?.name || '',
        imageUrl: data.imageUrlMap[exercise.id] || null,
        catalogExerciseId: exercise.id
      };
    });
  };

  const getFormattedMuscles = () => {
    return data.muscles.map(muscle => ({
      label: `${muscle.muscle} (${muscle.muscle_group})`,
      value: muscle.muscle
    }));
  };

  const getFormattedEquipment = () => {
    return data.equipment.map(equipment => ({
      label: equipment.name,
      value: equipment.name
    }));
  };

  // Function to filter exercises (mimics API filtering)
  const filterExercises = (filters = {}) => {
    console.log('Filtering exercises with filters:', filters);
    console.log('Starting with exercises count:', data.exercises.length);

    let filtered = [...data.exercises];

    // Filter by name
    if (filters.exerciseName) {
      const searchTerm = filters.exerciseName.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(searchTerm)
      );
      console.log('After name filter count:', filtered.length);
    }

    // Filter by muscles
    if (filters.muscles && filters.muscles.length > 0) {
      const muscleIds = data.muscles
        .filter(m => filters.muscles.includes(m.muscle))
        .map(m => m.id);

      console.log('Muscle IDs for filtering:', muscleIds);
      filtered = filtered.filter(ex => muscleIds.includes(ex.muscle_group_id));
      console.log('After muscle filter count:', filtered.length);
    }

    // Filter by equipment
    if (filters.equipment && filters.equipment.length > 0) {
      const equipmentIds = data.equipment
        .filter(e => filters.equipment.includes(e.name))
        .map(e => e.id);

      console.log('Equipment IDs for filtering:', equipmentIds);
      filtered = filtered.filter(ex => equipmentIds.includes(ex.equipment_id));
      console.log('After equipment filter count:', filtered.length);
    }

    // Format the results to match API response
    const result = filtered.map(exercise => {
      const muscle = data.muscles.find(m => m.id === exercise.muscle_group_id);
      const equipItem = data.equipment.find(
        e => e.id === exercise.equipment_id
      );

      return {
        id: exercise.id,
        name: exercise.name,
        muscle: muscle?.muscle || '',
        muscle_group: muscle?.muscle_group || '',
        equipment: equipItem?.name || '',
        imageUrl: data.imageUrlMap[exercise.id] || null,
        catalogExerciseId: exercise.id
      };
    });

    console.log('Final filtered result count:', result.length);
    if (result.length > 0) {
      console.log('Sample result:', JSON.stringify(result[0], null, 2));
    }

    return result;
  };

  // Function to get exercise by ID
  const getExerciseById = id => {
    const exercise = data.exercises.find(ex => ex.id === id);
    if (!exercise) return null;

    const muscle = data.muscles.find(m => m.id === exercise.muscle_group_id);
    const equipItem = data.equipment.find(e => e.id === exercise.equipment_id);

    return {
      id: exercise.id,
      name: exercise.name,
      muscle: muscle?.muscle || '',
      muscle_group: muscle?.muscle_group || '',
      equipment: equipItem?.name || '',
      imageUrl: data.imageUrlMap[exercise.id] || null,
      catalogExerciseId: exercise.id
    };
  };

  return (
    <StaticDataContext.Provider
      value={{
        ...data,
        isLoaded,
        getFormattedExercises,
        getFormattedMuscles,
        getFormattedEquipment,
        filterExercises,
        getExerciseById
      }}
    >
      {children}
    </StaticDataContext.Provider>
  );
};

export const useStaticData = () => {
  const context = useContext(StaticDataContext);
  if (!context) {
    throw new Error('useStaticData must be used within a StaticDataProvider');
  }
  return context;
};
