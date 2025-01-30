import React, {
  createContext,
  useReducer,
  useCallback,
  useEffect
} from 'react';
import * as Crypto from 'expo-crypto';
import { actionTypes } from '../actions/actionTypes';
import { workoutReducer } from '../reducers/workoutReducer';
import { getActiveProgram } from '../services/api';
import { useConfig } from '../context/configContext';
import { useUser } from '../context/userContext';

// Initial state
const initialState = {
  activeProgram: null,
  userId: null,
  activeWorkout: null
};

// Create the context
export const WorkoutContext = createContext();

// Create the provider component
export const WorkoutProvider = ({ children }) => {
  const { apiUrl } = useConfig();
  const { userId } = useUser();
  const [state, dispatch] = useReducer(workoutReducer, {
    ...initialState,
    userId: userId
  });

  useEffect(() => {
    if (userId) {
      dispatch({ type: actionTypes.SET_USER_ID, payload: userId });
    }
  }, [userId]);

  const updateWorkoutDuration = useCallback(minutes => {
    dispatch({
      type: actionTypes.UPDATE_WORKOUT_DURATION,
      payload: minutes
    });
  }, []);

  // Action creators

  const fetchActiveProgram = useCallback(async () => {
    try {
      const data = await getActiveProgram(userId);

      if (!data?.activeProgram) {
        dispatch({
          type: actionTypes.SET_ACTIVE_PROGRAM,
          payload: null
        });
        return false;
      }

      dispatch({
        type: actionTypes.SET_ACTIVE_PROGRAM,
        payload: data.activeProgram
      });
      return true;
    } catch (error) {
      console.error('Detailed error:', {
        error: error.message,
        stack: error.stack
      });
      dispatch({
        type: actionTypes.SET_ACTIVE_PROGRAM,
        payload: null
      });
      return false;
    }
  }, [userId]);

  const setActiveProgram = useCallback(activeProgram => {
    dispatch({ type: actionTypes.SET_ACTIVE_PROGRAM, payload: activeProgram });
  }, []);

  const setActiveWorkout = useCallback(workoutId => {
    dispatch({
      type: actionTypes.SET_ACTIVE_WORKOUT,
      payload: workoutId
    });
  }, []);

  // Initialize a new flex workout
  const initializeFlexWorkout = useCallback(() => {
    dispatch({ type: actionTypes.INITIALIZE_FLEX_WORKOUT });
  }, []);

  // Update workout name
  const updateWorkoutName = useCallback(name => {
    dispatch({
      type: actionTypes.UPDATE_WORKOUT_NAME,
      payload: name
    });
  }, []);

  // Clear workout details when done
  const clearWorkoutDetails = useCallback(() => {
    dispatch({ type: actionTypes.CLEAR_WORKOUT_DETAILS });
  }, []);

  const startWorkout = useCallback(workoutData => {
    dispatch({
      type: actionTypes.START_WORKOUT,
      payload: {
        ...workoutData,
        id: workoutData.id,
        startTime: new Date(),
        isCompleted: false
      }
    });
  }, []);

  const addExerciseToWorkout = useCallback(exercise => {
    const newExercise = {
      id: exercise.id || Crypto.randomUUID(),
      workoutId: exercise.workoutId,
      catalogExerciseId: exercise.catalogExerciseId,
      order: exercise.order || 0,
      name: exercise.name,
      muscle: exercise.muscle,
      muscleGroup: exercise.muscleGroup,
      subcategory: exercise.subcategory,
      equipment: exercise.equipment,
      imageUrl: exercise.imageUrl,
      sets: exercise.sets || [
        {
          id: Crypto.randomUUID(),
          weight: '',
          reps: '',
          order: 1
        }
      ]
    };

    dispatch({
      type: actionTypes.ADD_EXERCISE_TO_WORKOUT,
      payload: newExercise
    });
  }, []);

  const removeExerciseFromWorkout = useCallback(exerciseId => {
    dispatch({
      type: actionTypes.REMOVE_EXERCISE_FROM_WORKOUT,
      payload: exerciseId
    });
  }, []);

  const addSet = useCallback((exerciseId, setData) => {
    const newSet = {
      id: Crypto.randomUUID(),
      weight: '',
      reps: '',
      order:
        (state.activeWorkout?.exercises.find(e => e.id === exerciseId)?.sets
          ?.length || 0) + 1,
      ...setData
    };
    dispatch({
      type: actionTypes.ADD_SET,
      payload: { exerciseId, set: newSet }
    });
  }, []);

  const updateSet = useCallback((exerciseId, setId, setData) => {
    dispatch({
      type: actionTypes.UPDATE_SET,
      payload: { exerciseId, setId, setData }
    });
  }, []);

  const updateExerciseSets = (exerciseId, newSets) => {
    dispatch({
      type: actionTypes.UPDATE_EXERCISE_SETS,
      payload: {
        exerciseId,
        sets: newSets.map(set => ({
          id: set.id,
          weight: set.weight,
          reps: set.reps,
          order: set.order
        }))
      }
    });
  };

  const removeSet = useCallback((exerciseId, setId) => {
    dispatch({ type: actionTypes.REMOVE_SET, payload: { exerciseId, setId } });
  }, []);

  const completeWorkout = useCallback(
    async duration => {
      try {
        if (!state.activeWorkout) {
          throw new Error('No active workout to complete');
        }

        // Ensure duration is at least 1 minute
        const validDuration = Math.max(1, duration);

        // Filter out invalid sets and exercises
        const validExercises = state.activeWorkout.exercises
          .map(exercise => ({
            catalogExerciseId: exercise.catalogExerciseId,
            sets: Array.isArray(exercise.sets)
              ? exercise.sets
                  .filter(set => {
                    const weight = parseInt(set.weight);
                    const reps = parseInt(set.reps);
                    return (
                      !isNaN(weight) && !isNaN(reps) && weight >= 0 && reps > 0
                    );
                  })
                  .map(set => ({
                    weight: parseInt(set.weight),
                    reps: parseInt(set.reps),
                    order: set.order || 1
                  }))
              : []
          }))
          .filter(exercise => exercise.sets.length > 0);

        if (validExercises.length === 0) {
          throw new Error('No valid exercises with completed sets found');
        }

        const workoutData = {
          userId: userId,
          name: state.activeWorkout.name.trim(),
          duration: validDuration,
          exercises: validExercises
        };

        if (state.activeWorkout.programId) {
          workoutData.programId = state.activeWorkout.programId;
        }

        const response = await fetch(`${apiUrl}/api/workout/complete`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(workoutData)
        });

        const responseText = await response.text();

        if (!response.ok) {
          let errorMessage = 'Failed to save workout';
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = `${errorData.message}${
              errorData.error ? ': ' + errorData.error : ''
            }`;
          } catch (parseError) {
            errorMessage = `Server error (${response.status}): ${responseText}`;
          }
          throw new Error(errorMessage);
        }

        dispatch({ type: actionTypes.COMPLETE_WORKOUT });
        return true;
      } catch (error) {
        console.error('Error completing workout:', error);
        throw error;
      }
    },
    [state.activeWorkout, apiUrl]
  );

  const clearCurrentWorkout = useCallback(() => {
    dispatch({ type: actionTypes.CLEAR_CURRENT_WORKOUT });
  }, []);

  return (
    <WorkoutContext.Provider
      value={{
        state,
        fetchActiveProgram,
        setActiveProgram,
        setActiveWorkout,
        initializeFlexWorkout,
        clearWorkoutDetails,
        startWorkout,
        addExerciseToWorkout,
        removeExerciseFromWorkout,
        addSet,
        updateSet,
        updateExerciseSets,
        removeSet,
        completeWorkout,
        clearCurrentWorkout,
        updateWorkoutDuration,
        updateWorkoutName
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};
