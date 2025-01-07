import { createProgram as apiCreateProgram } from './api';

export const programService = {
  async createProgram(programData) {
    try {
      if (!programData || !programData.workouts) {
        throw new Error('Invalid program data structure');
      }

      const validatedData = {
        userId: programData.userId,
        name: programData.name,
        programDuration: Number(programData.programDuration) || 0,
        daysPerWeek: Number(programData.daysPerWeek) || 0,
        mainGoal: (programData.mainGoal || 'general').toLowerCase(),
        durationUnit: programData.durationUnit,

        workouts: programData.workouts.map((workout, workoutIndex) => ({
          name: workout.name,
          order: workoutIndex + 1,
          exercises: (workout.exercises || []).map((exercise, index) => {
            return {
              catalogExerciseId: Number(exercise.catalogExerciseId),
              order: index + 1,
              sets: (exercise.sets || []).map((set, setIndex) => ({
                order: setIndex + 1,
                weight: set.weight === '' ? null : Number(set.weight),
                reps: set.reps === '' ? null : Number(set.reps)
              }))
            };
          })
        }))
      };
      const response = await apiCreateProgram(validatedData);
      return response;
    } catch (error) {
      const enhancedError = new Error(
        `Failed to create program: ${error.message}`
      );
      enhancedError.originalError = error;
      throw enhancedError;
    }
  },

  async updateProgram(programData) {
    try {
      if (!programData) {
        throw new Error('Program data is missing');
      }

      if (!programData.id) {
        throw new Error('Program ID is required for update');
      }

      if (!Array.isArray(programData.workouts)) {
        throw new Error('Workouts must be an array');
      }

      const validatedData = {
        id: Number(programData.id),
        userId: programData.userId,
        name: programData.name,
        programDuration: Number(programData.programDuration) || 0,
        daysPerWeek: Number(programData.daysPerWeek) || 0,
        mainGoal: (programData.mainGoal || 'general').toLowerCase(),
        durationUnit: programData.durationUnit,
        workouts: programData.workouts.map(workout => ({
          id: workout.id ? Number(workout.id) : undefined,
          name: workout.name,
          order: workout.order || 1,
          exercises: (workout.exercises || []).map((exercise, index) => ({
            id: exercise.id ? Number(exercise.id) : undefined,
            catalogExerciseId: Number(exercise.catalogExerciseId),
            order: exercise.order || index + 1,
            sets: (exercise.sets || []).map((set, setIndex) => ({
              id: set.id ? Number(set.id) : undefined,
              weight: set.weight === '' ? null : Number(set.weight),
              reps: set.reps === '' ? null : Number(set.reps),
              order: set.order || setIndex + 1
            }))
          }))
        }))
      };

      const response = await apiService.updateProgram(validatedData);
      // If we get a success response, return a properly structured response
      if (response.success) {
        return {
          success: true,
          program: validatedData,
          workouts: validatedData.workouts,
          activeWorkout: validatedData.workouts[0]?.id || null
        };
      }
      return response;
    } catch (error) {
      throw new Error(`Failed to update program: ${error.message}`);
    }
  },

  // Delete method
  async deleteProgram(programId) {
    try {
      // Validate programId format and type
      if (!programId) {
        throw new Error('Program ID is required for deletion');
      }

      // Ensure programId is the correct type (number)
      const parsedId = parseInt(programId, 10);
      if (isNaN(parsedId)) {
        throw new Error(
          `Invalid program ID format: ${programId}. Expected a number.`
        );
      }

      const response = await apiService.deleteProgram(parsedId);
      return response;
    } catch (error) {
      // Enhanced error logging
      console.error('Program deletion error details:', {
        originalError: error,
        programId,
        timestamp: new Date().toISOString()
      });

      // Rethrow with more context
      throw new Error(`Failed to delete program: ${error.message}`);
    }
  }
};
