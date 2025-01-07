import { useState, useEffect, useCallback } from 'react';

let apiUrl = null;

export const initializeExerciseApi = config => {
  if (!config.API_URL) {
    throw new Error('API URL is required for exercise API initialization');
  }
  apiUrl = config.API_URL + '/api';
};

const ensureInitialized = () => {
  if (!apiUrl) {
    throw new Error('Exercise API service must be initialized before use');
  }
};

export function useExerciseData() {
  const [exercises, setExercises] = useState([]);
  const [muscles, setMuscles] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetadata = useCallback(async () => {
    try {
      const [musclesRes, equipmentRes] = await Promise.all([
        fetch(`${apiUrl}/muscles`),
        fetch(`${apiUrl}/equipments`)
      ]);

      if (!musclesRes.ok || !equipmentRes.ok) {
        throw new Error('Failed to fetch metadata');
      }

      const [musclesData, equipmentData] = await Promise.all([
        musclesRes.json(),
        equipmentRes.json()
      ]);

      setMuscles(musclesData);
      setEquipment(equipmentData);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchExercises = useCallback(async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(
        `${apiUrl}/exercise-catalog${queryString ? `?${queryString}` : ''}`
      );

      if (!response.ok) throw new Error('Failed to fetch exercises');

      const data = await response.json();
      setExercises(data.exercises);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMetadata(), fetchExercises()]).finally(() => {
      setLoading(false);
    });
  }, [fetchMetadata, fetchExercises]);

  return {
    exercises,
    muscles,
    equipment,
    loading,
    error,
    fetchExercises,
    fetchMetadata
  };
}
