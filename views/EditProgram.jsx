import React, { useContext, useEffect, useState } from 'react';
import {
  Text,
  StyleSheet,
  View,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import withKeyboardAvoidingView from '../src/hocs/withKeyboardAvoidingView';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ProgramContext } from '../src/context/programContext';
import ProgramForm from '../components/ProgramForm';
import SecondaryButton from '../components/SecondaryButton';
import ParallelogramButton from '../components/ParallelogramButton';
import Workout from '../components/Workout';
import { useTheme } from '../src/hooks/useTheme';
import { getThemedStyles } from '../src/utils/themeUtils';
import { globalStyles, colors } from '../src/styles/globalStyles';
import Header from '../components/Header';
import useExpandedItems from '../src/hooks/useExpandedItems';

const EditProgram = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { program: initialProgram } = route.params || {};

  const {
    state,
    initializeEditProgramState,
    setMode,
    updateProgram,
    addWorkout,
    clearProgram
  } = useContext(ProgramContext);

  const { program } = state;
  const { workouts } = state.workout;
  const [isWorkoutTitleEditing, setIsWorkoutTitleEditing] = useState(false);

  const {
    isProgramFormExpanded,
    toggleItem,
    toggleProgramForm,
    isItemExpanded
  } = useExpandedItems(workouts);

  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );

  useEffect(() => {
    const refresh = route.params?.shouldRefresh;
    const programId = route.params?.programId;

    if (refresh && programId) {
      // Instead of searching through state.programs, use the current program state
      if (state.program && state.program.id === programId) {
        initializeEditProgramState(state.program, state.workout.workouts);
      } else {
        console.warn('Program not found in current state:', programId);
      }
    }
  }, [
    route.params?.shouldRefresh,
    route.params?.programId,
    // state.program
    state.workout.workouts
  ]);

  useEffect(() => {
    setMode('edit');
    initializeEditProgramState(initialProgram, initialProgram.workouts);

    return () => {
      clearProgram();
    };
  }, []); // Empty dependency array to run only once

  // Dismiss keyboard when tapping outside
  const dismissKeyboard = () => {
    Keyboard.dismiss();
    if (isWorkoutTitleEditing) {
      Keyboard.dismiss();
    }
  };

  const handleUpdateProgram = async () => {
    try {
      const updatedProgram = {
        ...state.program,
        workouts: state.workout.workouts.map(workout => ({
          ...workout,
          exercises: workout.exercises.map(exercise => ({
            ...exercise,
            sets: exercise.sets.map(set => ({
              ...set,
              weight: parseInt(set.weight, 10) || 0,
              reps: parseInt(set.reps, 10) || 0,
              order: parseInt(set.order, 10) || 0
            }))
          }))
        }))
      };

      await updateProgram(updatedProgram);
      // Reset the navigation stack to ProgramsList
      navigation.reset({
        index: 0,
        routes: [{ name: 'ProgramsList' }]
      });
    } catch (error) {
      console.error('Failed to save the program:', error);
    }
  };

  const handleAddWorkout = event => {
    event.preventDefault();
    addWorkout(program.id);
  };

  const handleCancel = () => {
    clearProgram();
    // Reset the navigation stack to ProgramsList
    navigation.reset({
      index: 0,
      routes: [{ name: 'ProgramsList' }]
    });
  };

  if (!state.program) {
    return (
      <SafeAreaView
        style={[
          globalStyles.container,
          { backgroundColor: themedStyles.primaryBackgroundColor }
        ]}
      >
        <Header pageName='Edit Program' />
        <Text style={{ color: themedStyles.textColor }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView
        style={[
          globalStyles.container,
          { backgroundColor: themedStyles.primaryBackgroundColor }
        ]}
      >
        <Header pageName='Edit Program' />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <ProgramForm
              program={program}
              isExpanded={isProgramFormExpanded}
              onToggleExpand={toggleProgramForm}
            />
          </View>

          <View style={styles.workoutsContainer}>
            {workouts.length > 0 ? (
              workouts.map(workout => (
                <Workout
                  key={workout.id}
                  workout={workout}
                  isExpanded={isItemExpanded(workout.id)}
                  onToggleExpand={() => toggleItem(workout.id)}
                  onTitleEditingChange={isEditing =>
                    setIsWorkoutTitleEditing(isEditing)
                  }
                  variant='edit-program'
                />
              ))
            ) : (
              <Text style={{ color: themedStyles.textColor }}>
                No workouts available
              </Text>
            )}
          </View>
          {/* Add Workout button */}
          <SecondaryButton
            label='Add Workout'
            iconName='add-outline'
            onPress={handleAddWorkout}
          />
          {/* Save and Cancel buttons */}
          <View style={styles.buttonRow}>
            <ParallelogramButton
              label='SAVE'
              style={[{ width: 120, alignItems: 'center' }]}
              onPress={handleUpdateProgram}
            />
            <ParallelogramButton
              label='CANCEL'
              style={[{ width: 120, alignItems: 'center' }]}
              onPress={handleCancel}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    padding: 5
  },

  workoutsContainer: {
    marginBottom: 10
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginHorizontal: 20
  }
});

export default withKeyboardAvoidingView(EditProgram);
