import { useState, useEffect, useCallback } from 'react';
import Config from 'react-native-config';

export function useExerciseData(
  baseUrl = (Config.API_URL || 'http://localhost:9025') + '/api'
) {
  const [exercises, setExercises] = useState([]);
  const [muscles, setMuscles] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetadata = useCallback(async () => {
    try {
      // const musclesUrl = `${baseUrl}/muscles`;
      // const equipmentUrl = `${baseUrl}/equipments`;

      const [musclesRes, equipmentRes] = await Promise.all([
        fetch(`${baseUrl}/muscles`),
        fetch(`${baseUrl}/equipments`)
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
  }, [baseUrl]);

  const fetchExercises = useCallback(
    async (params = {}) => {
      try {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(
          `${baseUrl}/exercise-catalog${queryString ? `?${queryString}` : ''}`
        );

        if (!response.ok) throw new Error('Failed to fetch exercises');

        const data = await response.json();
        setExercises(data.exercises);
        return data;
      } catch (err) {
        setError(err.message);
        return null;
      }
    },
    [baseUrl]
  );

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
