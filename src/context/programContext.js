import React, { createContext, useReducer, useCallback } from 'react';
import * as Crypto from 'expo-crypto';
import { programService } from '../services/programService';
import { actionTypes } from '../actions/actionTypes';
import { programReducer } from '../reducers/programReducer.js';
import { currentProgram } from '../reducers/programInitialState.js';
import { useUser } from '../context/userContext.js';

export const ProgramContext = createContext();

export const ProgramProvider = ({ children }) => {
  const { userId } = useUser();
  const [state, dispatch] = useReducer(programReducer, {
    ...currentProgram,
    mode: 'view'
  });

  const setMode = mode => {
    dispatch({
      type: actionTypes.SET_MODE,
      payload: mode
    });
  };

  // Clear program state
  const clearProgram = () => {
    dispatch({
      type: actionTypes.CLEAR_PROGRAM,
      payload: currentProgram
    });
  };

  // Memoized function to initialize state for creating a new program and avoid re-rendering
  const initializeNewProgramState = useCallback(() => {
    const newProgramId = Crypto.randomUUID();
    const newWorkoutId = Crypto.randomUUID();

    const newProgram = {
      userId: userId,
      id: newProgramId,
      name: 'Program 1',
      programDuration: 0,
      durationUnit: 'Days',
      daysPerWeek: 0,
      mainGoal: 'Strength'
    };

    const newWorkout = {
      id: newWorkoutId,
      programId: newProgramId,
      name: 'Workout 1',
      exercises: []
    };

    // Dispatch to initialize the new program state

    dispatch({
      type: actionTypes.INITIALIZE_NEW_PROGRAM_STATE,
      payload: {
        program: newProgram,
        workouts: [newWorkout],
        activeWorkout: null
      }
    });
  }, [userId, dispatch]);

  // Memoized function to initialize state for editing a program

  const initializeEditProgramState = useCallback(
    (program, workouts) => {
      dispatch({
        type: actionTypes.INITIALIZE_EDIT_PROGRAM_STATE,
        payload: {
          program: {
            ...program,
            workouts
          },
          workouts,
          activeWorkout: workouts.length > 0 ? workouts[0].id : null
        }
      });
    },
    [dispatch]
  );

  // Function to update a single field in the program

  const updateProgramField = (field, value) => {
    dispatch({
      type: actionTypes.UPDATE_PROGRAM_FIELD,
      payload: { [field]: value }
    });
  };

  const setPrograms = useCallback(programs => {
    dispatch({
      type: actionTypes.SET_PROGRAMS,
      payload: programs
    });
  }, []);

  // Validate program data structure

  const validateProgramData = programData => {
    if (!programData.workouts || !Array.isArray(programData.workouts)) {
      console.error('Validation failed: Workouts should be an array.');
      throw new Error('Workouts should be an array.');
    }

    programData.workouts.forEach(workout => {
      if (!workout.exercises || !Array.isArray(workout.exercises)) {
        console.error('Validation failed: Exercises should be an array.');
        throw new Error('Exercises should be an array.');
      }

      workout.exercises.forEach(exercise => {
        if (!exercise.sets || !Array.isArray(exercise.sets)) {
          console.error('Validation failed: Sets should be an array.');
          throw new Error('Sets should be an array.');
        }
      });
    });
  };

  // Add the formatting function in the same file
  const formatProgramData = (program, workouts) => {
    const formatValue = value => {
      if (value === '' || value === null || value === undefined) {
        return null;
      }
      const num = Number(value);
      return isNaN(num) ? value : num;
    };

    if (!program.userId) {
      console.error('No userId found in program data:', program);
      throw new Error('userId is required');
    }

    return {
      ...program,
      userId: program.userId,
      programDuration: formatValue(program.programDuration),
      daysPerWeek: formatValue(program.daysPerWeek),
      workouts: workouts.map(workout => ({
        id: workout.id,
        name: workout.name,
        order: workout.order || 1,
        exercises: workout.exercises.map(exercise => ({
          catalogExerciseId: exercise.catalogExerciseId || exercise.id,
          order: exercise.order || 1,
          sets: exercise.sets.map((set, index) => ({
            reps: formatValue(set.reps),
            weight: formatValue(set.weight),
            order: set.order || index + 1
          }))
        }))
      }))
    };
  };

  // Save new program to backend

  const saveProgram = async () => {
    try {
      if (!state.program.userId) {
        console.error('No userId found in program state:', state.program);
        throw new Error('userId is required to save program');
      }
      const formattedProgram = formatProgramData(
        state.program,
        state.workout.workouts
      );
      validateProgramData(formattedProgram);

      const savedProgram = await programService.createProgram(formattedProgram);

      dispatch({
        type: actionTypes.SAVE_PROGRAM_SUCCESS,
        payload: savedProgram
      });
    } catch (error) {
      console.error('Failed to save program:', error);
      dispatch({
        type: actionTypes.SAVE_PROGRAM_FAILURE,
        payload: error.message
      });
    }
  };

  // Update program in backend

  const updateProgram = async updatedProgram => {
    try {
      const updatedProgramData = await programService.updateProgram(
        updatedProgram
      );

      dispatch({
        type: actionTypes.UPDATE_PROGRAM_DATABASE,
        payload: updatedProgramData
      });

      return updatedProgramData;
    } catch (error) {
      console.error('Failed to update program:', error);
      dispatch({
        type: actionTypes.SAVE_PROGRAM_FAILURE,
        payload: error.message
      });
      throw error;
    }
  };

  // Add new program details

  const addProgram = details => {
    dispatch({
      type: actionTypes.ADD_PROGRAM,
      payload: details
    });
  };

  // Delete a program

  const deleteProgram = async programId => {
    try {
      await programService.deleteProgram(programId);

      dispatch({
        type: actionTypes.DELETE_PROGRAM,
        payload: { programId }
      });
    } catch (error) {
      console.error('Failed to delete program:', error);
      dispatch({
        type: actionTypes.DELETE_PROGRAM_FAILURE,
        payload: error.message
      });
    }
  };

  // Workout Actions

  // Set active workout by ID

  const setActiveWorkout = workoutId => {
    // Always set the workoutId passed as the active one
    dispatch({
      type: actionTypes.SET_ACTIVE_WORKOUT,
      payload: { activeWorkout: workoutId }
    });
  };

  // Add a new workout to the program

  const addWorkout = () => {
    const newWorkout = {
      id: Crypto.randomUUID(),
      programId: state.program.id,
      name: `Workout ${state.workout.workouts.length + 1}`,
      exercises: []
    };

    dispatch({
      type: actionTypes.ADD_WORKOUT,
      payload: newWorkout
    });
  };

  // Function to update a single field in the workout

  const updateWorkoutField = (workoutId, field, value) => {
    dispatch({
      type: actionTypes.UPDATE_WORKOUT_FIELD,
      payload: { workoutId, field, value }
    });
  };

  // Update existing workout

  const updateWorkout = updatedWorkout => {
    dispatch({
      type: actionTypes.UPDATE_WORKOUT,
      payload: updatedWorkout
    });
  };

  // Delete a workout by ID

  const deleteWorkout = workoutId => {
    dispatch({
      type: actionTypes.DELETE_WORKOUT,
      payload: { workoutId }
    });
  };

  // Exercise Actions

  // Add exercises to a workout
  const addExercise = (workoutId, exercises) => {
    const standardizedExercises = exercises.map(exercise => {
      const standardized = {
        ...exercise,

        catalogExerciseId: exercise.catalogExerciseId,
        order: 1,
        sets: exercise.sets || [{ weight: '', reps: '', order: 1 }]
      };

      return standardized;
    });

    dispatch({
      type: actionTypes.ADD_EXERCISE,
      payload: { workoutId, exercises: standardizedExercises }
    });
  };

  // Update an exercise
  const updateExercise = (workoutId, updatedExercises) => {
    const standardizedExercises = updatedExercises.map((ex, index) => ({
      ...ex,
      id: ex.id || Crypto.randomUUID(),
      catalogExerciseId: ex.catalogExerciseId || ex.id,
      muscle: ex.muscle,
      equipment: ex.equipment,
      order: index + 1,
      sets: ex.sets || [
        { id: Crypto.randomUUID(), weight: '', reps: '', order: 1 }
      ]
    }));

    dispatch({
      type: actionTypes.UPDATE_EXERCISE,
      payload: { workoutId, updatedExercises: standardizedExercises }
    });
  };

  // Remove an exercise from a workout
  const removeExercise = (workoutId, exerciseId) => {
    dispatch({
      type: actionTypes.REMOVE_EXERCISE,
      payload: { workoutId, exerciseId }
    });
  };

  // Toggle exercise selection within a workout
  const toggleExerciseSelection = (exerciseId, exerciseData) => {
    // Directly access the activeWorkout ID

    const activeWorkoutId = state.workout.activeWorkout;

    if (!activeWorkoutId) {
      console.error('No active workout selected');
      return;
    }

    // Find the active workout using the ID
    const workout = state.workout.workouts.find(
      workout => workout.id === activeWorkoutId
    );

    if (!workout) {
      console.error('Active workout not found');
      return;
    }

    // Check if the exercise already exists in the workout's exercises array
    const exerciseExists = workout.exercises.some(ex => ex.id === exerciseId);

    if (exerciseExists) {
      // If the exercise exists, remove it
      dispatch({
        type: actionTypes.REMOVE_EXERCISE,
        payload: { workoutId: activeWorkoutId, exerciseId }
      });
    } else {
      // If the exercise doesn't exist, add it
      dispatch({
        type: actionTypes.ADD_EXERCISE,
        payload: {
          workoutId: activeWorkoutId,
          exercise: [exerciseData]
        }
      });
    }
  };

  // Set Actions

  // Add a new set to an exercise
  const addSet = (workoutId, exerciseId) => {
    dispatch({
      type: actionTypes.ADD_SET,
      payload: { workoutId, exerciseId }
    });
  };

  // Update an existing set within an exercise
  const updateSet = (workoutId, exerciseId, updatedSet) => {
    dispatch({
      type: actionTypes.UPDATE_SET,
      payload: { workoutId, exerciseId, updatedSet }
    });
  };

  // Remove a set from an exercise
  const removeSet = (workoutId, exerciseId, setId) => {
    dispatch({
      type: actionTypes.REMOVE_SET,
      payload: { workoutId, exerciseId, setId }
    });
  };

  return (
    <ProgramContext.Provider
      value={{
        state,
        dispatch,
        setPrograms,
        setMode,
        updateProgramField,
        initializeNewProgramState,
        initializeEditProgramState,
        addProgram,
        updateProgram,
        deleteProgram,
        addWorkout,
        updateWorkoutField,
        updateWorkout,
        deleteWorkout,
        setActiveWorkout,
        addExercise,
        updateExercise,
        toggleExerciseSelection,
        removeExercise,
        addSet,
        updateSet,
        removeSet,
        saveProgram,
        clearProgram
      }}
    >
      {children}
    </ProgramContext.Provider>
  );
};
