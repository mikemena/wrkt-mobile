import { actionTypes } from '../actions/actionTypes';
import * as Crypto from 'expo-crypto';

const workoutReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_ACTIVE_PROGRAM:
      return {
        ...state,
        activeProgram: action.payload || null
      };

    case actionTypes.INITIALIZE_FLEX_WORKOUT:
      const workoutId = Crypto.randomUUID();
      return {
        ...state,
        activeWorkout: {
          id: workoutId,
          name: 'Flex Workout',
          date: new Date(),
          exercises: []
        }
      };

    case actionTypes.CLEAR_WORKOUT_DETAILS:
      return {
        ...state,
        activeProgram: null
      };

    case actionTypes.UPDATE_WORKOUT_NAME:
      return {
        ...state,
        activeProgram: {
          ...state.activeProgram,
          workouts: state.activeProgram.workouts.map((workout, index) =>
            index === state.activeProgram.current_workout_index
              ? { ...workout, name: action.payload }
              : workout
          )
        },
        // Also update activeWorkout if it exists
        activeWorkout: state.activeWorkout
          ? { ...state.activeWorkout, name: action.payload }
          : null
      };

    // In workoutReducer.js, modify the SET_ACTIVE_WORKOUT case:

    // In workoutReducer.js
    case actionTypes.SET_ACTIVE_WORKOUT: {
      // For flex workouts (no active program or program with no workouts)
      if (!state.activeProgram || !state.activeProgram.workouts) {
        // If we already have an activeWorkout, just keep using it
        if (state.activeWorkout && state.activeWorkout.id === action.payload) {
          return state;
        }

        // Otherwise create a new workout structure
        return {
          ...state,
          activeWorkout: {
            id: action.payload || Crypto.randomUUID(),
            name: 'Flex Workout',
            exercises: [],
            isStarted: false,
            isCompleted: false
          }
        };
      }

      // For program workouts, find the workout in the active program
      const selectedWorkout = state.activeProgram.workouts.find(
        workout => workout.id === action.payload
      );

      return {
        ...state,
        activeWorkout: selectedWorkout
          ? {
              ...selectedWorkout,
              isStarted: false,
              isCompleted: false
            }
          : {
              // Fallback to creating a new workout if not found
              id: action.payload || Crypto.randomUUID(),
              name: 'Flex Workout',
              exercises: [],
              isStarted: false,
              isCompleted: false
            }
      };
    }

    case actionTypes.START_WORKOUT:
      return {
        ...state,
        activeWorkout: {
          ...state.activeWorkout,
          ...action.payload,
          startTime: new Date(),
          isStarted: true,
          isCompleted: false
        }
      };

    case actionTypes.ADD_EXERCISE_TO_WORKOUT:
      if (!state.activeWorkout) return state;

      return {
        ...state,
        activeWorkout: {
          ...state.activeWorkout,
          exercises: [...(state.activeWorkout.exercises || []), action.payload]
        }
      };

    case actionTypes.REMOVE_EXERCISE_FROM_WORKOUT:
      return {
        ...state,
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.filter(
            exercise => exercise.id !== action.payload
          )
        },
        workoutDetails: {
          ...state.workoutDetails,
          exercises: state.activeWorkout.exercises.filter(
            exercise => exercise.id !== action.payload
          )
        }
      };

    case actionTypes.ADD_SET:
      if (
        !state.activeWorkout ||
        !action.payload.exerciseId ||
        !action.payload.set
      ) {
        console.log('Missing required data for ADD_SET:', action.payload);
        return state;
      }
      return {
        ...state,
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.map(exercise =>
            exercise.id === action.payload.exerciseId
              ? {
                  ...exercise,
                  sets: [...(exercise.sets || []), action.payload.set]
                }
              : exercise
          )
        }
      };

    case actionTypes.UPDATE_SET:
      return {
        ...state,
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.map(exercise =>
            exercise.id === action.payload.exerciseId
              ? {
                  ...exercise,
                  sets: exercise.sets.map(set =>
                    set.id === action.payload.setId
                      ? { ...set, ...action.payload.setData }
                      : set
                  )
                }
              : exercise
          )
        }
      };

    case actionTypes.UPDATE_EXERCISE_SETS:
      return {
        ...state,
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.map(exercise =>
            exercise.id === action.payload.exerciseId
              ? { ...exercise, sets: action.payload.sets }
              : exercise
          )
        }
      };

    case actionTypes.REMOVE_SET:
      return {
        ...state,
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.map(exercise =>
            exercise.id === action.payload.exerciseId
              ? {
                  ...exercise,
                  sets: exercise.sets.filter(
                    set => set.id !== action.payload.setId
                  )
                }
              : exercise
          )
        }
      };

    case actionTypes.UPDATE_WORKOUT_DURATION:
      return {
        ...state,
        activeWorkout: {
          ...state.activeWorkout,
          duration: action.payload
        }
      };

    case actionTypes.COMPLETE_WORKOUT:
      return {
        ...state,
        activeWorkout: {
          ...state.activeWorkout,
          isComplete: true,
          endTime: new Date()
        }
      };

    case actionTypes.CLEAR_CURRENT_WORKOUT:
      return { ...state, activeWorkout: null };
    default:
      return state;
  }
};
export { workoutReducer };
