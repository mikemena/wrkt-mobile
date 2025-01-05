export const standardizePrograms = fetchedPrograms => {
  const standardizedState = {
    programs: {},
    workouts: {}
  };

  fetchedPrograms.forEach(program => {
    const programId = program.id; // Assuming program.id is either an integer or UUID

    // Standardize program data (each program object)
    standardizedState.programs[programId] = {
      userId: program.userId || null,
      id: programId,
      name: program.name || '',
      programDuration: program.programDuration || 0,
      durationUnit: program.durationUnit || 'Days',
      daysPerWeek: program.daysPerWeek || 0,
      mainGoal: program.mainGoal || ''
    };

    // Standardize workouts, grouping them by programId
    (program.workouts || []).forEach(workout => {
      const workoutId = workout.id;
      standardizedState.workouts[workoutId] = {
        id: workoutId,
        programId: programId,
        name: workout.name || '',
        exercises: (workout.exercises || []).map(exercise => ({
          id: exercise.id,
          catalogExerciseId: exercise.catalogExerciseId || null,
          equipment: exercise.equipment || '',
          muscle: exercise.muscle || '',
          name: exercise.name || '',
          order: exercise.order || 0,
          sets: (exercise.sets || []).map(set => ({
            id: set.id,
            order: set.order || 0,
            reps: set.reps || 0,
            weight: set.weight || 0,
            unit: set.unit || 'lbs'
          }))
        }))
      };
    });
  });

  return standardizedState;
};
