// src/utils/exerciseApi.js
import { useState, useEffect } from 'react';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const BASE_URL = 'http://localhost:9025/api';

class ExerciseCache {
  constructor() {
    this.memoryCache = new Map();
  }

  setCache(key, data) {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getCache(key) {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      this.memoryCache.delete(key);
      return null;
    }

    return cached.data;
  }

  clearCache() {
    this.memoryCache.clear();
  }
}

const exerciseCache = new ExerciseCache();

// Utility function for making API calls
export async function fetchExerciseData(endpoint, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;

  // Check cache first
  const cachedData = exerciseCache.getCache(url);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Cache the successful response
    exerciseCache.setCache(url, data);

    return data;
  } catch (error) {
    console.error('Error fetching exercise data:', error);
    throw error;
  }
}

// Custom hook for fetching exercise catalog
export function useExerciseCatalog(params = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await fetchExerciseData('/exercise-catalog', params);
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [JSON.stringify(params)]); // Dependencies array includes stringified params

  return { data, loading, error };
}

// Custom hook for fetching exercises by muscle group
export function useExercisesByMuscle(muscleId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!muscleId) return;

    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await fetchExerciseData(
          `/exercise-catalog/muscles/${muscleId}`
        );
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [muscleId]);

  return { data, loading, error };
}

// Custom hook for fetching exercises by equipment
export function useExercisesByEquipment(equipmentId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!equipmentId) return;

    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await fetchExerciseData(
          `/exercise-catalog/equipments/${equipmentId}`
        );
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [equipmentId]);

  return { data, loading, error };
}

// Cache control functions
export const clearExerciseCache = () => exerciseCache.clearCache();
